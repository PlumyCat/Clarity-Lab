export function getInsightExtractorPrompt(
  organizedIdeas: Record<string, Array<{ text: string }>>,
  objectiveStatement: string,
): string {
  const categoriesList = Object.entries(organizedIdeas)
    .map(([category, ideas]) => {
      const ideasText = ideas.map((idea) => `  - ${idea.text}`).join('\n');
      return `**${category}** :\n${ideasText}`;
    })
    .join('\n\n');

  return `Tu es un expert en analyse stratégique. Ton rôle est d'extraire les insights clés à partir des idées organisées d'une session de brainstorming.

**Objectif de la session :** ${objectiveStatement}

**Idées organisées par catégorie :**
${categoriesList}

**Ta mission :**
Extrais entre 3 et 7 insights stratégiques qui représentent les conclusions les plus importantes de cette session.

**Pour chaque insight, fournis :**
- **title** : Un titre court et percutant (5-10 mots)
- **description** : Une description détaillée de l'insight et de ses implications (2-3 phrases)
- **impact** : L'impact potentiel si cet insight est mis en oeuvre ("high", "medium" ou "low")
- **effort** : L'effort nécessaire pour mettre en oeuvre cet insight ("high", "medium" ou "low")

**Critères de sélection des insights :**
- Privilégie les insights actionnables et concrets
- Identifie les thèmes transversaux qui traversent plusieurs catégories
- Mets en avant les idées les plus originales et à fort potentiel
- Équilibre entre quick wins (impact élevé, effort faible) et initiatives stratégiques

Réponds UNIQUEMENT avec un tableau JSON valide au format suivant, sans texte avant ni après :
[
  {
    "title": "Titre de l'insight",
    "description": "Description détaillée de l'insight et de ses implications.",
    "impact": "high",
    "effort": "medium"
  }
]`;
}
