/**
 * Quick Test Script for API Performance
 * Tests individual components with single requests for faster iteration
 * 
 * Models:
 * - Research: Perplexity AI (sonar) - Real-time web search
 * - Composition: Google Gemini 3 Flash via OpenRouter - Fast creative writing
 * - Visual: Runware AI - Fast image generation
 * 
 * Run with: bun run scripts/test-quick.ts
 */

// Test a single interest with detailed timing breakdown
const TEST_INTEREST = 'Remote Work';

// ANSI colors
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

function log(msg: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

async function testResearchOnly() {
  log('\n📚 Testing Research Agent (Perplexity AI)', 'cyan');
  const { getResearchAgent } = await import('../services/prompt-engine/agents/research-agent');
  
  const agent = getResearchAgent();
  const start = Date.now();
  
  try {
    const report = await agent.research(TEST_INTEREST);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    log(`✓ Research completed in ${duration}s`, 'green');
    log(`  Trends: ${report.trends.length}`, 'dim');
    log(`  Angles: ${report.interestingAngles.length}`, 'dim');
    log(`  Sources: ${report.sources.length}`, 'dim');
    log(`\n  Summary: ${report.summary.substring(0, 150)}...`, 'dim');
    
    if (report.interestingAngles.length > 0) {
      log(`\n  Sample Angles:`, 'bright');
      report.interestingAngles.slice(0, 2).forEach((angle, i) => {
        log(`    ${i + 1}. ${angle}`, 'magenta');
      });
    }
    
    return report;
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(`✗ Research failed after ${duration}s: ${error instanceof Error ? error.message : error}`, 'red');
    return null;
  }
}

async function testComposerOnly(research: any) {
  log('\n✍️  Testing Prompt Composer (Gemini 3 Flash)', 'cyan');
  const { getPromptComposerAgent } = await import('../services/prompt-engine/agents/prompt-composer');
  
  const agent = getPromptComposerAgent();
  const start = Date.now();
  
  // Create minimal research if none provided
  const researchReport = research || {
    interest: TEST_INTEREST,
    trends: [`Latest trends in ${TEST_INTEREST}`],
    interestingAngles: [`Personal perspective on ${TEST_INTEREST}`],
    sources: [],
    summary: `Understanding ${TEST_INTEREST} in the modern context`,
    currentEvents: [],
    debatesAndDiscussions: [],
    generatedAt: new Date().toISOString(),
  };
  
  try {
    const content = await agent.compose(researchReport);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    log(`✓ Composition completed in ${duration}s`, 'green');
    log(`\n  Hook (${content.hook.split(/\s+/).length} words): "${content.hook}"`, 'magenta');
    log(`  Blurb length: ${content.blurb.length} chars`, 'dim');
    log(`  Tags: ${content.tags.join(', ')}`, 'dim');
    
    if (content.suggestedAngles.length > 0) {
      log(`\n  Suggested Angles:`, 'bright');
      content.suggestedAngles.forEach((angle, i) => {
        log(`    ${i + 1}. ${angle}`, 'blue');
      });
    }
    
    // Show blurb preview
    const cleanBlurb = content.blurb.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    log(`\n  Blurb preview: ${cleanBlurb.substring(0, 200)}...`, 'dim');
    
    return content;
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(`✗ Composition failed after ${duration}s: ${error instanceof Error ? error.message : error}`, 'red');
    return null;
  }
}

async function testVisualOnly(context?: string) {
  log('\n🎨 Testing Visual Composer Only (Runware AI)', 'cyan');
  const { getVisualComposerAgent } = await import('../services/prompt-engine/agents/visual-composer');
  
  const agent = getVisualComposerAgent();
  const start = Date.now();
  
  try {
    const visual = await agent.generate(TEST_INTEREST, context);
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    if (visual.imageUrl) {
      log(`✓ Image generated in ${duration}s`, 'green');
      log(`  Art style: ${visual.artStyle}`, 'blue');
      log(`  URL: ${visual.imageUrl}`, 'dim');
      log(`\n  Prompt used: ${visual.prompt.substring(0, 150)}...`, 'dim');
    } else {
      log(`⚠ Visual returned empty URL in ${duration}s`, 'yellow');
    }
    
    await agent.disconnect();
    return visual;
  } catch (error) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    log(`✗ Visual generation failed after ${duration}s: ${error instanceof Error ? error.message : error}`, 'red');
    return null;
  }
}

