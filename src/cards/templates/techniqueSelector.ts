const TECHNIQUE_LABELS: Record<string, string> = {
  five_whys: 'Les 5 Pourquoi',
  six_thinking_hats: 'Les 6 Chapeaux de Bono',
  swot: 'Analyse SWOT',
  scamper: 'SCAMPER',
  starbursting: 'Starbursting',
  mind_mapping: 'Carte mentale',
  brainwriting: 'Brainwriting',
  reverse_brainstorming: 'Brainstorming inversé',
};

export function createTechniqueSelectorCard(
  recommendations: Array<{ techniqueId: string; reason: string }>
): object {
  const recommendationItems = recommendations.map((rec) => ({
    type: 'Container',
    spacing: 'Small',
    items: [
      {
        type: 'TextBlock',
        text: `**${TECHNIQUE_LABELS[rec.techniqueId] || rec.techniqueId}**`,
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: rec.reason,
        wrap: true,
        isSubtle: true,
        spacing: 'None',
      },
    ],
  }));

  const choices = Object.entries(TECHNIQUE_LABELS).map(([id, label]) => ({
    title: label,
    value: id,
  }));

  const defaultSelected = recommendations.map((r) => r.techniqueId).join(',');

  return {
    body: [
      {
        type: 'TextBlock',
        text: 'Sélection des techniques',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'StormMate recommande les techniques suivantes pour votre objectif :',
        wrap: true,
        spacing: 'Small',
      },
      ...recommendationItems,
      {
        type: 'TextBlock',
        text: 'Sélectionnez les techniques à utiliser',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Large',
      },
      {
        type: 'Input.ChoiceSet',
        id: 'selectedTechniques',
        isMultiSelect: true,
        value: defaultSelected,
        choices,
      },
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Valider la sélection',
        data: { action: 'select_techniques' },
        style: 'positive',
      },
    ],
  };
}
