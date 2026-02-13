import type { TechniqueId, BrainstormSession, TechniqueRound, UserInput } from '../../storage/types';
import type { BaseTechnique, BrainstormTechnique } from './index';
import { wrapWithProgress } from '../../cards/builder';

interface SwotQuadrant {
  label: string;
  labelEn: string;
  icon: string;
  cardColor: 'Default' | 'Accent' | 'Good' | 'Warning' | 'Attention';
  question: string;
  description: string;
  type: 'internal' | 'external';
}

const QUADRANTS: SwotQuadrant[] = [
  {
    label: 'Forces',
    labelEn: 'Strengths',
    icon: '💪',
    cardColor: 'Good',
    question: 'Quels sont les points forts internes ?',
    description: 'Atouts, compétences clés, ressources, avantages compétitifs. Qu\'est-ce qui fonctionne déjà bien ? Sur quoi pouvons-nous capitaliser ?',
    type: 'internal',
  },
  {
    label: 'Faiblesses',
    labelEn: 'Weaknesses',
    icon: '⚠️',
    cardColor: 'Attention',
    question: 'Quelles sont les faiblesses internes ?',
    description: 'Limites, lacunes, manques de ressources ou compétences. Quels domaines nécessitent des améliorations ? Qu\'est-ce qui nous freine ?',
    type: 'internal',
  },
  {
    label: 'Opportunités',
    labelEn: 'Opportunities',
    icon: '🚀',
    cardColor: 'Accent',
    question: 'Quelles opportunités externes ?',
    description: 'Tendances favorables, marchés émergents, partenariats possibles, changements réglementaires positifs. Quelles opportunités pouvons-nous saisir ?',
    type: 'external',
  },
  {
    label: 'Menaces',
    labelEn: 'Threats',
    icon: '🌩️',
    cardColor: 'Warning',
    question: 'Quels risques externes ?',
    description: 'Concurrence, évolutions défavorables, contraintes réglementaires, risques économiques. Quels facteurs externes pourraient nous affecter négativement ?',
    type: 'external',
  },
];

// Legacy export pour le registry BaseTechnique
export const swot: BaseTechnique = {
  id: 'swot' as TechniqueId,
  name: 'Analyse SWOT',
  description: 'Outil d\'analyse stratégique qui évalue les Forces, Faiblesses, Opportunités et Menaces liées à un sujet ou projet.',
  totalRounds: 4,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    return new SwotTechnique().getPromptForRound(round, { objective: { refinedStatement: objectiveStatement } } as BrainstormSession);
  },

  getRoundLabel(round: number): string {
    const q = QUADRANTS[round];
    return q ? `${q.label} (${q.labelEn})` : `Étape ${round + 1}`;
  },
};

// Implémentation complète BrainstormTechnique
export class SwotTechnique implements BrainstormTechnique {
  id = 'swot';
  name = 'Analyse SWOT';
  description = 'Forces, Faiblesses, Opportunités, Menaces';
  category = 'strategic_planning' as const;
  totalRounds = 4;

  getPromptForRound(round: number, session: BrainstormSession): string {
    const objective = session.objective?.refinedStatement ?? 'Objectif non défini';
    const quadrant = QUADRANTS[round];
    if (!quadrant) return 'Round inconnu';

    return `Concernant l'objectif : "${objective}"\n\n${quadrant.icon} ${quadrant.label} (${quadrant.labelEn})\n${quadrant.description}`;
  }

  getCardForRound(round: number, session: BrainstormSession): object {
    const objective = session.objective?.refinedStatement ?? '';
    const quadrant = QUADRANTS[round];
    if (!quadrant) return {};

    // Construire le mini-résumé des quadrants déjà complétés
    const previousRounds = session.techniqueResults[this.id]?.rounds ?? [];
    const completedQuadrants: object[] = [];
    for (let i = 0; i < round; i++) {
      const q = QUADRANTS[i];
      const pr = previousRounds[i];
      if (q && pr) {
        const responsePreview = pr.responses.map(r => r.content).join('; ');
        const truncated = responsePreview.length > 80 ? responsePreview.slice(0, 80) + '...' : responsePreview;
        completedQuadrants.push({
          type: 'TextBlock',
          text: `${q.icon} **${q.label}** : ${truncated}`,
          wrap: true,
          spacing: 'Small',
          size: 'Small',
          isSubtle: true,
        });
      }
    }

    const body: object[] = [
      // Contexte : objectif
      {
        type: 'TextBlock',
        text: `🎯 ${objective}`,
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      },
      // Indicateur visuel SWOT (grille)
      {
        type: 'ColumnSet',
        spacing: 'Medium',
        columns: QUADRANTS.map((q, i) => ({
          type: 'Column',
          width: 'stretch',
          items: [
            {
              type: 'TextBlock',
              text: `${q.icon} ${q.label[0]}`,
              horizontalAlignment: 'Center',
              weight: i === round ? 'Bolder' : 'Lighter',
              color: i === round ? 'Accent' : i < round ? 'Good' : 'Default',
              isSubtle: i !== round,
            },
          ],
        })),
      },
    ];

    // Résumé des quadrants précédents
    if (completedQuadrants.length > 0) {
      body.push(
        {
          type: 'Container',
          style: 'emphasis',
          items: [
            {
              type: 'TextBlock',
              text: 'Quadrants complétés',
              weight: 'Bolder',
              size: 'Small',
              wrap: true,
            },
            ...completedQuadrants,
          ],
        },
      );
    }

    // Header du quadrant actuel
    body.push(
      {
        type: 'Container',
        style: quadrant.cardColor === 'Default' ? 'emphasis' : quadrant.cardColor.toLowerCase(),
        items: [
          {
            type: 'TextBlock',
            text: `${quadrant.icon} ${quadrant.label} — ${quadrant.labelEn} (${round + 1}/4)`,
            size: 'Large',
            weight: 'Bolder',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: quadrant.type === 'internal' ? 'Facteur interne' : 'Facteur externe',
            size: 'Small',
            isSubtle: true,
            wrap: true,
            spacing: 'None',
          },
        ],
      },
      // Description
      {
        type: 'TextBlock',
        text: quadrant.description,
        wrap: true,
        spacing: 'Medium',
      },
      // Champ de saisie
      {
        type: 'Input.Text',
        id: 'response',
        placeholder: `Listez les ${quadrant.label.toLowerCase()}...`,
        isMultiline: true,
        isRequired: true,
      },
    );

    const card = wrapWithProgress(session, body);

    return {
      ...card,
      actions: [
        {
          type: 'Action.Submit',
          title: 'Soumettre',
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
    const quadrant = QUADRANTS[round];
    const content = input.text || (input.data?.['response'] as string) || '';

    const roundResult: TechniqueRound = {
      roundNumber: round,
      prompt: quadrant ? `${quadrant.icon} ${quadrant.label} (${quadrant.labelEn}) — ${quadrant.question}` : `Quadrant ${round + 1}`,
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
}
