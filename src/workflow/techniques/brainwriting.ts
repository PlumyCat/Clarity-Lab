import { TechniqueId } from '../../storage/types';
import { BaseTechnique } from './index';

const ROUND_LABELS = ['Idées initiales', 'Enrichir les idées des autres', 'Synthèse'];

export const brainwriting: BaseTechnique = {
  id: 'brainwriting' as TechniqueId,
  name: 'Brainwriting',
  description: 'Technique de brainstorming écrit en trois phases : génération d\'idées individuelles, enrichissement croisé et synthèse collaborative.',
  totalRounds: 3,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    const prompts = [
      `Concernant l'objectif : "${objectiveStatement}"\n\n✏️ Idées initiales\nNotez toutes vos idées individuellement, sans filtre ni censure. Chaque idée compte, même celles qui semblent farfelues. Visez la quantité : essayez de proposer au moins 3 idées distinctes.`,
      `🔄 Enrichir les idées des autres\nReprenez les idées proposées par les autres participants. Comment pouvez-vous les enrichir, les améliorer ou les combiner ? Ajoutez des variantes, des compléments ou de nouvelles perspectives à chaque idée.`,
      `📝 Synthèse collaborative\nExaminons l'ensemble des idées générées et enrichies. Quelles sont les idées les plus prometteuses ? Quels thèmes émergent ? Proposez une synthèse ou un regroupement des meilleures idées.`,
    ];
    return prompts[round] ?? prompts[0];
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Phase ${round + 1}`;
  },
};
