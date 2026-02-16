import { TurnContext, MessageFactory } from 'botbuilder';
import { SessionStore } from '../storage/sessionStore';
import { ClaudeClient } from '../llm/claudeClient';
import {
  BrainstormSession,
  BmadStep,
  TechniqueId,
  TechniqueResult,
} from '../storage/types';
import { buildCard, getStepInfo } from '../cards/builder';
import { buildObjectiveFormCard } from '../cards/templates/objectiveForm';
import { buildObjectiveConfirmCard } from '../cards/templates/objectiveConfirm';
import { buildProgressCard } from '../cards/templates/progressCard';
import { createTechniqueSelectorCard } from '../cards/templates/techniqueSelector';
import { WorkflowEngine } from '../workflow/engine';
import { buildTranscriptInputCard } from '../cards/templates/transcriptInput';
import { parseTranscript, transcriptToResponses } from '../transcript/parser';
import { getTechnique, getBrainstormTechnique } from '../workflow/techniques/index';

const VALID_TECHNIQUE_IDS: TechniqueId[] = [
  'five_whys', 'starbursting', 'six_thinking_hats', 'scamper',
  'mind_mapping', 'brainwriting', 'reverse_brainstorming', 'swot',
];

const TECHNIQUE_STEP_MAP: Record<number, BmadStep> = {
  0: BmadStep.EXECUTE_TECHNIQUE_1,
  1: BmadStep.EXECUTE_TECHNIQUE_2,
  2: BmadStep.EXECUTE_TECHNIQUE_3,
};

export class CardActionHandler {
  private workflowEngine: WorkflowEngine;

  constructor(
    private sessionStore: SessionStore,
    private claude: ClaudeClient,
  ) {
    this.workflowEngine = new WorkflowEngine(claude);
  }

  async handleAction(
    context: TurnContext,
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    switch (action) {
      case 'start_session':
        return this.handleStartSession(context);
      case 'submit_objective':
        return this.handleSubmitObjective(context, data);
      case 'confirm_objective':
        return this.handleConfirmObjective(context);
      case 'edit_objective':
        return this.handleEditObjective(context);
      case 'select_techniques':
        return this.handleSelectTechniques(context, data);
      case 'submit_contribution':
      case 'technique_round_submit':
        return this.handleSubmitContributionFromCard(context, data);
      case 'transcript_mode':
        return this.handleTranscriptMode(context, data);
      case 'submit_transcript':
        return this.handleSubmitTranscript(context, data);
      case 'cancel_transcript_mode':
        return this.handleCancelTranscriptMode(context, data);
      case 'resume_session':
        return this.handleResumeSession(context);
      case 'continue_session':
        return this.handleContinueSession(context);
      case 'pause_session':
        return this.handlePauseSession(context);
      case 'new_session':
        return this.handleNewSession(context);
      default:
        // Delegate to workflow engine for steps 6-8 (organize, insights, generate)
        return this.handleViaWorkflowEngine(context, action, data);
    }
  }

  // --- Session lookup helper ---

  private async getSession(context: TurnContext): Promise<BrainstormSession | null> {
    const conversationId = context.activity.conversation.id;
    const session = await this.sessionStore.getSessionByConversationId(conversationId);
    if (!session) {
      await context.sendActivity("Aucune session active trouvée. Tapez **start** pour en créer une.");
    }
    return session;
  }

  // --- Start ---

