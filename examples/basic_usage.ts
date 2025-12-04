/**
 * Basic usage example for Latitude Deno SDK.
 * Demonstrates simple prompt execution and response handling.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/basic_usage.ts
 */

import { Latitude } from '../src/mod.ts';

// Create client (uses environment variables)
const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Latitude SDK Basic Usage ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. List available prompts
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Listing available prompts...\n');

const prompts = await latitude.prompts.getAll();
console.log(`Found ${prompts.length} prompts:`);
for (const prompt of prompts.slice(0, 5)) {
  console.log(`  - ${prompt.path}`);
  if (prompt.config?.model) {
    console.log(`    Model: ${prompt.config.model}`);
  }
}
if (prompts.length > 5) {
  console.log(`  ... and ${prompts.length - 5} more`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Run a prompt (sync mode)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Running a prompt (sync mode)...\n');

// Use the first available prompt or specify your own
const promptPath = prompts[0]?.path || 'my-prompt';

try {
  const result = await latitude.prompts.run(promptPath, {
    stream: false,
    parameters: {
      // Add your prompt parameters here
      input: 'Hello, World!',
    },
  });

  if (result?.response) {
    console.log('Response received:');
    console.log(`  Text: ${result.response.text?.substring(0, 200)}...`);
    console.log(`  Tokens used: ${result.response.usage?.totalTokens ?? 'N/A'}`);
    console.log(`  Conversation UUID: ${result.uuid}`);

    // If the prompt returns structured JSON (check if object response)
    const objectResponse = result.response as { object?: unknown };
    if (objectResponse.object) {
      console.log('  Structured output:', JSON.stringify(objectResponse.object, null, 2));
    }
  }
} catch (error) {
  console.error('Failed to run prompt:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get prompt details
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Getting prompt details...\n');

try {
  const prompt = await latitude.prompts.get(promptPath);
  console.log(`Prompt: ${prompt.path}`);
  console.log(`  Provider: ${prompt.config?.provider ?? 'default'}`);
  console.log(`  Model: ${prompt.config?.model ?? 'default'}`);
  console.log(`  Has schema: ${!!prompt.config?.schema}`);
  console.log(`  Content preview: ${prompt.content?.substring(0, 100)}...`);
} catch (error) {
  console.error('Failed to get prompt:', error);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. List projects
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Listing projects...\n');

try {
  const projects = await latitude.projects.getAll();
  console.log(`Found ${projects.length} projects:`);
  for (const project of projects.slice(0, 5)) {
    console.log(`  - [${project.id}] ${project.name}`);
  }
} catch (error) {
  console.error('Failed to list projects:', error);
}

console.log('\n=== Basic Usage Complete ===');
