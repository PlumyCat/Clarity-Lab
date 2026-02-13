import { BrainstormSession } from '../../storage/types';
import { wrapWithProgress } from '../builder';

export function buildObjectiveFormCard(session: BrainstormSession): object {
  const card = wrapWithProgress(session, [
    {
      type: 'TextBlock',
      text: 'Définir votre objectif',
      size: 'Large',
      weight: 'Bolder',
      wrap: true,
    },
    {
      type: 'TextBlock',
      text: 'Décrivez le sujet de votre brainstorming. StormMate vous aidera à affiner votre objectif.',
      wrap: true,
      spacing: 'Small',
    },
    {
      type: 'TextBlock',
      text: 'Que souhaitez-vous brainstormer ?',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Large',
    },
    {
      type: 'Input.Text',
      id: 'what',
      placeholder: 'Ex: Comment améliorer l\'expérience utilisateur de notre application mobile',
      isMultiline: true,
      isRequired: true,
    },
    {
      type: 'TextBlock',
      text: 'Quel est le contexte ?',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'Input.Text',
      id: 'context',
      placeholder: 'Ex: Application e-commerce avec 50k utilisateurs, taux de rétention en baisse de 15%',
      isMultiline: true,
    },
    {
      type: 'TextBlock',
      text: 'Quel résultat attendez-vous ?',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
    },
    {
      type: 'Input.Text',
      id: 'desiredOutcome',
      placeholder: 'Ex: Liste de 10 actions concrètes à implémenter ce trimestre',
      isMultiline: true,
    },
  ]);

  return {
    ...card,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Valider l\'objectif',
        data: { action: 'submit_objective' },
        style: 'positive',
      },
    ],
  };
}
