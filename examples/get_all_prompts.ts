/**
 * Example: Get All Prompts
 *
 * Demonstrates how to list all prompts in a project.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/get_all_prompts.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Get All Prompts Example ===\n');

try {
  const prompts = await latitude.prompts.getAll();

  console.log(`Found ${prompts.length} prompts:\n`);

  for (const prompt of prompts) {
    console.log(`📄 ${prompt.path}`);
    console.log(`   UUID: ${prompt.uuid}`);
    console.log(`   Provider: ${prompt.config?.provider ?? 'default'}`);
    console.log(`   Model: ${prompt.config?.model ?? 'default'}`);

    // Show parameters
    const paramCount = Object.keys(prompt.parameters).length;
    if (paramCount > 0) {
      console.log(`   Parameters: ${Object.keys(prompt.parameters).join(', ')}`);
    }

    console.log('');
  }

  // Group by provider
  const byProvider = prompts.reduce((acc, p) => {
    const provider = p.config?.provider?.toString() || 'default';
    acc[provider] = (acc[provider] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Prompts by Provider:');
  for (const [provider, count] of Object.entries(byProvider)) {
    console.log(`  ${provider}: ${count}`);
  }
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
