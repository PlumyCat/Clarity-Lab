import { TechniqueId } from '../../storage/types';
import { BaseTechnique } from './index';

const ROUND_LABELS = ['Qui ?', 'Quoi ?', 'Où ?', 'Quand ?', 'Pourquoi ?', 'Comment ?'];

export const starbursting: BaseTechnique = {
  id: 'starbursting' as TechniqueId,
  name: 'Starbursting',
  description: 'Technique d\'exploration systématique qui génère des questions autour de six axes fondamentaux : Qui, Quoi, Où, Quand, Pourquoi et Comment.',
  totalRounds: 6,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    const prompts = [
      `Concernant l'objectif : "${objectiveStatement}"\n\n👥 Qui ?\nQui est concerné ? Qui sont les parties prenantes, les utilisateurs, les décideurs ? Qui sera impacté ? Qui devrait être impliqué ?`,
      `📋 Quoi ?\nDe quoi s'agit-il exactement ? Quels sont les éléments clés ? Qu'est-ce qui doit être fait ? Quels sont les livrables attendus ?`,
      `📍 Où ?\nOù cela se passe-t-il ? Où sera-ce déployé ou implémenté ? Quels lieux ou environnements sont concernés ? Où se trouvent les ressources nécessaires ?`,
      `⏰ Quand ?\nQuand cela doit-il être réalisé ? Quelles sont les échéances ? Quand les résultats seront-ils visibles ? Quel est le calendrier optimal ?`,
      `❓ Pourquoi ?\nPourquoi est-ce important ? Pourquoi maintenant ? Pourquoi cette approche plutôt qu'une autre ? Quelles sont les motivations profondes ?`,
      `⚙️ Comment ?\nComment allons-nous procéder ? Comment mesurer le succès ? Comment surmonter les obstacles identifiés ? Quels outils et méthodes utiliser ?`,
    ];
    return prompts[round] ?? prompts[0];
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Question ${round + 1}`;
  },
};
