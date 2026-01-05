# Writing Prompt Recommendation Engine - Architecture Design

## Overview

The Writing Prompt Recommendation Engine is a microservice that generates personalized writing prompts based on user interests. It operates as a background job triggered after user onboarding, using AI agents to research topics, compose compelling hooks, and generate abstract visual art.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROMPT RECOMMENDATION ENGINE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────────────────────────────────────────────┐  │
│  │  Onboarding  │────▶│                  JOB ORCHESTRATOR                     │  │
│  │  Completion  │     │  - Receives user preferences                          │  │
│  └──────────────┘     │  - Selects 3 random interests                         │  │
│                       │  - Spawns parallel agent tasks                        │  │
│                       └──────────────────┬───────────────────────────────────┘  │
│                                          │                                       │
│                    ┌─────────────────────┼─────────────────────┐                │
│                    │                     │                     │                │
│                    ▼                     ▼                     ▼                │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │   RESEARCH AGENT    │  │   RESEARCH AGENT    │  │   RESEARCH AGENT    │     │
│  │   (Claude + Web)    │  │   (Claude + Web)    │  │   (Claude + Web)    │     │
│  │   Interest #1       │  │   Interest #2       │  │   Interest #3       │     │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘     │
│             │                        │                        │                 │
│             ▼                        ▼                        ▼                 │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │   PROMPT COMPOSER   │  │   PROMPT COMPOSER   │  │   PROMPT COMPOSER   │     │
│  │   (GPT-5)           │  │   (GPT-5)           │  │   (GPT-5)           │     │
│  │   Hook + Blurb      │  │   Hook + Blurb      │  │   Hook + Blurb      │     │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘     │
│             │                        │                        │                 │
│             │                        │                        │                 │
│  ┌──────────┴──────────┐  ┌──────────┴──────────┐  ┌──────────┴──────────┐     │
│  │   VISUAL COMPOSER   │  │   VISUAL COMPOSER   │  │   VISUAL COMPOSER   │     │
│  │   (FLUX.1 Pro)      │  │   (FLUX.1 Pro)      │  │   (FLUX.1 Pro)      │     │
│  │   Abstract Art      │  │   Abstract Art      │  │   Abstract Art      │     │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘     │
│             │                        │                        │                 │
│             └────────────────────────┼────────────────────────┘                 │
│                                      │                                          │
│                                      ▼                                          │
│                       ┌──────────────────────────┐                              │
│                       │    PROMPT REPOSITORY     │                              │
│                       │    (Database Storage)    │                              │
│                       └──────────────────────────┘                              │
│                                      │                                          │
└──────────────────────────────────────┼──────────────────────────────────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │        DASHBOARD         │
                         │   (Displays Prompts)     │
                         └──────────────────────────┘
