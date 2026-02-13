import type { BmadStep, BrainstormSession, StepResult, UserInput } from '../../storage/types.js';
import type { StepHandler } from './index.js';
import { generatePresentation } from '../../pptx/generator.js';
import { uploadPptx } from '../../pptx/upload.js';
import { wrapWithProgress } from '../../cards/builder.js';

/** @deprecated Use GenerateOutputHandler instead */
export { GenerateOutputHandler as GenerateOutputStep };

export class GenerateOutputHandler implements StepHandler {
  step = 'generate_output' as BmadStep;

  getEntryCard(session: BrainstormSession): object {
    if (session.outputUrl) {
      return this.buildSuccessCard(session);
    }

    const insightCount = session.insights.length;
    const ideaCount = session.organizedIdeas?.totalIdeas ?? 0;
    const techniqueCount = Object.keys(session.techniqueResults).length;

    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Génération du PowerPoint',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Le rapport de synthèse inclura :',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Techniques utilisées', value: String(techniqueCount) },
          { title: 'Idées organisées', value: String(ideaCount) },
          { title: 'Insights extraits', value: String(insightCount) },
        ],
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Générer le PowerPoint',
            style: 'positive',
            data: { action: 'start_generate' },
          },
        ],
      },
    ]);
  }

  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const action = (input.data?.action as string) ?? '';

    switch (action) {
      case 'start_generate':
        return this.handleGenerate(session);
      case 'complete_session':
        return this.handleComplete(session);
      case 'add_questions':
        return this.handleAddQuestionsForm(session);
      case 'submit_questions':
        return this.handleSubmitQuestions(session, input);
      default:
        return { responseCard: this.getEntryCard(session), updatedSession: session };
    }
  }

  isComplete(session: BrainstormSession): boolean {
    return session.outputUrl !== null;
  }

  private async handleGenerate(session: BrainstormSession): Promise<StepResult> {
    try {
      console.log(`[GenerateOutputHandler] Generating PPTX for session ${session.id}`);
      const buffer = await generatePresentation(session);

      console.log(`[GenerateOutputHandler] Uploading PPTX (${buffer.length} bytes)`);
      const objectiveLabel = session.objective?.what || session.objective?.refinedStatement || '';
      const url = await uploadPptx(buffer, session.id, objectiveLabel);

      const updatedSession: BrainstormSession = {
        ...session,
        outputUrl: url,
      };

      return {
        responseCard: this.buildSuccessCard(updatedSession),
        updatedSession,
      };
    } catch (error) {
      console.log(`[GenerateOutputHandler] Error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        responseCard: this.buildErrorCard(session),
        updatedSession: session,
      };
    }
  }

  private handleComplete(session: BrainstormSession): StepResult {
    const updatedSession: BrainstormSession = {
      ...session,
      status: 'completed',
    };

    return {
      responseText: 'Session de brainstorming terminée. Merci à tous les participants !\n\nLe PowerPoint de synthèse est disponible via le lien partagé. Vous pouvez démarrer une nouvelle session avec la commande `start`.',
      transitionTo: 'completed' as BmadStep,
      updatedSession,
    };
  }

  private handleAddQuestionsForm(session: BrainstormSession): StepResult {
    const card = wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Ajouter des questions ouvertes',
        size: 'Large',
        weight: 'Bolder',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Notez les questions à traiter lors de la prochaine session :',
        wrap: true,
      },
      {
        type: 'Input.Text',
        id: 'questions',
        isMultiline: true,
        placeholder: 'Entrez vos questions (une par ligne)',
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Ajouter',
            style: 'positive',
            data: { action: 'submit_questions' },
          },
          {
            type: 'Action.Submit',
            title: 'Annuler',
            data: { action: 'start_generate' },
          },
        ],
      },
    ]);

    return { responseCard: card, updatedSession: session };
  }

  private handleSubmitQuestions(session: BrainstormSession, input: UserInput): StepResult {
    const questionsText = (input.data?.questions as string) ?? '';
    const newQuestions = questionsText
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (newQuestions.length === 0) {
      return {
        responseCard: this.buildSuccessCard(session),
        responseText: 'Aucune question ajoutée.',
        updatedSession: session,
      };
    }

    const updatedSession: BrainstormSession = {
      ...session,
      openQuestions: [...session.openQuestions, ...newQuestions],
    };

    return {
      responseCard: this.buildSuccessCard(updatedSession),
      responseText: `${newQuestions.length} question${newQuestions.length > 1 ? 's' : ''} ajoutée${newQuestions.length > 1 ? 's' : ''}.`,
      updatedSession,
    };
  }

  private buildSuccessCard(session: BrainstormSession): object {
    const insightCount = session.insights.length;
    const ideaCount = session.organizedIdeas?.totalIdeas ?? 0;
    const techniqueCount = Object.keys(session.techniqueResults).length;
    const participantCount = session.participants.length;

    const bodyItems: object[] = [
      {
        type: 'TextBlock',
        text: 'PowerPoint généré avec succès',
        size: 'Large',
        weight: 'Bolder',
        color: 'Good',
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.OpenUrl',
            title: 'Télécharger le PowerPoint',
            url: session.outputUrl,
          },
        ],
      },
      {
        type: 'TextBlock',
        text: 'Résumé de la session',
        weight: 'Bolder',
        spacing: 'Large',
        wrap: true,
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Participants', value: String(participantCount) },
          { title: 'Techniques', value: String(techniqueCount) },
          { title: 'Idées', value: String(ideaCount) },
          { title: 'Insights', value: String(insightCount) },
        ],
      },
    ];

    // Open questions section
    if (session.openQuestions.length > 0) {
      bodyItems.push({
        type: 'TextBlock',
        text: `Questions ouvertes (${session.openQuestions.length})`,
        weight: 'Bolder',
        spacing: 'Large',
        wrap: true,
      });

      for (const q of session.openQuestions) {
        bodyItems.push({
          type: 'TextBlock',
          text: `- ${q}`,
          wrap: true,
          spacing: 'None',
          size: 'Small',
        });
      }
    }

    bodyItems.push({
      type: 'ActionSet',
      spacing: 'Large',
      actions: [
        {
          type: 'Action.Submit',
          title: 'Terminer la session',
          style: 'positive',
          data: { action: 'complete_session' },
        },
        {
          type: 'Action.Submit',
          title: 'Ajouter des questions',
          data: { action: 'add_questions' },
        },
      ],
    });

    return wrapWithProgress(session, bodyItems);
  }

  private buildErrorCard(session: BrainstormSession): object {
    return wrapWithProgress(session, [
      {
        type: 'TextBlock',
        text: 'Erreur lors de la génération',
        size: 'Large',
        weight: 'Bolder',
        color: 'Attention',
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: 'Une erreur s\'est produite lors de la génération ou de l\'upload du PowerPoint. Veuillez réessayer.',
        wrap: true,
      },
      {
        type: 'ActionSet',
        actions: [
          {
            type: 'Action.Submit',
            title: 'Réessayer',
            data: { action: 'start_generate' },
          },
        ],
      },
    ]);
  }
}
