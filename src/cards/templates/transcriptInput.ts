import type { BrainstormSession } from '../../storage/types';
import { wrapWithProgress } from '../builder';

/**
 * Card affichée pendant une discussion libre active.
 * Les participants envoient leurs idées directement dans le chat.
 */
export function buildFreeDiscussionActiveCard(
  session: BrainstormSession,
  techniqueId: string,
  techniqueName: string,
  round: number,
  roundLabel: string,
): object {
  const responseCount = session.freeDiscussion?.responses.length ?? 0;

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
      text: `💬 Discussion libre — ${techniqueName}`,
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
      text: '🎙️ **Le tour est lancé !** Envoyez vos idées avec **@StormMate** suivi de votre message.',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'TextBlock',
      text: 'Exemple : `@StormMate Je pense que nous devrions cibler les PME`',
      wrap: true,
      spacing: 'Small',
      isSubtle: true,
      size: 'Small',
    },
    {
      type: 'TextBlock',
      text: `📊 **${responseCount}** contribution(s) reçue(s)`,
      wrap: true,
      spacing: 'Medium',
      weight: 'Bolder',
    },
    {
      type: 'TextBlock',
      text: '_Quand tout le monde a contribué, tapez **@StormMate next** ou cliquez ci-dessous._',
      wrap: true,
      spacing: 'Small',
      isSubtle: true,
      size: 'Small',
    },
  ];

  const card = wrapWithProgress(session, body);

  return {
    ...card,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Terminer le tour',
        data: { action: 'end_discussion', round, techniqueId },
        style: 'positive',
      },
      {
        type: 'Action.Submit',
        title: 'Annuler',
        data: { action: 'cancel_discussion', round, techniqueId },
      },
    ],
  };
}
