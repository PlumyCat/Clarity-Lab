import type { BrainstormSession } from '../../storage/types';
import { wrapWithProgress } from '../builder';

/**
 * Card avec un champ multiline pour coller le transcript Teams.
 */
export function buildTranscriptInputCard(
  session: BrainstormSession,
  techniqueId: string,
  techniqueName: string,
  round: number,
  roundLabel: string,
): object {
  const body: object[] = [
    {
      type: 'TextBlock',
      text: `🎯 ${session.objective?.refinedStatement ?? ''}`,
      wrap: true,
      isSubtle: true,
      spacing: 'Small',
    },
    {
      type: 'TextBlock',
      text: `📝 Discussion libre — ${techniqueName}`,
      size: 'Large',
      weight: 'Bolder',
      color: 'Accent',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'TextBlock',
      text: roundLabel,
      weight: 'Bolder',
      wrap: true,
      spacing: 'Small',
    },
    {
      type: 'TextBlock',
      text: 'Collez ci-dessous le transcript de la discussion Teams. Le bot extraira automatiquement les contributions de chaque participant.',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'TextBlock',
      text: 'Formats supportés :\n- **Transcript Teams** (Nom / Heure / Texte)\n- **Format simple** (Nom: Texte)\n- **Texte libre** (un seul bloc)',
      wrap: true,
      spacing: 'Small',
      isSubtle: true,
      size: 'Small',
    },
    {
      type: 'Input.Text',
      id: 'transcript',
      placeholder: 'Collez le transcript ici...',
      isMultiline: true,
      isRequired: true,
      maxLength: 50000,
    },
  ];

  const card = wrapWithProgress(session, body);

  return {
    ...card,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Soumettre le transcript',
        data: { action: 'submit_transcript', round, techniqueId },
        style: 'positive',
      },
      {
        type: 'Action.Submit',
        title: 'Retour saisie classique',
        data: { action: 'cancel_transcript_mode', round, techniqueId },
      },
    ],
  };
}
