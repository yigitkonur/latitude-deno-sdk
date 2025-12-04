/**
 * Fetch mocking utilities for Deno tests.
 * 
 * Provides globalThis.fetch override with automatic restore pattern,
 * following Supabase-js and Deno std testing conventions.
 */

export type MockHandler = (input: string | URL | Request, init?: RequestInit) => Promise<Response> | Response;

export interface MockFetchOptions {
  /** Map of URL patterns to responses */
  handlers?: Map<string, Response>;
  /** Custom handler function */
  customHandler?: MockHandler;
  /** Whether to throw on unmatched URLs (default: true) */
  throwOnUnmatched?: boolean;
}

/**
 * Mock globalThis.fetch with pattern-based response matching.
 * 
 * @example
 * ```ts
 * const restore = mockFetch({
 *   handlers: new Map([
 *     ['/api/projects', new Response(JSON.stringify({ projects: [] }))],
 *     ['/api/run', new Response('stream data', { headers: { 'Content-Type': 'text/event-stream' } })]
 *   ])
 * });
 * 
 * try {
 *   await sdk.prompts.run('test');
 * } finally {
 *   restore();
 * }
 * ```
 */
export function mockFetch(options: MockFetchOptions = {}): () => void {
  const { handlers = new Map(), customHandler, throwOnUnmatched = true } = options;
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Try custom handler first
    if (customHandler) {
      return await customHandler(input, init);
    }

    // Try pattern matching
    for (const [pattern, response] of handlers) {
      if (url.includes(pattern)) {
        // Clone response to allow multiple reads
        return response.clone();
      }
    }

    // Unmatched URL
    if (throwOnUnmatched) {
      throw new Error(`Unhandled fetch request: ${url}`);
    }

    return new Response('Not Found', { status: 404 });
  };

  // Return restore function
  return () => {
    globalThis.fetch = originalFetch;
  };
}

/**
 * Create a mock fetch handler that tracks calls.
 * 
 * @example
 * ```ts
 * const { handler, calls, restore } = createMockFetchSpy();
 * globalThis.fetch = handler;
 * 
 * await fetch('/api/test');
 * assertEquals(calls.length, 1);
 * assertEquals(calls[0].url, '/api/test');
 * 
 * restore();
 * ```
 */
export function createMockFetchSpy(): {
  handler: MockHandler;
  calls: Array<{ url: string; init?: RequestInit }>;
  restore: () => void;
} {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;

  const handler: MockHandler = (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    calls.push({ url, init });
    return new Response('{}', { status: 200 });
  };

  return {
    handler: handler,
    calls: calls,
    restore: (): void => {
      globalThis.fetch = originalFetch;
    },
  };
}

/**
 * Helper to extract request details for assertions.
 */
export async function extractRequestDetails(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<{ url: string; method: string; headers: Headers; body?: string }> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = init?.method || 'GET';
  const headers = new Headers(init?.headers);
  const body = init?.body ? await (async () => {
    if (typeof init.body === 'string') return init.body;
    if (init.body instanceof ReadableStream) {
      const reader = init.body.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      return new TextDecoder().decode(new Uint8Array(chunks.flatMap((c) => Array.from(c))));
    }
    return String(init.body);
  })() : undefined;

  return { url, method, headers, body };
}
