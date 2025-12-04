/**
 * Test helpers for Latitude Deno SDK.
 * 
 * Provides utilities for mocking fetch, creating SSE streams,
 * and custom assertions following Deno/Supabase testing patterns.
 * 
 * @module
 */

// Fetch mocking
export {
  createMockFetchSpy,
  extractRequestDetails,
  mockFetch,
  type MockFetchOptions,
  type MockHandler,
} from './mock_fetch.ts';

// SSE Stream mocking
export {
  createMockGatewayError,
  createMockJSONResponse,
  createMockErrorResponse,
  createMockRunEvents,
  createMockSSEStream,
  createMockStreamingResponse,
  type SSEEvent,
} from './mock_stream.ts';

// Test fixtures
export {
  AI_RUN_ERROR_RESPONSE,
  CHUNK_EVENTS,
  CHUNKS,
  DOCUMENT_RESPONSE,
  ERROR_502_RESPONSE,
  FINAL_RESPONSE,
  NOT_FOUND_ERROR_RESPONSE,
  RUN_TEXT_RESPONSE,
} from './fixtures.ts';

// Custom assertions
export {
  assertFetchCall,
  assertJSONResponse,
  assertLatitudeError,
  assertResponse,
  assertSSEEvents,
} from './assertions.ts';

// Re-export common std assertions for convenience
export {
  assertEquals,
  assertExists,
  assertRejects,
  assertThrows,
} from '@std/assert';
