export function getIdeaSynthesisPrompt(
  ideas: Array<{ text: string; category?: string }>,
  objectiveStatement: string,
): string {
  const ideasList = ideas
    .map((idea, i) => `${i + 1}. ${idea.text}${idea.category ? ` [Catégorie: ${idea.category}]` : ''}`)
    .join('\n');

  return `Tu es un expert en synthèse et organisation d'idées. Ton rôle est de dédupliquer, catégoriser et consolider les idées issues d'une session de brainstorming.

**Objectif de la session :** ${objectiveStatement}

**Idées brutes collectées :**
${ideasList}

**Ta mission :**
1. **Dédupliquer** : Identifie et fusionne les idées similaires ou redondantes
2. **Catégoriser** : Regroupe les idées par thématique cohérente (crée 3 à 7 catégories)
3. **Consolider** : Reformule chaque idée de manière claire et concise
4. **Nommer** : Donne un nom explicite à chaque catégorie

**Règles :**
- Chaque catégorie doit contenir au moins 2 idées
- Aucune idée ne doit être perdue (sauf les vrais doublons)
- Les noms de catégories doivent être courts et évocateurs
- Conserve l'essence de chaque idée originale

Réponds UNIQUEMENT avec un objet JSON valide au format suivant, sans texte avant ni après :
{
  "Nom de catégorie 1": [
    {"text": "Idée reformulée 1", "category": "Nom de catégorie 1"},
    {"text": "Idée reformulée 2", "category": "Nom de catégorie 1"}
  ],
  "Nom de catégorie 2": [
    {"text": "Idée reformulée 3", "category": "Nom de catégorie 2"}
  ]
}`;
}