  private async handleStartSession(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const tenantId = context.activity.conversation.tenantId || '';

    const existing = await this.sessionStore.getSessionByConversationId(conversationId);
    if (existing) {
      await context.sendActivity(
        MessageFactory.attachment(buildCard(buildProgressCard(existing))),
      );
      return;
    }

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
      MessageFactory.attachment(buildCard(buildObjectiveFormCard(created))),
    );
  }

  // --- Objective Flow ---

  private async handleSubmitObjective(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    const what = ((data.what as string) || '').trim();
    const ctx = ((data.context as string) || '').trim();
    const desiredOutcome = ((data.desiredOutcome as string) || '').trim();

    if (!what) {
      await context.sendActivity("Veuillez remplir au moins le champ 'Que souhaitez-vous brainstormer ?'.");
      return;
    }

    await context.sendActivity("Analyse de votre objectif en cours...");

    const refined = await this.claude.refineObjective(what, ctx, desiredOutcome);

    session.objective = {
      what,
      context: refined.suggestedContext || ctx,
      desiredOutcome: refined.suggestedOutcome || desiredOutcome,
      refinedStatement: refined.refinedStatement,
    };
    const updated = await this.sessionStore.updateSession(session);

    await context.sendActivity(
      MessageFactory.attachment(
        buildCard(
          buildObjectiveConfirmCard(
            updated,
            { what, context: ctx, desiredOutcome },
            updated.objective!,
          ),
        ),
      ),
    );
  }

  private async handleConfirmObjective(context: TurnContext): Promise<void> {
    const session = await this.getSession(context);
    if (!session || !session.objective) return;

    session.currentStep = BmadStep.SELECT_TECHNIQUES;
    session.completedSteps.push(BmadStep.DEFINE_OBJECTIVE);
    await this.sessionStore.updateSession(session);

    await context.sendActivity("Objectif confirmé ! Passons à la sélection des techniques.");

    const recommendations = await this.claude.recommendTechniques(session.objective);

    await context.sendActivity(
      MessageFactory.attachment(buildCard(createTechniqueSelectorCard(recommendations))),
    );
  }

  private async handleEditObjective(context: TurnContext): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    session.objective = null;
    const updated = await this.sessionStore.updateSession(session);

    await context.sendActivity("D'accord, reformulons l'objectif.");
    await context.sendActivity(
      MessageFactory.attachment(buildCard(buildObjectiveFormCard(updated))),
    );
  }

  // --- Technique Selection ---

  private async handleSelectTechniques(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    const raw = (data.selectedTechniques as string) || '';
    const selectedIds = raw.split(',').filter(Boolean) as TechniqueId[];

    // Validate
    const validIds = selectedIds.filter((id) => VALID_TECHNIQUE_IDS.includes(id));
    if (validIds.length < 2 || validIds.length > 3) {
      await context.sendActivity("Veuillez sélectionner entre 2 et 3 techniques.");
      return;
    }

    session.selectedTechniques = validIds;
    session.currentStep = BmadStep.EXECUTE_TECHNIQUE_1;
    session.completedSteps.push(BmadStep.SELECT_TECHNIQUES);
    await this.sessionStore.updateSession(session);

    const firstTechnique = validIds[0];
    await context.sendActivity(
      `Techniques sélectionnées ! Commençons avec la première technique.`,
    );

    // Generate prompt for first technique round
    const prompt = await this.claude.generateTechniquePrompt(
      firstTechnique,
      0,
      session.objective?.refinedStatement || '',
    );

    await context.sendActivity(prompt);
  }

  // --- Technique Contributions ---

  async handleContribution(
    context: TurnContext,
    session: BrainstormSession,
    text: string,
  ): Promise<void> {
    const techniqueIndex = this.getTechniqueIndex(session.currentStep);
    if (techniqueIndex < 0) return;

    const techniqueId = session.selectedTechniques[techniqueIndex];
    if (!techniqueId) return;

    // Get or create technique result
    if (!session.techniqueResults[techniqueId]) {
      session.techniqueResults[techniqueId] = {
        techniqueId,
        rounds: [],
        summary: '',
        ideas: [],
      };
    }
    const result = session.techniqueResults[techniqueId];

    // Get current round or create first one
    if (result.rounds.length === 0) {
      result.rounds.push({
        roundNumber: 0,
        prompt: '',
        responses: [],
        summary: '',
      });
    }
    const currentRound = result.rounds[result.rounds.length - 1];

    // Add participant response
    currentRound.responses.push({
      participantId: context.activity.from.id,
      participantName: context.activity.from.name || 'Inconnu',
      content: text,
      timestamp: new Date(),
    });

    // Extract idea
    result.ideas.push(text);

    // Synthesize contributions for this round
    const contributions = currentRound.responses.map((r) => r.content);
    const synthesis = await this.claude.synthesizeContributions(contributions);
    currentRound.summary = synthesis;

    await this.sessionStore.updateSession(session);
    await context.sendActivity(`**Synthèse :** ${synthesis}`);
  }

  private async handleSubmitContributionFromCard(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    const text = ((data.contribution as string) || (data.response as string) || '').trim();
    if (!text) {
      await context.sendActivity("Veuillez saisir votre contribution.");
      return;
    }

    await this.handleContribution(context, session, text);
  }

  // --- Transcript Mode ---

  private async handleTranscriptMode(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    const techniqueId = (data.techniqueId as string) || '';
    const round = (data.round as number) ?? 0;

    const baseTech = getTechnique(techniqueId as TechniqueId);
    const roundLabel = baseTech.getRoundLabel(round);

    await context.sendActivity(
      MessageFactory.attachment(
        buildCard(
          buildTranscriptInputCard(session, techniqueId, baseTech.name, round, roundLabel),
        ),
      ),
    );
  }

  private async handleSubmitTranscript(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    const rawTranscript = ((data.transcript as string) || '').trim();
    if (!rawTranscript) {
      await context.sendActivity("Veuillez coller le transcript avant de soumettre.");
      return;
    }

    const entries = parseTranscript(rawTranscript);
    const responses = transcriptToResponses(entries);

    if (responses.length === 0) {
      await context.sendActivity("Impossible d'extraire des contributions du transcript. Veuillez vérifier le format.");
      return;
    }

    const participantNames = [...new Set(responses.map(r => r.participantName))];
    await context.sendActivity(
      `📝 Transcript analysé : **${responses.length}** contribution(s) de **${participantNames.join(', ')}**`,
    );

    // Delegate to workflow engine with transcriptResponses in data
    await this.handleViaWorkflowEngine(context, 'technique_round_submit', {
      ...data,
      action: 'technique_round_submit',
      transcriptResponses: responses,
    });
  }

  private async handleCancelTranscriptMode(
    context: TurnContext,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    // Re-afficher la card standard du round
    await this.sendStepEntryCard(context, session);
  }

  // --- Session Control ---

  private async handleResumeSession(context: TurnContext): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    if (session.status === 'paused') {
      session.status = 'active';
      await this.sessionStore.updateSession(session);
    }

    const stepInfo = getStepInfo(session.currentStep);
    await context.sendActivity(
      `Session reprise à l'étape ${stepInfo.number}/8 : **${stepInfo.name}**`,
    );
    await this.sendStepEntryCard(context, session);
  }

  private async handleContinueSession(context: TurnContext): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    await this.sendStepEntryCard(context, session);
  }

  private async sendStepEntryCard(context: TurnContext, session: BrainstormSession): Promise<void> {
    const entry = await this.workflowEngine.getEntryAction(session);
    if ('card' in entry) {
      await context.sendActivity(MessageFactory.attachment(buildCard(entry.card)));
    } else {
      await context.sendActivity(entry.text);
    }
  }

  private async handlePauseSession(context: TurnContext): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    session.status = 'paused';
    await this.sessionStore.updateSession(session);

    const stepInfo = getStepInfo(session.currentStep);
    await context.sendActivity(
      `Session mise en pause à l'étape ${stepInfo.number}/8 (${stepInfo.name}). Tapez **resume** pour reprendre.`,
    );
  }

  private async handleNewSession(context: TurnContext): Promise<void> {
    const conversationId = context.activity.conversation.id;
    const existing = await this.sessionStore.getSessionByConversationId(conversationId);

    // Mark existing session as completed
    if (existing) {
      existing.status = 'completed';
      existing.currentStep = BmadStep.COMPLETED;
      await this.sessionStore.updateSession(existing);
    }

    // Delegate to start_session flow
    await this.handleStartSession(context);
  }

  // --- Workflow Engine delegation for steps 6-8 ---

  private async handleViaWorkflowEngine(
    context: TurnContext,
    action: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const session = await this.getSession(context);
    if (!session) return;

    console.log(`[CardActionHandler] Delegating action "${action}" to workflow engine (step: ${session.currentStep})`);

    const input = {
      type: 'card_action' as const,
      text: (data.response as string) || (data.contribution as string) || '',
      participantId: context.activity.from.id,
      participantName: context.activity.from.name || 'Inconnu',
      data: { ...data, action },
    };

    const result = await this.workflowEngine.processInput(session, input);

    // Persist updated session
    if (result.updatedSession) {
      await this.sessionStore.updateSession(result.updatedSession);
    }

    // Send response text
    if (result.responseText) {
      await context.sendActivity(result.responseText);
    }

    // Send response card
    if (result.responseCard) {
      await context.sendActivity(MessageFactory.attachment(buildCard(result.responseCard)));
    }

    // If transitioned, show entry card for the new step
    if (result.transitionTo && result.updatedSession) {
      const entry = await this.workflowEngine.getEntryAction(result.updatedSession);
      if ('card' in entry) {
        await context.sendActivity(MessageFactory.attachment(buildCard(entry.card)));
      } else {
        await context.sendActivity(entry.text);
      }
    }
  }

  // --- Helpers ---

  private getTechniqueIndex(step: BmadStep): number {
    switch (step) {
      case BmadStep.EXECUTE_TECHNIQUE_1: return 0;
      case BmadStep.EXECUTE_TECHNIQUE_2: return 1;
      case BmadStep.EXECUTE_TECHNIQUE_3: return 2;
      default: return -1;
    }
  }
}
