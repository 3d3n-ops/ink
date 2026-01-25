/**
 * Prompt Composer Agent
 * Uses GPT-5 via OpenRouter to generate compelling writing hooks and blurbs
 * based on research findings.
 */

import { getOpenRouterClient } from '../client';
import { OPENROUTER_CONFIG, PROMPT_COMPOSER_CONFIG } from '../config';
import type { PromptContent, ResearchReport, OpenRouterMessage } from '../types';

// System prompt for the composer
const COMPOSER_SYSTEM_PROMPT = `You are a skilled writing prompt creator. Your job is to craft clear, compelling prompts that inspire people to write.

Your writing style:
- HOOKS: Short, punchy, and direct. Get to the point quickly.
- BLURBS: Simple and straightforward. Explain what's interesting without being fancy.
- TONE: Clear and conversational. Write like you're talking to a friend, not writing an academic paper.

Rules for hooks:
1. 6-12 words maximum (shorter is better)
2. Must create immediate curiosity or tension
3. Avoid clichés, jargon, and overly complex language
4. Use simple, concrete words
5. Can be: a direct question, a simple observation, or a clear statement

Rules for blurbs:
1. 1-2 paragraphs maximum (keep it brief, aim for 80-120 words total)
2. Explain what's happening in simple, everyday language
3. Mention 1-2 interesting points or questions
4. Include relevant links/sources naturally
5. End with a simple invitation to explore
6. Write like you're texting a friend, not writing an essay
7. Avoid fancy words: "precipice", "ivory tower", "paradigm", "discourse", "narrative", "trapped in", "survival guide", "navigate", "desire for" - use plain, direct words instead
8. Use short sentences. Break up long thoughts.

Remember: You're helping someone start writing, not impressing them with big words. Keep it simple and direct.`;

const COMPOSITION_PROMPT = `Based on this research about "{interest}", create a simple, direct writing prompt.

RESEARCH FINDINGS:
---
Trends: {trends}

Interesting Angles: {angles}

Current Events: {events}

Debates & Discussions: {debates}

Summary: {summary}

Sources: {sources}
---

Generate a writing prompt with:
1. A HOOK (the title/headline) - 6-12 words, short and direct
2. A BLURB (the setup) - 1-2 paragraphs in HTML format, keep it simple and conversational, include relevant links
3. TAGS - 3-5 topic tags
4. SUGGESTED ANGLES - 2-3 specific angles the writer could take

Output in this exact JSON format:
{
  "hook": "Your short, direct hook here",
  "blurb": "<p>First paragraph - keep it simple...</p><p>Second paragraph if needed...</p>",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedAngles": ["Angle 1", "Angle 2", "Angle 3"]
}

Important guidelines:
- Write like you're texting a friend, not writing an essay
- Use everyday language - avoid academic or overly intellectual phrases
- Keep the blurb under 120 words total (shorter is better)
- Make it clear what's interesting without being fancy
- The hook should be short and punchy, not wordy
- Use short sentences. Be direct. Cut unnecessary words.
- Examples of what NOT to say: "trapped in dusty lecture halls", "survival guide", "navigate a world", "desire for ancient wisdom"
- Examples of what TO say: "philosophy used to be boring, now it's everywhere", "people are asking if AI can think", "ancient ideas are popular again"`;

/**
 * Format sources for inclusion in the blurb
 */
function formatSourcesForBlurb(sources: ResearchReport['sources']): string {
  if (sources.length === 0) return 'No sources available';
  
  return sources
    .slice(0, 5)
    .map(s => `- ${s.title}${s.url ? ` (${s.url})` : ''}: ${s.snippet}`)
    .join('\n');
}

/**
 * Prompt Composer Agent - generates hooks and blurbs
 */
export class PromptComposerAgent {
  private client = getOpenRouterClient();

  /**
   * Compose a writing prompt from research findings
   */
  async compose(research: ResearchReport): Promise<PromptContent> {
    const prompt = COMPOSITION_PROMPT
      .replace('{interest}', research.interest)
      .replace('{trends}', research.trends.join(', ') || 'None identified')
      .replace('{angles}', research.interestingAngles.join(', ') || 'None identified')
      .replace('{events}', research.currentEvents.join(', ') || 'None identified')
      .replace('{debates}', research.debatesAndDiscussions.join(', ') || 'None identified')
      .replace('{summary}', research.summary)
      .replace('{sources}', formatSourcesForBlurb(research.sources));

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: COMPOSER_SYSTEM_PROMPT,
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    try {
      const response = await this.client.chat(messages, {
        model: OPENROUTER_CONFIG.models.composer,
        maxTokens: PROMPT_COMPOSER_CONFIG.maxTokens,
        temperature: PROMPT_COMPOSER_CONFIG.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No composition content received');
      }

      return this.parseComposition(content, research);
    } catch (error) {
      console.error('Prompt composer error:', error);
      return this.createFallbackComposition(research);
    }
  }

  /**
   * Parse the composition from model output
   */
  private parseComposition(content: string, research: ResearchReport): PromptContent {
    // Try multiple approaches to extract JSON
    let parsed: Record<string, unknown> | null = null;
    
    // Approach 1: Look for JSON block between ```json and ```
    const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        parsed = JSON.parse(jsonBlockMatch[1].trim());
      } catch {
        // Continue to next approach
      }
    }
    
