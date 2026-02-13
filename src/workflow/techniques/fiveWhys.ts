import type { TechniqueId, BrainstormSession, TechniqueRound, UserInput } from '../../storage/types';
import type { BaseTechnique, BrainstormTechnique } from './index';
import { wrapWithProgress } from '../../cards/builder';

const ROUND_LABELS = [
  'Premier Pourquoi',
  'Deuxième Pourquoi',
  'Troisième Pourquoi',
  'Quatrième Pourquoi',
  'Cinquième Pourquoi',
];

// Legacy export pour le registry BaseTechnique
export const fiveWhys: BaseTechnique = {
  id: 'five_whys' as TechniqueId,
  name: 'Les 5 Pourquoi',
  description: 'Technique d\'analyse causale qui creuse progressivement pour identifier la cause racine d\'un problème en posant "Pourquoi ?" cinq fois.',
  totalRounds: 5,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    return new FiveWhysTechnique().getPromptForRound(round, { objective: { refinedStatement: objectiveStatement } } as BrainstormSession);
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Pourquoi ${round + 1}`;
  },
};

// Implémentation complète BrainstormTechnique
export class FiveWhysTechnique implements BrainstormTechnique {
  id = 'five_whys';
  name = '5 Pourquoi';
  description = 'Creuser les causes racines en demandant "pourquoi" 5 fois';
  category = 'problem_exploration' as const;
  totalRounds = 5;

  getPromptForRound(round: number, session: BrainstormSession): string {
    const objective = session.objective?.refinedStatement ?? 'Objectif non défini';
    const previousRounds = this.getPreviousRounds(session);

    if (round === 0) {
      return `Concernant l'objectif : "${objective}"\n\nPremier Pourquoi : Pourquoi ce sujet est-il un problème ou un défi ? Partagez vos premières réflexions sur les causes apparentes.`;
    }

    const lastResponse = previousRounds[round - 1]?.summary
      || previousRounds[round - 1]?.responses.map(r => r.content).join('; ')
      || 'réponse précédente';

    return `${ROUND_LABELS[round]} : Pourquoi "${lastResponse}" ? Creusons plus profondément.`;
  }

  getCardForRound(round: number, session: BrainstormSession): object {
    const objective = session.objective?.refinedStatement ?? '';
    const previousRounds = this.getPreviousRounds(session);

    const body: object[] = [
      // Contexte : objectif
      {
        type: 'TextBlock',
        text: `🎯 ${objective}`,
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      },
      // Titre du round
      {
        type: 'TextBlock',
        text: `🔍 ${ROUND_LABELS[round]} (${round + 1}/5)`,
        size: 'Large',
        weight: 'Bolder',
        color: 'Accent',
        wrap: true,
        spacing: 'Medium',
      },
    ];

    // Chaîne des pourquoi précédents
    if (previousRounds.length > 0) {
      body.push({
        type: 'Container',
        style: 'emphasis',
        items: [
          {
            type: 'TextBlock',
            text: 'Chaîne des Pourquoi',
            weight: 'Bolder',
            size: 'Small',
            wrap: true,
          },
          ...previousRounds.map((pr, i) => ({
            type: 'TextBlock',
            text: `**P${i + 1}.** ${pr.responses.map(r => r.content).join('; ') || pr.summary || '—'}`,
            wrap: true,
            spacing: 'Small',
            size: 'Small',
          })),
        ],
      });
    }

    // Question du round
    const prompt = this.getPromptForRound(round, session);
    body.push(
      {
        type: 'TextBlock',
        text: prompt,
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'Input.Text',
        id: 'response',
        placeholder: round === 4
          ? 'Identifiez la cause racine fondamentale...'
          : 'Pourquoi ? Expliquez votre raisonnement...',
        isMultiline: true,
        isRequired: true,
      },
    );

    // Note spéciale pour le dernier round
    if (round === 4) {
      body.push({
        type: 'TextBlock',
        text: '💡 Dernier pourquoi ! Essayez d\'identifier la cause racine la plus fondamentale.',
        wrap: true,
        spacing: 'Small',
        color: 'Warning',
        size: 'Small',
      });
    }

    const card = wrapWithProgress(session, body);

    return {
      ...card,
      actions: [
        {
          type: 'Action.Submit',
          title: round === 4 ? 'Identifier la cause racine' : 'Soumettre',
          data: { action: 'technique_round_submit', round, techniqueId: this.id },
          style: 'positive',
        },
      ],
    };
  }

  async processRoundInput(
    round: number,
    input: UserInput,
    _session: BrainstormSession,
  ): Promise<{ roundResult: TechniqueRound; isComplete: boolean }> {
    const content = input.text || (input.data?.['response'] as string) || '';

    const roundResult: TechniqueRound = {
      roundNumber: round,
      prompt: ROUND_LABELS[round] ?? `Pourquoi ${round + 1}`,
      responses: [
        {
          participantId: input.participantId,
          participantName: input.participantName,
          content,
          timestamp: new Date(),
        },
      ],
      summary: '', // Sera rempli par le workflow engine via Claude
    };

    return {
      roundResult,
      isComplete: round >= this.totalRounds - 1,
    };
  }

  private getPreviousRounds(session: BrainstormSession): TechniqueRound[] {
    return session.techniqueResults[this.id]?.rounds ?? [];
  }
}
