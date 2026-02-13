export function buildHelpCard(): object {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: '❓ Aide — BMAD Brainstorm',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Commandes disponibles',
        size: 'Medium',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'FactSet',
        spacing: 'Small',
        facts: [
          { title: 'start', value: 'Démarrer un nouveau brainstorming' },
          { title: 'status', value: 'Voir la progression de la session' },
          { title: 'resume', value: 'Reprendre le brainstorming' },
          { title: 'pause', value: 'Mettre en pause la session' },
          { title: 'export', value: 'Générer le rapport PowerPoint' },
          { title: 'help', value: 'Afficher cette aide' },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Méthodologie BMAD',
        size: 'Medium',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Large',
      },
      {
        type: 'TextBlock',
        text: 'Le processus BMAD guide votre équipe en 8 étapes : de la définition de l\'objectif jusqu\'à la génération d\'un livrable structuré. Chaque étape utilise des techniques éprouvées (5 Pourquoi, SCAMPER, SWOT, etc.) pour stimuler la créativité collective.',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: 'Pendant les étapes d\'exécution, répondez simplement aux questions posées par le bot. Vos idées seront automatiquement collectées, organisées et synthétisées.',
        wrap: true,
        spacing: 'Small',
        isSubtle: true,
      },
    ],
  };
}
