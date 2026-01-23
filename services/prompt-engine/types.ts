/**
 * Writing Prompt Recommendation Engine - Type Definitions
 */

// ============================================================================
// User & Preferences
// ============================================================================

export interface UserPreferences {
  id: string;
  userId: string;
  writingReason: string | null;
  interests: string[];
  writingLevel: string | null;
}

// ============================================================================
// Research Agent Types
// ============================================================================

export interface ResearchSource {
  title: string;
  url: string;
  snippet: string;
}

export interface ResearchReport {
  interest: string;
  trends: string[];
  interestingAngles: string[];
  sources: ResearchSource[];
  summary: string;
  currentEvents: string[];
  debatesAndDiscussions: string[];
  generatedAt: string;
}

// ============================================================================
// Prompt Composer Types
// ============================================================================

export interface PromptContent {
  hook: string;
  blurb: string;
  tags: string[];
  suggestedAngles: string[];
}

// ============================================================================
// Visual Composer Types
// ============================================================================

export type ArtStyle =
  | 'watercolor'
  | 'oil-paint'
  | 'acrylic';

export interface VisualPromptConfig {
  topic: string;
  context?: string;  // Optional context (research summary, hook, etc.) to influence the visual
  artStyle: ArtStyle;
  mood?: string;
}

export interface GeneratedVisual {
  imageUrl: string;
  artStyle: ArtStyle;
  prompt: string;
  generatedAt: string;
}

// ============================================================================
// Writing Prompt (Final Output)
// ============================================================================

export type PromptStatus = 'pending' | 'generating' | 'ready' | 'used' | 'dismissed' | 'failed';

export interface WritingPrompt {
  id: string;
  userId: string;
  
  // Content
  interest: string;
  hook: string;
  blurb: string;
  imageUrl: string | null;
  
  // Metadata
  tags: string[];
  suggestedAngles: string[];
  sources: ResearchSource[];
  artStyle: ArtStyle | null;
  
  // Status
  status: PromptStatus;
  usedAt: string | null;
  dismissedAt: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Job Types
// ============================================================================

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PromptGenerationJob {
  id: string;
  userId: string;
  
  // Job details
  selectedInterests: string[];
  status: JobStatus;
  error: string | null;
  
  // Progress tracking
  researchCompleted: number;
  compositionCompleted: number;
  visualsCompleted: number;
  
  // Timestamps
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface JobProgress {
  total: number;
  completed: number;
  stage: 'research' | 'composition' | 'visuals' | 'done';
  currentInterest?: string;
}

// ============================================================================
// Pipeline Types
// ============================================================================

export interface PipelineResult {
  interest: string;
  research: ResearchReport;
  content: PromptContent;
  visual: GeneratedVisual | null;
  success: boolean;
  error?: string;
}

export interface PipelineInput {
  userId: string;
  interest: string;
  jobId: string;
}

// ============================================================================
// OpenRouter Types
// ============================================================================

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: OpenRouterToolCall[];
  tool_call_id?: string;
}

export interface OpenRouterToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface OpenRouterTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface OpenRouterChatRequest {
  model: string;
  messages: OpenRouterMessage[];
  tools?: OpenRouterTool[];
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

export interface OpenRouterChatResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: OpenRouterMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenRouterImageRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  response_format?: 'url' | 'b64_json';
}

export interface OpenRouterImageResponse {
  created: number;
  data: {
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }[];
}

// ============================================================================
// API Response Types
// ============================================================================

export interface GeneratePromptsResponse {
  success: boolean;
  jobId: string;
  message: string;
}

export interface GetPromptsResponse {
  prompts: WritingPrompt[];
  hasMore: boolean;
}

export interface GetJobStatusResponse {
  job: PromptGenerationJob;
  progress: JobProgress;
}

export interface UsePromptResponse {
  success: boolean;
  prompt: WritingPrompt;
  editorData: {
    title: string;
    blurb: string;
    imageUrl: string | null;
    tags: string[];
  };
}

