import { BrainstormSession, BmadStep } from '../../storage/types';
import { getStepInfo, wrapWithProgress } from '../builder';

const ALL_STEPS: BmadStep[] = [
  BmadStep.DEFINE_OBJECTIVE,
  BmadStep.SELECT_TECHNIQUES,
  BmadStep.EXECUTE_TECHNIQUE_1,
  BmadStep.EXECUTE_TECHNIQUE_2,
  BmadStep.EXECUTE_TECHNIQUE_3,
  BmadStep.ORGANIZE_IDEAS,
  BmadStep.EXTRACT_INSIGHTS,
  BmadStep.GENERATE_OUTPUT,
];

export function buildProgressCard(session: BrainstormSession): object {
  const stepItems = ALL_STEPS.map((step) => {
    const info = getStepInfo(step);
    const isCompleted = session.completedSteps.includes(step);
    const isCurrent = step === session.currentStep;

    let icon = '⬜';
    let color: string = 'Default';

    if (isCompleted) {
      icon = '✅';
    } else if (isCurrent) {
      icon = '▶️';
      color = 'Accent';
    }

    return {
      type: 'TextBlock',
      text: `${icon} ${info.number}. ${info.name}`,
      color,
      weight: isCurrent ? 'Bolder' : 'Default',
      spacing: 'Small',
      wrap: true,
    };
  });

  // Compter les idées totales
  let totalIdeas = 0;
  if (session.organizedIdeas) {
    totalIdeas = session.organizedIdeas.totalIdeas;
  } else {
    for (const result of Object.values(session.techniqueResults)) {
      totalIdeas += result.ideas.length;
    }
  }

  const body: object[] = [
    {
      type: 'TextBlock',
      text: 'Progression du brainstorming',
      size: 'Large',
      weight: 'Bolder',
      wrap: true,
    },
    {
      type: 'FactSet',
      spacing: 'Medium',
      facts: [
        { title: 'Participants', value: `${session.participants.length}` },
        { title: 'Idées générées', value: `${totalIdeas}` },
        { title: 'Étapes terminées', value: `${session.completedSteps.length} / ${ALL_STEPS.length}` },
      ],
    },
    ...stepItems,
  ];

  const card = wrapWithProgress(session, body);

  // Boutons contextuels selon l'état
  const actions: object[] = [];

  if (session.status === 'active' && session.currentStep !== BmadStep.COMPLETED) {
    actions.push({
      type: 'Action.Submit',
      title: 'Continuer',
      data: { action: 'continue_session' },
      style: 'positive',
    });
    actions.push({
      type: 'Action.Submit',
      title: 'Mettre en pause',
      data: { action: 'pause_session' },
    });
  }

  if (session.currentStep === BmadStep.COMPLETED || session.completedSteps.includes(BmadStep.EXTRACT_INSIGHTS)) {
    actions.push({
      type: 'Action.Submit',
      title: 'Exporter',
      data: { action: 'export_session' },
    });
  }

  return { ...card, actions };
}
