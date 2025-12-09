/**
 * Supabase Edge Function example for Latitude Deno SDK.
 *
 * This file demonstrates how to use the SDK in a Supabase Edge Function.
 * Deploy to Supabase with:
 *   supabase functions deploy my-function
 *
 * Set the secrets:
 *   supabase secrets set LATITUDE_API_KEY=lat_xxx
 *   supabase secrets set LATITUDE_PROJECT_ID=123
 */

import { Latitude, LatitudeApiError } from '../src/mod.ts';
import { MessageRole } from '../src/constants/index.ts';

// Initialize client outside handler for reuse across invocations
const apiKey = Deno.env.get('LATITUDE_API_KEY');
const projectId = Deno.env.get('LATITUDE_PROJECT_ID');

if (!apiKey || !projectId) {
  throw new Error('Missing LATITUDE_API_KEY or LATITUDE_PROJECT_ID in environment');
}

const latitude = new Latitude(apiKey, {
  projectId: Number(projectId),
});

/**
 * Edge Function handler for running prompts.
 *
 * Example requests:
 * POST /run
 * { "prompt": "my-prompt", "parameters": { "input": "Hello" } }
 *
 * POST /chat
 * { "uuid": "conversation-uuid", "message": "Follow up question" }
 */
export default async function handler(req: Request): Promise<Response> {
  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'application/json',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'run';

    // Parse request body
    let body: Record<string, unknown> = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        // Empty body is ok
      }
    }

    // ==========================================================================
    // ACTION: RUN - Execute a prompt
    // ==========================================================================
    if (action === 'run') {
      const promptPath = (body.prompt as string) || 'my-prompt';
      const parameters = (body.parameters as Record<string, unknown>) || {};

      const result = await latitude.prompts.run(promptPath, {
        stream: false,
        parameters,
      });

      return new Response(
        JSON.stringify({
          success: true,
          uuid: result?.uuid,
          text: result?.response?.text,
          tokens: result?.response?.usage?.totalTokens,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // ==========================================================================
    // ACTION: CHAT - Continue a conversation
    // ==========================================================================
    if (action === 'chat') {
      const uuid = body.uuid as string;
      const message = body.message as string;

      if (!uuid || !message) {
        return new Response(
          JSON.stringify({ error: "Missing 'uuid' or 'message' in request body" }),
          { status: 400, headers: corsHeaders },
        );
      }

      const result = await latitude.prompts.chat(uuid, [
        { role: MessageRole.user, content: [{ type: 'text', text: message }] },
      ]);

      return new Response(
        JSON.stringify({
          success: true,
          uuid: result?.uuid,
          text: result?.response?.text,
          tokens: result?.response?.usage?.totalTokens,
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // ==========================================================================
    // ACTION: LIST - List available prompts
    // ==========================================================================
    if (action === 'list') {
      const prompts = await latitude.prompts.getAll();

      return new Response(
        JSON.stringify({
          success: true,
          count: prompts.length,
          prompts: prompts.map((p) => ({
            path: p.path,
            model: p.config?.model,
          })),
        }),
        { status: 200, headers: corsHeaders },
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({
        error: `Unknown action: ${action}`,
        available_actions: ['run', 'chat', 'list'],
      }),
      { status: 400, headers: corsHeaders },
    );
  } catch (error) {
    console.error('Edge function error:', error);

    // Handle Latitude-specific errors
    if (error instanceof LatitudeApiError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          status: error.status,
          errorCode: error.errorCode,
        }),
        { status: error.status, headers: corsHeaders },
      );
    }

    // Generic error
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders },
    );
  }
}

// =============================================================================
// Streaming handler example
// =============================================================================

/**
 * Example: Streaming response for real-time UI updates
 * POST /stream
 * { "prompt": "my-prompt", "parameters": { "input": "Hello" } }
 */
export async function streamHandler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const promptPath = (body.prompt as string) || 'my-prompt';
    const parameters = (body.parameters as Record<string, unknown>) || {};

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        await latitude.prompts.run(promptPath, {
          stream: true,
          parameters,
          onEvent: (event) => {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          },
          onFinished: (result) => {
            const data = `data: ${JSON.stringify({ type: 'done', uuid: result.uuid })}\n\n`;
            controller.enqueue(encoder.encode(data));
            controller.close();
          },
          onError: (error) => {
            const data = `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`;
            controller.enqueue(encoder.encode(data));
            controller.close();
          },
        });
      },
    });

    return new Response(stream, { headers: corsHeaders });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}

// =============================================================================
// Tool calling handler example
// =============================================================================

/**
 * Example: Prompt with tool calling
 * POST /tools
 * { "prompt": "assistant", "parameters": { "location": "Boston" } }
 */
export async function toolsHandler(req: Request): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    const promptPath = (body.prompt as string) || 'assistant';
    const parameters = (body.parameters as Record<string, unknown>) || {};

    type Tools = {
      "get_weather": { location: string };
      "get_time": { timezone?: string };
    };

    const toolCalls: Array<{ name: string; args: unknown; result: unknown }> = [];

    const result = await latitude.prompts.run<'text', Tools>(promptPath, {
      stream: false,
      parameters,
      tools: {
        "get_weather": async ({ location }) => {
          const response = { location, temperature: '20°C', conditions: 'Sunny' };
          toolCalls.push({ name: 'get_weather', args: { location }, result: response });
          return await Promise.resolve(response);
        },
        "get_time": async ({ timezone = 'UTC' }) => {
          const response = { timezone, time: new Date().toISOString() };
          toolCalls.push({ name: 'get_time', args: { timezone }, result: response });
          return await Promise.resolve(response);
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        uuid: result?.uuid,
        text: result?.response?.text,
        toolCalls,
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    if (error instanceof LatitudeApiError) {
      return new Response(
        JSON.stringify({ success: false, error: error.message, status: error.status }),
        { status: error.status, headers: corsHeaders },
      );
    }
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: corsHeaders },
    );
  }
}
