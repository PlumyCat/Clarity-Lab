import { TechniqueId } from '../../storage/types';
import { BaseTechnique } from './index';

const ROUND_LABELS = ['Comment échouer ?', 'Inverser les échecs', 'Solutions concrètes'];

export const reverseBrainstorming: BaseTechnique = {
  id: 'reverse_brainstorming' as TechniqueId,
  name: 'Brainstorming inversé',
  description: 'Technique créative qui commence par imaginer comment échouer, puis inverse ces scénarios pour trouver des solutions innovantes.',
  totalRounds: 3,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    const prompts = [
      `Concernant l'objectif : "${objectiveStatement}"\n\n💥 Comment échouer ?\nInversons le problème ! Comment pourrait-on garantir l'échec total ? Quelles seraient les pires décisions à prendre ? Imaginez les scénarios catastrophe les plus créatifs. Plus c'est absurde, mieux c'est !`,
      `🔄 Inverser les échecs\nReprenons chaque scénario d'échec identifié et inversons-le. Si « ne pas écouter les utilisateurs » mène à l'échec, alors « écouter activement les utilisateurs » est une piste de succès. Transformez chaque échec en son opposé positif.`,
      `✅ Solutions concrètes\nÀ partir des inversions identifiées, formulons des solutions concrètes et actionnables. Comment mettre en œuvre ces pistes de succès ? Priorisez les actions les plus impactantes et définissez des premiers pas concrets.`,
    ];
    return prompts[round] ?? prompts[0];
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Phase ${round + 1}`;
  },
};
