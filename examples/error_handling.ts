/**
 * Error handling example for Latitude Deno SDK.
 * Demonstrates proper error handling patterns for production use.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/error_handling.ts
 */

import { Latitude, LatitudeApiError } from '../src/mod.ts';

// ═══════════════════════════════════════════════════════════════════════════
// Basic Error Handling Pattern
// ═══════════════════════════════════════════════════════════════════════════

console.log('=== Basic Error Handling ===\n');

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

try {
  const result = await latitude.prompts.run('my-prompt', {
    stream: false,
    parameters: { input: 'test' },
  });
  console.log(`Success: ${result?.response?.text?.substring(0, 50)}...`);
} catch (error) {
  if (error instanceof LatitudeApiError) {
    console.log(`API Error ${error.status}: ${error.message}`);
  } else {
    console.log(`Unexpected error: ${error}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive Error Handling
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Comprehensive Error Handling ===\n');

async function runPromptWithErrorHandling(
  promptPath: string,
  parameters: Record<string, unknown>,
) {
  try {
    return await latitude.prompts.run(promptPath, {
      stream: false,
      parameters,
    });
  } catch (error) {
    if (error instanceof LatitudeApiError) {
      // Handle different HTTP status codes
      switch (true) {
        case error.status === 401:
          console.error('Authentication failed. Check your API key.');
          console.error('Ensure LATITUDE_API_KEY is set correctly.');
          throw error;

        case error.status === 403:
          console.error('Access forbidden. Check your permissions.');
          throw error;

        case error.status === 404:
          console.error(`Prompt not found: ${promptPath}`);
          console.error('Check that the prompt path exists in your project.');
          return null; // Graceful handling

        case error.status === 422:
          console.error('Validation error:', error.message);
          console.error('Check your parameters match the prompt requirements.');
          throw error;

        case error.status === 429:
          console.error('Rate limited. Consider implementing backoff.');
          throw error;

        case error.status >= 500:
          console.error('Server error. The API may be temporarily unavailable.');
          console.error('Consider retrying with exponential backoff.');
          throw error;

        default:
          console.error(`API Error (${error.status}): ${error.message}`);
          throw error;
      }
    }

    // Network errors
    if (error instanceof TypeError && (error as Error).message.includes('fetch')) {
      console.error('Network error - check your internet connection.');
      throw error;
    }

    // Unknown error
    console.error('An unexpected error occurred:', error);
    throw error;
  }
}

// Test comprehensive handler
try {
  const result = await runPromptWithErrorHandling('my-prompt', { input: 'test' });
  if (result) {
    console.log('Success!');
  }
} catch {
  console.log('Failed after error handling');
}

// ═══════════════════════════════════════════════════════════════════════════
// Retry with Exponential Backoff
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Retry with Exponential Backoff ===\n');

async function runWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry auth errors
      if (error instanceof LatitudeApiError && error.status === 401) {
        throw error;
      }

      // Retry on server errors and rate limits
      const shouldRetry =
        error instanceof LatitudeApiError &&
        (error.status >= 500 || error.status === 429);

      if (shouldRetry && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Attempt ${attempt + 1} failed. Retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error('Unknown error after retries');
}

// Usage example
try {
  const result = await runWithRetry(() =>
    latitude.prompts.run('my-prompt', {
      stream: false,
      parameters: { input: 'retry test' },
    })
  );
  console.log('Success with retry:', result?.response?.text?.substring(0, 30));
} catch (error) {
  console.log('Failed after retries:', error);
}

// ═══════════════════════════════════════════════════════════════════════════
// Graceful Degradation Pattern
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Graceful Degradation ===\n');

interface AIResponse {
  text: string;
  source: 'ai' | 'fallback';
}

async function getResponseWithFallback(
  prompt: string,
  fallbackResponse: string,
): Promise<AIResponse> {
  try {
    const result = await latitude.prompts.run('my-prompt', {
      stream: false,
      parameters: { input: prompt },
    });

    return {
      text: result?.response?.text ?? fallbackResponse,
      source: 'ai',
    };
  } catch (error) {
    console.warn('AI failed, using fallback:', error instanceof Error ? error.message : error);
    return {
      text: fallbackResponse,
      source: 'fallback',
    };
  }
}

// Usage
const response = await getResponseWithFallback(
  'What is TypeScript?',
  'TypeScript is a typed superset of JavaScript.',
);
console.log(`Response (${response.source}): ${response.text.substring(0, 50)}...`);

// ═══════════════════════════════════════════════════════════════════════════
// Error Boundary Pattern for Multiple Operations
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Error Boundary Pattern ===\n');

interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function safeOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<OperationResult<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[${operationName}] Failed: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// Run multiple operations, collecting successes and failures
const operations = await Promise.all([
  safeOperation(() => latitude.prompts.getAll(), 'List prompts'),
  safeOperation(() => latitude.projects.getAll(), 'List projects'),
  safeOperation(
    () => latitude.prompts.run('my-prompt', { stream: false, parameters: {} }),
    'Run prompt',
  ),
]);

const succeeded = operations.filter((op) => op.success).length;
const failed = operations.filter((op) => !op.success).length;

console.log(`\nOperation results: ${succeeded} succeeded, ${failed} failed`);

// ═══════════════════════════════════════════════════════════════════════════
// Production-Ready Service Wrapper
// ═══════════════════════════════════════════════════════════════════════════

console.log('\n=== Production Service Wrapper ===\n');

class LatitudeService {
  private client: Latitude;
  private maxRetries: number;

  constructor(apiKey: string, projectId: number, maxRetries = 3) {
    this.client = new Latitude(apiKey, { projectId });
    this.maxRetries = maxRetries;
  }

  async runPrompt(
    path: string,
    parameters: Record<string, unknown>,
    options?: { stream?: boolean },
  ) {
    return await this.withRetry(() =>
      this.client.prompts.run(path, {
        stream: options?.stream ?? false,
        parameters,
      })
    );
  }

  async listPrompts() {
    return await this.withRetry(() => this.client.prompts.getAll());
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= this.maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry auth errors
        if (error instanceof LatitudeApiError && error.status === 401) {
          throw error;
        }

        // Retry on server errors
        if (error instanceof LatitudeApiError && error.status >= 500 && i < this.maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Unknown error');
  }
}

// Usage
const service = new LatitudeService(
  Deno.env.get('LATITUDE_API_KEY')!,
  Number(Deno.env.get('LATITUDE_PROJECT_ID')),
);

try {
  const prompts = await service.listPrompts();
  console.log(`Service returned ${prompts.length} prompts`);
} catch (error) {
  console.log(`Service error: ${error}`);
}

console.log('\n=== Error Handling Examples Complete ===');
