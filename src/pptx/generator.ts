import PptxGenJS from 'pptxgenjs';
import { BrainstormSession } from '../storage/types';
import { applyTheme } from './theme';
import { addTitleSlide } from './slides/titleSlide';
import { addObjectiveSlide } from './slides/objectiveSlide';
import { addTechniqueSummarySlides } from './slides/techniqueSummary';
import { addIdeasOverviewSlide } from './slides/ideasOverview';
import { addInsightsSlide } from './slides/insightsSlide';
import { addImpactEffortMatrixSlide } from './slides/impactEffortMatrix';
import { addNextStepsSlide } from './slides/nextStepsSlide';

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export async function generatePresentation(session: BrainstormSession): Promise<Buffer> {
  const pptx = new PptxGenJS();
  applyTheme(pptx);

  const date = formatDate(session.createdAt);
  const title = session.objective?.refinedStatement || 'Session de Brainstorming BMAD';
  const participants = session.participants.map((p) => p.name);

  // Slide 1: Title
  addTitleSlide(pptx, { title, date, participants });

  // Slide 2: Objective
  if (session.objective) {
    addObjectiveSlide(pptx, { objective: session.objective, date });
  }

  // Slides 3-N: One slide per technique
  if (Object.keys(session.techniqueResults).length > 0) {
    addTechniqueSummarySlides(pptx, {
      techniqueResults: session.techniqueResults,
      date,
    });
  }

  // Slide: Ideas overview
  if (session.organizedIdeas) {
    addIdeasOverviewSlide(pptx, {
      categories: session.organizedIdeas.categories,
      totalIdeas: session.organizedIdeas.totalIdeas,
      date,
    });
  }

  // Slide: Insights
  if (session.insights.length > 0) {
    addInsightsSlide(pptx, { insights: session.insights, date });
  }

  // Slide: Impact/Effort matrix
  if (session.insights.length > 0) {
    addImpactEffortMatrixSlide(pptx, { insights: session.insights, date });
  }

  // Slide: Next steps
  addNextStepsSlide(pptx, {
    openQuestions: session.openQuestions,
    insights: session.insights,
    date,
  });

  // Generate Buffer
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}
