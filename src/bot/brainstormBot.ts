import {
  TeamsActivityHandler,
  TurnContext,
  MessageFactory,
  AdaptiveCardInvokeResponse,
  AdaptiveCardInvokeValue,
} from 'botbuilder';
import { SessionStore } from '../storage/sessionStore';
import { ClaudeClient } from '../llm/claudeClient';
import { BmadStep } from '../storage/types';
import { buildCard, getStepInfo } from '../cards/builder';
import { buildWelcomeCard } from '../cards/templates/welcome';
import { buildObjectiveFormCard } from '../cards/templates/objectiveForm';
import { buildProgressCard } from '../cards/templates/progressCard';
import { buildSessionResumeCard } from '../cards/templates/sessionResume';
import { buildHelpCard } from '../cards/templates/helpCard';
import { CardActionHandler } from './cardActions';
import { WorkflowEngine } from '../workflow/engine';

export class BrainstormBot extends TeamsActivityHandler {
  private cardActionHandler: CardActionHandler;
  private workflowEngine: WorkflowEngine;

  constructor(
    private sessionStore: SessionStore,
    private claudeClient: ClaudeClient,
  ) {
    super();
    this.cardActionHandler = new CardActionHandler(sessionStore, claudeClient);
    this.workflowEngine = new WorkflowEngine(claudeClient);

    this.onMessage(async (context, next) => {
      await this.handleMessage(context);
      await next();
    });

    this.onMembersAdded(async (context, next) => {
      for (const member of context.activity.membersAdded || []) {
        if (member.id !== context.activity.recipient.id) {
          await context.sendActivity(
            MessageFactory.attachment(buildCard(buildWelcomeCard())),
          );
        }
      }
      await next();
    });
  }

  private async handleMessage(context: TurnContext): Promise<void> {
    // Handle card Action.Submit (comes as message with activity.value, no text)
    const value = context.activity.value as Record<string, unknown> | undefined;
    if (value && typeof value.action === 'string') {
      try {
        await this.cardActionHandler.handleAction(context, value.action, value);
      } catch (error) {
        console.error(`[BrainstormBot] Card action "${value.action}" error:`, error);
        // Don't re-throw for completed sessions or etag conflicts
        const msg = error instanceof Error ? error.message : String(error);
        if (msg.includes('modified by another') || msg.includes('PRECONDITION_FAILED') || msg.includes('not found')) {
          return;
        }
        throw error;
      }
      return;
    }

    // --- Free discussion interception ---
    const conversationId = context.activity.conversation.id;
    const activeSession = await this.sessionStore.getSessionByConversationId(conversationId);

    if (activeSession?.freeDiscussion) {
      const rawText = this.extractCommand(context);
      if (rawText) {
        const lower = rawText.toLowerCase().trim();
        // Bot commands pass through normally (not captured as contributions)
        const BOT_COMMANDS = ['start', 'resume', 'status', 'export', 'pause', 'help'];
        if (BOT_COMMANDS.includes(lower)) {
          // Fall through to normal command handling below
        } else if (['next', 'suivant', 'continuer', 'continue', 'terminé', 'termine', 'fin', 'stop'].includes(lower)) {
          // End the round
          await this.cardActionHandler.handleAction(context, 'end_discussion', {
            action: 'end_discussion',
            techniqueId: activeSession.freeDiscussion.techniqueId,
            round: activeSession.freeDiscussion.round,
          });
          return;
        } else {
          // Capture as contribution
          const participantName = context.activity.from.name || 'Inconnu';
          activeSession.freeDiscussion.responses.push({
            participantId: context.activity.from.id,
            participantName,
            content: rawText,
            timestamp: new Date(),
          });
          await this.sessionStore.updateSession(activeSession);
          const total = activeSession.freeDiscussion.responses.length;
          await context.sendActivity(`✅ **${participantName}** — idée enregistrée (${total} au total)`);
          return;
        }
      }
    }

    const text = this.extractCommand(context);
    if (!text) return;

    const command = text.toLowerCase().trim();

    switch (command) {
      case 'start':
        return this.handleStart(context);
      case 'resume':
        return this.handleResume(context);
      case 'status':
        return this.handleStatus(context);
      case 'export':
        return this.handleExport(context);
      case 'pause':
        return this.handlePause(context);
      case 'help':
        return this.handleHelp(context);
      case 'next':
      case 'suivant':
      case 'continuer':
      case 'continue':
        return this.handleNext(context);
      default:
        return this.handleFreeText(context, text);
    }
  }

  private extractCommand(context: TurnContext): string | null {
    const text = context.activity.text || '';
    // Remove bot @mention from text
    const cleaned = text.replace(/<at>.*?<\/at>/gi, '').trim();
    return cleaned || null;
  }

  // --- Command Handlers ---

