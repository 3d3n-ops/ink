/**
 * Test Script for Recommendation Engine
 * Tests the full pipeline: Research -> Compose -> Visual
 * 
 * Run with: bun run scripts/test-recommendation-engine.ts
 * 
 * Required environment variables:
 * - OPENROUTER_API_KEY: API key for OpenRouter (text generation)
 * - RUNWARE_API_KEY: API key for Runware (image generation)
 */

import { getResearchAgent } from '../services/prompt-engine/agents/research-agent';
import { getPromptComposerAgent } from '../services/prompt-engine/agents/prompt-composer';
import { getVisualComposerAgent } from '../services/prompt-engine/agents/visual-composer';

// Test interests (user preferences)
const TEST_INTERESTS = [
  'Artificial Intelligence',
  'Climate Change',
  'Personal Finance',
];

// ANSI color codes for pretty console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTiming(label: string, ms: number) {
  const seconds = (ms / 1000).toFixed(2);
  const color = ms < 2000 ? 'green' : ms < 5000 ? 'yellow' : 'red';
  log(`⏱️  ${label}: ${seconds}s`, color);
}

interface TestResult {
  interest: string;
  research: {
    success: boolean;
    durationMs: number;
    trendsCount: number;
    anglesCount: number;
    sourcesCount: number;
    summary: string;
  };
  composition: {
    success: boolean;
    durationMs: number;
    hook: string;
    hookWordCount: number;
    blurbLength: number;
    tagsCount: number;
  };
  visual: {
    success: boolean;
    durationMs: number;
    imageUrl: string;
    artStyle: string;
  };
  totalDurationMs: number;
}

