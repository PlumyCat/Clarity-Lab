import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import type { Idea, Insight, Objective, TechniqueId } from '../storage/types.js';
import { getSystemPrompt } from './prompts/systemPrompt.js';
import { getObjectiveRefinerPrompt } from './prompts/objectiveRefiner.js';
import { getTechniqueGuidePrompt } from './prompts/techniqueGuide.js';
import { getIdeaSynthesisPrompt } from './prompts/ideaSynthesis.js';
import { getInsightExtractorPrompt } from './prompts/insightExtractor.js';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

export class ClaudeClient {
  private client: Anthropic;
  private model: string;

  constructor() {
    // azureAiFoundryResource can be a full URL or just the resource name
    // SDK appends /v1/messages automatically, so baseURL should end with /anthropic
    const resource = config.azureAiFoundryResource.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseURL = `https://${resource}/anthropic`;
    console.log(`[ClaudeClient] baseURL=${baseURL}`);
    this.client = new Anthropic({
      apiKey: config.azureAiFoundryApiKey,
      baseURL,
    });
    this.model = config.claudeModel;
  }

  async chat(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options?: { maxTokens?: number; temperature?: number },
  ): Promise<string> {
    const maxTokens = options?.maxTokens ?? 4096;
    const temperature = options?.temperature ?? 1;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const startTime = Date.now();
      try {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages,
        });

        const durationMs = Date.now() - startTime;
        console.log(
          `[ClaudeClient] chat completed in ${durationMs}ms | tokens: input=${response.usage.input_tokens} output=${response.usage.output_tokens} | model=${response.model}`,
        );

        const block = response.content[0];
        if (block.type === 'text') {
          return block.text;
        }
        throw new Error('Unexpected response type from Claude');
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.log(
          `[ClaudeClient] attempt ${attempt}/${MAX_RETRIES} failed after ${durationMs}ms: ${error instanceof Error ? error.message : String(error)}`,
        );

        if (attempt === MAX_RETRIES) {
          throw error;
        }

