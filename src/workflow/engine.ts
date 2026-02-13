import { BmadStep, BrainstormSession, StepResult, UserInput } from '../storage/types.js';
import { ClaudeClient } from '../llm/claudeClient.js';
import { getStepHandler, type StepHandler } from './steps/index.js';

// Valid transitions map: from → allowed targets
const VALID_TRANSITIONS: Record<BmadStep, BmadStep[]> = {
  [BmadStep.IDLE]: [BmadStep.DEFINE_OBJECTIVE],
  [BmadStep.DEFINE_OBJECTIVE]: [BmadStep.SELECT_TECHNIQUES],
  [BmadStep.SELECT_TECHNIQUES]: [BmadStep.EXECUTE_TECHNIQUE_1],
  [BmadStep.EXECUTE_TECHNIQUE_1]: [BmadStep.EXECUTE_TECHNIQUE_2, BmadStep.ORGANIZE_IDEAS],
  [BmadStep.EXECUTE_TECHNIQUE_2]: [BmadStep.EXECUTE_TECHNIQUE_3, BmadStep.ORGANIZE_IDEAS],
  [BmadStep.EXECUTE_TECHNIQUE_3]: [BmadStep.ORGANIZE_IDEAS],
  [BmadStep.ORGANIZE_IDEAS]: [BmadStep.EXTRACT_INSIGHTS],
  [BmadStep.EXTRACT_INSIGHTS]: [BmadStep.GENERATE_OUTPUT],
  [BmadStep.GENERATE_OUTPUT]: [BmadStep.COMPLETED],
  [BmadStep.COMPLETED]: [],
};

const STEP_INFO: Record<BmadStep, { name: string; description: string }> = {
  [BmadStep.IDLE]: { name: 'En attente', description: 'La session n\'a pas encore démarré.' },
  [BmadStep.DEFINE_OBJECTIVE]: { name: 'Définir l\'objectif', description: 'Formulez clairement ce que vous souhaitez brainstormer.' },
  [BmadStep.SELECT_TECHNIQUES]: { name: 'Sélectionner les techniques', description: 'Choisissez 2-3 techniques de brainstorming adaptées.' },
  [BmadStep.EXECUTE_TECHNIQUE_1]: { name: 'Technique 1', description: 'Exécution de la première technique de brainstorming.' },
  [BmadStep.EXECUTE_TECHNIQUE_2]: { name: 'Technique 2', description: 'Exécution de la deuxième technique de brainstorming.' },
  [BmadStep.EXECUTE_TECHNIQUE_3]: { name: 'Technique 3', description: 'Exécution de la troisième technique de brainstorming.' },
  [BmadStep.ORGANIZE_IDEAS]: { name: 'Organiser les idées', description: 'Dédupliquer et catégoriser les idées générées.' },
  [BmadStep.EXTRACT_INSIGHTS]: { name: 'Extraire les insights', description: 'Identifier les insights clés et évaluer impact/effort.' },
  [BmadStep.GENERATE_OUTPUT]: { name: 'Générer le livrable', description: 'Produire le rapport de synthèse PowerPoint.' },
  [BmadStep.COMPLETED]: { name: 'Terminé', description: 'La session de brainstorming est terminée.' },
};

export class WorkflowEngine {
  private handlerCache = new Map<BmadStep, StepHandler>();

  constructor(private claudeClient: ClaudeClient) {}

  /**
   * Get the action to perform when entering/resuming a session.
   * Returns a card for steps with handlers, or a text message otherwise.
   */
  async getEntryAction(session: BrainstormSession): Promise<{ card: object } | { text: string }> {
    if (session.currentStep === BmadStep.IDLE) {
      return { text: 'Bienvenue dans votre session de brainstorming BMAD ! Utilisez la commande **brainstorm** pour démarrer.' };
    }

    if (session.currentStep === BmadStep.COMPLETED) {
      return { text: 'Cette session de brainstorming est terminée. Les résultats ont été générés.' };
    }

    const handler = this.getHandler(session.currentStep);
    if (!handler) {
      const info = STEP_INFO[session.currentStep];
      return { text: `Étape "${info.name}" non encore implémentée.` };
    }

    const card = await handler.getEntryCard(session);
    return { card };
  }

