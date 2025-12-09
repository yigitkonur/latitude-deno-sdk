/**
 * Basic usage example for Latitude Deno SDK.
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

// List available prompts
console.log('Fetching prompts...\n');

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

// Run a prompt (sync mode)
console.log('\nRunning a prompt...\n');

const promptPath = prompts[0]?.path || 'my-prompt';

try {
  const result = await latitude.prompts.run(promptPath, {
    stream: false,
    parameters: {
      input: 'Hello, World!',
    },
  });

  if (result?.response) {
    console.log('Response received:');
    console.log(`  Text: ${result.response.text?.substring(0, 200)}...`);
    console.log(`  Tokens: ${result.response.usage?.totalTokens ?? 'N/A'}`);
    console.log(`  UUID: ${result.uuid}`);

    // Check for structured output
    const objectResponse = result.response as { object?: unknown };
    if (objectResponse.object) {
      console.log('  Structured output:', JSON.stringify(objectResponse.object, null, 2));
    }
  }
} catch (error) {
  console.error('Failed to run prompt:', error);
}

// List projects
console.log('\nFetching projects...\n');

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
