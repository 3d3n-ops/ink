/**
 * Visual Composer Agent
 * Uses OpenRouter with Gemini 2.5 Flash to generate realistic impressionist-style art
 * of nature scenes using watercolor, oil paint, and acrylic styles.
 */

import { OPENROUTER_CONFIG, VISUAL_COMPOSER_CONFIG } from '../config';
import type { ArtStyle, GeneratedVisual, VisualPromptConfig } from '../types';

// Available art styles - impressionist nature scenes
const ART_STYLES: ArtStyle[] = [
  'watercolor',
  'oil-paint',
  'acrylic',
];

// Nature scenes to randomly select from
const NATURE_SCENES = [
  'misty morning forest with sunlight filtering through trees',
  'serene lake at sunset with mountains in the distance',
  'wildflower meadow with rolling hills',
  'ocean waves crashing on rocky coastline',
  'autumn leaves falling in a peaceful woodland',
  'snow-covered mountain peaks at dawn',
  'tranquil stream flowing through a mossy glen',
  'golden wheat field under stormy skies',
  'cherry blossoms along a quiet pathway',
  'lavender fields stretching to the horizon',
  'tropical waterfall hidden in lush jungle',
  'starry night sky over a calm lake',
  'morning mist rising over a river valley',
  'sunflowers dancing in summer breeze',
  'coastal cliffs with crashing surf below',
  'bamboo forest with dappled light',
  'desert landscape at golden hour',
  'rainforest canopy with rays of light',
];

/**
 * Select a random nature scene
 */
function selectRandomNatureScene(): string {
  const index = Math.floor(Math.random() * NATURE_SCENES.length);
  return NATURE_SCENES[index];
}

/**
 * Select a random art style
 */
function selectRandomArtStyle(): ArtStyle {
  const index = Math.floor(Math.random() * ART_STYLES.length);
  return ART_STYLES[index];
}

/**
 * Build the image generation prompt
 * Creates realistic impressionist nature scenes
 */
function buildImagePrompt(config: VisualPromptConfig): string {
  const styleConfig = VISUAL_COMPOSER_CONFIG.artStyles[config.artStyle];
  const natureScene = selectRandomNatureScene();
  
  // Realistic impressionist nature art prompt
  const prompt = `Generate an image: A realistic impressionist ${config.artStyle} painting of ${natureScene}. ${styleConfig.description}. Style: ${styleConfig.modifiers}. Detailed, realistic nature scene with impressionist brushwork. Vibrant colors, natural lighting, beautiful composition. Museum quality fine art painting. Masterpiece. No text, no letters, no words, no watermarks.`;

  return prompt;
}

/**
 * Visual Composer Agent - generates images using OpenRouter with Gemini 2.5 Flash
 */
