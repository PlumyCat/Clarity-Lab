import PptxGenJS from 'pptxgenjs';
import { BMAD_THEME, hex, addSlideHeader, addFooter } from '../theme';
import { Objective } from '../../storage/types';

export function addObjectiveSlide(
  pptx: PptxGenJS,
  data: { objective: Objective; date: string }
): void {
  const slide = pptx.addSlide();
  const { objective } = data;

  addSlideHeader(pptx, slide, 'Objectif de la session');

  // Refined statement highlight box
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.5,
    y: 1.2,
    w: 9.0,
    h: 0.8,
    fill: { color: hex(BMAD_THEME.colors.lightGray) },
    rectRadius: 0.05,
  });
  slide.addText(objective.refinedStatement, {
    x: 0.7,
    y: 1.25,
    w: 8.6,
    h: 0.7,
    fontSize: BMAD_THEME.sizes.subtitle,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.primary),
    bold: true,
    italic: true,
    valign: 'middle',
  });

  // Section: Ce que nous brainstormons
  slide.addText('Ce que nous brainstormons', {
    x: 0.5,
    y: 2.3,
    w: 9.0,
    h: 0.35,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.secondary),
    bold: true,
  });
  slide.addText(objective.what || '\u2014', {
    x: 0.5,
    y: 2.65,
    w: 9.0,
    h: 0.6,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.text),
    valign: 'top',
  });

  // Section: Contexte
  slide.addText('Contexte', {
    x: 0.5,
    y: 3.4,
    w: 9.0,
    h: 0.35,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.secondary),
    bold: true,
  });
  slide.addText(objective.context || '\u2014', {
    x: 0.5,
    y: 3.75,
    w: 9.0,
    h: 0.6,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.text),
    valign: 'top',
  });

  // Section: Résultat attendu
  slide.addText('Résultat attendu', {
    x: 0.5,
    y: 4.5,
    w: 9.0,
    h: 0.35,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.title,
    color: hex(BMAD_THEME.colors.secondary),
    bold: true,
  });
  slide.addText(objective.desiredOutcome || '\u2014', {
    x: 0.5,
    y: 4.85,
    w: 9.0,
    h: 0.4,
    fontSize: BMAD_THEME.sizes.body,
    fontFace: BMAD_THEME.fonts.body,
    color: hex(BMAD_THEME.colors.text),
    valign: 'top',
  });

  addFooter(slide, data.date);
}
