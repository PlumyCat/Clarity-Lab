import type { BmadStep, BrainstormSession, Idea, Insight, StepResult, UserInput } from '../../storage/types.js';
import type { StepHandler } from './index.js';
import { claudeClient } from '../../llm/claudeClient.js';
import { wrapWithProgress } from '../../cards/builder.js';

const IMPACT_COLORS: Record<string, string> = {
  high: 'Good',
  medium: 'Warning',
  low: 'Default',
};

function sortByPriority(insights: Insight[]): Insight[] {
  const impactScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const effortScore: Record<string, number> = { low: 3, medium: 2, high: 1 };

  return [...insights].sort((a, b) => {
    const scoreA = (impactScore[a.impact] ?? 0) + (effortScore[a.effort] ?? 0);
    const scoreB = (impactScore[b.impact] ?? 0) + (effortScore[b.effort] ?? 0);
    return scoreB - scoreA;
  });
}

function flattenIdeas(session: BrainstormSession): Idea[] {
  if (!session.organizedIdeas) return [];
  return session.organizedIdeas.categories.flatMap((cat) => cat.ideas);
}

/** @deprecated Use ExtractInsightsHandler instead */
export { ExtractInsightsHandler as ExtractInsightsStep };

export class ExtractInsightsHandler implements StepHandler {
  step = 'extract_insights' as BmadStep;

  getEntryCard(session: BrainstormSession): object {
    if (session.insights.length > 0) {
      return this.buildInsightsCard(session);
    }

    const ideaCount = session.organizedIdeas?.totalIdeas ?? 0;
    const categoryCount = session.organizedIdeas?.categories.length ?? 0;

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Extraction des insights',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `StormMate va analyser les **${ideaCount} idées** réparties en **${categoryCount} catégories** pour identifier les insights clés et évaluer leur impact et effort.`,
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Extraire les insights',
            style: 'positive',
            data: { action: 'start_extract' },
          },
        ],
      },
    ]);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const action = (input.data?.action as string) ?? '';

    switch (action) {
      case 'start_extract':
      case 'refine_insights':
        return this.handleExtract(session);
      case 'confirm_insights':
        return this.handleConfirm(session);
      default:
        return { responseCard: this.getEntryCard(session), updatedSession: session };
    }
  }

  isComplete(session: BrainstormSession): boolean {
    return session.insights.length > 0;
  }

  private async handleExtract(session: BrainstormSession): Promise<StepResult> {
    if (!session.organizedIdeas || !session.objective) {
      return {
        responseText: 'Données manquantes : les idées doivent être organisées et l\'objectif défini avant l\'extraction.',
        updatedSession: session,
      };
    }

    try {
      const allIdeas = flattenIdeas(session);
      const insights = await claudeClient.extractInsights(allIdeas, session.objective);
      const sorted = sortByPriority(insights);

      const updatedSession: BrainstormSession = {
        ...session,
        insights: sorted,
      };

      return {
        responseCard: this.buildInsightsCard(updatedSession),
        updatedSession,
      };
    } catch (error) {
      console.log(`[ExtractInsightsHandler] Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        responseCard: this.buildErrorCard(session),
        updatedSession: session,
      };
    }
  }

  private handleConfirm(session: BrainstormSession): StepResult {
    if (session.insights.length === 0) {
      return {
        responseCard: this.getEntryCard(session),
        responseText: 'Aucun insight à confirmer. Lancez d\'abord l\'extraction.',
        updatedSession: session,
      };
    }

    return {
      responseText: `**${session.insights.length} insights** confirmés.\n\nPassons à la génération du PowerPoint de synthèse.`,
      transitionTo: 'generate_output' as BmadStep,
      updatedSession: session,
    };
  }

  private buildInsightsCard(session: BrainstormSession): object {
    const sorted = sortByPriority(session.insights);

    const insightBlocks: object[] = [];
    for (const insight of sorted) {
      const impactLabel = { high: 'Élevé', medium: 'Moyen', low: 'Faible' }[insight.impact];
      const effortLabel = { high: 'Élevé', medium: 'Moyen', low: 'Faible' }[insight.effort];

      insightBlocks.push({
        type: 'Container',
        spacing: 'Medium',
        style: 'emphasis',
        items: [
          {
            type: 'TextBlock',
            text: insight.title,
            weight: 'Bolder',
            color: IMPACT_COLORS[insight.impact],
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: insight.description,
            wrap: true,
            size: 'Small',
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
                    text: `Impact: **${impactLabel}**`,
                    size: 'Small',
                    color: IMPACT_COLORS[insight.impact],
                  },
                ],
              },
              {
                type: 'Column',
                width: 'auto',
                items: [
                  {
                    type: 'TextBlock',
                    text: `Effort: **${effortLabel}**`,
                    size: 'Small',
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Insights clés',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `${sorted.length} insights identifiés, triés par priorité (impact élevé + effort faible en premier)`,
        isSubtle: true,
        wrap: true,
      },
      ...insightBlocks,
      {
        type: 'ActionSet',
        spacing: 'Large',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Valider les insights',
            style: 'positive',
            data: { action: 'confirm_insights' },
          },
          {
            type: 'Action.Submit',
            title: 'Affiner',
            data: { action: 'refine_insights' },
          },
        ],
      },
    ]);
  }

  private buildErrorCard(session: BrainstormSession): object {
    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Erreur lors de l\'extraction des insights',
        size: 'Large',
        weight: 'Bolder',
        color: 'Attention',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Une erreur s\'est produite lors de l\'analyse par StormMate. Veuillez réessayer.',
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Réessayer',
            data: { action: 'start_extract' },
          },
        ],
      },
    ]);
  }
}
