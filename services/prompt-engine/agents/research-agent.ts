/**
 * Research Agent
 * Uses Perplexity AI for real-time web search and research capabilities
 * to gather current trends, news, and interesting angles for a given topic.
 */

import { PERPLEXITY_CONFIG, RESEARCH_AGENT_CONFIG } from '../config';
import type { ResearchReport, ResearchSource } from '../types';

// System prompt for research agent
const RESEARCH_SYSTEM_PROMPT = `You are an expert research assistant for a writing app. Your job is to find interesting, thought-provoking topics and angles that would inspire compelling essays and personal writing.

Your research style:
- Look for CURRENT trends and happenings (not historical background)
- Find debates, controversies, and discussions people are having NOW
- Identify surprising statistics, counterintuitive findings, and fresh perspectives
- Note any notable figures, movements, or events making waves
- Focus on angles that would make someone want to WRITE about this topic

Be thorough but concise. Your research will be used to generate writing prompts.`;

const RESEARCH_OUTPUT_PROMPT = `Research the topic: "{interest}"

Find current trends, recent developments, debates, and interesting angles that would inspire someone to write a compelling essay about this topic.

Provide your findings in this exact JSON format:
{
  "trends": ["Current trend 1", "Current trend 2", "Current trend 3", "Current trend 4", "Current trend 5"],
  "interestingAngles": ["Unique essay angle 1", "Unique essay angle 2", "Unique essay angle 3", "Unique essay angle 4", "Unique essay angle 5"],
  "sources": [
    {"title": "Source title", "url": "https://...", "snippet": "Key quote or summary"},
    {"title": "Source title 2", "url": "https://...", "snippet": "Key quote or summary"}
  ],
  "currentEvents": ["Recent event 1", "Recent event 2", "Recent event 3"],
  "debatesAndDiscussions": ["Debate 1 people are having", "Debate 2", "Debate 3"],
  "summary": "A 2-3 sentence overview of what's happening in this space right now"
}

Include at least:
- 3-5 current trends
- 3-5 interesting writing angles (make them SPECIFIC and COMPELLING, not generic)
- 3-5 sources with URLs from your search
- 2-3 current events
- 2-3 debates or discussions

Think like a Substack writer or NYT essayist - what angles would make someone say "I NEED to write about this"?`;

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  citations?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Research Agent - gathers information using Perplexity AI's web search
 */
export class ResearchAgent {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Conduct research on a given interest/topic using Perplexity AI
   */
  async research(interest: string): Promise<ResearchReport> {
    const messages: PerplexityMessage[] = [
      {
        role: 'system',
        content: RESEARCH_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: RESEARCH_OUTPUT_PROMPT.replace('{interest}', interest),
      },
    ];

    try {
      const response = await this.callPerplexity(messages);
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No research content received from Perplexity');
      }

      // Parse the response and include citations if available
      return this.parseResearchReport(interest, content, response.citations);
    } catch (error) {
      console.error('Research agent error:', error);
      
      // Return a minimal report on error
      return this.createFallbackReport(interest, error);
    }
  }

  /**
   * Call Perplexity API
   */
  private async callPerplexity(messages: PerplexityMessage[]): Promise<PerplexityResponse> {
    const response = await fetch(`${PERPLEXITY_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PERPLEXITY_CONFIG.models.research,
        messages,
        max_tokens: RESEARCH_AGENT_CONFIG.maxTokens,
        temperature: RESEARCH_AGENT_CONFIG.temperature,
        return_citations: true,
      }),
      signal: AbortSignal.timeout(PERPLEXITY_CONFIG.requests.timeoutMs),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<PerplexityResponse>;
  }

  /**
   * Parse the research report from Perplexity's response
   */
  private parseResearchReport(
    interest: string, 
    content: string, 
    citations?: string[]
  ): ResearchReport {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // If no JSON, try to create a report from the text content
      return this.parseTextResponse(interest, content, citations);
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Merge parsed sources with citations from Perplexity
      let sources = this.parseSources(parsed.sources);
      
      // Add any additional citations from Perplexity's response
      if (citations && citations.length > 0) {
        const citationSources = citations.map((url, i) => ({
          title: `Source ${i + 1}`,
          url,
          snippet: 'Referenced in research',
        }));
        
        // Merge, avoiding duplicates
        const existingUrls = new Set(sources.map(s => s.url));
        for (const cs of citationSources) {
          if (!existingUrls.has(cs.url)) {
            sources.push(cs);
          }
        }
      }
      
      return {
        interest,
        trends: this.ensureArray(parsed.trends),
        interestingAngles: this.ensureArray(parsed.interestingAngles),
        sources: sources.slice(0, 10), // Limit to 10 sources
        summary: parsed.summary || 'Research summary unavailable.',
        currentEvents: this.ensureArray(parsed.currentEvents),
        debatesAndDiscussions: this.ensureArray(parsed.debatesAndDiscussions),
        generatedAt: new Date().toISOString(),
      };
    } catch (parseError) {
      console.error('Failed to parse research JSON:', parseError);
      return this.parseTextResponse(interest, content, citations);
    }
  }

  /**
   * Parse a text response when JSON parsing fails
   */
  private parseTextResponse(
    interest: string, 
    content: string, 
    citations?: string[]
  ): ResearchReport {
    // Extract what we can from the text
    const lines = content.split('\n').filter(l => l.trim());
    
    // Try to find trends, angles, etc. from bullet points or numbered lists
    const trends: string[] = [];
    const angles: string[] = [];
    
    let currentSection = '';
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('trend')) currentSection = 'trends';
      else if (lowerLine.includes('angle') || lowerLine.includes('perspective')) currentSection = 'angles';
      else if (line.match(/^[-•*\d.]\s*/)) {
        const text = line.replace(/^[-•*\d.]\s*/, '').trim();
        if (currentSection === 'trends' && text.length > 10) {
          trends.push(text);
        } else if (currentSection === 'angles' && text.length > 10) {
          angles.push(text);
        }
      }
    }

    // Build sources from citations
    const sources = (citations || []).map((url, i) => ({
      title: `Source ${i + 1}`,
      url,
      snippet: 'Referenced in research',
    }));

    return {
      interest,
      trends: trends.length > 0 ? trends : [`Current developments in ${interest}`],
      interestingAngles: angles.length > 0 ? angles : [`Fresh perspectives on ${interest}`],
      sources,
      summary: content.substring(0, 300),
      currentEvents: [],
      debatesAndDiscussions: [],
      generatedAt: new Date().toISOString(),
    };
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
    console.warn(`Research fallback activated for "${interest}": ${errorMessage}`);
    
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
