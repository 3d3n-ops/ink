/**
 * Visual Composer Agent
 * Uses FLUX via OpenRouter to generate abstract, artistic images
 * that complement the writing prompts.
 */

import { getOpenRouterClient } from '../client';
import { OPENROUTER_CONFIG, VISUAL_COMPOSER_CONFIG } from '../config';
import type { ArtStyle, GeneratedVisual, VisualPromptConfig } from '../types';

// All available art styles
const ART_STYLES: ArtStyle[] = [
  'minimalist-geometric',
  'surrealist-dreamscape',
  'abstract-expressionism',
  'contemporary-digital',
  'watercolor-impressionism',
  'bold-editorial',
  'neo-brutalism',
  'ethereal-gradient',
];

// Topic to mood/atmosphere mapping
const TOPIC_MOODS: Record<string, string[]> = {
  'technology': ['futuristic', 'cold blue', 'digital', 'circuit-like', 'neon'],
  'philosophy': ['contemplative', 'deep', 'infinite', 'cosmic', 'thoughtful'],
  'emotions': ['warm', 'turbulent', 'flowing', 'raw', 'visceral'],
  'society': ['interconnected', 'urban', 'dynamic', 'complex', 'textured'],
  'creativity': ['vibrant', 'explosive', 'colorful', 'dynamic', 'playful'],
  'spirituality': ['ethereal', 'luminous', 'peaceful', 'transcendent', 'golden'],
  'relationships': ['intimate', 'warm', 'intertwined', 'delicate', 'tender'],
  'business': ['structured', 'ambitious', 'bold', 'ascending', 'powerful'],
  'health': ['organic', 'vital', 'balanced', 'flowing', 'energetic'],
  'culture': ['rich', 'layered', 'diverse', 'textured', 'vibrant'],
  'default': ['abstract', 'thought-provoking', 'evocative', 'layered', 'intriguing'],
};

/**
 * Get mood keywords for a topic
 */
function getMoodForTopic(topic: string): string[] {
  const topicLower = topic.toLowerCase();
  
  for (const [key, moods] of Object.entries(TOPIC_MOODS)) {
    if (topicLower.includes(key)) {
      return moods;
    }
  }
  
  return TOPIC_MOODS.default;
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
 */
function buildImagePrompt(config: VisualPromptConfig): string {
  const styleConfig = VISUAL_COMPOSER_CONFIG.artStyles[config.artStyle];
  const moods = getMoodForTopic(config.topic);
  const selectedMoods = moods.slice(0, 3).join(', ');
  
  // Create an abstract prompt that captures the essence without being too literal
  const prompt = `Abstract artistic interpretation of the concept: "${config.topic}"

Style: ${styleConfig.description}
Mood: ${selectedMoods}
Artistic modifiers: ${styleConfig.modifiers}

Important:
- Create an ABSTRACT representation, not literal imagery
- Focus on evoking emotion and thought
- Use the art style consistently throughout
- High quality, professional artistic composition
- Suitable as a header image for an intellectual essay
- No text, no letters, no words in the image
- Clean composition with visual interest`;

  return prompt;
}

/**
 * Visual Composer Agent - generates abstract images for prompts
 */
export class VisualComposerAgent {
  private client = getOpenRouterClient();

  /**
   * Generate an abstract visual for a writing prompt
   */
  async generate(
    topic: string,
    hook: string,
    artStyle?: ArtStyle
  ): Promise<GeneratedVisual> {
    // Select art style (random if not specified)
    const selectedStyle = artStyle || selectRandomArtStyle();
    
    const config: VisualPromptConfig = {
      topic,
      hook,
      artStyle: selectedStyle,
      mood: getMoodForTopic(topic).join(', '),
    };

    const imagePrompt = buildImagePrompt(config);

    try {
      const response = await this.client.generateImage(imagePrompt, {
        model: OPENROUTER_CONFIG.models.visual,
        size: VISUAL_COMPOSER_CONFIG.size,
        n: 1,
      });

      const imageData = response.data[0];
      if (!imageData?.url) {
        throw new Error('No image URL in response');
      }

      return {
        imageUrl: imageData.url,
        artStyle: selectedStyle,
        prompt: imagePrompt,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Visual composer error:', error);
      
      // Try with fallback model
      return this.generateWithFallback(imagePrompt, selectedStyle);
    }
  }

  /**
   * Generate with fallback model
   */
  private async generateWithFallback(
    prompt: string,
    artStyle: ArtStyle
  ): Promise<GeneratedVisual> {
    try {
      const response = await this.client.generateImage(prompt, {
        model: OPENROUTER_CONFIG.fallbacks.visual,
        size: VISUAL_COMPOSER_CONFIG.size,
        n: 1,
      });

      const imageData = response.data[0];
      if (!imageData?.url) {
        throw new Error('No image URL in fallback response');
      }

      return {
        imageUrl: imageData.url,
        artStyle,
        prompt,
        generatedAt: new Date().toISOString(),
      };
    } catch (fallbackError) {
      console.error('Fallback visual generation failed:', fallbackError);
      
      // Return null image - prompt will display without visual
      return {
        imageUrl: '', // Empty - dashboard should handle gracefully
        artStyle,
        prompt,
        generatedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Generate multiple visuals in different styles
   */
  async generateVariations(
    topic: string,
    hook: string,
    count: number = 3
  ): Promise<GeneratedVisual[]> {
    // Select random unique styles
    const shuffled = [...ART_STYLES].sort(() => Math.random() - 0.5);
    const selectedStyles = shuffled.slice(0, Math.min(count, ART_STYLES.length));

    // Generate in parallel
    const results = await Promise.allSettled(
      selectedStyles.map(style => this.generate(topic, hook, style))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<GeneratedVisual> => r.status === 'fulfilled')
      .map(r => r.value);
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
}

// Export singleton factory
let agentInstance: VisualComposerAgent | null = null;

export function getVisualComposerAgent(): VisualComposerAgent {
  if (!agentInstance) {
    agentInstance = new VisualComposerAgent();
  }
  return agentInstance;
}

