import {
  BmadStep,
  BrainstormSession,
  StepResult,
  TechniqueId,
  TechniqueResult,
  TechniqueRound,
  UserInput,
} from '../../storage/types.js';
import type { StepHandler } from './index.js';
import type { ClaudeClient } from '../../llm/claudeClient.js';
import { getTechnique, getBrainstormTechnique } from '../techniques/index.js';
import { wrapWithProgress } from '../../cards/builder.js';

const TECHNIQUE_STEPS: BmadStep[] = [
  BmadStep.EXECUTE_TECHNIQUE_1,
  BmadStep.EXECUTE_TECHNIQUE_2,
  BmadStep.EXECUTE_TECHNIQUE_3,
];

export class ExecuteTechniqueHandler implements StepHandler {
  constructor(
    private techniqueIndex: number,
    private claudeClient: ClaudeClient,
  ) {}

  get step(): BmadStep {
    return TECHNIQUE_STEPS[this.techniqueIndex];
  }

  getEntryCard(session: BrainstormSession): object {
    const techniqueId = this.getTechniqueId(session);
    if (!techniqueId) {
      return wrapWithProgress(session, [
        { type: 'TextBlock', text: 'Erreur : technique non trouvée pour cet index.', color: 'Attention', wrap: true },
      ]);
    }

    const currentRound = this.getCurrentRound(session, techniqueId);

    // Try full BrainstormTechnique first (rich cards)
    const fullTech = getBrainstormTechnique(techniqueId);
    if (fullTech) {
      return fullTech.getCardForRound(currentRound, session) as object;
    }

    // Fallback: build generic card from BaseTechnique
    return this.buildGenericRoundCard(session, techniqueId, currentRound);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const techniqueId = this.getTechniqueId(session);
    if (!techniqueId) {
      return {
        responseText: 'Erreur : aucune technique assignée pour cette étape.',
        updatedSession: session,
      };
    }

    const baseTech = getTechnique(techniqueId);
    const currentRound = this.getCurrentRound(session, techniqueId);

    // Get or initialize the TechniqueResult
    const existingResult = session.techniqueResults[techniqueId];
    const techniqueResult: TechniqueResult = existingResult
      ? { ...existingResult, rounds: [...existingResult.rounds] }
      : { techniqueId, rounds: [], summary: '', ideas: [] };

    // Process the round input
    let roundResult: TechniqueRound;
    let isComplete: boolean;

    const fullTech = getBrainstormTechnique(techniqueId);
    if (fullTech) {
      const result = await fullTech.processRoundInput(currentRound, input, session);
      roundResult = result.roundResult;
      isComplete = result.isComplete;
    } else {
      // Manual processing for legacy BaseTechnique
      const content = input.text || (input.data?.response as string) || (input.data?.contribution as string) || '';
      roundResult = {
        roundNumber: currentRound,
        prompt: baseTech.getRoundLabel(currentRound),
        responses: [
          {
            participantId: input.participantId,
            participantName: input.participantName,
            content,
            timestamp: new Date(),
          },
        ],
        summary: '',
      };
      isComplete = currentRound >= baseTech.totalRounds - 1;
    }

    // Synthesize contributions via Claude
    const contributions = roundResult.responses.map(r => r.content).filter(Boolean);
    if (contributions.length > 0) {
      try {
        roundResult.summary = await this.claudeClient.synthesizeContributions(contributions);
      } catch (error) {
        console.log(`[ExecuteTechniqueHandler] Failed to synthesize round: ${error instanceof Error ? error.message : String(error)}`);
        roundResult.summary = contributions.join('\n');
      }
    }

    // Store the round result
    techniqueResult.rounds.push(roundResult);

    const updatedSession: BrainstormSession = {
      ...session,
      techniqueResults: {
        ...session.techniqueResults,
        [techniqueId]: techniqueResult,
      },
    };

    if (isComplete) {
      // Generate technique summary from all rounds
      const allContributions = techniqueResult.rounds.flatMap(r =>
        r.responses.map(resp => resp.content),
      ).filter(Boolean);

      try {
        techniqueResult.summary = await this.claudeClient.synthesizeContributions(allContributions);
      } catch {
        techniqueResult.summary = `Technique ${baseTech.name} terminée.`;
      }
      techniqueResult.ideas = allContributions;

      // Update session with final technique result
      updatedSession.techniqueResults = {
        ...updatedSession.techniqueResults,
        [techniqueId]: techniqueResult,
      };

      const nextStep = this.getNextStep(session);

      return {
        responseText: `**${baseTech.name}** terminée !\n\n${techniqueResult.summary}`,
        transitionTo: nextStep,
        updatedSession,
      };
    }

    // Not complete: show next round card
    const nextRound = currentRound + 1;
    let nextCard: object;

    if (fullTech) {
      nextCard = fullTech.getCardForRound(nextRound, updatedSession) as object;
    } else {
      nextCard = this.buildGenericRoundCard(updatedSession, techniqueId, nextRound);
    }

    return {
      responseText: roundResult.summary ? `**Synthèse du tour ${currentRound + 1} :**\n${roundResult.summary}` : undefined,
      responseCard: nextCard,
      updatedSession,
    };
  }

  isComplete(session: BrainstormSession): boolean {
    const techniqueId = this.getTechniqueId(session);
    if (!techniqueId) return false;

    const baseTech = getTechnique(techniqueId);
    const result = session.techniqueResults[techniqueId];
    return result ? result.rounds.length >= baseTech.totalRounds : false;
  }

  private getTechniqueId(session: BrainstormSession): TechniqueId | null {
    return session.selectedTechniques[this.techniqueIndex] ?? null;
  }

  private getCurrentRound(session: BrainstormSession, techniqueId: TechniqueId): number {
    return session.techniqueResults[techniqueId]?.rounds.length ?? 0;
  }

  private getNextStep(session: BrainstormSession): BmadStep {
    const nextIndex = this.techniqueIndex + 1;
    if (nextIndex < session.selectedTechniques.length) {
      return TECHNIQUE_STEPS[nextIndex];
    }
    return BmadStep.ORGANIZE_IDEAS;
  }

  private buildGenericRoundCard(
    session: BrainstormSession,
    techniqueId: TechniqueId,
    round: number,
  ): object {
    const baseTech = getTechnique(techniqueId);
    const objectiveStatement = session.objective?.refinedStatement ?? '';
    const prompt = baseTech.getRoundPrompt(round, objectiveStatement);
    const roundLabel = baseTech.getRoundLabel(round);

    const card = wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: `🎯 ${objectiveStatement}`,
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: `${baseTech.name} — Tour ${round + 1}/${baseTech.totalRounds}`,
        size: 'Large',
        weight: 'Bolder',
        color: 'Accent',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: roundLabel,
        weight: 'Bolder',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: prompt,
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'Input.Text',
        id: 'response',
        placeholder: 'Partagez vos réflexions...',
        isMultiline: true,
        isRequired: true,
      },
    ]);

    return {
      ...card,
      actions: [
        {
          type: 'Action.Submit',
          title: round === baseTech.totalRounds - 1 ? 'Terminer cette technique' : 'Soumettre',
          data: { action: 'technique_round_submit', round, techniqueId },
          style: 'positive',
        },
      ],
    };
  }
}
