import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter } from '../theme';
import { IdeaCategory } from '../../storage/types';

const MAX_IDEAS_PER_CATEGORY = 6;

export function addIdeasOverviewSlide(
  pptx: PptxGenJS,
  data: { categories: IdeaCategory[]; totalIdeas: number; date: string }
): void {
  const slide = pptx.addSlide();

  addSlideHeader(pptx, slide, 'Idées consolidées');

  // Total ideas badge
  slide.addText(`${data.totalIdeas} idées`, {
    x: 8.0,
    y: 0.35,
    w: 1.4,
    h: 0.3,
    fontSize: 10,
    fontFace: BMAD_THEME.fonts.body,
    color: 'FFFFFF',
    align: 'center',
    valign: 'middle',
    fill: { color: hex(BMAD_THEME.colors.accent) },
    shape: pptx.ShapeType.roundRect,
    rectRadius: 0.05,
    bold: true,
  });

  // Layout categories in columns (max 3 columns)
  const cols = Math.min(data.categories.length, 3);
  const colWidth = 8.5 / cols;
  const startY = 1.3;

  data.categories.slice(0, 3).forEach((category, colIdx) => {
    const x = 0.5 + colIdx * colWidth;

    // Category name header
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.05,
      y: startY,
      w: colWidth - 0.1,
      h: 0.35,
      fill: { color: hex(BMAD_THEME.colors.secondary) },
      rectRadius: 0.03,
    });
    slide.addText(category.name, {
      x: x + 0.15,
      y: startY,
      w: colWidth - 0.3,
      h: 0.35,
      fontSize: BMAD_THEME.sizes.small,
      fontFace: BMAD_THEME.fonts.title,
      color: 'FFFFFF',
      bold: true,
      valign: 'middle',
    });

    // Ideas list
    const ideasToShow = category.ideas.slice(0, MAX_IDEAS_PER_CATEGORY);
    const ideaTexts: PptxGenJS.TextProps[] = ideasToShow.map((idea) => ({
      text: idea.content,
      options: {
        fontSize: BMAD_THEME.sizes.small,
        bullet: true,
        breakLine: true,
      },
    }));

    if (ideaTexts.length > 0) {
      slide.addText(ideaTexts, {
        x: x + 0.1,
        y: startY + 0.45,
        w: colWidth - 0.2,
        h: 3.3,
        fontFace: BMAD_THEME.fonts.body,
        color: hex(BMAD_THEME.colors.text),
        valign: 'top',
      });
    }

    // Show remaining count if truncated
    if (category.ideas.length > MAX_IDEAS_PER_CATEGORY) {
      const remaining = category.ideas.length - MAX_IDEAS_PER_CATEGORY;
      slide.addText(`+${remaining} autres...`, {
        x: x + 0.1,
        y: startY + 3.75,
        w: colWidth - 0.2,
        h: 0.3,
        fontSize: 9,
        fontFace: BMAD_THEME.fonts.body,
        color: hex(BMAD_THEME.colors.textLight),
        italic: true,
      });
    }
  });

  // If more than 3 categories, note it
  if (data.categories.length > 3) {
    slide.addText(`+ ${data.categories.length - 3} autres catégories`, {
      x: 0.5,
      y: 5.0,
      w: 9.0,
      h: 0.25,
      fontSize: 9,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.textLight),
      italic: true,
      align: 'right',
    });
  }

  addFooter(slide, data.date);
}
