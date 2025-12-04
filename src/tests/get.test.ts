/**
 * Tests for prompts.get() method.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude, type LatitudeApiError } from '../index.ts';
import { createMockErrorResponse, createMockJSONResponse, DOCUMENT_RESPONSE, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const PROJECT_ID = 123;

function getUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

Deno.test('prompts.get() - retrieves prompt successfully', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse(DOCUMENT_RESPONSE)),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const prompt = await sdk.prompts.get('prompt', { projectId: PROJECT_ID });

    assertExists(prompt);
    assertEquals(prompt.path, 'prompt');
    assertEquals(prompt.uuid, DOCUMENT_RESPONSE.uuid);
  } finally {
    restore();
  }
});

Deno.test('prompts.get() - includes project id and version in URL', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse(DOCUMENT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.get('my-prompt', {
      projectId: PROJECT_ID,
      versionUuid: 'test-version',
    });
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/projects/${PROJECT_ID}/versions/test-version/documents/my-prompt`),
    true,
  );
});

Deno.test('prompts.get() - throws error when not found', async () => {
  const restore = mockFetch({
    customHandler: () =>
      Promise.resolve(
        createMockErrorResponse('not_found_error', 'Prompt not found', 404),
      ),
  });

  let thrownError: unknown = null;

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.get('nonexistent', { projectId: PROJECT_ID });
  } catch (error) {
    thrownError = error;
  } finally {
    restore();
  }

  assertExists(thrownError);
  const err = thrownError as LatitudeApiError;
  assertEquals(err.status, 404);
});
