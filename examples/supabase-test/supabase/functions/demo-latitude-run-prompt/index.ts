/**
 * Demo: Run Prompt
 * Business case: Execute AI prompts with parameters.
 *
 * Features demonstrated:
 * - Basic prompt execution
 * - Parameter passing
 * - Sync vs streaming modes
 * - Structured JSON output
 *
 * Deploy: supabase functions deploy demo-latitude-run-prompt --no-verify-jwt
 * Test: curl "https://your-project.supabase.co/functions/v1/demo-latitude-run-prompt"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/latitude-deno-sdk@1.0.10';

const LATITUDE_API_KEY = Deno.env.get('LATITUDE_API_KEY')!;
const LATITUDE_PROJECT_ID = Number(Deno.env.get('LATITUDE_PROJECT_ID'))!;

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
  const mode = url.searchParams.get('mode') || 'sync'; // sync, stream, json

  const latitude = new Latitude(LATITUDE_API_KEY, {
    projectId: LATITUDE_PROJECT_ID,
  });

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    mode,
  };

  try {
    // Get prompt path from request or use default
    let promptPath = 'extract-linkedin-from-serp';
    let parameters: Record<string, unknown> = {
      query: 'test engineer',
      serp_results: JSON.stringify({
        organic: [
          {
            title: 'Alice Smith - Senior Engineer at Google',
            snippet: 'LinkedIn · Alice Smith · Google · Mountain View',
            link: 'https://linkedin.com/in/alice-smith',
            position: 1,
          },
          {
            title: 'Bob Jones - Tech Lead at Meta',
            snippet: 'LinkedIn · Bob Jones · Meta · Menlo Park',
            link: 'https://linkedin.com/in/bob-jones',
            position: 2,
          },
        ],
      }),
    };

    // Allow custom prompt/params via POST
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.prompt) promptPath = body.prompt;
        if (body.parameters) parameters = body.parameters;
      } catch {
        // Use defaults
      }
    }

    results.prompt = promptPath;

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: SYNC - Wait for complete response
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === 'sync') {
      const start = Date.now();
      const result = await latitude.prompts.run(promptPath, {
        stream: false,
        parameters,
      });
      const duration = Date.now() - start;

      results.success = true;
      results.duration_ms = duration;
      results.response = {
        uuid: result?.uuid,
        text: result?.response?.text?.substring(0, 500),
        tokens: result?.response?.usage?.totalTokens,
        has_structured_output: !!(result?.response as unknown as { object?: unknown })?.object,
      };

      // If structured output
      const responseObj = result?.response as unknown as { object?: unknown };
      if (responseObj?.object) {
        results.structured_output = responseObj.object;
      }
    } // ═══════════════════════════════════════════════════════════════════════
    // MODE: STREAM - Stream response with timing
    // ═══════════════════════════════════════════════════════════════════════
    else if (mode === 'stream') {
      const start = Date.now();
      let firstChunkTime = 0;
      let chunkCount = 0;
      let totalChars = 0;
      const chunks: string[] = [];

      await latitude.prompts.run(promptPath, {
        stream: true,
        parameters,
        onEvent: (event) => {
          if (event.data && typeof event.data === 'object') {
            const data = event.data as Record<string, unknown>;
            if ('text' in data && typeof data.text === 'string') {
              if (chunkCount === 0) {
                firstChunkTime = Date.now() - start;
              }
              chunkCount++;
              totalChars += data.text.length;
              chunks.push(data.text);
            }
          }
        },
        onFinished: (result) => {
          const duration = Date.now() - start;
          results.success = true;
          results.streaming = {
            time_to_first_chunk_ms: firstChunkTime,
            total_duration_ms: duration,
            chunk_count: chunkCount,
            total_chars: totalChars,
            preview: chunks.join('').substring(0, 300),
          };
          results.response = {
            uuid: result.uuid,
            tokens: result.response?.usage?.totalTokens,
          };
        },
        onError: (error) => {
          results.success = false;
          results.error = error.message;
        },
      });
    } // ═══════════════════════════════════════════════════════════════════════
    // MODE: JSON - Structured output parsing
    // ═══════════════════════════════════════════════════════════════════════
    else if (mode === 'json') {
      const start = Date.now();
      const result = await latitude.prompts.run(promptPath, {
        stream: false,
        parameters,
      });
      const duration = Date.now() - start;

      const responseObj = result?.response as unknown as { object?: unknown };
      results.success = true;
      results.duration_ms = duration;
      results.structured_output = responseObj?.object ?? null;
      results.raw_text = result?.response?.text?.substring(0, 200);

      // If it's an array, show stats
      if (Array.isArray(responseObj?.object)) {
        results.array_stats = {
          count: responseObj.object.length,
          sample: responseObj.object[0],
        };
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Run prompt error:', error);

    let errorDetails: Record<string, unknown> = {
      message: error instanceof Error ? error.message : String(error),
    };

    if (error instanceof LatitudeApiError) {
      errorDetails = {
        ...errorDetails,
        status: error.status,
        error_code: error.errorCode,
      };
    }

    return new Response(
      JSON.stringify(
        {
          success: false,
          error: errorDetails,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
      { status: 500, headers: corsHeaders },
    );
  }
});
