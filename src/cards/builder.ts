import { Attachment, CardFactory } from 'botbuilder';
import { BrainstormSession, BmadStep } from '../storage/types';

const STEP_MAP: Record<BmadStep, { number: number; name: string }> = {
  [BmadStep.IDLE]: { number: 0, name: 'Non démarré' },
  [BmadStep.DEFINE_OBJECTIVE]: { number: 1, name: 'Définir l\'objectif' },
  [BmadStep.SELECT_TECHNIQUES]: { number: 2, name: 'Sélectionner les techniques' },
  [BmadStep.EXECUTE_TECHNIQUE_1]: { number: 3, name: 'Exécution technique 1' },
  [BmadStep.EXECUTE_TECHNIQUE_2]: { number: 4, name: 'Exécution technique 2' },
  [BmadStep.EXECUTE_TECHNIQUE_3]: { number: 5, name: 'Exécution technique 3' },
  [BmadStep.ORGANIZE_IDEAS]: { number: 6, name: 'Organiser les idées' },
  [BmadStep.EXTRACT_INSIGHTS]: { number: 7, name: 'Extraire les insights' },
  [BmadStep.GENERATE_OUTPUT]: { number: 8, name: 'Générer le livrable' },
  [BmadStep.COMPLETED]: { number: 8, name: 'Terminé' },
};

const TOTAL_STEPS = 8;

export function getStepInfo(step: BmadStep): { number: number; name: string } {
  return STEP_MAP[step] ?? { number: 0, name: 'Inconnu' };
}

export function buildCard(cardJson: object): Attachment {
  const card = ('type' in cardJson && (cardJson as Record<string, unknown>).type === 'AdaptiveCard')
    ? cardJson
    : {
        type: 'AdaptiveCard',
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        version: '1.5',
        ...cardJson,
      };
  return CardFactory.adaptiveCard(card);
}

export function buildProgressHeader(session: BrainstormSession): object {
  const stepInfo = getStepInfo(session.currentStep);
  const completedCount = session.completedSteps.length;

  const progressBlocks: string[] = [];
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    progressBlocks.push(i <= completedCount ? '🟦' : i === stepInfo.number ? '🟩' : '⬜');
  }

  return {
    type: 'ColumnSet',
    columns: [
      {
        type: 'Column',
        width: 'stretch',
        items: [
          {
            type: 'TextBlock',
            text: `Étape ${stepInfo.number}/${TOTAL_STEPS} — ${stepInfo.name}`,
            weight: 'Bolder',
            size: 'Medium',
            wrap: true,
          },
          {
            type: 'TextBlock',
            text: progressBlocks.join(''),
            spacing: 'Small',
          },
        ],
      },
    ],
  };
}

export function wrapWithProgress(session: BrainstormSession, body: object[]): object {
  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: [
      buildProgressHeader(session),
      {
        type: 'TextBlock',
        text: ' ',
        spacing: 'Small',
        separator: true,
      },
      ...body,
    ],
  };
}
