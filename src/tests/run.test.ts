/**
 * Tests for prompts.run() method.
 * Covers streaming/non-streaming execution, error handling, retry logic.
 */

import { assertEquals, assertExists } from '@std/assert';
import { Latitude, type LatitudeApiError } from '../index.ts';
import { ApiErrorCodes, RunErrorCodes } from '../utils/errors.ts';
import {
  CHUNKS,
  createMockErrorResponse,
  createMockJSONResponse,
  createMockSSEStream,
  FINAL_RESPONSE,
  mockFetch,
  RUN_TEXT_RESPONSE,
} from './helpers/mod.ts';
import { ChainEventTypes, StreamEventTypes } from '../constants/index.ts';

const LATITUDE_API_KEY = 'fake-api-key';
const PROJECT_ID = 123;

function getUrl(input: string | URL | Request): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

Deno.test('prompts.run() - streaming - sends correct auth header', async () => {
  let authHeader: string | null = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      authHeader = new Headers(init?.headers).get('Authorization');
      return Promise.resolve(createMockJSONResponse({}));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      stream: true,
    });
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertEquals(authHeader, `Bearer ${LATITUDE_API_KEY}`);
});

Deno.test('prompts.run() - streaming - includes project id in URL', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse({}));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      stream: true,
    });
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/projects/${PROJECT_ID}/versions/live/documents/run`),
    true,
  );
});

Deno.test('prompts.run() - streaming - sends correct request body', async () => {
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
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: { foo: 'bar' },
      customIdentifier: 'test-id',
      stream: true,
    });
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertExists(requestBody);
  const body = requestBody as Record<string, unknown>;
  assertEquals(body['path'], 'path/to/document');
  assertEquals(body['parameters'], { foo: 'bar' });
  assertEquals(body['stream'], true);
});

Deno.test('prompts.run() - streaming - sends tool names', async () => {
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
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      tools: {
        get_weather: () => Promise.resolve('sunny'),
        get_time: () => Promise.resolve('12:00'),
      },
      stream: true,
    });
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertExists(requestBody);
  const body = requestBody as Record<string, unknown>;
  assertEquals(body['tools'], ['get_weather', 'get_time']);
});

Deno.test('prompts.run() - streaming - calls onEvent and onFinished', async () => {
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
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: true,
      onEvent: ({ event, data }) => {
        events.push({ event, data });
      },
      onFinished: (data) => {
        finishedData = data;
      },
    });
  } finally {
    restore();
  }

  assertEquals(events.length > 0, true);
  assertExists(finishedData);
});

Deno.test('prompts.run() - streaming - calls onError on chain error', async () => {
  let errorReceived: unknown = null;

  const restore = mockFetch({
    customHandler: () => {
      const errorEvent = {
        event: StreamEventTypes.Latitude,
        data: {
          type: ChainEventTypes.ChainError,
          error: {
            message: 'Something bad happened',
          },
          uuid: '123',
          messages: [],
          timestamp: Date.now(),
        },
      };

      const stream = createMockSSEStream([errorEvent]);
      return Promise.resolve(
        new Response(stream, {
          headers: { 'Content-Type': 'text/event-stream' },
        }),
      );
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: true,
      onError: (error) => {
        errorReceived = error;
      },
    });
  } catch {
    // Expected
  } finally {
    restore();
  }

  assertExists(errorReceived);
  const error = errorReceived as LatitudeApiError;
  assertEquals(error.status, 402);
  assertEquals(error.errorCode, RunErrorCodes.AIRunError);
});

Deno.test('prompts.run() - non-streaming - sends correct auth header', async () => {
  let authHeader: string | null = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      authHeader = new Headers(init?.headers).get('Authorization');
      return Promise.resolve(createMockJSONResponse(RUN_TEXT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      stream: false,
    });
  } finally {
    restore();
  }

  assertEquals(authHeader, `Bearer ${LATITUDE_API_KEY}`);
});

Deno.test('prompts.run() - non-streaming - includes project id in URL', async () => {
  let requestUrl = '';

  const restore = mockFetch({
    customHandler: (input) => {
      requestUrl = getUrl(input);
      return Promise.resolve(createMockJSONResponse(RUN_TEXT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      stream: false,
    });
  } finally {
    restore();
  }

  assertEquals(
    requestUrl.includes(`/api/v3/projects/${PROJECT_ID}/versions/live/documents/run`),
    true,
  );
});

Deno.test('prompts.run() - non-streaming - sends correct request body', async () => {
  let requestBody: unknown = null;

  const restore = mockFetch({
    customHandler: (_input, init) => {
      if (init?.body) {
        requestBody = JSON.parse(init.body as string);
      }
      return Promise.resolve(createMockJSONResponse(RUN_TEXT_RESPONSE));
    },
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: { foo: 'bar' },
      customIdentifier: 'miau',
      stream: false,
    });
  } finally {
    restore();
  }

  assertExists(requestBody);
  const body = requestBody as Record<string, unknown>;
  assertEquals(body['stream'], false);
  assertEquals(body['background'], false);
  assertEquals(body['path'], 'path/to/document');
});

Deno.test('prompts.run() - non-streaming - calls onFinished callback', async () => {
  let finishedData: unknown = null;

  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse(FINAL_RESPONSE)),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    const response = await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: false,
      onFinished: (data) => {
        finishedData = data;
      },
    });

    assertExists(finishedData);
    assertEquals(response, FINAL_RESPONSE);
  } finally {
    restore();
  }
});

Deno.test('prompts.run() - non-streaming - handles errors with onError', async () => {
  let errorReceived: unknown = null;

  const restore = mockFetch({
    customHandler: () =>
      Promise.resolve(
        createMockErrorResponse(
          RunErrorCodes.AIProviderConfigError,
          'Document Log uuid not found in response',
          402,
        ),
      ),
  });

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: false,
      onError: (error) => {
        errorReceived = error;
      },
    });
  } finally {
    restore();
  }

  assertExists(errorReceived);
  const error = errorReceived as LatitudeApiError;
  assertEquals(error.status, 402);
  assertEquals(error.errorCode, RunErrorCodes.AIProviderConfigError);
});

Deno.test('prompts.run() - non-streaming - throws error when onError not provided', async () => {
  const restore = mockFetch({
    customHandler: () =>
      Promise.resolve(
        createMockErrorResponse(
          RunErrorCodes.AIProviderConfigError,
          'Document Log uuid not found',
          402,
        ),
      ),
  });

  let thrownError: unknown = null;

  try {
    const sdk = new Latitude(LATITUDE_API_KEY, { __internal: { retryMs: 1 } });
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: false,
    });
  } catch (error) {
    thrownError = error;
  } finally {
    restore();
  }

  assertExists(thrownError);
  const err = thrownError as LatitudeApiError;
  assertEquals(err.status, 402);
  assertEquals(err.errorCode, RunErrorCodes.AIProviderConfigError);
});

Deno.test('prompts.run() - non-streaming - retries 3 times on 502 errors', async () => {
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
    await sdk.prompts.run('path/to/document', {
      projectId: PROJECT_ID,
      parameters: {},
      stream: false,
      onError: (error) => {
        errorReceived = error;
      },
    });
  } finally {
    restore();
  }

  assertEquals(callCount, 3);
  assertExists(errorReceived);
  const error = errorReceived as LatitudeApiError;
  assertEquals(error.status, 502);
});