```

## Component Details

### 1. Job Orchestrator
**Location:** `services/prompt-engine/orchestrator.ts`

Responsibilities:
- Triggered immediately after onboarding completion
- Fetches user preferences from database
- Randomly selects 3 interests from user's chosen topics
- Spawns parallel agent workflows for each interest
- Manages job state (pending, processing, completed, failed)
- Handles retries and error recovery

### 2. Research Agent (Claude with Web Search)
**Location:** `services/prompt-engine/agents/research-agent.ts`

Model: `anthropic/claude-sonnet-4` via OpenRouter (supports web search tool)

Responsibilities:
- Receives an interest topic
- Uses Claude's web search tool to find:
  - Current trends in that space
  - Recent news and happenings
  - Interesting debates or discussions
  - Notable figures or movements
- Returns a structured research report with:
  - Key trends (array)
  - Interesting angles (array)
  - Source URLs (array)
  - Summary paragraph

### 3. Prompt Composer Agent (GPT-5)
**Location:** `services/prompt-engine/agents/prompt-composer.ts`

Model: `openai/gpt-5` via OpenRouter

Responsibilities:
- Receives research report from Research Agent
- Generates a two-part blurb:
  1. **Hook**: A compelling, Substack/NYT-quality headline (10-15 words)
  2. **Blurb**: 2-3 paragraph exploration piece with:
     - Provocative arguments
     - Thought-provoking questions
     - Embedded links to sources
     - Personal angle suggestions

Output format:
```typescript
{
  hook: string;           // The compelling headline
  blurb: string;          // HTML-formatted exploration piece
  tags: string[];         // Topic tags for categorization
  suggestedAngles: string[]; // Different ways to approach the topic
}
```

### 4. Visual Prompt Composer Agent (FLUX)
**Location:** `services/prompt-engine/agents/visual-composer.ts`

Model: `black-forest-labs/flux-1.1-pro` via OpenRouter

Responsibilities:
- Receives the hook and topic context
- Generates an abstract, artistic image that:
  - Captures the essence of the topic
  - Uses a randomly selected art style
  - Is visually striking and thought-provoking
- Art styles rotation:
  - Minimalist geometric
  - Surrealist dreamscape
  - Abstract expressionism
  - Contemporary digital art
  - Watercolor impressionism
  - Bold editorial illustration

### 5. Prompt Repository
**Location:** `services/prompt-engine/repository.ts`

Database tables needed:
- `WritingPrompt` - Stores generated prompts
- `PromptGenerationJob` - Tracks job status

## Database Schema Additions

```sql
-- Writing prompts generated for users
CREATE TABLE WritingPrompt (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  
  -- Content
  interest TEXT NOT NULL,
  hook TEXT NOT NULL,
  blurb TEXT NOT NULL,
  imageUrl TEXT,
  
  -- Metadata
  tags TEXT, -- JSON array
  suggestedAngles TEXT, -- JSON array
  sources TEXT, -- JSON array of URLs
  artStyle TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, ready, used, dismissed
  usedAt DATETIME,
  dismissedAt DATETIME,
  
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- Job tracking for prompt generation
CREATE TABLE PromptGenerationJob (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  
  -- Job details
  selectedInterests TEXT NOT NULL, -- JSON array of 3 interests
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  error TEXT,
  
  -- Progress tracking
  researchCompleted INTEGER DEFAULT 0,
  compositionCompleted INTEGER DEFAULT 0,
  visualsCompleted INTEGER DEFAULT 0,
  
  startedAt DATETIME,
  completedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

CREATE INDEX idx_writing_prompt_user ON WritingPrompt(userId);
CREATE INDEX idx_writing_prompt_status ON WritingPrompt(status);
CREATE INDEX idx_prompt_job_user ON PromptGenerationJob(userId);
CREATE INDEX idx_prompt_job_status ON PromptGenerationJob(status);
```

## API Endpoints

### Internal (Microservice)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prompts/generate` | POST | Triggers prompt generation for a user |
| `/api/prompts/job/:jobId` | GET | Gets job status |
| `/api/prompts/job/:jobId/cancel` | POST | Cancels a running job |

### External (Dashboard)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prompts` | GET | Gets all ready prompts for current user |
| `/api/prompts/:id` | GET | Gets a specific prompt with full details |
| `/api/prompts/:id/use` | POST | Marks prompt as used, returns data for editor |
| `/api/prompts/:id/dismiss` | POST | Dismisses a prompt |
| `/api/prompts/refresh` | POST | Requests new prompts (regeneration) |

## OpenRouter Configuration

```typescript
// services/prompt-engine/config.ts
export const OPENROUTER_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  models: {
    research: 'anthropic/claude-sonnet-4',      // Web search capable
    composer: 'openai/gpt-5',                    // Best at creative writing
    visual: 'black-forest-labs/flux-1.1-pro',   // High-quality image gen
  },
  // Fallback models if primary unavailable
  fallbacks: {
    research: 'anthropic/claude-3.5-sonnet',
    composer: 'openai/gpt-4-turbo',
    visual: 'black-forest-labs/flux-schnell',
  }
};
```

## Flow Sequence

```
1. User completes onboarding (page 8)
   └─▶ Frontend calls POST /api/prompts/generate

2. Orchestrator receives request
   ├─▶ Fetches user preferences from DB
   ├─▶ Randomly selects 3 interests
   ├─▶ Creates PromptGenerationJob record
   └─▶ Spawns 3 parallel pipelines

3. For each interest (parallel):
   a. Research Agent
      ├─▶ Calls Claude via OpenRouter with web search
      ├─▶ Parses and structures research findings
      └─▶ Returns ResearchReport

   b. Prompt Composer
      ├─▶ Receives ResearchReport
      ├─▶ Calls GPT-5 via OpenRouter
      └─▶ Returns PromptContent (hook + blurb)

   c. Visual Composer
      ├─▶ Receives topic + hook
      ├─▶ Selects random art style
      ├─▶ Calls FLUX via OpenRouter
      └─▶ Returns image URL

4. Orchestrator aggregates results
   ├─▶ Creates 3 WritingPrompt records
   ├─▶ Updates job status to 'completed'
   └─▶ Prompts now visible on dashboard

5. Dashboard polls /api/prompts
   └─▶ Displays ready prompts with images and hooks
```

## Error Handling Strategy

1. **Retry Logic**: Each agent call retries up to 3 times with exponential backoff
2. **Partial Success**: If 2/3 prompts succeed, still show those to user
3. **Fallback Models**: If primary model fails, use fallback model
4. **Graceful Degradation**: If image gen fails, show prompt without image
5. **Job Recovery**: Failed jobs can be retried from last successful step

## Performance Considerations

1. **Parallel Execution**: All 3 interest pipelines run simultaneously
2. **Streaming**: Consider streaming responses for faster perceived performance
3. **Caching**: Cache research results for similar topics (TTL: 6 hours)
4. **Rate Limiting**: Respect OpenRouter rate limits, queue excess requests
5. **Image Optimization**: Store images in CDN, serve optimized sizes

## Environment Variables Required

```bash
# OpenRouter
OPENROUTER_API_KEY=sk-or-...

# Optional: Specific model overrides
OPENROUTER_RESEARCH_MODEL=anthropic/claude-sonnet-4
OPENROUTER_COMPOSER_MODEL=openai/gpt-5
OPENROUTER_VISUAL_MODEL=black-forest-labs/flux-1.1-pro

# Image storage (for generated images)
CLOUDINARY_URL=... # or S3, etc.
```

## File Structure

```
services/
└── prompt-engine/
    ├── ARCHITECTURE.md          # This file
    ├── config.ts                # Configuration constants
    ├── types.ts                 # TypeScript interfaces
    ├── client.ts                # OpenRouter API client
    ├── orchestrator.ts          # Job orchestration
    ├── repository.ts            # Database operations
    ├── agents/
    │   ├── research-agent.ts    # Claude web search agent
    │   ├── prompt-composer.ts   # GPT-5 composition agent
    │   └── visual-composer.ts   # FLUX image generation agent
    └── utils/
        ├── retry.ts             # Retry logic utilities
        └── art-styles.ts        # Art style definitions

app/
└── api/
    └── prompts/
        ├── route.ts             # GET prompts, POST generate
        ├── [id]/
        │   ├── route.ts         # GET specific prompt
        │   ├── use/
        │   │   └── route.ts     # POST mark as used
        │   └── dismiss/
        │       └── route.ts     # POST dismiss prompt
        └── job/
            └── [jobId]/
                └── route.ts     # GET job status
```

## Next Steps

1. Create database migration for new tables
2. Implement OpenRouter client with proper typing
3. Build Research Agent with Claude web search
4. Build Prompt Composer with GPT-5
5. Build Visual Composer with FLUX
6. Create Job Orchestrator
7. Build API routes
8. Update dashboard to consume prompts
9. Build slideshow animation component
10. Connect to editor with pre-filled title

