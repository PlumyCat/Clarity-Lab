const IMPACT_COLORS: Record<string, string> = {
  high: 'Good',
  medium: 'Warning',
  low: 'Default',
};

const EFFORT_COLORS: Record<string, string> = {
  high: 'Attention',
  medium: 'Warning',
  low: 'Good',
};

const LEVEL_LABELS: Record<string, string> = {
  high: 'Élevé',
  medium: 'Moyen',
  low: 'Faible',
};

export function createInsightsReviewCard(
  insights: Array<{
    id: string;
    title: string;
    description: string;
    impact: string;
    effort: string;
    votes: number;
  }>
): object {
  const insightItems = insights.flatMap((insight) => [
    {
      type: 'Container',
      spacing: 'Medium',
      separator: true,
      items: [
        {
          type: 'TextBlock',
          text: `**${insight.title}**`,
          wrap: true,
        },
        {
          type: 'TextBlock',
          text: insight.description,
          wrap: true,
          spacing: 'Small',
        },
        {
          type: 'ColumnSet',
          spacing: 'Small',
          columns: [
            {
              type: 'Column',
              width: 'auto',
              items: [
                {
                  type: 'TextBlock',
                  text: `Impact: ${LEVEL_LABELS[insight.impact] || insight.impact}`,
                  color: IMPACT_COLORS[insight.impact] || 'Default',
                  weight: 'Bolder',
                  size: 'Small',
                },
              ],
            },
            {
              type: 'Column',
              width: 'auto',
              items: [
                {
                  type: 'TextBlock',
                  text: `Effort: ${LEVEL_LABELS[insight.effort] || insight.effort}`,
                  color: EFFORT_COLORS[insight.effort] || 'Default',
                  weight: 'Bolder',
                  size: 'Small',
                },
              ],
            },
            {
              type: 'Column',
              width: 'auto',
              items: [
                {
                  type: 'TextBlock',
                  text: `${insight.votes} vote(s)`,
                  isSubtle: true,
                  size: 'Small',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'ActionSet',
      actions: [
        {
          type: 'Action.Submit',
          title: 'Voter',
          data: { action: 'vote_insight', insightId: insight.id },
        },
      ],
    },
  ]);

  return {
    body: [
      {
        type: 'TextBlock',
        text: 'Revue des insights',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Votez pour les insights les plus pertinents.',
        wrap: true,
        isSubtle: true,
        spacing: 'Small',
      },
      ...insightItems,
    ],
    actions: [
      {
        type: 'Action.Submit',
        title: 'Continuer',
        data: { action: 'finalize_insights' },
        style: 'positive',
      },
    ],
  };
}
