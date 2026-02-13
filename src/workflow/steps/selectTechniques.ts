import { BmadStep, BrainstormSession, StepResult, TechniqueId, UserInput } from '../../storage/types.js';
import type { StepHandler } from './index.js';
import type { ClaudeClient } from '../../llm/claudeClient.js';
import { TECHNIQUE_INFO } from '../techniques/index.js';
import { wrapWithProgress } from '../../cards/builder.js';

const VALID_TECHNIQUE_IDS: TechniqueId[] = [
  'five_whys', 'starbursting', 'six_thinking_hats', 'scamper',
  'mind_mapping', 'brainwriting', 'reverse_brainstorming', 'swot',
];

export class SelectTechniquesStep implements StepHandler {
  readonly step = BmadStep.SELECT_TECHNIQUES;

  constructor(private claudeClient: ClaudeClient) {}

  async getEntryCard(session: BrainstormSession): Promise<object> {
    if (!session.objective) {
      return wrapWithProgress(session, [
        {
          type: 'TextBlock',
          text: 'Erreur : aucun objectif défini. Veuillez d\'abord définir votre objectif.',
          color: 'Attention',
          wrap: true,
        },
      ]);
    }

    // Call Claude to get technique recommendations
    console.log('[SelectTechniquesStep] Getting technique recommendations...');
    let recommendations: Array<{ techniqueId: TechniqueId; reason: string }> = [];
    try {
      recommendations = await this.claudeClient.recommendTechniques(session.objective);
    } catch (error) {
      console.log(`[SelectTechniquesStep] Failed to get recommendations: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Store recommendations as JSON in session for display
    const rationale = recommendations.map(r => {
      const info = TECHNIQUE_INFO[r.techniqueId];
      return `**${info?.name || r.techniqueId}** : ${r.reason}`;
    }).join('\n\n');

    return this.buildTechniqueCard(session, recommendations, rationale);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const action = input.data?.action as string | undefined;
    const verb = input.data?.verb as string | undefined;
    const actionKey = action || verb;

    if (input.type === 'card_action' && actionKey === 'submit_techniques') {
      return this.handleSelection(session, input);
    }

    // If no valid action, show the entry card again
    return {
      responseCard: await this.getEntryCard(session),
      updatedSession: session,
    };
  }

  isComplete(session: BrainstormSession): boolean {
    return session.selectedTechniques.length >= 2;
  }

  private handleSelection(session: BrainstormSession, input: UserInput): StepResult {
    const raw = input.data?.selectedTechniques as string | undefined;
    if (!raw) {
      return {
        responseText: 'Veuillez sélectionner au moins 2 techniques.',
        updatedSession: session,
      };
    }

    // Adaptive Cards ChoiceSet with isMultiSelect returns comma-separated values
    const selectedIds = raw.split(',').map(s => s.trim()).filter(Boolean) as TechniqueId[];

    // Validate count
    if (selectedIds.length < 2 || selectedIds.length > 3) {
      return {
        responseText: `Veuillez sélectionner entre 2 et 3 techniques (vous en avez sélectionné ${selectedIds.length}).`,
        updatedSession: session,
      };
    }

    // Validate IDs
    for (const id of selectedIds) {
      if (!VALID_TECHNIQUE_IDS.includes(id)) {
        return {
          responseText: `Technique inconnue : "${id}". Veuillez réessayer.`,
          updatedSession: session,
        };
      }
    }

    const techniqueNames = selectedIds.map(id => TECHNIQUE_INFO[id]?.name || id).join(', ');

    const updatedSession: BrainstormSession = {
      ...session,
      selectedTechniques: selectedIds,
      techniqueRecommendations: techniqueNames,
    };

    return {
      responseText: `Techniques sélectionnées : **${techniqueNames}**\n\nLançons la première technique !`,
      transitionTo: BmadStep.EXECUTE_TECHNIQUE_1,
      updatedSession,
    };
  }

  private buildTechniqueCard(
    session: BrainstormSession,
    recommendations: Array<{ techniqueId: TechniqueId; reason: string }>,
    rationale: string,
  ): object {
    const recommendedIds = recommendations.map(r => r.techniqueId);
    const defaultSelected = recommendedIds.join(',');

    const recommendationItems: object[] = recommendations.length > 0
      ? [
          {
            type: 'TextBlock',
            text: 'StormMate recommande les techniques suivantes :',
            wrap: true,
            spacing: 'Small',
          },
          ...recommendations.map(rec => ({
            type: 'Container',
            spacing: 'Small',
            items: [
              {
                type: 'TextBlock',
                text: `**${TECHNIQUE_INFO[rec.techniqueId]?.name || rec.techniqueId}**`,
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
          })),
        ]
      : [
          {
            type: 'TextBlock',
            text: 'Choisissez les techniques que vous souhaitez utiliser :',
            wrap: true,
            spacing: 'Small',
          },
        ];

    const choices = VALID_TECHNIQUE_IDS.map(id => ({
      title: `${TECHNIQUE_INFO[id]?.name || id} — ${TECHNIQUE_INFO[id]?.description || ''}`,
      value: id,
    }));

    const card = wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Sélection des techniques',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      ...recommendationItems,
      {
        type: 'TextBlock',
        text: 'Sélectionnez 2 à 3 techniques',
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
    ]);

    return {
      ...card,
      actions: [
        {
          type: 'Action.Submit',
          title: 'Valider la sélection',
          style: 'positive',
          data: { action: 'submit_techniques' },
        },
      ],
    };
  }
}
