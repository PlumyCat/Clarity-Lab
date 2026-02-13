export function getObjectiveRefinerPrompt(
  rawInput: string,
  context: string,
  expectedOutcome: string,
): string {
  return `Tu es un expert en formulation d'objectifs de brainstorming. Ton rôle est d'analyser l'objectif brut fourni par l'utilisateur et de le reformuler de manière claire, mesurable et actionnable.

**Objectif brut de l'utilisateur :**
${rawInput}

**Contexte fourni :**
${context || 'Aucun contexte supplémentaire fourni.'}

**Résultat attendu :**
${expectedOutcome || 'Non précisé par l\'utilisateur.'}

**Ta mission :**
1. Reformule l'objectif pour qu'il soit clair, spécifique et orienté action
2. Suggère un contexte enrichi si celui fourni est insuffisant
3. Propose un résultat attendu concret si celui fourni est vague

**Règles de reformulation :**
- L'objectif doit commencer par un verbe d'action (Explorer, Identifier, Concevoir, Améliorer...)
- Il doit être compréhensible par tous les participants sans connaissance préalable
- Il doit être suffisamment ouvert pour permettre la créativité
- Il doit être suffisamment cadré pour rester productif

Réponds UNIQUEMENT avec un objet JSON valide au format suivant, sans texte avant ni après :
{
  "refinedStatement": "L'objectif reformulé ici",
  "suggestedContext": "Le contexte enrichi ici",
  "suggestedOutcome": "Le résultat attendu concret ici"
}`;
}
