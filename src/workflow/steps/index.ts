import type { BmadStep, BrainstormSession, StepResult, UserInput } from '../../storage/types.js';
import type { ClaudeClient } from '../../llm/claudeClient.js';
import { DefineObjectiveStep } from './defineObjective.js';
import { SelectTechniquesStep } from './selectTechniques.js';
import { ExecuteTechniqueHandler } from './executeTechnique.js';
import { OrganizeIdeasHandler } from './organizeIdeas.js';
import { ExtractInsightsHandler } from './extractInsights.js';
import { GenerateOutputHandler } from './generateOutput.js';

export interface StepHandler {
  step: BmadStep;
  getEntryCard(session: BrainstormSession): Promise<object> | object;
  processInput(session: BrainstormSession, input: UserInput): Promise<StepResult>;
  isComplete(session: BrainstormSession): boolean;
}

/**
 * Factory function to get the appropriate StepHandler for a given step.
 * Returns null for steps that are not yet implemented.
 */
export function getStepHandler(step: BmadStep, claudeClient: ClaudeClient): StepHandler | null {
  switch (step) {
    case 'define_objective' as BmadStep:
      return new DefineObjectiveStep(claudeClient);
    case 'select_techniques' as BmadStep:
      return new SelectTechniquesStep(claudeClient);
    case 'execute_technique_1' as BmadStep:
      return new ExecuteTechniqueHandler(0, claudeClient);
    case 'execute_technique_2' as BmadStep:
      return new ExecuteTechniqueHandler(1, claudeClient);
    case 'execute_technique_3' as BmadStep:
      return new ExecuteTechniqueHandler(2, claudeClient);
    case 'organize_ideas' as BmadStep:
      return new OrganizeIdeasHandler();
    case 'extract_insights' as BmadStep:
      return new ExtractInsightsHandler();
    case 'generate_output' as BmadStep:
      return new GenerateOutputHandler();
    default:
      return null;
  }
}
