import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter } from '../theme';
import { TechniqueResult, TechniqueId } from '../../storage/types';

const TECHNIQUE_NAMES: Record<TechniqueId, string> = {
  five_whys: '5 Pourquoi',
  starbursting: 'Starbursting',
  six_thinking_hats: 'Six Chapeaux',
  scamper: 'SCAMPER',
  mind_mapping: 'Mind Mapping',
  brainwriting: 'Brainwriting',
  reverse_brainstorming: 'Brainstorming inversé',
  swot: 'Analyse SWOT',
};

/** Add one slide per technique with summary and key ideas */
export function addTechniqueSummarySlides(
  pptx: PptxGenJS,
  data: { techniqueResults: Record<string, TechniqueResult>; date: string }
): void {
  for (const [id, result] of Object.entries(data.techniqueResults)) {
    const techniqueName = TECHNIQUE_NAMES[id as TechniqueId] ?? id;
    const slide = pptx.addSlide();

    addSlideHeader(pptx, slide, techniqueName);

    // Summary section
    slide.addText('Synthèse', {
      x: 0.5,
      y: 1.2,
      w: 9.0,
      h: 0.35,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.title,
      color: hex(BMAD_THEME.colors.secondary),
      bold: true,
    });
    slide.addText(result.summary || '\u2014', {
      x: 0.5,
      y: 1.55,
      w: 9.0,
      h: 1.0,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.text),
      valign: 'top',
    });

    // Key ideas section
    slide.addText(`Idées clés (${result.ideas.length})`, {
      x: 0.5,
      y: 2.7,
      w: 9.0,
      h: 0.35,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.title,
      color: hex(BMAD_THEME.colors.secondary),
      bold: true,
    });

    const ideasToShow = result.ideas.slice(0, 8);
    const ideaTexts: PptxGenJS.TextProps[] = ideasToShow.map((idea) => ({
      text: idea,
      options: {
        fontSize: BMAD_THEME.sizes.body,
        bullet: true,
        breakLine: true,
      },
    }));

    if (ideaTexts.length > 0) {
      slide.addText(ideaTexts, {
        x: 0.7,
        y: 3.1,
        w: 8.5,
        h: 2.0,
        fontFace: BMAD_THEME.fonts.body,
        color: hex(BMAD_THEME.colors.text),
        valign: 'top',
      });
    }

    // Rounds count badge
    slide.addText(`${result.rounds.length} round${result.rounds.length > 1 ? 's' : ''}`, {
      x: 8.2,
      y: 0.35,
      w: 1.2,
      h: 0.3,
      fontSize: 9,
      fontFace: BMAD_THEME.fonts.body,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fill: { color: hex(BMAD_THEME.colors.secondary) },
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.05,
      bold: true,
    });

    addFooter(slide, data.date);
  }
}
