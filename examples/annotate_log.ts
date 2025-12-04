/**
 * Example: Annotate Log with Evaluation
 * 
 * Demonstrates how to:
 * 1. Render a prompt with custom adapter
 * 2. Call an external LLM (OpenAI)
 * 3. Create a log entry
 * 4. Annotate the log with an evaluation score
 * 
 * Prerequisites:
 * - Create an evaluation in Latitude UI
 * - Get the evaluation UUID
 * 
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 EVALUATION_UUID=xxx OPENAI_API_KEY=xxx \
 *   deno run --allow-env --allow-net examples/annotate_log.ts
 */

import { Adapters, Latitude } from '../src/mod.ts';

// Note: This example requires OpenAI SDK
// In a real app: import OpenAI from 'npm:openai@^4.0.0';
// For this example, we'll simulate the response

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

const EVALUATION_UUID = Deno.env.get('EVALUATION_UUID') || 'YOUR_EVALUATION_UUID';

console.log('=== Annotate Log Example ===\n');

try {
  // Step 1: Get the prompt
  console.log('Step 1: Fetching prompt...\n');
  const prompt = await latitude.prompts.get('joke-generator');

  // Step 2: Render the prompt to get OpenAI-compatible messages
  console.log('Step 2: Rendering prompt with OpenAI adapter...\n');
  const { config, messages } = await latitude.prompts.render({
    prompt: { content: prompt.content },
    parameters: { topic: 'programming' },
    adapter: Adapters.openai,
  });

  console.log('Rendered config:', config);
  console.log('Messages:', JSON.stringify(messages, null, 2));

  // Step 3: Call external LLM (simulated)
  console.log('\nStep 3: Calling OpenAI (simulated)...\n');
  const llmResponse = 'Why do programmers prefer dark mode? Because light attracts bugs!';

  // Step 4: Create a log entry
  console.log('Step 4: Creating log entry...\n');
  const { uuid } = await latitude.logs.create('joke-generator', messages as never, {
    response: llmResponse,
  });

  console.log(`Log created with UUID: ${uuid}`);

  // Step 5: Annotate with evaluation score
  console.log('\nStep 5: Annotating log with evaluation...\n');
  const result = await latitude.evaluations.annotate(uuid, 5, EVALUATION_UUID, {
    reason: 'This is a good joke!',
  });

  console.log('Evaluation Result:');
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
