import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter } from '../theme';
import { Insight } from '../../storage/types';

// Grid dimensions
const GRID_X = 1.2;
const GRID_Y = 1.2;
const GRID_W = 7.5;
const GRID_H = 3.8;
const HALF_W = GRID_W / 2;
const HALF_H = GRID_H / 2;

// Map level to position within the grid (0..1 range)
const LEVEL_POS: Record<string, number> = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
};

function getInsightPosition(insight: Insight): { x: number; y: number } {
  const effortPos = LEVEL_POS[insight.effort] ?? 0.5;
  const impactPos = LEVEL_POS[insight.impact] ?? 0.5;

  // X axis: effort (low=left, high=right)
  const x = GRID_X + effortPos * GRID_W;
  // Y axis: impact (high=top, low=bottom) — inverted
  const y = GRID_Y + (1 - impactPos) * GRID_H;

  return { x, y };
}

export function addImpactEffortMatrixSlide(
  pptx: PptxGenJS,
  data: { insights: Insight[]; date: string }
): void {
  const slide = pptx.addSlide();

  addSlideHeader(pptx, slide, 'Matrice Impact / Effort');

  // Quadrant backgrounds and labels
  const quadrants = [
    { x: GRID_X, y: GRID_Y, label: 'Quick Wins', color: 'D4EDDA' },
    { x: GRID_X + HALF_W, y: GRID_Y, label: 'Projets majeurs', color: 'CCE5FF' },
    { x: GRID_X, y: GRID_Y + HALF_H, label: 'Facile', color: 'F5F5F5' },
    { x: GRID_X + HALF_W, y: GRID_Y + HALF_H, label: '\u00C0 \u00E9viter', color: 'F8D7DA' },
  ];

  quadrants.forEach((q) => {
    slide.addShape(pptx.ShapeType.rect, {
      x: q.x,
      y: q.y,
      w: HALF_W,
      h: HALF_H,
      fill: { color: q.color },
    });
    slide.addText(q.label, {
      x: q.x + 0.1,
      y: q.y + 0.05,
      w: HALF_W - 0.2,
      h: 0.35,
      fontSize: BMAD_THEME.sizes.small,
      fontFace: BMAD_THEME.fonts.body,
      color: '888888',
      bold: true,
      italic: true,
      valign: 'top',
      align: 'left',
    });
  });

  // Grid center lines
  slide.addShape(pptx.ShapeType.line, {
    x: GRID_X + HALF_W,
    y: GRID_Y,
    w: 0,
    h: GRID_H,
    line: { color: 'AAAAAA', width: 1 },
  });
  slide.addShape(pptx.ShapeType.line, {
    x: GRID_X,
    y: GRID_Y + HALF_H,
    w: GRID_W,
    h: 0,
    line: { color: 'AAAAAA', width: 1 },
  });

  // Axis labels
  slide.addText('\u2190 Effort faible          Effort \u00E9lev\u00E9 \u2192', {
    x: GRID_X,
    y: GRID_Y + GRID_H + 0.05,
    w: GRID_W,
    h: 0.3,
    fontSize: BMAD_THEME.sizes.small,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.textLight),
    align: 'center',
  });
  slide.addText('Impact \u00E9lev\u00E9', {
    x: 0.05,
    y: GRID_Y + 0.1,
    w: 1.1,
    h: 0.3,
    fontSize: BMAD_THEME.sizes.small,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.textLight),
    align: 'center',
  });
  slide.addText('Impact faible', {
    x: 0.05,
    y: GRID_Y + GRID_H - 0.4,
    w: 1.1,
    h: 0.3,
    fontSize: BMAD_THEME.sizes.small,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.textLight),
    align: 'center',
  });

  // Plot insights as colored circles with numbers
  const dotColors = [
    hex(BMAD_THEME.colors.accent),
    hex(BMAD_THEME.colors.secondary),
    hex(BMAD_THEME.colors.success),
    hex(BMAD_THEME.colors.danger),
    hex(BMAD_THEME.colors.primary),
    hex(BMAD_THEME.colors.warning),
  ];

  data.insights.forEach((insight, index) => {
    const pos = getInsightPosition(insight);
    const dotColor = dotColors[index % dotColors.length];
    const dotSize = 0.3;

    slide.addShape(pptx.ShapeType.ellipse, {
      x: pos.x - dotSize / 2,
      y: pos.y - dotSize / 2,
      w: dotSize,
      h: dotSize,
      fill: { color: dotColor },
    });

    slide.addText(`${index + 1}`, {
      x: pos.x - dotSize / 2,
      y: pos.y - dotSize / 2,
      w: dotSize,
      h: dotSize,
      fontSize: 9,
      fontFace: BMAD_THEME.fonts.body,
      color: 'FFFFFF',
      align: 'center',
      valign: 'middle',
      bold: true,
    });
  });

  // Legend
  if (data.insights.length > 0) {
    const legendItems = data.insights.map(
      (insight, i) => `${i + 1}. ${insight.title}`
    );
    slide.addText(legendItems.join('   |   '), {
      x: 0.5,
      y: 5.0,
      w: 9.0,
      h: 0.25,
      fontSize: 8,
      fontFace: BMAD_THEME.fonts.body,
      color: hex(BMAD_THEME.colors.textLight),
      align: 'center',
    });
  }

  addFooter(slide, data.date);
}
