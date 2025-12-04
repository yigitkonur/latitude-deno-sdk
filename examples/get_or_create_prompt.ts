/**
 * Example: Get or Create Prompt
 *
 * Demonstrates the getOrCreate pattern - retrieves existing prompt
 * or creates it if it doesn't exist.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/get_or_create_prompt.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Get or Create Prompt Example ===\n');

const PROMPT_PATH = 'examples/auto-created-prompt';
const INITIAL_CONTENT = `---
provider: openai
model: gpt-4
---
<system>You are a helpful assistant.</system>
<user>{{user_input}}</user>
`;

try {
  console.log(`Attempting to get or create prompt: ${PROMPT_PATH}\n`);

  const prompt = await latitude.prompts.getOrCreate(PROMPT_PATH, {
    prompt: INITIAL_CONTENT,
  });

  console.log('Prompt Retrieved/Created:');
  console.log(`  Path: ${prompt.path}`);
  console.log(`  UUID: ${prompt.uuid}`);
  console.log(`  Provider: ${prompt.config?.provider ?? 'default'}`);
  console.log(`  Model: ${prompt.config?.model ?? 'default'}`);
  console.log(`\nContent:\n${prompt.content}`);
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
