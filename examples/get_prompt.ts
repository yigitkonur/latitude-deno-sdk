/**
 * Example: Get a Single Prompt
 *
 * Demonstrates how to retrieve a specific prompt by path.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/get_prompt.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Get Prompt Example ===\n');

try {
  // Get a specific prompt
  const prompt = await latitude.prompts.get('my-prompt');

  console.log('Prompt Details:');
  console.log(`  Path: ${prompt.path}`);
  console.log(`  UUID: ${prompt.uuid}`);
  console.log(`  Provider: ${prompt.config?.provider ?? 'default'}`);
  console.log(`  Model: ${prompt.config?.model ?? 'default'}`);
  console.log(`  Has schema: ${!!prompt.config?.schema}`);
  console.log(`\nContent preview:\n${prompt.content?.substring(0, 200)}...`);

  // Show parameters if any
  if (Object.keys(prompt.parameters).length > 0) {
    console.log('\nParameters:');
    for (const [name, config] of Object.entries(prompt.parameters)) {
      console.log(`  - ${name}: ${config.type}`);
    }
  }
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
