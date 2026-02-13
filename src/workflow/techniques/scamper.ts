import { TechniqueId } from '../../storage/types';
import { BaseTechnique } from './index';

const ROUND_LABELS = [
  'Substituer',
  'Combiner',
  'Adapter',
  'Modifier',
  'Put to other use (Autres usages)',
  'Éliminer',
  'Réorganiser',
];

export const scamper: BaseTechnique = {
  id: 'scamper' as TechniqueId,
  name: 'SCAMPER',
  description: 'Technique de créativité structurée qui explore 7 transformations possibles : Substituer, Combiner, Adapter, Modifier, Put to other use, Éliminer, Réorganiser.',
  totalRounds: 7,

  getRoundPrompt(round: number, objectiveStatement: string): string {
    const prompts = [
      `Concernant l'objectif : "${objectiveStatement}"\n\n🔄 Substituer\nQue pourrait-on remplacer ? Quels composants, matériaux, processus ou personnes pourraient être substitués ? Quelles alternatives existent ?`,
      `🔗 Combiner\nQue pourrait-on combiner ou fusionner ? Quels éléments, idées ou processus pourraient être associés pour créer quelque chose de nouveau ?`,
      `🔧 Adapter\nQue pourrait-on adapter d'un autre domaine ? Quelles solutions existantes pourraient être transposées ? Qu'est-ce qui a fonctionné ailleurs et pourrait s'appliquer ici ?`,
      `📐 Modifier\nQue pourrait-on modifier, agrandir ou réduire ? Quelles caractéristiques pourraient être amplifiées ou minimisées ? Que se passe-t-il si on change l'échelle ?`,
      `🎯 Put to other use — Autres usages\nComment pourrait-on utiliser cela autrement ? Dans quel autre contexte cela pourrait-il servir ? Quels nouveaux marchés ou utilisateurs pourraient en bénéficier ?`,
      `✂️ Éliminer\nQue pourrait-on supprimer ou simplifier ? Quels éléments sont superflus ? Que se passe-t-il si on réduit au strict minimum ?`,
      `🔀 Réorganiser\nQue pourrait-on réorganiser, inverser ou réagencer ? Et si on faisait l'inverse ? Comment une autre séquence ou structure pourrait-elle améliorer les choses ?`,
    ];
    return prompts[round] ?? prompts[0];
  },

  getRoundLabel(round: number): string {
    return ROUND_LABELS[round] ?? `Étape ${round + 1}`;
  },
};
