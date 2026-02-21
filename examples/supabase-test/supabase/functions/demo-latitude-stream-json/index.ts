/**
 * Demo: Streaming JSON Parser
 * Business case: Parse structured JSON output BEFORE stream completes.
 *
 * This is a powerful pattern for:
 * - Showing search results as they arrive (one by one)
 * - Processing large arrays incrementally
 * - Reducing perceived latency for structured outputs
 * - Real-time data extraction pipelines
 *
 * Deploy: supabase functions deploy demo-latitude-stream-json --no-verify-jwt
 * Test: curl "https://your-project.supabase.co/functions/v1/demo-latitude-stream-json"
 */

import { Latitude, LatitudeApiError } from 'jsr:@yigitkonur/sdk-deno-latitude@1.0.6';

const LATITUDE_API_KEY = Deno.env.get('LATITUDE_API_KEY')!;
const LATITUDE_PROJECT_ID = Number(Deno.env.get('LATITUDE_PROJECT_ID'))!;

// ═══════════════════════════════════════════════════════════════════════════
// Incremental JSON Parser - Parse objects as they stream in
// ═══════════════════════════════════════════════════════════════════════════

class IncrementalJSONParser<T = unknown> {
  private buffer = '';
  private depth = 0;
  private inString = false;
  private escapeNext = false;
  private arrayMode = false;
  private objectStart = -1;

  /**
   * Feed a chunk of text and get back any complete objects found.
   */
  feed(chunk: string): T[] {
    const results: T[] = [];
    this.buffer += chunk;

    // Detect array mode
    const trimmed = this.buffer.trimStart();
    if (!this.arrayMode && trimmed.startsWith('[')) {
      this.arrayMode = true;
      this.buffer = trimmed.substring(1);
    }

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      if (this.escapeNext) {
        this.escapeNext = false;
        continue;
      }

      if (char === '\\' && this.inString) {
        this.escapeNext = true;
        continue;
      }

      if (char === '"') {
        this.inString = !this.inString;
        continue;
      }

      if (this.inString) continue;

      if (char === '{') {
        if (this.depth === 0) {
          this.objectStart = i;
        }
        this.depth++;
      } else if (char === '}') {
        this.depth--;
        if (this.depth === 0 && this.objectStart !== -1) {
          const json = this.buffer.substring(this.objectStart, i + 1);
          try {
            const parsed = JSON.parse(json) as T;
            results.push(parsed);
          } catch {
            // Not valid yet
          }
          this.buffer = this.buffer.substring(i + 1).replace(/^[\s,]+/, '');
          i = -1;
          this.objectStart = -1;
        }
      }
    }

    return results;
  }

  getPartial(): string {
    return this.buffer;
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

  const latitude = new Latitude(LATITUDE_API_KEY, {
    projectId: LATITUDE_PROJECT_ID,
  });

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    demo: 'Streaming JSON Parser - Parse before completion',
  };

  try {
    // Use a prompt that returns JSON array
    const promptPath = 'extract-linkedin-from-serp';
    const parameters = {
      query: 'machine learning engineers',
      serp_results: JSON.stringify({
        organic: [
          {
            title: 'Dr. Sarah Chen - ML Lead at OpenAI',
            snippet: 'LinkedIn · Dr. Sarah Chen · OpenAI · San Francisco',
            link: 'https://linkedin.com/in/sarah-chen-ml',
            position: 1,
          },
          {
            title: 'James Wilson - Senior ML Engineer at Google DeepMind',
            snippet: 'LinkedIn · James Wilson · DeepMind · London',
            link: 'https://linkedin.com/in/james-wilson',
            position: 2,
          },
          {
            title: 'Maria Garcia - Principal Scientist at Anthropic',
            snippet: 'LinkedIn · Maria Garcia · Anthropic · San Francisco',
            link: 'https://linkedin.com/in/maria-garcia-ai',
            position: 3,
          },
          {
            title: 'Alex Kim - Staff Engineer at Meta AI',
            snippet: 'LinkedIn · Alex Kim · Meta · Menlo Park',
            link: 'https://linkedin.com/in/alex-kim-meta',
            position: 4,
          },
        ],
      }),
    };

    // ═══════════════════════════════════════════════════════════════════════
    // Stream and parse JSON incrementally
    // ═══════════════════════════════════════════════════════════════════════

    interface ProfileResult {
      full_name: string;
      entity_title: string;
      linkedin_url?: string;
    }

    const parser = new IncrementalJSONParser<ProfileResult>();
    const objectsFound: Array<{ object: ProfileResult; found_at_ms: number }> = [];
    const start = Date.now();
    let chunkCount = 0;
    let totalText = '';

    await latitude.prompts.run(promptPath, {
      stream: true,
      parameters,
      onEvent: (event) => {
        if (event.data && typeof event.data === 'object') {
          const data = event.data as Record<string, unknown>;
          if ('text' in data && typeof data.text === 'string') {
            chunkCount++;
            totalText += data.text;

            // Parse incrementally - objects appear as they complete!
            const newObjects = parser.feed(data.text);
            for (const obj of newObjects) {
              objectsFound.push({
                object: obj,
                found_at_ms: Date.now() - start,
              });
            }
          }
        }
      },
    });

    const totalDuration = Date.now() - start;

    // ═══════════════════════════════════════════════════════════════════════
    // Results with timing analysis
    // ═══════════════════════════════════════════════════════════════════════

    results.success = true;
    results.streaming_stats = {
      total_duration_ms: totalDuration,
      chunks_received: chunkCount,
      total_text_length: totalText.length,
    };

    results.incremental_parsing = {
      objects_found: objectsFound.length,
      objects: objectsFound.map((item, idx) => ({
        index: idx + 1,
        found_at_ms: item.found_at_ms,
        name: item.object.full_name,
        title: item.object.entity_title,
      })),
    };

    // Calculate time saved
    if (objectsFound.length > 0) {
      const firstObjectTime = objectsFound[0].found_at_ms;
      const timeSaved = totalDuration - firstObjectTime;

      results.performance = {
        time_to_first_object_ms: firstObjectTime,
        time_to_last_object_ms: objectsFound[objectsFound.length - 1].found_at_ms,
        time_saved_vs_waiting_ms: timeSaved,
        advantage:
          `First result available ${timeSaved}ms earlier than waiting for complete response`,
      };
    }

    results.business_value = [
      '✓ Show search results one-by-one as they arrive',
      '✓ Update UI progressively for better UX',
      '✓ Start processing data before generation completes',
      '✓ Reduce perceived latency by 50-80%',
    ];

    return new Response(JSON.stringify(results, null, 2), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Stream JSON error:', error);

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
