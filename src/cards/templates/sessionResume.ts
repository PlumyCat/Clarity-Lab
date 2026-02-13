import { BrainstormSession } from '../../storage/types';
import { getStepInfo } from '../builder';

export function buildSessionResumeCard(session: BrainstormSession): object {
  const stepInfo = getStepInfo(session.currentStep);

  // Compter les idées
  let totalIdeas = 0;
  if (session.organizedIdeas) {
    totalIdeas = session.organizedIdeas.totalIdeas;
  } else {
    for (const result of Object.values(session.techniqueResults)) {
      totalIdeas += result.ideas.length;
    }
  }

  const bodyItems: object[] = [
    {
      type: 'TextBlock',
      text: '🔄 Session en cours trouvée',
      size: 'Large',
      weight: 'Bolder',
      wrap: true,
    },
  ];

  // Objectif
  if (session.objective) {
    bodyItems.push(
      {
        type: 'TextBlock',
        text: 'Objectif',
        weight: 'Bolder',
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'TextBlock',
        text: session.objective.refinedStatement,
        wrap: true,
        spacing: 'Small',
      },
    );
  }

  // Récap chiffré
  bodyItems.push({
    type: 'FactSet',
    spacing: 'Medium',
    facts: [
      { title: 'Étape actuelle', value: `${stepInfo.number}/8 — ${stepInfo.name}` },
      { title: 'Idées générées', value: `${totalIdeas}` },
      { title: 'Participants', value: `${session.participants.length}` },
      { title: 'Dernière activité', value: new Date(session.updatedAt).toLocaleString('fr-FR') },
    ],
  });

  // Questions ouvertes
  if (session.openQuestions.length > 0) {
    bodyItems.push({
      type: 'TextBlock',
      text: 'Questions ouvertes',
      weight: 'Bolder',
      wrap: true,
      spacing: 'Medium',
    });
    for (const question of session.openQuestions) {
      bodyItems.push({
        type: 'TextBlock',
        text: `• ${question}`,
        wrap: true,
        spacing: 'Small',
      });
    }
  }

  return {
    type: 'AdaptiveCard',
    $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
    version: '1.5',
    body: bodyItems,
    actions: [
      {
        type: 'Action.Submit',
        title: 'Reprendre',
        data: { action: 'resume_session' },
        style: 'positive',
      },
      {
        type: 'Action.Submit',
        title: 'Nouvelle session',
        data: { action: 'new_session' },
      },
    ],
  };
}
