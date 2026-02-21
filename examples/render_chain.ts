/**
 * Example: Render Chain with External LLM
 *
 * Demonstrates how to use renderChain to execute multi-step prompts
 * with an external LLM provider (OpenAI).
 *
 * Prerequisites:
 * - OpenAI API key
 * - A prompt with chain steps in Latitude
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 OPENAI_API_KEY=xxx \
 *   deno run --allow-env --allow-net examples/render_chain.ts
 */

import { Adapters, Latitude } from '../src/mod.ts';

// Note: This example requires OpenAI SDK
// In a real app: import OpenAI from 'npm:openai@^4.0.0';
// For this example, we'll simulate the response

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Render Chain Example ===\n');

try {
  // Get a prompt that uses chain steps
  console.log('Step 1: Fetching chain prompt...\n');
  const prompt = await latitude.prompts.get('chain-example');

  console.log('Step 2: Rendering chain with OpenAI adapter...\n');

  const result = await latitude.prompts.renderChain({
    prompt,
    parameters: { question: 'What is the meaning of life?' },
    adapter: Adapters.openai,
    onStep: async ({ config, messages }) => {
      console.log(`[Chain Step] Model: ${config.model}`);
      console.log(`[Chain Step] Messages: ${messages.length}`);

      // In a real implementation, you would call OpenAI here:
      // const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
      // const response = await openai.chat.completions.create({
      //   model: config.model as string,
      //   temperature: config.temperature as number,
      //   messages,
      // });
      // return response.choices[0].message;

      // Simulated response - return string or message object
      return await Promise.resolve('The meaning of life is a philosophical question...');
    },
  });

  console.log('\n=== Final Result ===');
  console.log('Config:', result.config);
  console.log('Messages:', result.messages.length);
  console.log(
    '\nFinal message:',
    JSON.stringify(result.messages[result.messages.length - 1], null, 2),
  );
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
