import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter, stripMarkdown, truncateText } from '../theme';
import { Insight } from '../../storage/types';

const IMPACT_BADGE: Record<string, string> = {
  high: hex(BMAD_THEME.colors.success),
  medium: hex(BMAD_THEME.colors.warning),
  low: hex(BMAD_THEME.colors.danger),
};

const EFFORT_BADGE: Record<string, string> = {
  low: hex(BMAD_THEME.colors.success),
  medium: hex(BMAD_THEME.colors.warning),
  high: hex(BMAD_THEME.colors.danger),
};

/** Sort insights by priority: high impact + low effort first */
function sortByPriority(insights: Insight[]): Insight[] {
  const impactScore: Record<string, number> = { high: 3, medium: 2, low: 1 };
  const effortScore: Record<string, number> = { low: 3, medium: 2, high: 1 };

  return [...insights].sort((a, b) => {
    const scoreA = (impactScore[a.impact] ?? 0) + (effortScore[a.effort] ?? 0);
    const scoreB = (impactScore[b.impact] ?? 0) + (effortScore[b.effort] ?? 0);
    return scoreB - scoreA;
  });
}

export function addInsightsSlide(
  pptx: PptxGenJS,
  data: { insights: Insight[]; date: string }
): void {
  const sorted = sortByPriority(data.insights);
  const slide = pptx.addSlide();

  addSlideHeader(pptx, slide, 'Insights clés');

  // Insight cards (2 columns layout)
  const colWidth = 4.3;
  const cardHeight = 1.8;
  const startY = 1.2;
  const gapX = 0.4;
  const gapY = 0.15;

  sorted.slice(0, 4).forEach((insight, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 0.5 + col * (colWidth + gapX);
    const y = startY + row * (cardHeight + gapY);

    // Card background
    slide.addShape(pptx.ShapeType.roundRect, {
      x,
      y,
      w: colWidth,
      h: cardHeight,
      fill: { color: hex(BMAD_THEME.colors.lightGray) },
      rectRadius: 0.05,
    });

    // Insight title (truncated to avoid overflow)
    slide.addText(truncateText(stripMarkdown(insight.title), 60), {
      x: x + 0.15,
      y: y + 0.1,
      w: colWidth - 0.3,
      h: 0.5,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.title,
      color: hex(BMAD_THEME.colors.primary),
      bold: true,
      valign: 'top',
      autoFit: true,
    });

    // Insight description
    slide.addText(truncateText(stripMarkdown(insight.description), 130), {
      x: x + 0.15,
      y: y + 0.6,
      w: colWidth - 0.3,
      h: 0.7,
      fontSize: BMAD_THEME.sizes.small,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.text),
      valign: 'top',
      autoFit: true,
    });

    // Impact badge
    slide.addText(`Impact: ${insight.impact}`, {
      x: x + 0.15,
      y: y + cardHeight - 0.4,
      w: 1.4,
      h: 0.28,
      fontSize: 9,
      fontFace: BMAD_THEME.fonts.body,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fill: { color: IMPACT_BADGE[insight.impact] },
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.05,
      bold: true,
    });

    // Effort badge
    slide.addText(`Effort: ${insight.effort}`, {
      x: x + 1.7,
      y: y + cardHeight - 0.4,
      w: 1.4,
      h: 0.28,
      fontSize: 9,
      fontFace: BMAD_THEME.fonts.body,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      fill: { color: EFFORT_BADGE[insight.effort] },
      shape: pptx.ShapeType.roundRect,
      rectRadius: 0.05,
      bold: true,
    });
  });

  addFooter(slide, data.date);
}
