import type { TechniqueId } from '../../storage/types.js';

interface TechniqueConfig {
  name: string;
  description: string;
  rounds: string[];
}

const techniques: Record<TechniqueId, TechniqueConfig> = {
  five_whys: {
    name: 'Les 5 Pourquoi',
    description: 'Technique d\'analyse causale qui creuse en profondeur en posant successivement "Pourquoi ?" pour identifier les causes racines.',
    rounds: [
      'Premier Pourquoi : Pourquoi ce problème ou ce besoin existe-t-il ? Décrivez la situation telle que vous la percevez. Quelles sont les manifestations visibles du problème ?',
      'Deuxième Pourquoi : En reprenant les causes identifiées au tour précédent, demandez-vous pourquoi elles existent. Quelles sont les causes sous-jacentes ?',
      'Troisième Pourquoi : Creusons encore plus profond. Pourquoi les causes identifiées au tour précédent existent-elles ? Quels sont les facteurs structurels en jeu ?',
      'Quatrième Pourquoi : Nous approchons des causes racines. Pourquoi ces facteurs structurels sont-ils présents ? Quels sont les éléments systémiques ?',
      'Cinquième Pourquoi : Dernier niveau d\'analyse. Pourquoi ces éléments systémiques persistent-ils ? Identifiez les causes fondamentales et les leviers d\'action possibles.',
    ],
  },
  six_thinking_hats: {
    name: 'Les 6 Chapeaux de Bono',
    description: 'Technique qui examine un sujet sous 6 angles différents (faits, émotions, risques, avantages, créativité, organisation) pour une analyse complète.',
    rounds: [
      'Chapeau Blanc (Faits) : Quels sont les faits objectifs et les données dont nous disposons ? Quelles informations nous manquent ? Restons factuels et neutres.',
      'Chapeau Rouge (Émotions) : Quelles sont vos intuitions et ressentis sur ce sujet ? Pas besoin de justifier, exprimez vos émotions et pressentiments librement.',
      'Chapeau Noir (Risques) : Quels sont les risques, dangers et obstacles potentiels ? Qu\'est-ce qui pourrait mal tourner ? Soyez critiques et prudents.',
      'Chapeau Jaune (Avantages) : Quels sont les bénéfices et opportunités ? Quels sont les aspects positifs et les scénarios optimistes ? Voyez le verre à moitié plein.',
      'Chapeau Vert (Créativité) : Pensez de manière créative et originale. Proposez des alternatives, des solutions innovantes, des idées folles. Tout est permis !',
      'Chapeau Bleu (Organisation) : Prenons du recul. Synthétisons ce qui a été dit. Quelles sont les prochaines étapes ? Comment organiser les idées émises ?',
    ],
  },
  swot: {
    name: 'Analyse SWOT',
    description: 'Analyse stratégique qui examine les Forces, Faiblesses, Opportunités et Menaces pour évaluer une situation de manière complète.',
    rounds: [
      'Forces (Strengths) : Quels sont nos atouts internes ? Quelles sont nos compétences clés, nos ressources, nos avantages compétitifs ? Qu\'est-ce qui fonctionne bien ?',
      'Faiblesses (Weaknesses) : Quelles sont nos faiblesses internes ? Quels sont nos manques, nos limites, nos points à améliorer ? Où perdons-nous de l\'efficacité ?',
      'Opportunités (Opportunities) : Quelles opportunités externes pouvons-nous saisir ? Quelles tendances, évolutions ou circonstances jouent en notre faveur ?',
      'Menaces (Threats) : Quelles menaces externes devons-nous anticiper ? Quels risques, changements ou obstacles pourraient nous impacter négativement ?',
    ],
  },
  scamper: {
    name: 'SCAMPER',
    description: 'Technique de créativité qui transforme un concept existant via 7 opérations : Substituer, Combiner, Adapter, Modifier, Proposer d\'autres usages, Éliminer, Réorganiser.',
    rounds: [
      'Substituer & Combiner : Que pourrait-on remplacer dans l\'approche actuelle ? Quels éléments pourrait-on substituer par d\'autres ? Et quels éléments pourrait-on combiner ou fusionner pour créer quelque chose de nouveau ?',
      'Adapter & Modifier : Que pourrait-on adapter d\'un autre domaine ou contexte ? Quelles bonnes pratiques emprunter ? Et que pourrait-on modifier, agrandir, réduire ou transformer pour améliorer la situation ?',
      'Proposer d\'autres usages & Éliminer : Quels autres usages ou applications pourrait-on imaginer ? Et que pourrait-on supprimer, simplifier ou éliminer pour rendre les choses plus efficaces ?',
      'Réorganiser : Comment pourrait-on réorganiser, inverser ou restructurer l\'approche ? Que se passerait-il si on faisait les choses dans un ordre différent ou de manière opposée ?',
    ],
  },
  starbursting: {
    name: 'Starbursting',
    description: 'Technique qui génère des questions plutôt que des réponses, en explorant systématiquement les 6 dimensions : Qui, Quoi, Où, Quand, Pourquoi, Comment.',
    rounds: [
      'Qui & Quoi : Qui est concerné par ce sujet ? Qui sont les parties prenantes ? Qui bénéficierait d\'une solution ? Et quoi exactement cherche-t-on à accomplir ? Quel est le coeur du sujet ?',
      'Où & Quand : Où ce sujet s\'applique-t-il ? Dans quel contexte, quel environnement ? Et quand est-ce pertinent ? Quels sont les délais, les échéances, les moments clés ?',
      'Pourquoi & Comment : Pourquoi est-ce important ? Pourquoi maintenant ? Quelles sont les motivations profondes ? Et comment pourrait-on s\'y prendre ? Quelles approches, méthodes ou ressources ?',
    ],
  },
  mind_mapping: {
    name: 'Mind Mapping',
    description: 'Technique visuelle qui organise les idées en partant d\'un concept central et en créant des branches thématiques pour explorer toutes les dimensions.',
    rounds: [
      'Branches principales : À partir de l\'objectif central, identifiez les grandes thématiques ou dimensions à explorer. Quels sont les piliers principaux du sujet ? Proposez 3 à 6 branches principales.',
      'Sous-branches : Pour chaque branche principale identifiée, développez des sous-thèmes. Détaillez, nuancez, approfondissez chaque dimension. Faites des connexions entre les branches.',
      'Feuilles et connexions : Ajoutez des idées concrètes, des exemples, des actions spécifiques aux sous-branches. Identifiez les liens transversaux entre différentes branches.',
    ],
  },
  brainwriting: {
    name: 'Brainwriting',
    description: 'Technique d\'écriture silencieuse où chaque participant propose des idées par écrit, puis enrichit les idées des autres pour construire collectivement.',
    rounds: [
      'Génération initiale : Chaque participant propose 3 idées en lien avec l\'objectif. Écrivez librement, sans censure ni jugement. Toutes les idées sont les bienvenues, même les plus audacieuses.',
      'Enrichissement : Lisez les idées proposées par les autres participants et enrichissez-les. Ajoutez des variantes, combinez des idées entre elles, proposez des améliorations ou des extensions.',
      'Consolidation : En vous appuyant sur toutes les idées générées et enrichies, proposez vos 2-3 idées favorites ou de nouvelles synthèses. Quelles combinaisons vous semblent les plus prometteuses ?',
    ],
  },
  reverse_brainstorming: {
    name: 'Brainstorming Inversé',
    description: 'Technique qui inverse le problème : au lieu de chercher des solutions, on cherche d\'abord comment aggraver le problème, puis on inverse ces idées en solutions.',
    rounds: [
      'Inversion du problème : Comment pourrait-on AGGRAVER la situation ? Comment s\'assurer que l\'objectif ne soit JAMAIS atteint ? Soyez créatifs dans la catastrophe ! Plus c\'est absurde, mieux c\'est.',
      'Retournement : Reprenez les idées "catastrophe" du tour précédent et inversez-les. Si "ne pas communiquer" aggrave le problème, alors "mettre en place une communication transparente" est une piste de solution.',
      'Solutions concrètes : À partir des retournements, formulez des solutions concrètes et actionnables. Priorisez les plus impactantes et détaillez comment les mettre en oeuvre.',
    ],
  },
};

export function getTechniqueGuidePrompt(
  techniqueId: TechniqueId,
  objectiveStatement: string,
  round: number,
): string {
  const technique = techniques[techniqueId];
  const roundIndex = Math.min(round - 1, technique.rounds.length - 1);
  const roundPrompt = technique.rounds[roundIndex];

  return `Tu facilites une session de brainstorming utilisant la technique **${technique.name}**.

**Description de la technique :** ${technique.description}

**Objectif de la session :** ${objectiveStatement}

**Tour actuel : ${round}/${technique.rounds.length}**

**Consigne pour ce tour :**
${roundPrompt}

**Instructions pour le facilitateur :**
- Présente clairement la consigne de ce tour aux participants
- Encourage la participation de tous
- Rappelle qu'il n'y a pas de mauvaise idée à ce stade
- Si c'est le premier tour, explique brièvement la technique
- Si c'est un tour intermédiaire, fais un bref rappel des contributions précédentes
- Si c'est le dernier tour, annonce que c'est la phase finale de cette technique

Génère un message engageant et structuré pour guider les participants dans ce tour.`;
}
