/**
 * Example: Create Log Entry
 * 
 * Demonstrates how to manually create log entries for conversations.
 * Useful for tracking external LLM calls or custom integrations.
 * 
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/create_log.ts
 */

import { Latitude } from '../src/mod.ts';
import { MessageRole } from '../src/constants/index.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Create Log Example ===\n');

try {
  // Create a conversation log
  const messages = [
    {
      role: MessageRole.system,
      content: [{ type: 'text' as const, text: 'You are a helpful assistant.' }],
    },
    {
      role: MessageRole.user,
      content: [{ type: 'text' as const, text: 'What is TypeScript?' }],
    },
  ];

  const response = 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.';

  console.log('Creating log entry...\n');

  const log = await latitude.logs.create('assistant', messages as never, {
    response,
  });

  console.log('Log Created:');
  console.log(`  UUID: ${log.uuid}`);
  console.log(`  Messages: ${messages.length}`);
  console.log(`  Response: ${response.substring(0, 50)}...`);

  console.log('\nThis log can now be:');
  console.log('  - Viewed in Latitude UI');
  console.log('  - Annotated with evaluations');
  console.log('  - Used for analytics and monitoring');
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