    // Approach 2: Find the outermost JSON object
    if (!parsed) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Try to fix common JSON issues
          try {
            const fixed = jsonMatch[0]
              .replace(/,\s*}/g, '}') // Remove trailing commas
              .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
              .replace(/'/g, '"'); // Replace single quotes
            parsed = JSON.parse(fixed);
          } catch {
            // Continue to fallback
          }
        }
      }
    }
    
    // Approach 3: Try to extract fields manually if JSON parsing fails
    if (!parsed) {
      const hook = this.extractField(content, 'hook') || 
                   this.extractQuotedString(content, /hook['":\s]+["']([^"']+)["']/i);
      const blurb = this.extractField(content, 'blurb') ||
                    this.extractHtmlContent(content);
      
      if (hook) {
        parsed = {
          hook,
          blurb: blurb || this.createMinimalBlurb(research),
          tags: [research.interest.toLowerCase().replace(/\s+/g, '-')],
          suggestedAngles: research.interestingAngles.slice(0, 3),
        };
      }
    }
    
    if (!parsed) {
      // Last resort: use fallback composition
      console.warn('Could not parse composition, using fallback');
      return this.createFallbackComposition(research);
    }

    // Validate hook length
    const hook = this.validateHook(parsed.hook as string, research.interest);
    
    // Validate and clean blurb
    const blurb = this.validateBlurb(parsed.blurb as string, research);
    
    return {
      hook,
      blurb,
      tags: this.ensureArray(parsed.tags).slice(0, 5),
      suggestedAngles: this.ensureArray(parsed.suggestedAngles).slice(0, 3),
    };
  }
  
  /**
   * Extract a field value from text
   */
  private extractField(content: string, field: string): string | null {
    const regex = new RegExp(`["']?${field}["']?\\s*:\\s*["']([^"']+)["']`, 'i');
    const match = content.match(regex);
    return match ? match[1] : null;
  }
  
  /**
   * Extract a quoted string using a regex
   */
  private extractQuotedString(content: string, regex: RegExp): string | null {
    const match = content.match(regex);
    return match ? match[1] : null;
  }
  
  /**
   * Extract HTML content (paragraphs) from text
   */
  private extractHtmlContent(content: string): string | null {
    const htmlMatch = content.match(/<p>[\s\S]*<\/p>/);
    return htmlMatch ? htmlMatch[0] : null;
  }

  /**
   * Validate and potentially fix the hook
   */
  private validateHook(hook: string, interest: string): string {
    if (!hook || typeof hook !== 'string') {
      return `What ${interest} tells us about ourselves`;
    }
    
    // Count words
    const wordCount = hook.split(/\s+/).length;
    
    if (wordCount < PROMPT_COMPOSER_CONFIG.hook.minWords) {
      // Too short - might need enhancement
      return hook;
    }
    
    if (wordCount > PROMPT_COMPOSER_CONFIG.hook.maxWords) {
      // Too long - truncate at sentence boundary if possible
      const sentences = hook.split(/[.!?]/);
      const firstSentence = sentences[0].trim();
      // If still too long, truncate to first 12 words
      const words = firstSentence.split(/\s+/);
      if (words.length > PROMPT_COMPOSER_CONFIG.hook.maxWords) {
        return words.slice(0, PROMPT_COMPOSER_CONFIG.hook.maxWords).join(' ');
      }
      return firstSentence + (firstSentence.match(/[.!?]$/) ? '' : '.');
    }
    
    return hook;
  }

  /**
   * Validate and enhance the blurb
   */
  private validateBlurb(blurb: string, research: ResearchReport): string {
    if (!blurb || typeof blurb !== 'string') {
      return this.createMinimalBlurb(research);
    }
    
    // Ensure it's HTML formatted
    if (!blurb.includes('<p>')) {
      // Wrap paragraphs in <p> tags
      const paragraphs = blurb.split(/\n\n+/);
      return paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
    }
    
    // Limit to max paragraphs
    const paragraphs = blurb.match(/<p>[\s\S]*?<\/p>/g) || [];
    if (paragraphs.length > PROMPT_COMPOSER_CONFIG.blurb.maxParagraphs) {
      return paragraphs.slice(0, PROMPT_COMPOSER_CONFIG.blurb.maxParagraphs).join('');
    }
    
    return blurb;
  }

  /**
   * Create a minimal blurb when content is missing
   */
  private createMinimalBlurb(research: ResearchReport): string {
    const angle = research.interestingAngles[0] || 'this topic';
    const trend = research.trends[0] || 'what\'s happening now';
    
    // Keep it simple and direct
    const summary = research.summary.length > 100 
      ? research.summary.substring(0, 100) + '...'
      : research.summary;
    
    return `<p>Something interesting is happening with ${research.interest.toLowerCase()}. ${summary}</p>`;
  }

  /**
   * Ensure value is an array of strings
   */
  private ensureArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string');
    }
    return [];
  }

  /**
   * Create fallback composition when generation fails
   */
  private createFallbackComposition(research: ResearchReport): PromptContent {
    return {
      hook: `What's happening with ${research.interest.toLowerCase()}?`,
      blurb: this.createMinimalBlurb(research),
      tags: [research.interest.toLowerCase().replace(/\s+/g, '-')],
      suggestedAngles: research.interestingAngles.slice(0, 3),
    };
  }
}

// Export singleton factory
let agentInstance: PromptComposerAgent | null = null;

export function getPromptComposerAgent(): PromptComposerAgent {
  if (!agentInstance) {
    agentInstance = new PromptComposerAgent();
  }
  return agentInstance;
}

