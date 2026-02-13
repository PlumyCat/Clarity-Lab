export function createTechniquePromptCard(
  techniqueName: string,
  round: number,
  totalRounds: number,
  prompt: string,
  roundLabel: string
): object {
  return {
    body: [
      {
        type: 'TextBlock',
        text: techniqueName,
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'ColumnSet',
        columns: [
          {
            type: 'Column',
            width: 'auto',
            items: [
              {
                type: 'TextBlock',
                text: `Tour ${round}/${totalRounds}`,
                weight: 'Bolder',
                color: 'Accent',
              },
            ],
          },
          {
            type: 'Column',
            width: 'stretch',
            items: [
              {
                type: 'TextBlock',
                text: roundLabel,
                isSubtle: true,
              },
            ],
          },
        ],
      },
      {
        type: 'TextBlock',
        text: prompt,
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'Input.Text',
        id: 'contribution',
        placeholder: 'Saisissez votre contribution...',
        isMultiline: true,
        isRequired: true,
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Contribuer',
        data: { action: 'submit_contribution' },
        style: 'positive',
      },
    ],
  };
}