        const delay = RETRY_DELAYS_MS[attempt - 1];
        console.log(`[ClaudeClient] retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }

    throw new Error('Unreachable: max retries exceeded');
  }

  async refineObjective(
    rawInput: string,
    context: string,
    expectedOutcome: string,
  ): Promise<{ refinedStatement: string; suggestedContext: string; suggestedOutcome: string }> {
    const prompt = getObjectiveRefinerPrompt(rawInput, context, expectedOutcome);
    const response = await this.chat(getSystemPrompt(), [{ role: 'user', content: prompt }]);
    return parseJsonResponse(response);
  }

  async recommendTechniques(
    objective: Objective,
  ): Promise<Array<{ techniqueId: TechniqueId; reason: string }>> {
    const prompt = `Tu es un expert en techniques de brainstorming. En fonction de l'objectif suivant, recommande les 3 techniques les plus adaptées parmi : five_whys, six_thinking_hats, swot, scamper, starbursting, mind_mapping, brainwriting, reverse_brainstorming.

**Objectif :** ${objective.refinedStatement}
**Contexte :** ${objective.context}
**Résultat attendu :** ${objective.desiredOutcome}

Pour chaque technique recommandée, explique brièvement pourquoi elle est pertinente pour cet objectif.

Réponds UNIQUEMENT avec un tableau JSON valide au format suivant, sans texte avant ni après :
[
  {"techniqueId": "id_technique", "reason": "Raison de la recommandation"}
]`;

    const response = await this.chat(getSystemPrompt(), [{ role: 'user', content: prompt }]);
    return parseJsonResponse(response);
  }

  async generateTechniquePrompt(
    techniqueId: TechniqueId,
    round: number,
    context: string,
  ): Promise<string> {
    const guidePrompt = getTechniqueGuidePrompt(techniqueId, context, round);
    return this.chat(getSystemPrompt(), [{ role: 'user', content: guidePrompt }]);
  }

  async synthesizeContributions(
    contributions: string[],
    context?: { objective?: string; techniqueName?: string; roundLabel?: string },
  ): Promise<string> {
    const contributionsList = contributions
      .map((c, i) => `${i + 1}. ${c}`)
      .join('\n');

    const contextBlock = context?.objective
      ? `**Objectif du brainstorming :** ${context.objective}
**Technique :** ${context.techniqueName ?? 'N/A'}
**Tour :** ${context.roundLabel ?? 'N/A'}

`
      : '';

    const prompt = `${contextBlock}Voici les contributions des participants pour ce tour de brainstorming :

${contributionsList}

Fais une synthèse concise et structurée de ces contributions EN RESTANT STRICTEMENT dans le cadre de l'objectif et du tour ci-dessus. N'invente pas de contexte ni de sujet qui ne serait pas mentionné dans les contributions. Identifie les thèmes principaux, les points de convergence et les idées originales. La synthèse doit être encourageante et préparer le terrain pour le tour suivant.

IMPORTANT : Réponds en texte brut SANS formatage markdown (pas de #, **, *, -, emojis, backticks). Utilise uniquement des phrases et paragraphes simples. Maximum 3-4 phrases.`;

    return this.chat(getSystemPrompt(), [{ role: 'user', content: prompt }]);
  }

  async organizeIdeas(ideas: Idea[]): Promise<Record<string, Idea[]>> {
    const simplifiedIdeas = ideas.map((idea) => ({
      text: idea.content,
      category: idea.category,
    }));

    const objectiveStatement = 'les idées de la session de brainstorming';
    const prompt = getIdeaSynthesisPrompt(simplifiedIdeas, objectiveStatement);
    const response = await this.chat(getSystemPrompt(), [{ role: 'user', content: prompt }]);
    const organized: Record<string, Array<{ text: string; category: string }>> =
      parseJsonResponse(response);

    const result: Record<string, Idea[]> = {};
    for (const [category, categoryIdeas] of Object.entries(organized)) {
      result[category] = categoryIdeas.map((catIdea) => {
        const original = ideas.find((idea) => idea.content === catIdea.text);
        if (original) {
          return { ...original, category };
        }
        return {
          id: crypto.randomUUID(),
          content: catIdea.text,
          source: ideas[0]?.source ?? 'brainwriting',
          votes: 0,
          category,
        } satisfies Idea;
      });
    }
    return result;
  }

  async extractInsights(ideas: Idea[], objective: Objective): Promise<Insight[]> {
    const organizedIdeas: Record<string, Array<{ text: string }>> = {};
    for (const idea of ideas) {
      const category = idea.category || 'Non catégorisé';
      if (!organizedIdeas[category]) {
        organizedIdeas[category] = [];
      }
      organizedIdeas[category].push({ text: idea.content });
    }

    const prompt = getInsightExtractorPrompt(organizedIdeas, objective.refinedStatement);
    const response = await this.chat(getSystemPrompt(), [{ role: 'user', content: prompt }]);
    const rawInsights: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }> = parseJsonResponse(response);

    return rawInsights.map((raw) => ({
      id: crypto.randomUUID(),
      title: raw.title,
      description: raw.description,
      impact: raw.impact,
      effort: raw.effort,
      rationale: raw.description,
      sourceTechniques: [] as TechniqueId[],
      votes: 0,
    }));
  }
}

/**
 * Extract and parse JSON from a Claude response that may contain
 * markdown code fences or surrounding text.
 */
function parseJsonResponse<T>(text: string): T {
  // Try to extract JSON from markdown code fences first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();

  try {
    return JSON.parse(jsonStr);
  } catch {
    // If direct parse fails, try to find the first JSON structure
    const objectMatch = jsonStr.match(/(\{[\s\S]*\})/);
    const arrayMatch = jsonStr.match(/(\[[\s\S]*\])/);
    const match = objectMatch || arrayMatch;

    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch {
        // Fall through to error
      }
    }

    console.log(`[ClaudeClient] Failed to parse JSON response: ${jsonStr.substring(0, 200)}...`);
    throw new Error('Failed to parse JSON from Claude response');
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const claudeClient = new ClaudeClient();
