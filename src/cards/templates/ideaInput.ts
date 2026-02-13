export function createIdeaInputCard(prompt: string): object {
  return {
    body: [
      {
        type: 'TextBlock',
        text: 'Ajouter une idée',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: prompt,
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'Input.Text',
        id: 'ideaText',
        placeholder: 'Décrivez votre idée...',
        isMultiline: true,
        isRequired: true,
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Ajouter l\'idée',
        data: { action: 'submit_idea' },
        style: 'positive',
      },
    ],
  };
}
