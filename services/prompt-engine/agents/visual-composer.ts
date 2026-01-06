/**
 * Visual Composer Agent
 * Uses Runware AI to generate abstract, artistic images
 * that complement the writing prompts.
 */

import { Runware } from '@runware/sdk-js';
import { VISUAL_COMPOSER_CONFIG } from '../config';
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
 * Uses both topic and context (hook/summary) to create more relevant visuals
 */
function buildImagePrompt(config: VisualPromptConfig): string {
  const styleConfig = VISUAL_COMPOSER_CONFIG.artStyles[config.artStyle];
  const moods = getMoodForTopic(config.topic);
  const selectedMoods = moods.slice(0, 3).join(', ');
  
  // Extract key themes from context if provided (limit to first 100 chars for prompt efficiency)
  const contextHint = config.context 
    ? `. Inspired by: ${config.context.substring(0, 100)}` 
    : '';
  
  // Create an abstract prompt that captures the essence without being too literal
  const prompt = `Abstract artistic interpretation of the concept: "${config.topic}"${contextHint}. Style: ${styleConfig.description}. Mood: ${selectedMoods}. Artistic modifiers: ${styleConfig.modifiers}. Create an ABSTRACT representation, not literal imagery. Focus on evoking emotion and thought. High quality, professional artistic composition. Suitable as a header image for an intellectual essay. No text, no letters, no words in the image. Clean composition with visual interest.`;

  return prompt;
}

/**
 * Visual Composer Agent - generates abstract images for prompts using Runware AI
 */
export class VisualComposerAgent {
  private runware: InstanceType<typeof Runware> | null = null;
  private initializationPromise: Promise<InstanceType<typeof Runware>> | null = null;

  /**
   * Initialize Runware client with proper synchronization
   * Uses a promise-based lock to prevent race conditions when multiple
   * parallel pipelines call generate() simultaneously
   */
  private async getClient(): Promise<InstanceType<typeof Runware>> {
    // If already initialized, return immediately
    if (this.runware) {
      return this.runware;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization and store the promise so concurrent calls can wait on it
    this.initializationPromise = this.initializeClient();
    
    try {
      this.runware = await this.initializationPromise;
      return this.runware;
    } catch (error) {
      // Reset on failure so future calls can retry
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Internal initialization logic - only called once
   */
  private async initializeClient(): Promise<InstanceType<typeof Runware>> {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) {
      throw new Error('RUNWARE_API_KEY environment variable is required');
    }

    const client = new Runware({ apiKey });
    await client.ensureConnection();
    return client;
  }

  /**
   * Generate an abstract visual for a writing prompt using Runware AI
   * 
   * @param topic - The main topic/interest (e.g., "Artificial Intelligence")
   * @param context - Optional context like research summary or hook to influence the visual
   * @param artStyle - Optional specific art style, or random if not specified
   */
  async generate(
    topic: string,
    context?: string,
    artStyle?: ArtStyle
  ): Promise<GeneratedVisual> {
    // Select art style (random if not specified)
    const selectedStyle = artStyle || selectRandomArtStyle();
    
    const config: VisualPromptConfig = {
      topic,
      context,
      artStyle: selectedStyle,
      mood: getMoodForTopic(topic).join(', '),
    };

    const imagePrompt = buildImagePrompt(config);

    try {
      const runware = await this.getClient();
      
      // Generate image using Runware AI
      const images = await runware.imageInference({
        positivePrompt: imagePrompt,
        negativePrompt: 'text, letters, words, watermark, logo, signature, blurry, low quality, distorted',
        width: 1024,
        height: 1024,
        model: 'runware:100@1', // Runware's default model
        steps: 25,
        CFGScale: 7.5,
        outputType: 'URL',
        outputFormat: 'PNG',
        numberResults: 1,
      });

      const imageUrl = images?.[0]?.imageURL || '';

      return {
        imageUrl,
        artStyle: selectedStyle,
        prompt: imagePrompt,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Runware image generation failed:', error);
      
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
   * Disconnect from Runware (cleanup)
   */
  async disconnect(): Promise<void> {
    // Wait for any pending initialization before disconnecting
    if (this.initializationPromise) {
      try {
        await this.initializationPromise;
      } catch {
        // Ignore initialization errors during cleanup
      }
    }
    
    if (this.runware) {
      await this.runware.disconnect();
      this.runware = null;
    }
    
    this.initializationPromise = null;
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
