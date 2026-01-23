/**
 * Test Script for Nature Image Generation
 * Generates impressionist-style nature scenes and saves them locally
 * 
 * Run with: bun run scripts/test-nature-images.ts
 * 
 * Required environment variables:
 * - RUNWARE_API_KEY: API key for Runware (image generation)
 */

import { getVisualComposerAgent } from '../services/prompt-engine/agents/visual-composer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

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

// Art styles to test
const ART_STYLES = ['watercolor', 'oil-paint', 'acrylic'] as const;

// Output directory for generated images
const OUTPUT_DIR = join(process.cwd(), 'generated-images');

interface GenerationResult {
  style: string;
  success: boolean;
  imageUrl: string;
  prompt: string;
  localPath: string;
  durationMs: number;
  error?: string;
}

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await writeFile(filepath, Buffer.from(arrayBuffer));
}

async function generateAndSave(style: typeof ART_STYLES[number]): Promise<GenerationResult> {
  const agent = getVisualComposerAgent();
  const start = Date.now();
  
  try {
    log(`\n🎨 Generating ${style} image...`, 'cyan');
    
    const visual = await agent.generate(undefined, undefined, style);
    const durationMs = Date.now() - start;
    
    if (!visual.imageUrl) {
      return {
        style,
        success: false,
        imageUrl: '',
        prompt: visual.prompt,
        localPath: '',
        durationMs,
        error: 'No image URL returned',
      };
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${style}-${timestamp}.png`;
    const localPath = join(OUTPUT_DIR, filename);
    
    log(`   ⬇️  Downloading image...`, 'dim');
    await downloadImage(visual.imageUrl, localPath);
    
    log(`   ✅ Saved to: ${localPath}`, 'green');
    log(`   ⏱️  Time: ${(durationMs / 1000).toFixed(2)}s`, 'dim');
    log(`   📝 Prompt: ${visual.prompt.substring(0, 100)}...`, 'dim');
    
    return {
      style,
      success: true,
      imageUrl: visual.imageUrl,
      prompt: visual.prompt,
      localPath,
      durationMs,
    };
  } catch (error) {
    const durationMs = Date.now() - start;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log(`   ❌ Failed: ${errorMessage}`, 'red');
    
    return {
      style,
      success: false,
      imageUrl: '',
      prompt: '',
      localPath: '',
      durationMs,
      error: errorMessage,
    };
  }
}

async function main() {
  console.log('\n');
  log('🖼️  INK Nature Image Generation Test', 'bright');
  log('=====================================', 'bright');
  log('Generating abstract impressionist nature scenes', 'dim');
  log(`Styles: ${ART_STYLES.join(', ')}`, 'dim');
  
  // Check for required API key
  if (!process.env.RUNWARE_API_KEY) {
    log('\n❌ Error: RUNWARE_API_KEY environment variable is required', 'red');
    process.exit(1);
  }
  
  // Create output directory
  try {
    await mkdir(OUTPUT_DIR, { recursive: true });
    log(`\n📁 Output directory: ${OUTPUT_DIR}`, 'blue');
  } catch {
    // Directory might already exist
  }
  
  const overallStart = Date.now();
  const results: GenerationResult[] = [];
  
  // Generate one image for each style
  for (const style of ART_STYLES) {
    const result = await generateAndSave(style);
    results.push(result);
  }
  
  const overallDuration = Date.now() - overallStart;
  
  // Print summary
  log('\n' + '='.repeat(50), 'bright');
  log('📊 Summary', 'bright');
  log('='.repeat(50), 'bright');
  
  const successful = results.filter(r => r.success);
  log(`\n✅ Successfully generated: ${successful.length}/${results.length}`, successful.length === results.length ? 'green' : 'yellow');
  log(`⏱️  Total time: ${(overallDuration / 1000).toFixed(2)}s`, 'dim');
  
  log('\n📁 Generated files:', 'bright');
  for (const result of results) {
    if (result.success) {
      log(`   ✓ ${result.style}: ${result.localPath}`, 'green');
    } else {
      log(`   ✗ ${result.style}: ${result.error}`, 'red');
    }
  }
  
  // Save metadata JSON
  const metadataPath = join(OUTPUT_DIR, 'generation-metadata.json');
  const metadata = {
    generatedAt: new Date().toISOString(),
    totalDurationMs: overallDuration,
    results: results.map(r => ({
      style: r.style,
      success: r.success,
      imageUrl: r.imageUrl,
      prompt: r.prompt,
      localPath: r.localPath,
      durationMs: r.durationMs,
      error: r.error,
    })),
  };
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  log(`\n📄 Metadata saved to: ${metadataPath}`, 'blue');
  
  // Cleanup
  const visualAgent = getVisualComposerAgent();
  await visualAgent.disconnect();
  
  log('\n✅ Test completed!\n', 'green');
  
  process.exit(successful.length > 0 ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
