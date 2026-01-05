/**
 * Writing Prompt Recommendation Engine
 * 
 * Main entry point for the prompt generation microservice.
 * 
 * Usage:
 *   import { getPromptOrchestrator, getResearchAgent, ... } from '@/services/prompt-engine';
 * 
 * Architecture:
 *   See ARCHITECTURE.md for full documentation
 */

// Orchestrator - main entry point
export { getPromptOrchestrator, PromptOrchestrator } from './orchestrator';

// Agents
export { getResearchAgent, ResearchAgent } from './agents/research-agent';
export { getPromptComposerAgent, PromptComposerAgent } from './agents/prompt-composer';
export { getVisualComposerAgent, VisualComposerAgent } from './agents/visual-composer';

// OpenRouter client
export { getOpenRouterClient, OpenRouterClient } from './client';

// Repository
export * as repository from './repository';

// Configuration
export * from './config';

// Types
export * from './types';

