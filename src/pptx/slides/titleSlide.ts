import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex } from '../theme';

export function addTitleSlide(
  pptx: PptxGenJS,
  data: { title: string; date: string; participants: string[] }
): void {
  const slide = pptx.addSlide();
  slide.background = { color: hex(BMAD_THEME.colors.primary) };

  // Main title
  slide.addText(data.title, {
    x: 0.5,
    y: 1.2,
    w: 9.0,
    h: 1.5,
    fontSize: BMAD_THEME.sizes.titleMain,
    fontFace: BMAD_THEME.fonts.title,
    color: 'FFFFFF',
    align: 'center',
    bold: true,
  });

  // Date
  slide.addText(data.date, {
    x: 0.5,
    y: 2.8,
    w: 9.0,
    h: 0.5,
    fontSize: BMAD_THEME.sizes.subtitle,
    fontFace: BMAD_THEME.fonts.body,
    color: 'CCCCCC',
    align: 'center',
  });

  // Separator line
  slide.addShape(pptx.ShapeType.rect, {
    x: 3.5,
    y: 3.5,
    w: 3.0,
    h: 0.02,
    fill: { color: hex(BMAD_THEME.colors.accent) },
  });

  // Participants
  if (data.participants.length > 0) {
    slide.addText(`Participants : ${data.participants.join(', ')}`, {
      x: 0.5,
      y: 4.0,
      w: 9.0,
      h: 0.8,
      fontSize: BMAD_THEME.sizes.body,
      fontFace: BMAD_THEME.fonts.body,
      color: 'AAAAAA',
      align: 'center',
    });
  }

  // BMAD branding footer
  slide.addText('BMAD Brainstorm Bot', {
    x: 0.5,
    y: 5.1,
    w: 9.0,
    h: 0.3,
    fontSize: 9,
    fontFace: BMAD_THEME.fonts.body,
    color: '888888',
    align: 'center',
  });
}
