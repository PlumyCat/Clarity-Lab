import { BrainstormSession, Objective } from '../../storage/types';
import { wrapWithProgress } from '../builder';

export function buildObjectiveConfirmCard(
  session: BrainstormSession,
  original: { what: string; context: string; desiredOutcome: string },
  refined: Objective,
): object {
  const card = wrapWithProgress(session, [
    {
      type: 'TextBlock',
      text: 'Objectif raffiné par StormMate',
      size: 'Large',
      weight: 'Bolder',
      wrap: true,
    },
    // Objectif original (grisé)
    {
      type: 'TextBlock',
      text: 'Votre formulation initiale',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
      isSubtle: true,
    },
    {
      type: 'TextBlock',
      text: original.what,
      wrap: true,
      spacing: 'Small',
      isSubtle: true,
    },
    // Objectif raffiné (mis en avant)
    {
      type: 'TextBlock',
      text: 'Objectif raffiné',
      weight: 'Bolder',
      size: 'Medium',
      wrap: true,
      spacing: 'Large',
      color: 'Accent',
    },
    {
      type: 'TextBlock',
      text: `**${refined.refinedStatement}**`,
      wrap: true,
      spacing: 'Small',
    },
    {
      type: 'FactSet',
      spacing: 'Medium',
      facts: [
        { title: 'Contexte', value: refined.context },
        { title: 'Résultat attendu', value: refined.desiredOutcome },
      ],
    },
    {
      type: 'TextBlock',
      text: 'Souhaitez-vous confirmer cet objectif ou le modifier ?',
      wrap: true,
      spacing: 'Large',
      isSubtle: true,
    },
  ]);

  return {
    ...card,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Confirmer',
        data: { action: 'confirm_objective' },
        style: 'positive',
      },
      {
        type: 'Action.Submit',
        title: 'Modifier',
        data: { action: 'edit_objective' },
      },
    ],
  };
}
