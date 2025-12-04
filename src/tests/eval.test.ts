/**
 * Tests for evaluations.annotate() method.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude } from '../index.ts';
import { createMockJSONResponse, mockFetch } from './helpers/mod.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const CONVERSATION_UUID = 'conversation-uuid';
const EVALUATION_UUID = 'evaluation-uuid';

const MOCK_EVALUATION_RESULT = {
  uuid: 'result-uuid',
  score: 0.9,
  metadata: { reason: 'Great response' },
};

Deno.test('evaluations.annotate() - annotates conversation', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse(MOCK_EVALUATION_RESULT));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const result = await sdk.evaluations.annotate(
      CONVERSATION_UUID,
      0.9,
      EVALUATION_UUID,
      { reason: 'Great response' },
    );

    assertExists(result);
    assertEquals(result.score, 0.9);
    assertExists(requestBody);
    const body = requestBody as Record<string, unknown>;
    assertEquals(body['score'], 0.9);
    const metadata = body['metadata'] as Record<string, unknown>;
    assertEquals(metadata['reason'], 'Great response');
  } finally {
    restore();
  }
});

Deno.test('evaluations.annotate() - uses correct endpoint', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input.url;
      return Promise.resolve(createMockJSONResponse(MOCK_EVALUATION_RESULT));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.evaluations.annotate(CONVERSATION_UUID, 0.9, EVALUATION_UUID);
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(
      `/api/v3/conversations/${CONVERSATION_UUID}/evaluations/${EVALUATION_UUID}/annotate`,
    ),
    true,
  );
});
