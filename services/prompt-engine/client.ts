/**
 * OpenRouter API Client
 * Handles all communication with OpenRouter for text and image generation
 */

import { OPENROUTER_CONFIG } from './config';
import type {
  OpenRouterChatRequest,
  OpenRouterChatResponse,
  OpenRouterImageRequest,
  OpenRouterImageResponse,
  OpenRouterMessage,
  OpenRouterTool,
} from './types';

class OpenRouterClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }
    this.apiKey = apiKey;
    this.baseUrl = OPENROUTER_CONFIG.baseUrl;
  }

  /**
   * Common headers for all OpenRouter requests
   */
  private getHeaders(): Record<string, string> {
    const referer = process.env.NODE_ENV === 'production'
      ? 'https://try-ink.app'
      : 'http://localhost:3000';
    
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': referer,
      'X-Title': 'Ink - Writing App',
    };
  }

  /**
   * Retry wrapper with exponential backoff
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = OPENROUTER_CONFIG.requests.maxRetries
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes('401') || error.message.includes('403')) {
            throw error; // Auth errors - don't retry
          }
          if (error.message.includes('400')) {
            throw error; // Bad request - don't retry
          }
        }
        
        if (attempt < maxRetries) {
          const delay = OPENROUTER_CONFIG.requests.retryDelayMs * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError || new Error('Unknown error occurred');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Chat completion - used for research and composition agents
   */
  async chat(
    messages: OpenRouterMessage[],
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      tools?: OpenRouterTool[];
      toolChoice?: OpenRouterChatRequest['tool_choice'];
    } = {}
  ): Promise<OpenRouterChatResponse> {
    const {
      model = OPENROUTER_CONFIG.models.composer,
      maxTokens = 2048,
      temperature = 0.7,
      tools,
      toolChoice,
    } = options;

    const request: OpenRouterChatRequest = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (tools && tools.length > 0) {
      request.tools = tools;
      request.tool_choice = toolChoice || 'auto';
    }

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(OPENROUTER_CONFIG.requests.timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter chat error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<OpenRouterChatResponse>;
    });
  }

  /**
   * Chat with tool handling - handles tool calls and responses
   */
  async chatWithTools(
    messages: OpenRouterMessage[],
    tools: OpenRouterTool[],
    toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>>,
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      maxIterations?: number;
    } = {}
  ): Promise<OpenRouterChatResponse> {
    const { maxIterations = 5, ...chatOptions } = options;
    
    let currentMessages = [...messages];
    let iterations = 0;

    while (iterations < maxIterations) {
      const response = await this.chat(currentMessages, {
        ...chatOptions,
        tools,
        toolChoice: 'auto',
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage) {
        throw new Error('No response from model');
      }

      // If no tool calls, we're done
      if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
        return response;
      }

      // Add assistant message with tool calls
      currentMessages.push(assistantMessage);

      // Process each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const handler = toolHandlers[toolCall.function.name];
        if (!handler) {
          throw new Error(`Unknown tool: ${toolCall.function.name}`);
        }

        const args = JSON.parse(toolCall.function.arguments);
        const result = await handler(args);

        // Add tool result
        currentMessages.push({
          role: 'tool',
          content: result,
          tool_call_id: toolCall.id,
        });
      }

      iterations++;
    }

    throw new Error('Max tool iterations exceeded');
  }

  /**
   * Image generation - used for visual composer
   */
  async generateImage(
    prompt: string,
    options: {
      model?: string;
      size?: string;
      n?: number;
    } = {}
  ): Promise<OpenRouterImageResponse> {
    const {
      model = OPENROUTER_CONFIG.models.visual,
      size = '1024x1024',
      n = 1,
    } = options;

    const request: OpenRouterImageRequest = {
      model,
      prompt,
      size,
      n,
      response_format: 'url',
    };

    return this.withRetry(async () => {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(OPENROUTER_CONFIG.requests.timeoutMs * 2), // Images take longer
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter image error ${response.status}: ${errorText}`);
      }

      return response.json() as Promise<OpenRouterImageResponse>;
    });
  }

  /**
   * Check if a model is available
   */
  async checkModelAvailability(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) return false;
      
      const data = await response.json() as { data: { id: string }[] };
      return data.data.some(m => m.id === model);
    } catch {
      return false;
    }
  }

  /**
   * Get the best available model from primary and fallback
   */
  async getAvailableModel(
    type: 'composer' | 'visual'
  ): Promise<string> {
    const primary = OPENROUTER_CONFIG.models[type];
    const fallback = OPENROUTER_CONFIG.fallbacks[type];

    if (await this.checkModelAvailability(primary)) {
      return primary;
    }

    console.warn(`Primary model ${primary} unavailable, using fallback ${fallback}`);
    return fallback;
  }
}

// Singleton instance
let clientInstance: OpenRouterClient | null = null;

export function getOpenRouterClient(): OpenRouterClient {
  if (!clientInstance) {
    clientInstance = new OpenRouterClient();
  }
  return clientInstance;
}

export { OpenRouterClient };

