/**
 * Tests for prompts.getAll() method.
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

Deno.test('prompts.getAll() - retrieves all prompts', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse([DOCUMENT_RESPONSE])),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const prompts = await sdk.prompts.getAll({ projectId: PROJECT_ID });

    assertExists(prompts);
    assertEquals(Array.isArray(prompts), true);
    assertEquals(prompts.length, 1);
    assertEquals(prompts[0].uuid, DOCUMENT_RESPONSE.uuid);
  } finally {
    restore();
  }
});

Deno.test('prompts.getAll() - includes project id in URL', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse([]));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.getAll({ projectId: PROJECT_ID, versionUuid: 'test-version' });
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/projects/${PROJECT_ID}/versions/test-version/documents`),
    true,
  );
});