  private async handleStart(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const tenantId = context.activity.conversation.tenantId || '';

    // Check for existing active/paused session
    const existing = await this.sessionStore.getSessionByConversationId(conversationId);
    if (existing) {
      await context.sendActivity(
        MessageFactory.attachment(buildCard(buildSessionResumeCard(existing))),
      );
      return;
    }

    // Determine meetingId from Teams channel data or fallback to conversationId
    const channelData = context.activity.channelData as Record<string, Record<string, string>> | undefined;
    const meetingId = channelData?.meeting?.id || conversationId;

    const session = this.sessionStore.createNewSession(meetingId, conversationId, tenantId);
    session.currentStep = BmadStep.DEFINE_OBJECTIVE;
    session.conversationReference = TurnContext.getConversationReference(context.activity) as Record<string, unknown>;
    session.participants.push({
      id: context.activity.from.id,
      name: context.activity.from.name || 'Inconnu',
      joinedAt: new Date(),
      meetings: [meetingId],
    });

    const created = await this.sessionStore.createSession(session);

    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildWelcomeCard())),
    );
    await context.sendActivity(
      "💡 **Astuce** : Pendant les techniques, cliquez **Commencer le tour** puis envoyez vos idées avec **@StormMate**. Tapez **@StormMate next** pour clôturer le tour.",
    );
    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildObjectiveFormCard(created))),
    );
  }

  private async handleResume(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session) {
      await context.sendActivity(
        "Aucune session trouvée. Tapez **start** pour en démarrer une.",
      );
      return;
    }

    if (session.status === 'paused') {
      session.status = 'active';
      await this.sessionStore.updateSession(session);
    }

    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildSessionResumeCard(session))),
    );
  }

  private async handleStatus(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session) {
      await context.sendActivity("Aucune session active. Tapez **start** pour commencer.");
      return;
    }

    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildProgressCard(session))),
    );
  }

  private async handleExport(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session) {
      await context.sendActivity("Aucune session active. Rien à exporter.");
      return;
    }

    if (session.outputUrl) {
      await context.sendActivity(
        `Le PowerPoint est disponible : [Télécharger la synthèse](${session.outputUrl})`,
      );
      return;
    }

    await context.sendActivity(
      "L'export PowerPoint sera disponible une fois le brainstorming terminé (étape 8/8).",
    );
  }

  private async handlePause(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session) {
      await context.sendActivity("Aucune session active à mettre en pause.");
      return;
    }

    session.status = 'paused';
    await this.sessionStore.updateSession(session);

    const stepInfo = getStepInfo(session.currentStep);
    await context.sendActivity(
      `Session mise en pause à l'étape ${stepInfo.number}/8 (${stepInfo.name}). Tapez **resume** pour reprendre.`,
    );
  }

  private async handleHelp(context: TurnContext): Promise<void> {
    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildHelpCard())),
    );
  }

  private async handleNext(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session || session.status !== 'active') {
      await context.sendActivity("Aucune session active. Tapez **start** pour commencer.");
      return;
    }

    // Show the entry card for the current step (re-display it)
    const stepInfo = getStepInfo(session.currentStep);
    await context.sendActivity(`Étape ${stepInfo.number}/8 : **${stepInfo.name}**`);

    const entry = await this.workflowEngine.getEntryAction(session);
    if ('card' in entry) {
      await context.sendActivity(MessageFactory.attachment(buildCard(entry.card)));
    } else {
      await context.sendActivity(entry.text);
    }
  }

  private async handleFreeText(context: TurnContext, text: string): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);

    if (!session || session.status === 'paused') {
      await context.sendActivity(
        "Tapez **start** pour démarrer ou **help** pour voir les commandes.",
      );
      return;
    }

    // During technique execution, remind to start the round first
    if (
      session.currentStep === BmadStep.EXECUTE_TECHNIQUE_1 ||
      session.currentStep === BmadStep.EXECUTE_TECHNIQUE_2 ||
      session.currentStep === BmadStep.EXECUTE_TECHNIQUE_3
    ) {
      await context.sendActivity(
        "Cliquez sur **Commencer le tour** pour lancer la collecte d'idées, puis envoyez vos contributions. Tapez **next** pour afficher la carte du tour.",
      );
      return;
    }

    await context.sendActivity(
      "Tapez **help** pour voir les commandes disponibles.",
    );
  }

  // --- Adaptive Card Invoke Handler ---

  protected async onAdaptiveCardInvoke(
    context: TurnContext,
    invokeValue: AdaptiveCardInvokeValue,
  ): Promise<AdaptiveCardInvokeResponse> {
    const verb = invokeValue.action?.verb as string | undefined;
    const data = (invokeValue.action?.data as Record<string, unknown>) || {};
    const action = verb || (data.action as string) || '';

    try {
      await this.cardActionHandler.handleAction(context, action, data);
    } catch (error) {
      console.error(`[BrainstormBot] Card action error (${action}):`, error);
      await context.sendActivity("Erreur lors du traitement. Veuillez réessayer.");
    }

    return { statusCode: 200, type: 'application/vnd.microsoft.activity.message', value: {} };
  }
}
