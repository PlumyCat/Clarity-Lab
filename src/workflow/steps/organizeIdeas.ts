import type { BmadStep, BrainstormSession, Idea, IdeaCategory, StepResult, TechniqueId, UserInput } from '../../storage/types.js';
import type { StepHandler } from './index.js';
import { claudeClient } from '../../llm/claudeClient.js';
import { wrapWithProgress } from '../../cards/builder.js';

function collectAllIdeas(session: BrainstormSession): Idea[] {
  const ideas: Idea[] = [];
  for (const [techId, result] of Object.entries(session.techniqueResults)) {
    for (const ideaText of result.ideas) {
      ideas.push({
        id: crypto.randomUUID(),
        content: ideaText,
        source: techId as TechniqueId,
        votes: 0,
      });
    }
  }
  return ideas;
}

/** @deprecated Use OrganizeIdeasHandler instead */
export { OrganizeIdeasHandler as OrganizeIdeasStep };

export class OrganizeIdeasHandler implements StepHandler {
  step = 'organize_ideas' as BmadStep;

  getEntryCard(session: BrainstormSession): object {
    if (session.organizedIdeas) {
      return this.buildOrganizedCard(session);
    }

    const allIdeas = collectAllIdeas(session);
    const techniqueCount = Object.keys(session.techniqueResults).length;

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Organisation des idées',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `**${allIdeas.length} idées** collectées à partir de **${techniqueCount} technique${techniqueCount > 1 ? 's' : ''}**.`,
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'StormMate va analyser, dédupliquer et catégoriser toutes les idées générées pendant les sessions de brainstorming.',
        wrap: true,
        isSubtle: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Organiser les idées',
            style: 'positive',
            data: { action: 'start_organize' },
          },
        ],
      },
    ]);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const action = (input.data?.action as string) ?? '';

    switch (action) {
      case 'start_organize':
      case 'reorganize_ideas':
        return this.handleOrganize(session);
      case 'confirm_ideas':
        return this.handleConfirm(session);
      default:
        return { responseCard: this.getEntryCard(session), updatedSession: session };
    }
  }

  isComplete(session: BrainstormSession): boolean {
    return session.organizedIdeas !== null;
  }

  private async handleOrganize(session: BrainstormSession): Promise<StepResult> {
    const allIdeas = collectAllIdeas(session);

    if (allIdeas.length === 0) {
      return {
        responseText: 'Aucune idée à organiser. Les techniques n\'ont produit aucun résultat.',
        updatedSession: session,
      };
    }

    try {
      const organized = await claudeClient.organizeIdeas(allIdeas);

      const categories: IdeaCategory[] = Object.entries(organized).map(([name, ideas]) => ({
        name,
        ideas,
      }));
      const totalIdeas = categories.reduce((sum, cat) => sum + cat.ideas.length, 0);

      const updatedSession: BrainstormSession = {
        ...session,
        organizedIdeas: { categories, totalIdeas },
      };

      return {
        responseCard: this.buildOrganizedCard(updatedSession),
        updatedSession,
      };
    } catch (error) {
      console.log(`[OrganizeIdeasHandler] Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        responseCard: this.buildErrorCard(session, 'organisation des idées'),
        updatedSession: session,
      };
    }
  }

  private handleConfirm(session: BrainstormSession): StepResult {
    if (!session.organizedIdeas) {
      return {
        responseCard: this.getEntryCard(session),
        responseText: 'Aucune organisation à confirmer. Lancez d\'abord l\'analyse.',
        updatedSession: session,
      };
    }

    const { categories, totalIdeas } = session.organizedIdeas;
    return {
      responseText: `Organisation confirmée : **${categories.length} catégories**, **${totalIdeas} idées**.\n\nPassons à l'extraction des insights.`,
      transitionTo: 'extract_insights' as BmadStep,
      updatedSession: session,
    };
  }

  private buildOrganizedCard(session: BrainstormSession): object {
    const { categories, totalIdeas } = session.organizedIdeas!;

    const categoryBlocks: object[] = [];
    for (const cat of categories) {
      categoryBlocks.push({
        type: 'TextBlock',
        text: `**${cat.name}** (${cat.ideas.length} idées)`,
        spacing: 'Medium',
        wrap: true,
      });

      const visibleIdeas = cat.ideas.slice(0, 5);
      for (const idea of visibleIdeas) {
        categoryBlocks.push({
          type: 'TextBlock',
          text: `- ${idea.content}`,
          wrap: true,
          spacing: 'None',
          size: 'Small',
        });
      }

      if (cat.ideas.length > 5) {
        categoryBlocks.push({
          type: 'TextBlock',
          text: `_+${cat.ideas.length - 5} autres..._`,
          isSubtle: true,
          size: 'Small',
          spacing: 'None',
        });
      }
    }

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Idées organisées par catégorie',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: `${totalIdeas} idées réparties en ${categories.length} catégories`,
        isSubtle: true,
        wrap: true,
      },
      ...categoryBlocks,
      {
        type: 'ActionSet',
        spacing: 'Large',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Valider l\'organisation',
            style: 'positive',
            data: { action: 'confirm_ideas' },
          },
          {
            type: 'Action.Submit',
            title: 'Réorganiser',
            data: { action: 'reorganize_ideas' },
          },
        ],
      },
    ]);
  }

  private buildErrorCard(session: BrainstormSession, context: string): object {
    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: `Erreur lors de l'${context}`,
        size: 'Large',
        weight: 'Bolder',
        color: 'Attention',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Une erreur s\'est produite lors du traitement par StormMate. Veuillez réessayer.',
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Réessayer',
            data: { action: 'start_organize' },
          },
        ],
      },
    ]);
  }
}