export class VisualComposerAgent {
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
   * Get headers for OpenRouter requests
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
   * Generate an image using Gemini 2.5 Flash via OpenRouter
   * Includes retry logic for transient failures
   */
  private async generateWithGemini(prompt: string, retries: number = 2): Promise<string> {
    const model = OPENROUTER_CONFIG.models.visual;
    
    const request = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify(request),
          signal: AbortSignal.timeout(120000), // 2 minute timeout for image generation
        });

        if (!response.ok) {
          const errorText = await response.text();
          
          // Don't retry on client errors (4xx) except 429 (rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new Error(`OpenRouter/Gemini image error ${response.status}: ${errorText}`);
          }
          
          // Retry on server errors (5xx) and rate limits (429)
          if (attempt < retries) {
            const delay = OPENROUTER_CONFIG.requests.retryDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`OpenRouter/Gemini image error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        const message = data.choices?.[0]?.message;
        
        if (!message) {
          throw new Error('No message in Gemini response');
        }
        
        // Gemini returns images in the 'images' field
        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
          const image = message.images[0];
          
          // Check for image_url.url (Gemini format)
          if (image.image_url?.url) {
            return image.image_url.url;
          }
          
          // Check for direct URL property
          if (image.url) {
            return image.url;
          }
          
          // Check for base64 data
          if (image.b64_json) {
            const mimeType = image.mime_type || 'image/png';
            return `data:${mimeType};base64,${image.b64_json}`;
          }
          
          // Check if image is a string URL
          if (typeof image === 'string') {
            return image;
          }
        }
        
        // Check for multimodal content array (Gemini's native format via OpenRouter)
        if (message.content && Array.isArray(message.content)) {
          for (const part of message.content) {
            // Check for image_url type with URL
            if (part.type === 'image_url' && part.image_url?.url) {
              return part.image_url.url;
            }
            // Check for inline_data with base64
            if (part.type === 'image' && part.image_url?.url) {
              return part.image_url.url;
            }
            // Check for base64 inline data (Gemini format)
            if (part.inline_data?.mime_type?.startsWith('image/')) {
              return `data:${part.inline_data.mime_type};base64,${part.inline_data.data}`;
            }
            // Check for text content that might contain a URL
            if (part.type === 'text' && part.text) {
              const urlMatch = part.text.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
              if (urlMatch) {
                return urlMatch[0];
              }
            }
          }
        }
        
        // Check if content is a string
        const content = typeof message.content === 'string' ? message.content : null;
        
        if (content) {
          // Try to extract URL from content if it's text with a URL
          const urlMatch = content.match(/https?:\/\/[^\s"'<>]+\.(png|jpg|jpeg|gif|webp)/i);
          if (urlMatch) {
            return urlMatch[0];
          }

          // If the content itself is base64 encoded image data
          if (content.includes('base64,')) {
            return content;
          }
        }

        throw new Error('No image found in Gemini response. Available fields: ' + Object.keys(message).join(', '));
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }
        
        // Retry on network errors or timeouts
        if (error instanceof Error && (
          error.message.includes('timeout') ||
          error.message.includes('network') ||
          error.message.includes('fetch')
        )) {
          const delay = OPENROUTER_CONFIG.requests.retryDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // Don't retry on other errors
        throw error;
      }
    }
    
    throw new Error('Failed to generate image after retries');
  }

  /**
   * Generate a realistic impressionist nature scene
   * 
   * @param _topic - Unused (kept for API compatibility)
   * @param _context - Unused (kept for API compatibility)
   * @param artStyle - Optional specific art style, or random if not specified
   */
  async generate(
    _topic?: string,
    _context?: string,
    artStyle?: ArtStyle
  ): Promise<GeneratedVisual> {
    // Select art style (random if not specified)
    const selectedStyle = artStyle || selectRandomArtStyle();
    
    const config: VisualPromptConfig = {
      topic: 'nature', // Fixed topic for impressionist nature scenes
      artStyle: selectedStyle,
    };

    const imagePrompt = buildImagePrompt(config);

    try {
      const imageUrl = await this.generateWithGemini(imagePrompt);

      return {
        imageUrl,
        artStyle: selectedStyle,
        prompt: imagePrompt,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Gemini image generation failed:', error);
      
      // Return empty URL - dashboard handles this gracefully with placeholder
      return {
        imageUrl: '',
        artStyle: selectedStyle,
        prompt: imagePrompt,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Get available art styles
   */
  getAvailableStyles(): { style: ArtStyle; description: string }[] {
    return ART_STYLES.map(style => ({
      style,
      description: VISUAL_COMPOSER_CONFIG.artStyles[style].description,
    }));
  }

  /**
   * Disconnect - no-op for OpenRouter (no persistent connection)
   */
  async disconnect(): Promise<void> {
    // No-op - OpenRouter uses HTTP, no persistent connection to close
  }
}

// Export singleton factory
let agentInstance: VisualComposerAgent | null = null;

export function getVisualComposerAgent(): VisualComposerAgent {
  if (!agentInstance) {
    agentInstance = new VisualComposerAgent();
  }
  return agentInstance;
}
