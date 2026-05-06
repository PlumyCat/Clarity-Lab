import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter, stripMarkdown, truncateText } from '../theme';
import { Insight } from '../../storage/types';

export function addNextStepsSlide(
  pptx: PptxGenJS,
  data: { openQuestions: string[]; insights: Insight[]; date: string }
): void {
  const slide = pptx.addSlide();

  addSlideHeader(pptx, slide, 'Prochaines étapes');

  // Section: Actions recommandées (top priority)
  slide.addText('Actions recommandées', {
    x: 0.5,
    y: 1.3,
    w: 9.0,
    h: 0.4,
    fontSize: BMAD_THEME.sizes.subtitle,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.secondary),
    bold: true,
  });

  // Sort insights: high impact + low effort first
  const impactScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const effortScore: Record<string, number> = { low: 3, medium: 2, high: 1 };
  const topInsights = [...data.insights]
    .sort((a, b) => {
      const scoreA = (impactScore[a.impact] ?? 0) + (effortScore[a.effort] ?? 0);
      const scoreB = (impactScore[b.impact] ?? 0) + (effortScore[b.effort] ?? 0);
      return scoreB - scoreA;
    })
    .slice(0, 4);

  if (topInsights.length > 0) {
    const actionTexts: PptxGenJS.TextProps[] = topInsights.map((insight) => ({
      text: `${truncateText(stripMarkdown(insight.title), 80)} (Impact: ${insight.impact}, Effort: ${insight.effort})`,
      options: {
        fontSize: BMAD_THEME.sizes.body,
        bullet: true,
        breakLine: true,
      },
    }));
    slide.addText(actionTexts, {
      x: 0.7,
      y: 1.7,
      w: 8.5,
      h: 1.4,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.text),
      valign: 'top',
      autoFit: true,
    });
  } else {
    slide.addText('Aucune action recommandée.', {
      x: 0.7,
      y: 1.7,
      w: 8.5,
      h: 0.4,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.body,
      color: '999999',
      italic: true,
    });
  }

  // Section: Questions ouvertes
  slide.addText('Questions ouvertes', {
    x: 0.5,
    y: 3.3,
    w: 9.0,
    h: 0.4,
    fontSize: BMAD_THEME.sizes.subtitle,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.secondary),
    bold: true,
  });

  if (data.openQuestions.length > 0) {
    const questionTexts: PptxGenJS.TextProps[] = data.openQuestions
      .slice(0, 4)
      .map((q) => ({
        text: truncateText(stripMarkdown(q), 120),
        options: {
          fontSize: BMAD_THEME.sizes.body,
          bullet: true,
          breakLine: true,
        },
      }));
    slide.addText(questionTexts, {
      x: 0.7,
      y: 3.7,
      w: 8.5,
      h: 1.2,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.text),
      valign: 'top',
      autoFit: true,
    });
  } else {
    slide.addText('Aucune question ouverte.', {
      x: 0.7,
      y: 3.7,
      w: 8.5,
      h: 0.4,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.body,
      color: '999999',
      italic: true,
    });
  }

  // Suggested next meeting
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextDateStr = nextWeek.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  slide.addText(`Prochaine réunion suggérée : ${nextDateStr}`, {
    x: 0.5,
    y: 4.85,
    w: 9.0,
    h: 0.35,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.accent),
    bold: true,
    italic: true,
  });

  addFooter(slide, data.date);
}
