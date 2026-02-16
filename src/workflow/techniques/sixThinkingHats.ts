import type { TechniqueId, BrainstormSession, TechniqueRound, UserInput, ParticipantResponse } from '../../storage/types';
import type { BaseTechnique, BrainstormTechnique } from './index';
import { wrapWithProgress } from '../../cards/builder';

interface HatDefinition {
  label: string;
  icon: string;
  color: string;
  cardColor: 'Default' | 'Accent' | 'Good' | 'Warning' | 'Attention';
  question: string;
  description: string;
}

const HATS: HatDefinition[] = [
  {
    label: 'Chapeau Blanc',
    icon: '🤍',
    color: 'Blanc',
    cardColor: 'Default',
    question: 'Quels sont les faits objectifs ?',
    description: 'Données, chiffres, informations vérifiées. Restez factuels et neutres. Quelles informations avons-nous ? Lesquelles nous manquent ?',
  },
  {
    label: 'Chapeau Rouge',
    icon: '❤️',
    color: 'Rouge',
    cardColor: 'Attention',
    question: 'Que ressentez-vous intuitivement ?',
    description: 'Émotions, intuitions, pressentiments. Pas besoin de justifier. Quel est votre ressenti immédiat sur ce sujet ?',
  },
  {
    label: 'Chapeau Noir',
    icon: '🖤',
    color: 'Noir',
    cardColor: 'Default',
    question: 'Quels sont les risques et dangers ?',
    description: 'Critique constructive, obstacles, points faibles. Qu\'est-ce qui pourrait mal tourner ? Quels sont les pièges à éviter ?',
  },
  {
    label: 'Chapeau Jaune',
    icon: '💛',
    color: 'Jaune',
    cardColor: 'Warning',
    question: 'Quels sont les avantages et opportunités ?',
    description: 'Optimisme, bénéfices, valeur ajoutée. Qu\'est-ce qui pourrait bien fonctionner ? Quels gains sont possibles ?',
  },
  {
    label: 'Chapeau Vert',
    icon: '💚',
    color: 'Vert',
    cardColor: 'Good',
    question: 'Quelles idées nouvelles ou alternatives ?',
    description: 'Créativité sans limites, idées originales, alternatives. Pensez en dehors des sentiers battus. Toutes les idées sont les bienvenues.',
  },
  {
    label: 'Chapeau Bleu',
    icon: '💙',
    color: 'Bleu',
    cardColor: 'Accent',
    question: 'Quel plan d\'action et prochaines étapes ?',
    description: 'Prise de recul, synthèse, organisation. Quelles conclusions tirer ? Quelles priorités pour la suite ?',
  },
];

// Legacy export pour le registry BaseTechnique
export const sixThinkingHats: BaseTechnique = {
  id: 'six_thinking_hats' as TechniqueId,
  name: 'Les 6 Chapeaux de Bono',
  description: 'Méthode de réflexion parallèle qui examine un sujet sous six angles différents : faits, émotions, risques, avantages, créativité et processus.',
  totalRounds: 6,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    return new SixThinkingHatsTechnique().getPromptForRound(round, { objective: { refinedStatement: objectiveStatement } } as BrainstormSession);
  },

  getRoundLabel(round: number): string {
    return HATS[round]?.label ?? `Chapeau ${round + 1}`;
  },
};

// Implémentation complète BrainstormTechnique
export class SixThinkingHatsTechnique implements BrainstormTechnique {
  id = 'six_thinking_hats';
  name = 'Six Chapeaux de Bono';
  description = 'Examiner sous 6 perspectives différentes';
  category = 'problem_exploration' as const;
  totalRounds = 6;

  getPromptForRound(round: number, session: BrainstormSession): string {
    const objective = session.objective?.refinedStatement ?? 'Objectif non défini';
    const hat = HATS[round];
    if (!hat) return 'Round inconnu';

    return `Concernant l'objectif : "${objective}"\n\n${hat.icon} ${hat.label} — ${hat.color}\n${hat.description}`;
  }

  getCardForRound(round: number, session: BrainstormSession): object {
    const objective = session.objective?.refinedStatement ?? '';
    const hat = HATS[round];
    if (!hat) return {};

    const body: object[] = [
      // Contexte : objectif
      {
        type: 'TextBlock',
        text: `🎯 ${objective}`,
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      },
      // Header du chapeau avec couleur
      {
        type: 'Container',
        style: hat.cardColor === 'Default' ? 'emphasis' : hat.cardColor.toLowerCase(),
        bleed: true,
        items: [
          {
            type: 'TextBlock',
            text: `${hat.icon} ${hat.label} (${round + 1}/6)`,
            size: 'Large',
            weight: 'Bolder',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: hat.question,
            size: 'Medium',
            weight: 'Bolder',
            wrap: true,
            spacing: 'Small',
          },
        ],
      },
      // Description détaillée
      {
        type: 'TextBlock',
        text: hat.description,
        wrap: true,
        spacing: 'Medium',
      },
      // Champ de saisie
      {
        type: 'Input.Text',
        id: 'response',
        placeholder: `Partagez vos réflexions pour le ${hat.label}...`,
        isMultiline: true,
        isRequired: true,
      },
    ];

    const card = wrapWithProgress(session, body);

    return {
      ...card,
      actions: [
        {
          type: 'Action.Submit',
          title: `Soumettre ce chapeau`,
          data: { action: 'technique_round_submit', round, techniqueId: this.id },
          style: 'positive',
        },
        {
          type: 'Action.Submit',
          title: 'Discussion libre (transcript)',
          data: { action: 'transcript_mode', round, techniqueId: this.id },
        },
      ],
    };
  }

  async processRoundInput(
    round: number,
    input: UserInput,
    _session: BrainstormSession,
  ): Promise<{ roundResult: TechniqueRound; isComplete: boolean }> {
    const hat = HATS[round];

    // Support transcript mode : responses multiples depuis le transcript
    const transcriptResponses = input.data?.['transcriptResponses'] as ParticipantResponse[] | undefined;

    const responses: ParticipantResponse[] = transcriptResponses && transcriptResponses.length > 0
      ? transcriptResponses
      : [
          {
            participantId: input.participantId,
            participantName: input.participantName,
            content: input.text || (input.data?.['response'] as string) || '',
            timestamp: new Date(),
          },
        ];

    const roundResult: TechniqueRound = {
      roundNumber: round,
      prompt: hat ? `${hat.icon} ${hat.label} — ${hat.question}` : `Chapeau ${round + 1}`,
      responses,
      summary: '',
    };

    return {
      roundResult,
      isComplete: round >= this.totalRounds - 1,
    };
  }
}
