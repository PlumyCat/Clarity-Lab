export function buildWelcomeCard(): object {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      {
        type: 'TextBlock',
        text: '🧠 BMAD Brainstorm',
        size: 'ExtraLarge',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Je suis votre facilitateur de brainstorming. Je vais vous guider à travers un processus structuré en 8 étapes pour faire émerger les meilleures idées.',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: 'Les 8 étapes',
        size: 'Medium',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Large',
      },
      {
        type: 'ColumnSet',
        columns: [
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: '1. **Objectif** — Définir le sujet', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '2. **Techniques** — Choisir les méthodes', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '3. **Exécution 1** — Première technique', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '4. **Exécution 2** — Deuxième technique', wrap: true, spacing: 'Small' },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              { type: 'TextBlock', text: '5. **Exécution 3** — Troisième technique', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '6. **Organisation** — Trier les idées', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '7. **Insights** — Extraire les pépites', wrap: true, spacing: 'Small' },
              { type: 'TextBlock', text: '8. **Livrable** — Générer le rapport', wrap: true, spacing: 'Small' },
            ],
          },
        ],
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Commencer le brainstorming',
        data: { action: 'start_session' },
        style: 'positive',
      },
    ],
  };
}
