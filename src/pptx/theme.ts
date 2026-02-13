import PptxGenJS from 'pptxgenjs';

export const BMAD_THEME = {
  colors: {
    primary: '#1B365D',
    secondary: '#2E86AB',
    accent: '#F18F01',
    success: '#4CAF50',
    warning: '#FF9800',
    danger: '#F44336',
    background: '#FFFFFF',
    text: '#333333',
    textLight: '#666666',
    lightGray: '#F5F5F5',
  },
  fonts: {
    title: 'Segoe UI',
    body: 'Segoe UI',
  },
  sizes: {
    titleMain: 28,
    titleSlide: 24,
    subtitle: 18,
    body: 14,
    small: 11,
  },
} as const;

/** Strip '#' prefix for pptxgenjs hex colors */
export function hex(color: string): string {
  return color.replace('#', '');
}

export function applyTheme(pptx: PptxGenJS): void {
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'BMAD Brainstorm Bot';
  pptx.theme = {
    headFontFace: BMAD_THEME.fonts.title,
    bodyFontFace: BMAD_THEME.fonts.body,
  };
}

/** Add a standard footer to a slide */
export function addFooter(slide: PptxGenJS.Slide, date: string): void {
  slide.addText(`BMAD Brainstorm Bot – ${date}`, {
    x: 0.5,
    y: 5.2,
    w: 9.0,
    h: 0.3,
    fontSize: 8,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.textLight),
    align: 'center',
  });
}

/** Add a standard slide header (title + colored separator bar) */
export function addSlideHeader(
  pptx: PptxGenJS,
  slide: PptxGenJS.Slide,
  title: string,
): void {
  // Title
  slide.addText(title, {
    x: 0.5,
    y: 0.3,
    w: 9.0,
    h: 0.6,
    fontSize: BMAD_THEME.sizes.titleSlide,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.primary),
    bold: true,
  });

  // Colored separator bar
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 0.95,
    w: 2.0,
    h: 0.04,
    fill: { color: hex(BMAD_THEME.colors.accent) },
  });
}
