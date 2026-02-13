// Enum des 8 étapes BMAD
export enum BmadStep {
  IDLE = 'idle',
  DEFINE_OBJECTIVE = 'define_objective',
  SELECT_TECHNIQUES = 'select_techniques',
  EXECUTE_TECHNIQUE_1 = 'execute_technique_1',
  EXECUTE_TECHNIQUE_2 = 'execute_technique_2',
  EXECUTE_TECHNIQUE_3 = 'execute_technique_3',
  ORGANIZE_IDEAS = 'organize_ideas',
  EXTRACT_INSIGHTS = 'extract_insights',
  GENERATE_OUTPUT = 'generate_output',
  COMPLETED = 'completed',
}

// Enum des techniques disponibles
export type TechniqueId = 'five_whys' | 'starbursting' | 'six_thinking_hats' | 'scamper' | 'mind_mapping' | 'brainwriting' | 'reverse_brainstorming' | 'swot';

// Session status
export type SessionStatus = 'active' | 'paused' | 'completed';

// Interface Objective (Step 1)
export interface Objective {
  what: string;
  context: string;
  desiredOutcome: string;
  refinedStatement: string; // Version raffinée par Claude
}

// Interface pour les rounds de technique
export interface TechniqueRound {
  roundNumber: number;
  prompt: string;
  responses: ParticipantResponse[];
  summary: string; // Synthèse Claude du round
}

export interface ParticipantResponse {
  participantId: string;
  participantName: string;
  content: string;
  timestamp: Date;
}

// Résultats d'une technique
export interface TechniqueResult {
  techniqueId: TechniqueId;
  rounds: TechniqueRound[];
  summary: string; // Synthèse globale par Claude
  ideas: string[]; // Idées extraites
}

// Catégorie d'idées (Step 6)
export interface IdeaCategory {
  name: string;
  ideas: Idea[];
}

export interface Idea {
  id: string;
  content: string;
  source: TechniqueId; // Technique d'origine
  votes: number;
  category?: string;
}

// Insight (Step 7)
export interface Insight {
  id: string;
  title: string;
  description: string;
  sourceTechniques: TechniqueId[];
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  rationale: string;
  votes: number;
}

// Participant
export interface Participant {
  id: string;
  name: string;
  email?: string;
  joinedAt: Date;
  meetings: string[]; // meeting IDs
}

// Meeting record
export interface MeetingRecord {
  meetingId: string;
  startedAt: Date;
  endedAt?: Date;
  stepsCompleted: BmadStep[];
}

// Session principale
export interface BrainstormSession {
  id: string;
  meetingId: string;
  conversationId: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;

  // BMAD workflow
  currentStep: BmadStep;
  completedSteps: BmadStep[];

  // Step 1
  objective: Objective | null;

  // Step 2
  selectedTechniques: TechniqueId[];
  techniqueRecommendations: string;

  // Steps 3-5
  techniqueResults: Record<string, TechniqueResult>;

  // Step 6
  organizedIdeas: {
    categories: IdeaCategory[];
    totalIdeas: number;
  } | null;

  // Step 7
  insights: Insight[];

  // Step 8
  outputUrl: string | null;

  // Multi-meeting
  meetings: MeetingRecord[];
  openQuestions: string[];
  participants: Participant[];

  // Teams conversation reference (pour messages proactifs)
  conversationReference: Record<string, unknown> | null;

  // Cosmos DB metadata
  _etag?: string;
}

// Input utilisateur générique
export interface UserInput {
  type: 'text' | 'card_action';
  text?: string;
  data?: Record<string, unknown>;
  participantId: string;
  participantName: string;
}

// Résultat d'un step handler
export interface StepResult {
  responseCard?: unknown; // Adaptive Card JSON
  responseText?: string;
  transitionTo?: BmadStep;
  updatedSession: BrainstormSession;
}
