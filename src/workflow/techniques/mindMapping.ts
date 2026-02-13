import { TechniqueId } from '../../storage/types';
import { BaseTechnique } from './index';

const ROUND_LABELS = ['Thème central', 'Branches principales', 'Sous-branches'];

export const mindMapping: BaseTechnique = {
  id: 'mind_mapping' as TechniqueId,
  name: 'Mind Mapping',
  description: 'Technique de cartographie mentale qui structure la réflexion en partant d\'un thème central vers des branches et sous-branches d\'idées.',
  totalRounds: 3,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    const prompts = [
      `Concernant l'objectif : "${objectiveStatement}"\n\n🎯 Thème central\nDéfinissons le cœur de notre réflexion. Quel est le concept central autour duquel nous allons construire notre carte mentale ? Proposez des mots-clés et concepts fondamentaux liés à l'objectif.`,
      `🌿 Branches principales\nÀ partir de notre thème central, quelles sont les grandes catégories ou dimensions à explorer ? Identifiez les branches principales de notre carte mentale (4 à 8 branches idéalement).`,
      `🍃 Sous-branches et détails\nPour chaque branche principale identifiée, développez les sous-branches. Ajoutez des détails, des exemples concrets et des connexions entre les branches. Quels liens voyez-vous entre les différentes branches ?`,
    ];
    return prompts[round] ?? prompts[0];
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Étape ${round + 1}`;
  },
};