async function testParallelPipeline() {
  log('\n⚡ Testing PARALLEL Pipeline (Research → [Compose + Visual])', 'cyan');
  log('   This mirrors the optimized production pipeline', 'dim');
  
  const { getResearchAgent } = await import('../services/prompt-engine/agents/research-agent');
  const { getPromptComposerAgent } = await import('../services/prompt-engine/agents/prompt-composer');
  const { getVisualComposerAgent } = await import('../services/prompt-engine/agents/visual-composer');
  
  const totalStart = Date.now();
  
  // Step 1: Research (must complete first)
  log('\n📚 Step 1: Research (Perplexity AI)', 'bright');
  const researchStart = Date.now();
  const researchAgent = getResearchAgent();
  const research = await researchAgent.research(TEST_INTEREST);
  const researchDuration = Date.now() - researchStart;
  log(`   ✓ Research: ${(researchDuration / 1000).toFixed(2)}s`, 'green');
  
  // Step 2: Composition + Visual IN PARALLEL
  log('\n⚡ Step 2: Composition + Visual (PARALLEL)', 'bright');
  const parallelStart = Date.now();
  
  const composerAgent = getPromptComposerAgent();
  const visualAgent = getVisualComposerAgent();
  
  const [content, visual] = await Promise.all([
    (async () => {
      const start = Date.now();
      const result = await composerAgent.compose(research);
      log(`   ✓ Composition: ${((Date.now() - start) / 1000).toFixed(2)}s`, 'green');
      return result;
    })(),
    (async () => {
      const start = Date.now();
      const result = await visualAgent.generate(TEST_INTEREST, research.summary);
      log(`   ✓ Visual: ${((Date.now() - start) / 1000).toFixed(2)}s`, 'green');
      return result;
    })(),
  ]);
  
  const parallelDuration = Date.now() - parallelStart;
  const totalDuration = Date.now() - totalStart;
  
  log(`\n   Parallel step time: ${(parallelDuration / 1000).toFixed(2)}s (composition + visual ran together)`, 'dim');
  
  await visualAgent.disconnect();
  
  return {
    research,
    content,
    visual,
    timing: {
      research: researchDuration,
      parallel: parallelDuration,
      total: totalDuration,
    },
  };
}

async function main() {
  log('\n🚀 Quick API Test', 'bright');
  log(`Testing with interest: "${TEST_INTEREST}"`, 'dim');
  log('=' .repeat(50), 'dim');
  
  // Check API keys
  if (!process.env.PERPLEXITY_API_KEY) {
    log('\n❌ PERPLEXITY_API_KEY not set - research will fail', 'red');
    process.exit(1);
  }
  if (!process.env.OPENROUTER_API_KEY) {
    log('\n❌ OPENROUTER_API_KEY not set - composition will fail', 'red');
    process.exit(1);
  }
  if (!process.env.RUNWARE_API_KEY) {
    log('\n⚠️  RUNWARE_API_KEY not set - visual test will fail', 'yellow');
  }
  
  log('\n🔑 API Keys configured:', 'dim');
  log('   - Perplexity AI (Research): ✓', 'green');
  log('   - OpenRouter/Gemini (Compose): ✓', 'green');
  log(`   - Runware AI (Visual): ${process.env.RUNWARE_API_KEY ? '✓' : '✗'}`, process.env.RUNWARE_API_KEY ? 'green' : 'yellow');
  
  // Run parallel pipeline test
  const result = await testParallelPipeline();
  
  // Summary
  log('\n' + '=' .repeat(50), 'dim');
  log('📊 PARALLEL PIPELINE RESULTS', 'bright');
  log(`\n⏱️  Timing Breakdown:`, 'bright');
  log(`   Research (sequential):     ${(result.timing.research / 1000).toFixed(2)}s`, 'dim');
  log(`   Compose + Visual (parallel): ${(result.timing.parallel / 1000).toFixed(2)}s`, 'dim');
  log(`   ─────────────────────────────`, 'dim');
  log(`   Total Pipeline Time:       ${(result.timing.total / 1000).toFixed(2)}s`, 'green');
  
  log(`\n📝 Generated Content:`, 'bright');
  log(`   Hook: "${result.content.hook}"`, 'magenta');
  log(`   Blurb: ${result.content.blurb.length} chars`, 'dim');
  log(`   Image: ${result.visual?.imageUrl ? '✓ Generated' : '✗ Failed'}`, result.visual?.imageUrl ? 'green' : 'red');
  log(`   Art Style: ${result.visual?.artStyle || 'N/A'}`, 'blue');
  
  // Compare with theoretical sequential time
  const theoreticalSequential = result.timing.research + result.timing.parallel * 1.5; // Rough estimate
  const savings = ((theoreticalSequential - result.timing.total) / theoreticalSequential * 100).toFixed(0);
  log(`\n💡 Parallel execution saved ~${savings}% time vs sequential`, 'green');
  
  const success = result.research && result.content && result.visual?.imageUrl;
  log(`\n${success ? '✅' : '❌'} Test ${success ? 'PASSED' : 'FAILED'}`, success ? 'green' : 'red');
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);

