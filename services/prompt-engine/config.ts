/**
 * Writing Prompt Recommendation Engine - Configuration
 */

export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  
  models: {
    // Claude Sonnet 4 - Best for research with web search capabilities
    research: process.env.OPENROUTER_RESEARCH_MODEL || 'anthropic/claude-sonnet-4',
    
    // GPT-5 - Superior creative writing and hook composition
    composer: process.env.OPENROUTER_COMPOSER_MODEL || 'openai/gpt-5',
    
    // FLUX 1.1 Pro - High-quality artistic image generation
    visual: process.env.OPENROUTER_VISUAL_MODEL || 'black-forest-labs/flux-1.1-pro',
  },
  
  // Fallback models if primary unavailable
  fallbacks: {
    research: 'anthropic/claude-3.5-sonnet',
    composer: 'openai/gpt-4-turbo',
    visual: 'black-forest-labs/flux-schnell',
  },
  
  // Request configuration
  requests: {
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 60000,
  },
} as const;

// Agent-specific configurations
export const RESEARCH_AGENT_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
  
  // Web search configuration for Claude
  webSearchEnabled: true,
  maxSearchResults: 5,
} as const;

export const PROMPT_COMPOSER_CONFIG = {
  maxTokens: 2048,
  temperature: 0.85, // Higher for more creative hooks
  
  // Hook requirements
  hook: {
    minWords: 8,
    maxWords: 18,
    styles: [
      'provocative-question',
      'bold-statement',
      'counterintuitive-insight',
      'timely-observation',
      'personal-confession',
    ],
  },
  
  // Blurb requirements
  blurb: {
    minParagraphs: 2,
    maxParagraphs: 3,
    includeLinks: true,
    toneOptions: ['thoughtful', 'urgent', 'exploratory', 'skeptical', 'hopeful'],
  },
} as const;

export const VISUAL_COMPOSER_CONFIG = {
  // Image dimensions
  size: '1024x1024',
  
  // Art styles with descriptions for FLUX
  artStyles: {
    'minimalist-geometric': {
      description: 'Clean lines, simple shapes, limited color palette, lots of negative space',
      modifiers: 'minimalist, geometric, clean, modern, bauhaus inspired',
    },
    'surrealist-dreamscape': {
      description: 'Dream-like imagery, unexpected juxtapositions, melting forms',
      modifiers: 'surrealist, dreamlike, dali inspired, ethereal, impossible geometry',
    },
    'abstract-expressionism': {
      description: 'Bold brushstrokes, emotional intensity, non-representational',
      modifiers: 'abstract expressionist, bold strokes, raw emotion, kandinsky inspired',
    },
    'contemporary-digital': {
      description: 'Modern digital art, gradients, glitch aesthetics, neon accents',
      modifiers: 'digital art, contemporary, glitch, neon, cyberpunk influenced',
    },
    'watercolor-impressionism': {
      description: 'Soft edges, flowing colors, light and atmosphere focused',
      modifiers: 'watercolor, impressionist, soft, dreamy, monet inspired',
    },
    'bold-editorial': {
      description: 'Magazine-style, high contrast, typography-friendly, graphic',
      modifiers: 'editorial illustration, bold, graphic, high contrast, magazine style',
    },
    'neo-brutalism': {
      description: 'Raw, unpolished, bold colors, chunky shapes, anti-minimalist',
      modifiers: 'neo-brutalist, raw, bold colors, chunky, unconventional',
    },
    'ethereal-gradient': {
      description: 'Soft gradients, celestial themes, peaceful, contemplative',
      modifiers: 'gradient, ethereal, celestial, peaceful, aurora-like, flowing',
    },
  },
} as const;

// Job configuration
export const JOB_CONFIG = {
  // Number of interests to select for each generation
  interestsPerGeneration: 3,
  
  // Maximum concurrent pipelines
  maxConcurrentPipelines: 3,
  
  // Timeout for entire job (ms)
  jobTimeoutMs: 180000, // 3 minutes
  
  // Cache TTL for research results (ms)
  researchCacheTtlMs: 6 * 60 * 60 * 1000, // 6 hours
} as const;

// Rate limiting
export const RATE_LIMIT_CONFIG = {
  // Max requests per minute per user
  userRateLimit: 10,
  
  // Max concurrent jobs per user
  maxConcurrentJobsPerUser: 1,
  
  // Cooldown between regeneration requests (ms)
  regenerationCooldownMs: 5 * 60 * 1000, // 5 minutes
} as const;

// Export type for art style keys
export type ArtStyleKey = keyof typeof VISUAL_COMPOSER_CONFIG.artStyles;

