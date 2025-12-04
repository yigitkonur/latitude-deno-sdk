/**
 * Tests for prompts.chat() method.
 * Covers conversation continuation with streaming and non-streaming modes.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude, type LatitudeApiError } from '../index.ts';
import { ApiErrorCodes, MessageRole } from '../constants/index.ts';
import {
  CHUNKS,
  createMockErrorResponse,
  createMockJSONResponse,
  createMockSSEStream,
  FINAL_RESPONSE,
  mockFetch,
  RUN_TEXT_RESPONSE,
} from './helpers/mod.ts';
import type { StreamEventTypes } from '../constants/index.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const CONVERSATION_UUID = 'fake-conversation-uuid';

function getUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

Deno.test('prompts.chat() - streaming - sends correct auth header', async () => {
  let authHeader: string | null = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      authHeader = new Headers(init?.headers).get('Authorization');
      return Promise.resolve(createMockJSONResponse({}));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      { stream: true },
    );
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertEquals(authHeader, `Bearer ${LATITUDE_API_KEY}`);
});

Deno.test('prompts.chat() - streaming - includes conversation UUID in URL', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse({}));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      { stream: true },
    );
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/conversations/${CONVERSATION_UUID}/chat`),
    true,
  );
});

Deno.test('prompts.chat() - streaming - sends messages in request body', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse({}));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'fake-user-content' }],
        },
      ],
      { stream: true },
    );
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertExists(requestBody);
  const body = requestBody as Record<string, unknown>;
  const messages = body['messages'] as Array<Record<string, unknown>>;
  assertEquals(messages[0]['role'], MessageRole.user);
  assertEquals(body['stream'], true);
  assertEquals(body['tools'], []);
});

Deno.test('prompts.chat() - streaming - calls onEvent and onFinished', async () => {
  const events: Array<{ event: string; data: unknown }> = [];
  let finishedData: unknown = null;

  const restore = mockFetch({
    customHandler: () => {
      const stream = createMockSSEStream(
        CHUNKS.map((chunk) => {
          const lines = chunk.split('\n');
          const eventLine = lines.find((l) => l.startsWith('event:'));
          const dataLine = lines.find((l) => l.startsWith('data:'));
          return {
            event: eventLine?.slice(7).trim() as StreamEventTypes,
            data: JSON.parse(dataLine?.slice(6).trim() || '{}'),
          };
        }),
      );
      return Promise.resolve(
        new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      );
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const response = await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      {
        stream: true,
        onEvent: ({ event, data }) => {
          events.push({ event, data });
        },
        onFinished: (data) => {
          finishedData = data;
        },
      },
    );

    assertEquals(events.length > 0, true);
    assertExists(finishedData);
    assertEquals(response, finishedData);
  } finally {
    restore();
  }
});

Deno.test('prompts.chat() - streaming - retries 3 times on 502', async () => {
  let callCount = 0;

  const restore = mockFetch({
    customHandler: () => {
      callCount++;
      return Promise.resolve(
        createMockErrorResponse(
          ApiErrorCodes.InternalServerError,
          'Something bad happened',
          502,
        ),
      );
    },
  });

  let errorReceived: unknown = null;

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      {
        stream: true,
        onError: (error) => {
          errorReceived = error;
        },
      },
    );
  } finally {
    restore();
  }

  assertEquals(callCount, 3);
  assertExists(errorReceived);
  const error = errorReceived as LatitudeApiError;
  assertEquals(error.status, 502);
});

Deno.test('prompts.chat() - non-streaming - sends correct request', async () => {
  let requestUrl = '';
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (input, init) => {
      requestUrl = getUrl(input);
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse(RUN_TEXT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'fake-user-content' }],
        },
      ],
      { stream: false },
    );
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/conversations/${CONVERSATION_UUID}/chat`),
    true,
  );
  assertExists(requestBody);
  const body = requestBody as Record<string, unknown>;
  assertEquals(body['stream'], false);
});

Deno.test('prompts.chat() - non-streaming - calls onFinished', async () => {
  let finishedData: unknown = null;

  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse(FINAL_RESPONSE)),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const response = await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      {
        stream: false,
        onFinished: (data) => {
          finishedData = data;
        },
      },
    );

    assertExists(finishedData);
    assertEquals(response, FINAL_RESPONSE);
  } finally {
    restore();
  }
});

Deno.test('prompts.chat() - non-streaming - handles errors', async () => {
  let errorReceived: unknown = null;

  const restore = mockFetch({
    customHandler: () =>
      Promise.resolve(
        createMockErrorResponse(
          ApiErrorCodes.InternalServerError,
          'Something bad happened',
          502,
        ),
      ),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.chat(
      CONVERSATION_UUID,
      [
        {
          role: MessageRole.user,
          content: [{ type: 'text', text: 'Hello' }],
        },
      ],
      {
        stream: false,
        onError: (error) => {
          errorReceived = error;
        },
      },
    );
  } finally {
    restore();
  }

  assertExists(errorReceived);
  const error = errorReceived as LatitudeApiError;
  assertEquals(error.status, 502);
});
