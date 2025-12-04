/**
 * Custom assertions for Latitude SDK tests.
 * 
 * Provides specialized assertions for SSE events, streaming responses,
 * and SDK-specific patterns.
 */

import { assertEquals, assertExists } from '@std/assert';
import type { ChainEventDto, StreamEventTypes } from '../../constants/index.ts';

/**
 * Assert that an SSE event sequence matches expected events.
 * 
 * @example
 * ```ts
 * await assertSSEEvents(response.body!, [
 *   { event: 'latitude-event', data: { type: 'chain-started' } },
 *   { event: 'provider-event', data: { type: 'text-delta', textDelta: 'Hello' } }
 * ]);
 * ```
 */
export async function assertSSEEvents(
  stream: ReadableStream<Uint8Array>,
  expectedEvents: Array<{ event: StreamEventTypes; data: Partial<ChainEventDto> }>,
): Promise<void> {
  const decoder = new TextDecoder();
  const reader = stream.getReader();
  const receivedEvents: Array<{ event: string; data: unknown }> = [];

  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent: { event?: string; data?: string } = {};
      for (const line of lines) {
        if (line.startsWith('event:')) {
          currentEvent.event = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          currentEvent.data = line.slice(5).trim();
        } else if (line === '' && currentEvent.event && currentEvent.data) {
          receivedEvents.push({
            event: currentEvent.event,
            data: JSON.parse(currentEvent.data),
          });
          currentEvent = {};
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  assertEquals(receivedEvents.length, expectedEvents.length, 'Event count mismatch');

  for (let i = 0; i < expectedEvents.length; i++) {
    const expected = expectedEvents[i];
    const received = receivedEvents[i];

    assertEquals(received.event, expected.event, `Event ${i}: type mismatch`);

    // Check partial data match
    for (const [key, value] of Object.entries(expected.data)) {
      assertEquals(
        (received.data as Record<string, unknown>)[key],
        value,
        `Event ${i}: data.${key} mismatch`,
      );
    }
  }
}

/**
 * Assert that a Response has expected status and content type.
 */
export function assertResponse(
  response: Response,
  expectedStatus: number,
  expectedContentType?: string,
): void {
  assertEquals(response.status, expectedStatus, 'Status code mismatch');

  if (expectedContentType) {
    const contentType = response.headers.get('Content-Type');
    assertExists(contentType, 'Content-Type header missing');
    assertEquals(
      contentType.includes(expectedContentType),
      true,
      `Content-Type mismatch: expected ${expectedContentType}, got ${contentType}`,
    );
  }
}

/**
 * Assert that a JSON response matches expected structure.
 */
export async function assertJSONResponse<T = unknown>(
  response: Response,
  expectedData: Partial<T>,
): Promise<void> {
  assertResponse(response, 200, 'application/json');

  const data = await response.json() as T;
  for (const [key, value] of Object.entries(expectedData)) {
    assertEquals(
      (data as Record<string, unknown>)[key],
      value,
      `JSON field ${key} mismatch`,
    );
  }
}

/**
 * Assert that a fetch call was made with expected parameters.
 */
export function assertFetchCall(
  calls: Array<{ url: string; init?: RequestInit }>,
  index: number,
  expected: {
    urlPattern: string;
    method?: string;
    headers?: Record<string, string>;
    bodyContains?: string;
  },
): void {
  const call = calls[index];
  assertExists(call, `Call ${index} not found`);

  assertEquals(
    call.url.includes(expected.urlPattern),
    true,
    `URL pattern mismatch: ${call.url} does not contain ${expected.urlPattern}`,
  );

  if (expected.method) {
    assertEquals(call.init?.method || 'GET', expected.method, 'Method mismatch');
  }

  if (expected.headers) {
    const headers = new Headers(call.init?.headers);
    for (const [key, value] of Object.entries(expected.headers)) {
      assertEquals(headers.get(key), value, `Header ${key} mismatch`);
    }
  }

  if (expected.bodyContains && call.init?.body) {
    const bodyStr = String(call.init.body);
    assertEquals(
      bodyStr.includes(expected.bodyContains),
      true,
      `Body does not contain: ${expected.bodyContains}`,
    );
  }
}

/**
 * Assert that an error is a LatitudeApiError with expected properties.
 */
export function assertLatitudeError(
  error: unknown,
  expectedStatus: number,
  expectedErrorCode?: string,
): void {
  assertExists(error, 'Error is null/undefined');
  assertEquals(typeof error, 'object', 'Error is not an object');

  const err = error as { status?: number; errorCode?: string; message?: string };
  assertEquals(err.status, expectedStatus, 'Error status mismatch');

  if (expectedErrorCode) {
    assertEquals(err.errorCode, expectedErrorCode, 'Error code mismatch');
  }
}
