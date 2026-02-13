import { BmadStep, BrainstormSession, StepResult, UserInput } from '../../storage/types.js';
import type { StepHandler } from './index.js';
import type { ClaudeClient } from '../../llm/claudeClient.js';
import { buildObjectiveFormCard } from '../../cards/templates/objectiveForm.js';
import { wrapWithProgress } from '../../cards/builder.js';

export class DefineObjectiveStep implements StepHandler {
  readonly step = BmadStep.DEFINE_OBJECTIVE;

  constructor(private claudeClient: ClaudeClient) {}

  getEntryCard(session: BrainstormSession): object {
    return buildObjectiveFormCard(session);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const action = input.data?.action as string | undefined;
    const verb = input.data?.verb as string | undefined;
    const actionKey = action || verb;

    // User submitted the objective form
    if (input.type === 'card_action' && (actionKey === 'submit_objective' || !actionKey)) {
      return this.handleFormSubmission(session, input);
    }

    // User confirmed the refined objective
    if (input.type === 'card_action' && actionKey === 'confirm_objective') {
      return this.handleConfirmation(session);
    }

    // User wants to edit the objective
    if (input.type === 'card_action' && actionKey === 'edit_objective') {
      return this.handleEdit(session);
    }

    // Text input fallback: treat as the "what" field
    if (input.type === 'text' && input.text) {
      return this.handleFormSubmission(session, {
        ...input,
        data: { what: input.text, context: '', desiredOutcome: '' },
      });
    }

    return {
      responseCard: this.getEntryCard(session),
      updatedSession: session,
    };
  }

  isComplete(session: BrainstormSession): boolean {
    return session.objective !== null && session.objective.refinedStatement !== '';
  }

  private async handleFormSubmission(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const what = (input.data?.what as string) || '';
    const context = (input.data?.context as string) || '';
    const desiredOutcome = (input.data?.desiredOutcome as string) || '';

    if (!what.trim()) {
      return {
        responseText: 'Veuillez décrire ce que vous souhaitez brainstormer.',
        responseCard: this.getEntryCard(session),
        updatedSession: session,
      };
    }

    console.log(`[DefineObjectiveStep] Refining objective: "${what.substring(0, 80)}..."`);

    const refined = await this.claudeClient.refineObjective(what, context, desiredOutcome);

    const updatedSession: BrainstormSession = {
      ...session,
      objective: {
        what,
        context: refined.suggestedContext || context,
        desiredOutcome: refined.suggestedOutcome || desiredOutcome,
        refinedStatement: refined.refinedStatement,
      },
    };

    return {
      responseCard: this.buildConfirmationCard(updatedSession),
      updatedSession,
    };
  }

  private handleConfirmation(session: BrainstormSession): StepResult {
    if (!session.objective) {
      return {
        responseCard: this.getEntryCard(session),
        responseText: 'Aucun objectif à confirmer. Veuillez d\'abord soumettre votre objectif.',
        updatedSession: session,
      };
    }

    return {
      responseText: `Objectif confirmé : **${session.objective.refinedStatement}**\n\nPassons à la sélection des techniques de brainstorming.`,
      transitionTo: BmadStep.SELECT_TECHNIQUES,
      updatedSession: session,
    };
  }

  private handleEdit(session: BrainstormSession): StepResult {
    const updatedSession: BrainstormSession = {
      ...session,
      objective: null,
    };

    return {
      responseCard: this.getEntryCard(updatedSession),
      updatedSession,
    };
  }

  private buildConfirmationCard(session: BrainstormSession): object {
    const objective = session.objective!;

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Objectif reformulé par StormMate',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'TextBlock',
            text: `**Votre formulation :** ${objective.what}`,
            wrap: true,
          },
        ],
        spacing: 'Medium',
      },
      {
        type: 'Container',
        style: 'good',
        items: [
          {
            type: 'TextBlock',
            text: `**Reformulation StormMate :** ${objective.refinedStatement}`,
            wrap: true,
          },
        ],
        spacing: 'Small',
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Contexte', value: objective.context || 'Non spécifié' },
          { title: 'Résultat attendu', value: objective.desiredOutcome || 'Non spécifié' },
        ],
        spacing: 'Medium',
      },
      {
        type: 'TextBlock',
        text: 'Cet objectif vous convient-il ?',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Large',
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Confirmer',
            style: 'positive',
            data: { action: 'confirm_objective' },
          },
          {
            type: 'Action.Submit',
            title: 'Modifier',
            data: { action: 'edit_objective' },
          },
        ],
      },
    ]);
  }
}
