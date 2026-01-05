/**
 * Research Agent
 * Uses Claude via OpenRouter with web search capabilities to gather
 * current trends, news, and interesting angles for a given topic.
 */

import { getOpenRouterClient } from '../client';
import { OPENROUTER_CONFIG, RESEARCH_AGENT_CONFIG } from '../config';
import type { ResearchReport, ResearchSource, OpenRouterTool, OpenRouterMessage } from '../types';

// Web search tool definition for Claude
const WEB_SEARCH_TOOL: OpenRouterTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description: 'Search the web for current information about a topic. Use this to find recent news, trends, discussions, and developments.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find relevant information',
        },
      },
      required: ['query'],
    },
  },
};

// System prompt for research agent
const RESEARCH_SYSTEM_PROMPT = `You are an expert research assistant for a writing app. Your job is to find interesting, thought-provoking topics and angles that would inspire compelling essays and personal writing.

Your research style:
- Look for CURRENT trends and happenings (not historical background)
- Find debates, controversies, and discussions people are having NOW
- Identify surprising statistics, counterintuitive findings, and fresh perspectives
- Note any notable figures, movements, or events making waves
- Focus on angles that would make someone want to WRITE about this topic

When searching:
1. Start with a broad search for current news/trends
2. Then search for debates or controversial takes
3. Finally, search for personal stories or unique angles

Be thorough but concise. Your research will be used to generate writing prompts.`;

const RESEARCH_OUTPUT_PROMPT = `Based on your research, provide a structured report in the following JSON format:

{
  "trends": ["Current trend 1", "Current trend 2", ...],
  "interestingAngles": ["Angle 1 that would make a great essay", "Angle 2", ...],
  "sources": [
    {"title": "Source title", "url": "https://...", "snippet": "Key quote or summary"},
    ...
  ],
  "currentEvents": ["Recent event 1", "Recent event 2", ...],
  "debatesAndDiscussions": ["Debate 1 people are having", "Debate 2", ...],
  "summary": "A 2-3 sentence overview of what's happening in this space right now"
}

Include at least:
- 3-5 current trends
- 3-5 interesting writing angles
- 3-5 sources with URLs
- 2-3 current events
- 2-3 debates or discussions

Make the angles SPECIFIC and COMPELLING - not generic. Think like a Substack writer or NYT essayist.`;

/**
 * Simulated web search handler
 * In production, this would call a real search API (Brave, SerpAPI, etc.)
 * For now, Claude will use its training data + we can integrate real search later
 */
async function webSearchHandler(args: Record<string, unknown>): Promise<string> {
  const query = args.query as string;
  
  // TODO: Integrate with actual search API (Brave Search, SerpAPI, etc.)
  // For now, return a placeholder that prompts Claude to use its knowledge
  return JSON.stringify({
    status: 'simulated',
    query,
    message: `Search results for: "${query}". Use your knowledge to provide current and relevant information about this topic. Focus on recent developments, trends, and discussions.`,
  });
}

/**
 * Research Agent - gathers information about a topic
 */
export class ResearchAgent {
  private client = getOpenRouterClient();

  /**
   * Conduct research on a given interest/topic
   */
  async research(interest: string): Promise<ResearchReport> {
    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: RESEARCH_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: `Research the topic: "${interest}"

Please search for:
1. Current trends and what's happening now in this space
2. Debates, controversies, or interesting discussions
3. Fresh angles and perspectives that would inspire great writing

After your research, provide your findings in the structured JSON format.`,
      },
    ];

    try {
      // Use chat with tools to allow web search
      const response = await this.client.chatWithTools(
        messages,
        [WEB_SEARCH_TOOL],
        { web_search: webSearchHandler },
        {
          model: OPENROUTER_CONFIG.models.research,
          maxTokens: RESEARCH_AGENT_CONFIG.maxTokens,
          temperature: RESEARCH_AGENT_CONFIG.temperature,
          maxIterations: 5,
        }
      );

      // After tool use, get the final structured response
      const finalMessages: OpenRouterMessage[] = [
        ...messages,
        response.choices[0].message,
        {
          role: 'user',
          content: RESEARCH_OUTPUT_PROMPT,
        },
      ];

      const structuredResponse = await this.client.chat(finalMessages, {
        model: OPENROUTER_CONFIG.models.research,
        maxTokens: RESEARCH_AGENT_CONFIG.maxTokens,
        temperature: 0.3, // Lower temp for structured output
      });

      const content = structuredResponse.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No research content received');
      }

      return this.parseResearchReport(interest, content);
    } catch (error) {
      console.error('Research agent error:', error);
      
      // Return a minimal report on error
      return this.createFallbackReport(interest, error);
    }
  }

  /**
   * Parse the research report from model output
   */
  private parseResearchReport(interest: string, content: string): ResearchReport {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse research report JSON');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        interest,
        trends: this.ensureArray(parsed.trends),
        interestingAngles: this.ensureArray(parsed.interestingAngles),
        sources: this.parseSources(parsed.sources),
        summary: parsed.summary || 'Research summary unavailable.',
        currentEvents: this.ensureArray(parsed.currentEvents),
        debatesAndDiscussions: this.ensureArray(parsed.debatesAndDiscussions),
        generatedAt: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error('Failed to parse research JSON:', parseError);
      throw new Error('Invalid research report format');
    }
  }

  /**
   * Ensure value is an array
   */
  private ensureArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string');
    }
    return [];
  }

  /**
   * Parse sources array
   */
  private parseSources(sources: unknown): ResearchSource[] {
    if (!Array.isArray(sources)) return [];
    
    return sources
      .filter((s): s is Record<string, string> => 
        typeof s === 'object' && s !== null && 'title' in s
      )
      .map(s => ({
        title: s.title || 'Unknown source',
        url: s.url || '',
        snippet: s.snippet || '',
      }));
  }

  /**
   * Create a fallback report when research fails
   */
  private createFallbackReport(interest: string, error: unknown): ResearchReport {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      interest,
      trends: [`Exploring ${interest}`, `Understanding modern ${interest.toLowerCase()}`],
      interestingAngles: [
        `What ${interest.toLowerCase()} means to you personally`,
        `The unexpected lessons from ${interest.toLowerCase()}`,
      ],
      sources: [],
      summary: `Explore your thoughts and experiences with ${interest.toLowerCase()}. What draws you to this topic?`,
      currentEvents: [],
      debatesAndDiscussions: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

// Export singleton factory
let agentInstance: ResearchAgent | null = null;

export function getResearchAgent(): ResearchAgent {
  if (!agentInstance) {
    agentInstance = new ResearchAgent();
  }
  return agentInstance;
}