  /**
   * Process user input for the current step.
   * Does NOT persist the session — the caller (bot handler) is responsible for that.
   */
  async processInput(session: BrainstormSession, input: UserInput): Promise<StepResult> {
    const handler = this.getHandler(session.currentStep);

    if (!handler) {
      console.log(`[WorkflowEngine] No handler for step: ${session.currentStep}`);
      return {
        responseText: `Étape "${STEP_INFO[session.currentStep]?.name}" non encore implémentée.`,
        updatedSession: session,
      };
    }

    const result = await handler.processInput(session, input);

    // If the step requests a transition, perform it
    if (result.transitionTo) {
      result.updatedSession = this.transition(result.updatedSession, result.transitionTo);
    }

    return result;
  }

  /**
   * Get info about the current step: number, name, description.
   */
  getCurrentStepInfo(session: BrainstormSession): {
    number: number;
    name: string;
    description: string;
  } {
    const step = session.currentStep;
    const info = STEP_INFO[step];
    const techniqueCount = session.selectedTechniques.length || 2;

    // Calculate user-visible step number, collapsing unused technique slots
    const baseStepNumbers: Record<string, number> = {
      [BmadStep.IDLE]: 0,
      [BmadStep.DEFINE_OBJECTIVE]: 1,
      [BmadStep.SELECT_TECHNIQUES]: 2,
      [BmadStep.EXECUTE_TECHNIQUE_1]: 3,
      [BmadStep.EXECUTE_TECHNIQUE_2]: 4,
      [BmadStep.EXECUTE_TECHNIQUE_3]: 5,
    };

    let number: number;
    if (step in baseStepNumbers) {
      number = baseStepNumbers[step];
    } else {
      const afterTechniques = 2 + techniqueCount;
      switch (step) {
        case BmadStep.ORGANIZE_IDEAS: number = afterTechniques + 1; break;
        case BmadStep.EXTRACT_INSIGHTS: number = afterTechniques + 2; break;
        case BmadStep.GENERATE_OUTPUT: number = afterTechniques + 3; break;
        case BmadStep.COMPLETED: number = 5 + techniqueCount; break;
        default: number = 0;
      }
    }

    return { number, name: info.name, description: info.description };
  }

  /**
   * Check if a transition from the current step to the target step is valid.
   */
  canTransition(session: BrainstormSession, toStep: BmadStep): boolean {
    const validTargets = VALID_TRANSITIONS[session.currentStep];
    if (!validTargets?.includes(toStep)) {
      return false;
    }

    // Skip EXECUTE_TECHNIQUE_3 if fewer than 3 techniques selected
    if (toStep === BmadStep.EXECUTE_TECHNIQUE_3 && session.selectedTechniques.length < 3) {
      return false;
    }

    // Skip EXECUTE_TECHNIQUE_2 if fewer than 2 techniques
    if (toStep === BmadStep.EXECUTE_TECHNIQUE_2 && session.selectedTechniques.length < 2) {
      return false;
    }

    return true;
  }

  /**
   * Perform a transition to the target step, updating session state.
   * Returns the updated session (does NOT persist it).
   */
  transition(session: BrainstormSession, toStep: BmadStep): BrainstormSession {
    if (!this.canTransition(session, toStep)) {
      console.log(`[WorkflowEngine] Invalid transition: ${session.currentStep} → ${toStep}`);
      return session;
    }

    const previousStep = session.currentStep;
    console.log(`[WorkflowEngine] Transition: ${previousStep} → ${toStep}`);

    const completedSteps = [...session.completedSteps];
    if (previousStep !== BmadStep.IDLE && !completedSteps.includes(previousStep)) {
      completedSteps.push(previousStep);
    }

    return {
      ...session,
      currentStep: toStep,
      completedSteps,
      updatedAt: new Date(),
    };
  }

  /**
   * Get the next logical step, accounting for technique count.
   */
  getNextStep(session: BrainstormSession): BmadStep | null {
    const validTargets = VALID_TRANSITIONS[session.currentStep];
    if (!validTargets || validTargets.length === 0) return null;

    for (const target of validTargets) {
      if (this.canTransition(session, target)) {
        return target;
      }
    }
    return null;
  }

  /**
   * Check if the current step is complete.
   */
  isStepComplete(session: BrainstormSession): boolean {
    const handler = this.getHandler(session.currentStep);
    if (!handler) return false;
    return handler.isComplete(session);
  }

  /**
   * Check if the entire workflow is complete.
   */
  isWorkflowComplete(session: BrainstormSession): boolean {
    return session.currentStep === BmadStep.COMPLETED;
  }

  private getHandler(step: BmadStep): StepHandler | null {
    if (this.handlerCache.has(step)) {
      return this.handlerCache.get(step)!;
    }
    const handler = getStepHandler(step, this.claudeClient);
    if (handler) {
      this.handlerCache.set(step, handler);
    }
    return handler;
  }
}
