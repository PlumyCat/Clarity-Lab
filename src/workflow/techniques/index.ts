import type { TechniqueId, BrainstormSession, TechniqueRound, UserInput } from '../../storage/types.js';
import { fiveWhys, FiveWhysTechnique } from './fiveWhys.js';
import { sixThinkingHats, SixThinkingHatsTechnique } from './sixThinkingHats.js';
import { swot, SwotTechnique } from './swot.js';
import { scamper } from './scamper.js';
import { starbursting } from './starbursting.js';
import { mindMapping } from './mindMapping.js';
import { brainwriting } from './brainwriting.js';
import { reverseBrainstorming } from './reverseBrainstorming.js';

// Interface legacy pour les techniques non encore migrées
export interface BaseTechnique {
  id: TechniqueId;
  name: string;
  description: string;
  totalRounds: number;
  getRoundPrompt(round: number, objectiveStatement: string): string;
  getRoundLabel(round: number): string;
}

// Interface complète pour les techniques migrées (Five Whys, Six Hats, SWOT)
export interface BrainstormTechnique {
  id: string;
  name: string;
  description: string;
  category: 'problem_exploration' | 'solution_generation' | 'risk_analysis' | 'strategic_planning';
  totalRounds: number;

  getPromptForRound(round: number, session: BrainstormSession): string;
  getCardForRound(round: number, session: BrainstormSession): unknown;
  processRoundInput(round: number, input: UserInput, session: BrainstormSession): Promise<{
    roundResult: TechniqueRound;
    isComplete: boolean;
  }>;
}

const registry: Record<string, BaseTechnique> = {
  five_whys: fiveWhys,
  six_thinking_hats: sixThinkingHats,
  swot,
  scamper,
  starbursting,
  mind_mapping: mindMapping,
  brainwriting,
  reverse_brainstorming: reverseBrainstorming,
};

export function getTechnique(id: TechniqueId): BaseTechnique {
  const technique = registry[id];
  if (!technique) {
    throw new Error(`Technique inconnue : ${id}`);
  }
  return technique;
}

export function getAllTechniques(): BaseTechnique[] {
  return Object.values(registry);
}

// Registry for full BrainstormTechnique implementations
const brainstormRegistry: Record<string, BrainstormTechnique> = {
  five_whys: new FiveWhysTechnique(),
  six_thinking_hats: new SixThinkingHatsTechnique(),
  swot: new SwotTechnique(),
};

/**
 * Get the full BrainstormTechnique implementation if available.
 * Returns null for techniques that only have the legacy BaseTechnique interface.
 */
export function getBrainstormTechnique(id: TechniqueId): BrainstormTechnique | null {
  return brainstormRegistry[id] ?? null;
}

export const TECHNIQUE_INFO: Record<string, { name: string; description: string; category: string }> = {
  five_whys: { name: '5 Pourquoi', description: 'Creuser les causes racines en demandant "pourquoi" 5 fois', category: 'problem_exploration' },
  starbursting: { name: 'Starbursting', description: 'Explorer avec qui/quoi/où/quand/pourquoi/comment', category: 'problem_exploration' },
  six_thinking_hats: { name: 'Six Chapeaux de Bono', description: 'Examiner sous 6 perspectives différentes', category: 'problem_exploration' },
  scamper: { name: 'SCAMPER', description: 'Substituer, Combiner, Adapter, Modifier, Proposer, Éliminer, Réorganiser', category: 'solution_generation' },
  mind_mapping: { name: 'Mind Mapping', description: 'Organisation visuelle des idées en arborescence', category: 'solution_generation' },
  brainwriting: { name: 'Brainwriting', description: 'Génération silencieuse d\'idées en rounds successifs', category: 'solution_generation' },
  reverse_brainstorming: { name: 'Brainstorming Inversé', description: 'Trouver comment échouer pour découvrir comment réussir', category: 'risk_analysis' },
  swot: { name: 'Analyse SWOT', description: 'Forces, Faiblesses, Opportunités, Menaces', category: 'strategic_planning' },
};
