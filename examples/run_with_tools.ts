/**
 * Example: Run Prompt with Typed Tool Calling
 *
 * Demonstrates how to use typed tools with the Latitude SDK.
 * Tools allow the AI to call functions you define during execution.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/run_with_tools.ts
 */

import { Latitude } from '../src/mod.ts';

// Define your tool types for type safety
type Tools = {
  'get_weather': { location: string };
  'get_time': { timezone?: string };
};

// Initialize client
const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Tool Calling Example ===\n');

try {
  // Run a prompt with tool handlers
  const response = await latitude.prompts.run<Tools>('assistant', {
    parameters: {
      location: 'Boston',
    },
    tools: {
      // Tool handler for weather lookup
      'get_weather': async ({ location }) => {
        console.log(`[Tool Called] get_weather(location="${location}")`);
        // In a real app, you'd call a weather API here
        return await Promise.resolve({
          location,
          temperature: '2°C',
          conditions: 'Cloudy',
          humidity: '65%',
        });
      },

      // Tool handler for time lookup
      'get_time': async ({ timezone = 'UTC' }) => {
        console.log(`[Tool Called] get_time(timezone="${timezone}")`);
        const now = new Date();
        return await Promise.resolve({
          timezone,
          time: now.toLocaleTimeString('en-US', { timeZone: timezone }),
          timestamp: now.toISOString(),
        });
      },
    },
  });

  console.log('\n=== Response ===');
  console.log('Text:', response?.response.text);
  console.log('Conversation UUID:', response?.uuid);
  console.log('Tokens used:', response?.response.usage?.totalTokens);

  // Tool calls are tracked in the response (only for text responses)
  const textResponse = response?.response as { toolCalls?: unknown[] };
  if (
    textResponse?.toolCalls && Array.isArray(textResponse.toolCalls) &&
    textResponse.toolCalls.length > 0
  ) {
    console.log('\n=== Tool Calls Made ===');
    for (const toolCall of textResponse.toolCalls) {
      const tc = toolCall as { name: string; arguments: Record<string, unknown> };
      console.log(`- ${tc.name}(${JSON.stringify(tc.arguments)})`);
    }
  }
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
