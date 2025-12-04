/**
 * SSE (Server-Sent Events) stream mocking utilities for Deno tests.
 * 
 * Provides factories for creating mock ReadableStream responses
 * that mimic Latitude API streaming behavior.
 */

import type { ChainEventDto, StreamEventTypes } from '../../constants/index.ts';

export interface SSEEvent {
  event: StreamEventTypes;
  data: ChainEventDto;
}

/**
 * Create a mock SSE stream with proper event formatting.
 * 
 * @example
 * ```ts
 * const stream = createMockSSEStream([
 *   { event: 'latitude-event', data: { type: 'chain-started', uuid: 'test', messages: [] } },
 *   { event: 'provider-event', data: { type: 'text-delta', textDelta: 'Hello' } }
 * ]);
 * 
 * const response = new Response(stream, {
 *   headers: { 'Content-Type': 'text/event-stream' }
 * });
 * ```
 */
export function createMockSSEStream(events: SSEEvent[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();

      for (const { event, data } of events) {
        // Format as SSE: event: <type>\ndata: <json>\n\n
        const chunk = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }

      controller.close();
    },
  });
}

/**
 * Create a mock JSON response.
 * 
 * @example
 * ```ts
 * const response = createMockJSONResponse({ uuid: 'test', conversation: [] }, 200);
 * ```
 */
export function createMockJSONResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Create a mock error response matching Latitude API error format.
 * 
 * @example
 * ```ts
 * const response = createMockErrorResponse('not_found_error', 'Document not found', 404);
 * ```
 */
export function createMockErrorResponse(
  errorCode: string,
  message: string,
  status = 400,
  dbErrorRef?: { entityUuid: string; entityType: string },
): Response {
  return createMockJSONResponse(
    {
      name: 'LatitudeError',
      errorCode,
      message,
      details: {},
      ...(dbErrorRef ? { dbErrorRef } : {}),
    },
    status,
  );
}

/**
 * Create a mock streaming response with SSE events.
 * 
 * @example
 * ```ts
 * const response = createMockStreamingResponse([
 *   { event: 'latitude-event', data: { type: 'chain-started', uuid: 'test', messages: [] } }
 * ]);
 * ```
 */
export function createMockStreamingResponse(events: SSEEvent[]): Response {
  return new Response(createMockSSEStream(events), {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

/**
 * Create a mock 502/504 gateway error response.
 * 
 * @example
 * ```ts
 * const response = createMockGatewayError(502);
 * ```
 */
export function createMockGatewayError(status: 502 | 504 = 502): Response {
  return createMockErrorResponse(
    'internal_server_error',
    status === 502 ? 'Bad Gateway' : 'Gateway Timeout',
    status,
  );
}

/**
 * Helper to create a complete run response with all expected events.
 * 
 * @example
 * ```ts
 * const events = createMockRunEvents({
 *   uuid: 'test-uuid',
 *   text: 'Hello World',
 *   messages: []
 * });
 * ```
 */
export function createMockRunEvents(options: {
  uuid: string;
  text: string;
  messages: unknown[];
  toolCalls?: unknown[];
}): SSEEvent[] {
  const { uuid, text, messages, toolCalls = [] } = options;

  return [
    {
      event: 'latitude-event' as StreamEventTypes,
      data: {
        type: 'chain-started',
        uuid,
        messages,
        timestamp: Date.now(),
      } as ChainEventDto,
    },
    {
      event: 'latitude-event' as StreamEventTypes,
      data: {
        type: 'provider-started',
        uuid,
        messages,
        timestamp: Date.now(),
        config: {},
      } as ChainEventDto,
    },
    {
      event: 'provider-event' as StreamEventTypes,
      data: {
        type: 'text-delta',
        textDelta: text,
      } as ChainEventDto,
    },
    {
      event: 'latitude-event' as StreamEventTypes,
      data: {
        type: 'provider-completed',
        uuid,
        messages,
        timestamp: Date.now(),
        providerLogUuid: 'provider-log-uuid',
        tokenUsage: {
          inputTokens: 10,
          outputTokens: 5,
          promptTokens: 10,
          completionTokens: 5,
          totalTokens: 15,
          reasoningTokens: 0,
          cachedInputTokens: 0,
        },
        finishReason: 'stop',
        response: {
          text,
          usage: {
            inputTokens: 10,
            outputTokens: 5,
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
            reasoningTokens: 0,
            cachedInputTokens: 0,
          },
          streamType: 'text',
          toolCalls: toolCalls.length > 0 ? toolCalls : null,
        },
      } as ChainEventDto,
    },
  ];
}
