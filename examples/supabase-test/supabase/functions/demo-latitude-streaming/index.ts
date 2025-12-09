/**
 * Demo: Streaming Responses
 * Business case: Real-time UI updates for chat applications.
 *
 * Features demonstrated:
 * - Server-Sent Events (SSE) streaming
 * - Time to first byte tracking
 * - Token-by-token delivery
 *
 * Deploy: supabase functions deploy demo-latitude-streaming --no-verify-jwt
 * Test: curl -N "https://your-project.supabase.co/functions/v1/demo-latitude-streaming"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/latitude-deno-sdk@1.0.6';

const client = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'stream';

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // =========================================================================
  // ACTION: STREAM - Server-Sent Events streaming
  // =========================================================================
  if (action === 'stream') {
    const headers = {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    // Get parameters
    let promptPath = 'my-prompt';
    let parameters: Record<string, unknown> = { input: 'Write a short poem about programming' };

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.prompt) promptPath = body.prompt;
        if (body.parameters) parameters = body.parameters;
      } catch {
        // Use defaults
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const startTime = Date.now();
        let firstChunkTime = 0;
        let chunkCount = 0;
        let totalChars = 0;

        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        // Send initial event
        send({ type: 'start', prompt: promptPath, timestamp: startTime });

        try {
          await client.prompts.run(promptPath, {
            stream: true,
            parameters,
            onEvent: (event) => {
              if (event.data && typeof event.data === 'object') {
                const data = event.data as Record<string, unknown>;
                if ('text' in data && typeof data.text === 'string') {
                  if (chunkCount === 0) {
                    firstChunkTime = Date.now() - startTime;
                    send({ type: 'first_chunk', ttfb_ms: firstChunkTime });
                  }
                  chunkCount++;
                  totalChars += data.text.length;
                  send({ type: 'chunk', text: data.text, chunk: chunkCount });
                }
              }
            },
            onFinished: (result) => {
              const duration = Date.now() - startTime;
              send({
                type: 'done',
                uuid: result.uuid,
                stats: {
                  duration_ms: duration,
                  ttfb_ms: firstChunkTime,
                  chunks: chunkCount,
                  chars: totalChars,
                  tokens: result.response?.usage?.totalTokens,
                },
              });
              controller.close();
            },
            onError: (error) => {
              send({ type: 'error', message: error.message });
              controller.close();
            },
          });
        } catch (error) {
          send({
            type: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
          controller.close();
        }
      },
    });

    return new Response(stream, { headers });
  }

  // =========================================================================
  // ACTION: COMPARE - Compare streaming vs sync timing
  // =========================================================================
  if (action === 'compare') {
    const jsonHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
    };

    try {
      const promptPath = url.searchParams.get('prompt') || 'my-prompt';
      const results: Record<string, unknown> = {
        prompt: promptPath,
        comparison: {},
      };

      // Streaming timing
      const streamStart = Date.now();
      let streamTTFB = 0;
      let firstReceived = false;

      await client.prompts.run(promptPath, {
        stream: true,
        parameters: { input: 'Hi' },
        onEvent: () => {
          if (!firstReceived) {
            streamTTFB = Date.now() - streamStart;
            firstReceived = true;
          }
        },
      });
      const streamTotal = Date.now() - streamStart;

      // Sync timing
      const syncStart = Date.now();
      await client.prompts.run(promptPath, {
        stream: false,
        parameters: { input: 'Hi' },
      });
      const syncTotal = Date.now() - syncStart;

      results.comparison = {
        streaming: {
          ttfb_ms: streamTTFB,
          total_ms: streamTotal,
          perceived_faster_by_ms: streamTotal - streamTTFB,
        },
        sync: {
          total_ms: syncTotal,
        },
        recommendation:
          streamTTFB < syncTotal
            ? 'Use streaming for better perceived performance'
            : 'Sync mode is faster for this prompt',
      };

      return new Response(JSON.stringify(results, null, 2), { headers: jsonHeaders });
    } catch (error) {
      if (error instanceof LatitudeApiError) {
        return new Response(
          JSON.stringify({ success: false, error: error.message, status: error.status }),
          { status: error.status, headers: jsonHeaders },
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: String(error) }),
        { status: 500, headers: jsonHeaders },
      );
    }
  }

  // =========================================================================
  // ACTION: HELP - Show usage
  // =========================================================================
  return new Response(
    JSON.stringify(
      {
        success: true,
        actions: {
          stream: {
            description: 'Stream response via Server-Sent Events',
            usage: '?action=stream or POST with { "prompt": "path", "parameters": {...} }',
            content_type: 'text/event-stream',
          },
          compare: {
            description: 'Compare streaming vs sync timing',
            usage: '?action=compare&prompt=my-prompt',
            content_type: 'application/json',
          },
        },
        example_events: [
          { type: 'start', prompt: 'my-prompt', timestamp: 1234567890 },
          { type: 'first_chunk', ttfb_ms: 150 },
          { type: 'chunk', text: 'Hello', chunk: 1 },
          { type: 'done', uuid: '...', stats: { duration_ms: 500, chunks: 10 } },
        ],
      },
      null,
      2,
    ),
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
});
