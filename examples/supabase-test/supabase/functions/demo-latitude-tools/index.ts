/**
 * Demo: Tool Calling
 * Business case: AI assistants that can perform actions (weather, calculations, etc.)
 *
 * Features demonstrated:
 * - Defining typed tools
 * - Tool execution and result handling
 * - Multiple tool calls in single request
 *
 * Deploy: supabase functions deploy demo-latitude-tools --no-verify-jwt
 * Test: curl "https://your-project.supabase.co/functions/v1/demo-latitude-tools"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/latitude-deno-sdk@1.0.6';

const client = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

// Define tool types for type safety
type Tools = {
  "get_weather": { location: string };
  "get_time": { timezone?: string };
  "calculate": { expression: string };
};

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'demo';

    // Track tool calls for response
    const toolCalls: Array<{
      name: string;
      args: unknown;
      result: unknown;
      timestamp: number;
    }> = [];

    const start = Date.now();

    // =========================================================================
    // ACTION: DEMO - Run assistant prompt with tools
    // =========================================================================
    if (action === 'demo') {
      // Get prompt and parameters from request or use defaults
      let promptPath = 'assistant';
      let parameters: Record<string, unknown> = { location: 'San Francisco' };

      if (req.method === 'POST') {
        try {
          const body = await req.json();
          if (body.prompt) promptPath = body.prompt;
          if (body.parameters) parameters = body.parameters;
        } catch {
          // Use defaults
        }
      }

      const result = await client.prompts.run<'text', Tools>(promptPath, {
        stream: false,
        parameters,
        tools: {
          "get_weather": async ({ location }) => {
            const response = {
              location,
              temperature: Math.floor(Math.random() * 30) + 10,
              unit: 'celsius',
              conditions: ['Sunny', 'Cloudy', 'Rainy', 'Windy'][Math.floor(Math.random() * 4)],
              humidity: Math.floor(Math.random() * 60) + 40,
            };
            toolCalls.push({
              name: 'get_weather',
              args: { location },
              result: response,
              timestamp: Date.now() - start,
            });
            return await Promise.resolve(response);
          },

          "get_time": async ({ timezone = 'UTC' }) => {
            const now = new Date();
            const response = {
              timezone,
              time: now.toLocaleTimeString('en-US', { timeZone: timezone }),
              date: now.toLocaleDateString('en-US', { timeZone: timezone }),
              timestamp: now.toISOString(),
            };
            toolCalls.push({
              name: 'get_time',
              args: { timezone },
              result: response,
              timestamp: Date.now() - start,
            });
            return await Promise.resolve(response);
          },

          "calculate": async ({ expression }) => {
            let calculatedResult: number | string;
            try {
              // Safe evaluation for simple math
              calculatedResult = Function(`"use strict"; return (${expression})`)();
            } catch {
              calculatedResult = 'Invalid expression';
            }
            const response = {
              expression,
              result: calculatedResult,
            };
            toolCalls.push({
              name: 'calculate',
              args: { expression },
              result: response,
              timestamp: Date.now() - start,
            });
            return await Promise.resolve(response);
          },
        },
      });

      return new Response(
        JSON.stringify(
          {
            success: true,
            prompt: promptPath,
            parameters,
            response: {
              uuid: result?.uuid,
              text: result?.response?.text,
              tokens: result?.response?.usage?.totalTokens,
            },
            tool_calls: toolCalls,
            total_duration_ms: Date.now() - start,
          },
          null,
          2,
        ),
        { headers: corsHeaders },
      );
    }

    // =========================================================================
    // ACTION: LIST - Show available tools
    // =========================================================================
    if (action === 'list') {
      return new Response(
        JSON.stringify(
          {
            success: true,
            available_tools: [
              {
                name: 'get_weather',
                description: 'Get weather for a location',
                parameters: { location: 'string (required)' },
              },
              {
                name: 'get_time',
                description: 'Get current time in a timezone',
                parameters: { timezone: 'string (optional, default: UTC)' },
              },
              {
                name: 'calculate',
                description: 'Evaluate a math expression',
                parameters: { expression: 'string (required)' },
              },
            ],
            usage: {
              demo: '?action=demo - Run prompt with tools',
              custom: 'POST with { "prompt": "path", "parameters": {...} }',
            },
          },
          null,
          2,
        ),
        { headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: `Unknown action: ${action}`,
        available_actions: ['demo', 'list'],
      }),
      { status: 400, headers: corsHeaders },
    );
  } catch (error) {
    console.error('Tool calling error:', error);

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

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