async function testResearchAgent(interest: string): Promise<TestResult['research']> {
  const agent = getResearchAgent();
  const start = Date.now();
  
  try {
    const report = await agent.research(interest);
    const durationMs = Date.now() - start;
    
    return {
      success: true,
      durationMs,
      trendsCount: report.trends.length,
      anglesCount: report.interestingAngles.length,
      sourcesCount: report.sources.length,
      summary: report.summary,
    };
  } catch (error) {
    return {
      success: false,
      durationMs: Date.now() - start,
      trendsCount: 0,
      anglesCount: 0,
      sourcesCount: 0,
      summary: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function testComposerAgent(interest: string, research: any): Promise<TestResult['composition']> {
  const agent = getPromptComposerAgent();
  const start = Date.now();
  
  try {
    // Create minimal research report for testing if needed
    const researchReport = research || {
      interest,
      trends: [`Exploring ${interest}`],
      interestingAngles: [`Personal perspective on ${interest}`],
      sources: [],
      summary: `Understanding ${interest}`,
      currentEvents: [],
      debatesAndDiscussions: [],
      generatedAt: new Date().toISOString(),
    };
    
    const content = await agent.compose(researchReport);
    const durationMs = Date.now() - start;
    
    return {
      success: true,
      durationMs,
      hook: content.hook,
      hookWordCount: content.hook.split(/\s+/).length,
      blurbLength: content.blurb.length,
      tagsCount: content.tags.length,
    };
  } catch (error) {
    return {
      success: false,
      durationMs: Date.now() - start,
      hook: '',
      hookWordCount: 0,
      blurbLength: 0,
      tagsCount: 0,
    };
  }
}

async function testVisualAgent(interest: string, context?: string): Promise<TestResult['visual']> {
  const agent = getVisualComposerAgent();
  const start = Date.now();
  
  try {
    const visual = await agent.generate(interest, context);
    const durationMs = Date.now() - start;
    
    return {
      success: !!visual.imageUrl,
      durationMs,
      imageUrl: visual.imageUrl,
      artStyle: visual.artStyle,
    };
  } catch (error) {
    return {
      success: false,
      durationMs: Date.now() - start,
      imageUrl: '',
      artStyle: '',
    };
  }
}

async function runFullPipelineTest(interest: string): Promise<TestResult> {
  logSection(`Testing: ${interest}`);
  const totalStart = Date.now();
  
  // Step 1: Research
  log('\n📚 Step 1: Research Agent', 'cyan');
  const research = await testResearchAgent(interest);
  logTiming('Research', research.durationMs);
  
  if (research.success) {
    log(`   ✓ Found ${research.trendsCount} trends, ${research.anglesCount} angles, ${research.sourcesCount} sources`, 'green');
    log(`   Summary: ${research.summary.substring(0, 100)}...`, 'dim');
  } else {
    log(`   ✗ Research failed: ${research.summary}`, 'red');
  }
  
  // Step 2: Composition
  log('\n✍️  Step 2: Prompt Composer', 'cyan');
  const composition = await testComposerAgent(interest, research.success ? {
    interest,
    trends: [],
    interestingAngles: [],
    sources: [],
    summary: research.summary,
    currentEvents: [],
    debatesAndDiscussions: [],
    generatedAt: new Date().toISOString(),
  } : null);
  logTiming('Composition', composition.durationMs);
  
  if (composition.success) {
    log(`   ✓ Hook (${composition.hookWordCount} words): "${composition.hook}"`, 'green');
    log(`   ✓ Blurb: ${composition.blurbLength} chars, ${composition.tagsCount} tags`, 'green');
  } else {
    log(`   ✗ Composition failed`, 'red');
  }
  
  // Step 3: Visual Generation
  log('\n🎨 Step 3: Visual Composer (Runware AI)', 'cyan');
  const visual = await testVisualAgent(interest, composition.hook || `Exploring ${interest}`);
  logTiming('Visual Generation', visual.durationMs);
  
  if (visual.success) {
    log(`   ✓ Image generated: ${visual.artStyle} style`, 'green');
    log(`   ✓ URL: ${visual.imageUrl.substring(0, 80)}...`, 'dim');
  } else {
    log(`   ✗ Visual generation failed (returned empty URL)`, 'yellow');
  }
  
  const totalDurationMs = Date.now() - totalStart;
  logTiming('\n📊 Total Pipeline Time', totalDurationMs);
  
  return {
    interest,
    research,
    composition,
    visual,
    totalDurationMs,
  };
}

function printCreativityAnalysis(results: TestResult[]) {
  logSection('🎭 Creativity & Uniqueness Analysis');
  
  const hooks = results.map(r => r.composition.hook).filter(Boolean);
  const uniqueHooks = new Set(hooks);
  
  log('\n📝 Hooks Generated:', 'bright');
  hooks.forEach((hook, i) => {
    log(`   ${i + 1}. "${hook}"`, 'magenta');
  });
  
  log(`\n   Uniqueness: ${uniqueHooks.size}/${hooks.length} unique hooks`, uniqueHooks.size === hooks.length ? 'green' : 'yellow');
  
  // Analyze hook styles
  const questionHooks = hooks.filter(h => h.includes('?')).length;
  const shortHooks = hooks.filter(h => h.split(/\s+/).length <= 10).length;
  
  log('\n📊 Hook Style Analysis:', 'bright');
  log(`   Questions: ${questionHooks}/${hooks.length}`, 'dim');
  log(`   Concise (≤10 words): ${shortHooks}/${hooks.length}`, 'dim');
  
  // Art styles used
  const artStyles = results.map(r => r.visual.artStyle).filter(Boolean);
  const uniqueStyles = new Set(artStyles);
  
  log('\n🎨 Art Styles Used:', 'bright');
  artStyles.forEach((style, i) => {
    log(`   ${i + 1}. ${style}`, 'blue');
  });
  log(`   Diversity: ${uniqueStyles.size}/${artStyles.length} unique styles`, uniqueStyles.size >= Math.ceil(artStyles.length * 0.6) ? 'green' : 'yellow');
}

function printSummary(results: TestResult[]) {
  logSection('📈 Summary Report');
  
  const successful = results.filter(r => r.research.success && r.composition.success);
  const imagesGenerated = results.filter(r => r.visual.success).length;
  
  log('\n✅ Success Rate:', 'bright');
  log(`   Research: ${results.filter(r => r.research.success).length}/${results.length}`, 'dim');
  log(`   Composition: ${results.filter(r => r.composition.success).length}/${results.length}`, 'dim');
  log(`   Visual: ${imagesGenerated}/${results.length}`, 'dim');
  log(`   Full Pipeline: ${successful.length}/${results.length}`, successful.length === results.length ? 'green' : 'yellow');
  
  log('\n⏱️  Average Timing:', 'bright');
  const avgResearch = results.reduce((sum, r) => sum + r.research.durationMs, 0) / results.length;
  const avgComposition = results.reduce((sum, r) => sum + r.composition.durationMs, 0) / results.length;
  const avgVisual = results.reduce((sum, r) => sum + r.visual.durationMs, 0) / results.length;
  const avgTotal = results.reduce((sum, r) => sum + r.totalDurationMs, 0) / results.length;
  
  log(`   Research: ${(avgResearch / 1000).toFixed(2)}s`, avgResearch < 5000 ? 'green' : 'yellow');
  log(`   Composition: ${(avgComposition / 1000).toFixed(2)}s`, avgComposition < 5000 ? 'green' : 'yellow');
  log(`   Visual: ${(avgVisual / 1000).toFixed(2)}s`, avgVisual < 10000 ? 'green' : 'yellow');
  log(`   Total (avg): ${(avgTotal / 1000).toFixed(2)}s`, avgTotal < 20000 ? 'green' : 'yellow');
  
  log('\n📦 Content Quality:', 'bright');
  const avgHookWords = results.reduce((sum, r) => sum + r.composition.hookWordCount, 0) / results.length;
  const avgBlurbLength = results.reduce((sum, r) => sum + r.composition.blurbLength, 0) / results.length;
  
  log(`   Avg hook length: ${avgHookWords.toFixed(1)} words (target: 8-18)`, avgHookWords >= 8 && avgHookWords <= 18 ? 'green' : 'yellow');
  log(`   Avg blurb length: ${Math.round(avgBlurbLength)} chars`, avgBlurbLength > 200 ? 'green' : 'yellow');
}

async function runParallelPipelineTest(interest: string): Promise<TestResult> {
  const totalStart = Date.now();
  
  // Step 1: Research (must complete first)
  const research = await testResearchAgent(interest);
  
  // Step 2: Composition + Visual in PARALLEL
  const parallelStart = Date.now();
  const [composition, visual] = await Promise.all([
    testComposerAgent(interest, research.success ? {
      interest,
      trends: [],
      interestingAngles: [],
      sources: [],
      summary: research.summary,
      currentEvents: [],
      debatesAndDiscussions: [],
      generatedAt: new Date().toISOString(),
    } : null),
    testVisualAgent(interest, `Exploring ${interest}`),
  ]);
  
  const totalDurationMs = Date.now() - totalStart;
  
  return {
    interest,
    research,
    composition,
    visual,
    totalDurationMs,
  };
}

async function main() {
  console.log('\n');
  log('🚀 INK Recommendation Engine Test Suite', 'bright');
  log('=========================================', 'bright');
  
  // Check for required API keys
  if (!process.env.PERPLEXITY_API_KEY) {
    log('\n❌ Error: PERPLEXITY_API_KEY environment variable is required', 'red');
    process.exit(1);
  }
  
  if (!process.env.OPENROUTER_API_KEY) {
    log('\n❌ Error: OPENROUTER_API_KEY environment variable is required', 'red');
    process.exit(1);
  }
  
  if (!process.env.RUNWARE_API_KEY) {
    log('\n⚠️  Warning: RUNWARE_API_KEY not set - image generation will fail', 'yellow');
  }
  
  log(`\nTesting with ${TEST_INTERESTS.length} interests: ${TEST_INTERESTS.join(', ')}`, 'dim');
  log('Mode: FULLY PARALLEL (all interests + compose/visual run concurrently)\n', 'cyan');
  
  const overallStart = Date.now();
  
  // Run ALL interests in parallel (like production orchestrator)
  log('⚡ Running all pipelines in parallel...', 'bright');
  const results = await Promise.all(
    TEST_INTERESTS.map(interest => runParallelPipelineTest(interest))
  );
  
  const overallDuration = Date.now() - overallStart;
  
  // Print individual results
  for (const result of results) {
    logSection(`Results: ${result.interest}`);
    log(`   Research: ${result.research.success ? '✓' : '✗'} (${(result.research.durationMs / 1000).toFixed(2)}s)`, result.research.success ? 'green' : 'red');
    log(`   Composition: ${result.composition.success ? '✓' : '✗'} (${(result.composition.durationMs / 1000).toFixed(2)}s)`, result.composition.success ? 'green' : 'red');
    log(`   Visual: ${result.visual.success ? '✓' : '✗'} (${(result.visual.durationMs / 1000).toFixed(2)}s)`, result.visual.success ? 'green' : 'red');
    if (result.composition.hook) {
      log(`   Hook: "${result.composition.hook}"`, 'magenta');
    }
  }
  
  // Print creativity analysis
  printCreativityAnalysis(results);
  
  // Print summary with parallel timing
  printSummary(results);
  
  // Overall parallel timing
  logSection('⚡ PARALLEL EXECUTION SUMMARY');
  log(`\n   Total wall-clock time for ${TEST_INTERESTS.length} prompts: ${(overallDuration / 1000).toFixed(2)}s`, 'green');
  
  const sumSequential = results.reduce((sum, r) => sum + r.totalDurationMs, 0);
  const parallelSavings = ((sumSequential - overallDuration) / sumSequential * 100).toFixed(0);
  log(`   Sequential would have taken: ${(sumSequential / 1000).toFixed(2)}s`, 'dim');
  log(`   Parallel saved: ${parallelSavings}% time`, 'green');
  log(`   Avg per prompt: ${(overallDuration / TEST_INTERESTS.length / 1000).toFixed(2)}s`, 'dim');
  
  // Cleanup
  const visualAgent = getVisualComposerAgent();
  await visualAgent.disconnect();
  
  log('\n✅ Test suite completed!\n', 'green');
  
  // Exit with error if any pipeline failed
  const allSuccessful = results.every(r => r.research.success && r.composition.success);
  process.exit(allSuccessful ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

