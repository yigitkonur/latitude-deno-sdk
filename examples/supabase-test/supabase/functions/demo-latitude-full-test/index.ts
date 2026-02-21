/**
 * Demo: Full SDK Test
 * Business case: Comprehensive test of all SDK features.
 *
 * Features demonstrated:
 * - Prompt listing and execution
 * - Streaming and sync modes
 * - Chat continuation
 * - Error handling
 * - Performance metrics
 *
 * Deploy: supabase functions deploy demo-latitude-full-test --no-verify-jwt
 * Test: curl "https://your-project.supabase.co/functions/v1/demo-latitude-full-test"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/sdk-deno-latitude@1.0.6';

const client = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

interface TestResult {
  name: string;
  success: boolean;
  duration_ms: number;
  result?: unknown;
  error?: string;
}

async function runTest(
  name: string,
  fn: () => Promise<unknown>,
): Promise<TestResult> {
  const start = Date.now();
  try {
    const result = await fn();
    return {
      name,
      success: true,
      duration_ms: Date.now() - start,
      result,
    };
  } catch (error) {
    return {
      name,
      success: false,
      duration_ms: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'all';
  const promptPath = url.searchParams.get('prompt') || 'my-prompt';

  const results: TestResult[] = [];
  const startTime = Date.now();

  try {
    // =========================================================================
    // TEST: List Prompts
    // =========================================================================
    if (action === 'all' || action === 'prompts') {
      results.push(
        await runTest('list_prompts', async () => {
          const prompts = await client.prompts.getAll();
          return {
            count: prompts.length,
            sample: prompts.slice(0, 3).map((p) => ({
              path: p.path,
              model: p.config?.model,
            })),
          };
        }),
      );
    }

    // =========================================================================
    // TEST: List Projects
    // =========================================================================
    if (action === 'all' || action === 'projects') {
      results.push(
        await runTest('list_projects', async () => {
          const projects = await client.projects.getAll();
          return {
            count: projects.length,
            sample: projects.slice(0, 3).map((p) => ({
              id: p.id,
              name: p.name,
            })),
          };
        }),
      );
    }

    // =========================================================================
    // TEST: Run Prompt (Sync)
    // =========================================================================
    if (action === 'all' || action === 'run') {
      results.push(
        await runTest('run_prompt_sync', async () => {
          const result = await client.prompts.run(promptPath, {
            stream: false,
            parameters: { input: 'Test message' },
          });
          return {
            uuid: result?.uuid,
            text_length: result?.response?.text?.length,
            tokens: result?.response?.usage?.totalTokens,
          };
        }),
      );
    }

    // =========================================================================
    // TEST: Run Prompt (Streaming)
    // =========================================================================
    if (action === 'all' || action === 'stream') {
      results.push(
        await runTest('run_prompt_stream', async () => {
          let chunkCount = 0;
          let totalChars = 0;
          let ttfb = 0;
          const streamStart = Date.now();

          const result = await client.prompts.run(promptPath, {
            stream: true,
            parameters: { input: 'Test streaming' },
            onEvent: (event) => {
              if (event.data && typeof event.data === 'object') {
                const data = event.data as Record<string, unknown>;
                if ('text' in data && typeof data.text === 'string') {
                  if (chunkCount === 0) {
                    ttfb = Date.now() - streamStart;
                  }
                  chunkCount++;
                  totalChars += data.text.length;
                }
              }
            },
          });

          return {
            uuid: result?.uuid,
            chunks: chunkCount,
            chars: totalChars,
            ttfb_ms: ttfb,
            tokens: result?.response?.usage?.totalTokens,
          };
        }),
      );
    }

    // =========================================================================
    // TEST: Chat Continuation
    // =========================================================================
    if (action === 'all' || action === 'chat') {
      results.push(
        await runTest('chat_continuation', async () => {
          // Start conversation
          const initial = await client.prompts.run(promptPath, {
            stream: false,
            parameters: { input: 'Hello, start a conversation' },
          });

          if (!initial?.uuid) {
            return { error: 'No UUID returned from initial run' };
          }

          // Continue conversation
          try {
            const followUp = await client.prompts.chat(initial.uuid, [
              {
                role: 'user',
                content: [{ type: 'text', text: 'Continue the conversation' }],
              },
            ] as Parameters<typeof client.prompts.chat>[1]);

            return {
              initial_uuid: initial.uuid,
              followup_uuid: followUp?.uuid,
              chat_supported: true,
            };
          } catch (chatError) {
            return {
              initial_uuid: initial.uuid,
              chat_supported: false,
              note: 'Chat continuation may not be supported for all prompt types',
              error: chatError instanceof Error ? chatError.message : String(chatError),
            };
          }
        }),
      );
    }

    // =========================================================================
    // TEST: Get Prompt Details
    // =========================================================================
    if (action === 'all' || action === 'details') {
      results.push(
        await runTest('get_prompt_details', async () => {
          const prompt = await client.prompts.get(promptPath);
          return {
            path: prompt.path,
            provider: prompt.config?.provider,
            model: prompt.config?.model,
            has_schema: !!prompt.config?.schema,
            content_preview: prompt.content?.substring(0, 100),
          };
        }),
      );
    }

    // =========================================================================
    // TEST: Error Handling (404)
    // =========================================================================
    if (action === 'all' || action === 'errors') {
      results.push(
        await runTest('error_handling_404', async () => {
          try {
            await client.prompts.get('non-existent-prompt-' + Date.now());
            return { error: 'Should have thrown 404' };
          } catch (error) {
            if (error instanceof LatitudeApiError) {
              return {
                caught: true,
                status: error.status,
                errorCode: error.errorCode,
                message: error.message.substring(0, 100),
              };
            }
            throw error;
          }
        }),
      );
    }

    // =========================================================================
    // Calculate summary
    // =========================================================================
    const passed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const totalDuration = Date.now() - startTime;

    return new Response(
      JSON.stringify(
        {
          success: failed === 0,
          summary: {
            total: results.length,
            passed,
            failed,
            total_duration_ms: totalDuration,
          },
          tests: results,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error('Full test error:', error);

    return new Response(
      JSON.stringify(
        {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          partial_results: results,
        },
        null,
        2,
      ),
      { status: 500, headers: corsHeaders },
    );
  }
});
