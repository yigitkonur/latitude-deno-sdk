/**
 * Tests for prompts.create() method.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { createMockJSONResponse, DOCUMENT_RESPONSE, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const PROJECT_ID = 123;

Deno.test('prompts.create() - creates new prompt', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse(DOCUMENT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const prompt = await sdk.prompts.create('new-prompt', {
      projectId: PROJECT_ID,
      prompt: 'New prompt content',
    });

    assertExists(prompt);
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    assertEquals(body['path'], 'new-prompt');
    assertEquals(body['prompt'], 'New prompt content');
  } finally {
    restore();
  }
});
