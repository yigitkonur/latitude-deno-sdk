/**
 * Tests for prompts.getOrCreate() method.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { createMockJSONResponse, DOCUMENT_RESPONSE, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const PROJECT_ID = 123;

function getUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

Deno.test('prompts.getOrCreate() - creates prompt if not exists', async () => {
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
    const prompt = await sdk.prompts.getOrCreate('new-prompt', {
      projectId: PROJECT_ID,
      prompt: 'Initial content',
    });

    assertExists(prompt);
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    assertEquals(body['path'], 'new-prompt');
    assertEquals(body['prompt'], 'Initial content');
  } finally {
    restore();
  }
});

Deno.test('prompts.getOrCreate() - uses correct endpoint', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse(DOCUMENT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.getOrCreate('test-prompt', { projectId: PROJECT_ID });
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/projects/${PROJECT_ID}/versions/live/documents/get-or-create`),
    true,
  );
});
