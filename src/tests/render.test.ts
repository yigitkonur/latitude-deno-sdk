/**
 * Tests for prompts.render() and prompts.renderChain() methods.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { Adapters } from 'promptl-ai';

const LATITUDE_API_KEY = 'fake-api-key';

const MOCK_PROMPT = {
  content: '---\nprovider: openai\nmodel: gpt-4\n---\n<user>Hello {{name}}</user>',
  provider: 'openai',
};

Deno.test('prompts.render() - renders prompt with parameters', async () => {
  const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
  const result = await sdk.prompts.render({
    prompt: MOCK_PROMPT,
    parameters: { name: 'World' },
    adapter: Adapters.openai,
  });

  assertExists(result);
  assertExists(result.config);
  assertExists(result.messages);
  assertEquals(Array.isArray(result.messages), true);
});

Deno.test('prompts.render() - uses default adapter when not specified', async () => {
  const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
  const result = await sdk.prompts.render({
    prompt: MOCK_PROMPT,
    parameters: { name: 'Test' },
  });

  assertExists(result);
  assertExists(result.config);
  assertExists(result.messages);
});
