/**
 * Demo: Multi-turn Chat
 * Business case: Build conversational AI experiences.
 *
 * Features demonstrated:
 * - Starting conversations
 * - Continuing with follow-up messages
 * - Conversation context management
 *
 * Deploy: supabase functions deploy demo-latitude-chat --no-verify-jwt
 * Test: curl "https://your-project.supabase.co/functions/v1/demo-latitude-chat"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/latitude-deno-sdk@1.0.6';

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
  const action = url.searchParams.get('action') || 'demo'; // demo, start, continue

  const latitude = new Latitude(LATITUDE_API_KEY, {
    projectId: LATITUDE_PROJECT_ID,
  });

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    action,
  };

  try {
    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: DEMO - Full conversation demonstration
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'demo') {
      const conversation: Array<{
        role: 'user' | 'assistant';
        message: string;
        timestamp_ms: number;
      }> = [];

      const start = Date.now();

      // Turn 1: Start conversation
      const initial = await latitude.prompts.run('extract-linkedin-from-serp', {
        stream: false,
        parameters: {
          query: 'data scientists',
          serp_results: JSON.stringify({
            organic: [
              {
                title: 'Emma Watson - Data Scientist at Netflix',
                snippet: 'LinkedIn · Emma Watson · Netflix · Los Angeles',
                link: 'https://linkedin.com/in/emma-watson-ds',
                position: 1,
              },
            ],
          }),
        },
      });

      conversation.push({
        role: 'user',
        message: 'Find data scientists from search results',
        timestamp_ms: Date.now() - start,
      });

      conversation.push({
        role: 'assistant',
        message: initial?.response?.text?.substring(0, 200) + '...' || '',
        timestamp_ms: Date.now() - start,
      });

      results.initial = {
        uuid: initial?.uuid,
        response_preview: initial?.response?.text?.substring(0, 100),
      };

      // Turn 2: Follow-up (if chat is supported)
      if (initial?.uuid) {
        try {
          const followUp = await latitude.prompts.chat(initial.uuid, [
            {
              role: 'user' as const,
              content: 'Add another profile: John Smith - ML Engineer at Spotify',
            },
          ]);

          conversation.push({
            role: 'user',
            message: 'Add another profile: John Smith - ML Engineer at Spotify',
            timestamp_ms: Date.now() - start,
          });

          conversation.push({
            role: 'assistant',
            message: followUp?.response?.text?.substring(0, 200) + '...' || '',
            timestamp_ms: Date.now() - start,
          });

          results.follow_up = {
            uuid: followUp?.uuid,
            response_preview: followUp?.response?.text?.substring(0, 100),
          };
        } catch (chatError) {
          results.follow_up = {
            note: 'Chat continuation may not be supported for all prompt types',
            error: chatError instanceof Error ? chatError.message : String(chatError),
          };
        }
      }

      results.success = true;
      results.conversation = conversation;
      results.total_duration_ms = Date.now() - start;
    } // ═══════════════════════════════════════════════════════════════════════
    // ACTION: START - Start a new conversation
    // ═══════════════════════════════════════════════════════════════════════
    else if (action === 'start') {
      let promptPath = 'extract-linkedin-from-serp';
      let parameters: Record<string, unknown> = {
        query: 'engineers',
        serp_results: JSON.stringify({
          organic: [{
            title: 'Test',
            snippet: 'LinkedIn',
            link: 'https://linkedin.com/in/test',
            position: 1,
          }],
        }),
      };

      // Allow custom prompt via POST
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          if (body.prompt) promptPath = body.prompt;
          if (body.parameters) parameters = body.parameters;
        } catch {
          // Use defaults
        }
      }

      const start = Date.now();
      const result = await latitude.prompts.run(promptPath, {
        stream: false,
        parameters,
      });

      results.success = true;
      results.conversation_uuid = result?.uuid;
      results.response = {
        text: result?.response?.text?.substring(0, 300),
        tokens: result?.response?.usage?.totalTokens,
      };
      results.duration_ms = Date.now() - start;
      results.next_step =
        `Use ?action=continue&uuid=${result?.uuid} with POST body containing messages`;
    } // ═══════════════════════════════════════════════════════════════════════
    // ACTION: CONTINUE - Continue an existing conversation
    // ═══════════════════════════════════════════════════════════════════════
    else if (action === 'continue') {
      const uuid = url.searchParams.get('uuid');

      if (!uuid) {
        return new Response(
          JSON.stringify(
            {
              success: false,
              error: 'Missing uuid parameter',
              usage:
                '?action=continue&uuid=<conversation-uuid> with POST body: { "message": "your message" }',
            },
            null,
            2,
          ),
          { status: 400, headers: corsHeaders },
        );
      }

      let message = 'Can you provide more details?';

      if (req.method === 'POST') {
        try {
          const body = await req.json();
          if (body.message) message = body.message;
        } catch {
          // Use default
        }
      }

      const start = Date.now();

      try {
        const result = await latitude.prompts.chat(uuid, [
          { role: 'user' as const, content: message },
        ]);

        results.success = true;
        results.conversation_uuid = result?.uuid;
        results.user_message = message;
        results.response = {
          text: result?.response?.text?.substring(0, 300),
          tokens: result?.response?.usage?.totalTokens,
        };
        results.duration_ms = Date.now() - start;
      } catch (chatError) {
        results.success = false;
        results.error = chatError instanceof Error ? chatError.message : String(chatError);
        results.note =
          'Chat continuation may not be supported for all prompt types (e.g., JSON schema prompts)';
      }
    }

    return new Response(JSON.stringify(results, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Chat error:', error);

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
        },
        null,
        2,
      ),
      { status: 500, headers: corsHeaders },
    );
  }
});
