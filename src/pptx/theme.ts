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
  pptx.author = 'StormMate';
  pptx.theme = {
    headFontFace: BMAD_THEME.fonts.title,
    bodyFontFace: BMAD_THEME.fonts.body,
  };
}

/** Add a standard footer to a slide */
export function addFooter(slide: PptxGenJS.Slide, date: string): void {
  slide.addText(`StormMate – ${date}`, {
    x: 0.5,
    y: 7.0,
    w: 9.0,
    h: 0.3,
    fontSize: 8,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.textLight),
    align: 'center',
  });
}

/**
 * Strip markdown formatting from text for clean PPTX rendering.
 * Removes headers, bold/italic markers, bullet prefixes, emojis, etc.
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*(.+?)\*/g, '$1') // Remove italic *text*
    .replace(/__(.+?)__/g, '$1') // Remove bold __text__
    .replace(/_(.+?)_/g, '$1') // Remove italic _text_
    .replace(/^[-*+]\s+/gm, '') // Remove list markers
    .replace(/^\d+\.\s+/gm, '') // Remove numbered list markers
    .replace(/`(.+?)`/g, '$1') // Remove inline code
    .replace(/^>\s+/gm, '') // Remove blockquotes
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
    .replace(/\n{3,}/g, '\n\n') // Collapse multiple blank lines
    .trim();
}

/** Truncate text to a max number of characters, adding ellipsis */
export function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3).replace(/\s+\S*$/, '') + '...';
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
