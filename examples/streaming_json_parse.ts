/**
 * Advanced: Streaming JSON Parser for Latitude Deno SDK.
 * Parse structured JSON output BEFORE the stream completes.
 *
 * This is incredibly useful for:
 * - Showing partial results in real-time (e.g., search results appearing one by one)
 * - Processing large JSON arrays incrementally
 * - Reducing perceived latency for structured outputs
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/streaming_json_parse.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Streaming JSON Parser - Parse Before Completion ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// Incremental JSON Parser Class
// Parses JSON objects as they stream in, before the response completes
// ─────────────────────────────────────────────────────────────────────────────

class IncrementalJSONParser<T = unknown> {
  private buffer = '';
  private depth = 0;
  private inString = false;
  private escapeNext = false;
  private arrayMode = false;
  private objectStart = -1;

  /**
   * Feed a chunk of text and get back any complete objects found.
   * Call this with each streaming chunk.
   */
  feed(chunk: string): T[] {
    const results: T[] = [];
    this.buffer += chunk;

    // Detect if we're parsing an array
    const trimmed = this.buffer.trimStart();
    if (!this.arrayMode && trimmed.startsWith('[')) {
      this.arrayMode = true;
      this.buffer = trimmed.substring(1); // Remove opening bracket
    }

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i];

      // Handle escape sequences in strings
      if (this.escapeNext) {
        this.escapeNext = false;
        continue;
      }

      if (char === '\\' && this.inString) {
        this.escapeNext = true;
        continue;
      }

      // Track string boundaries
      if (char === '"') {
        this.inString = !this.inString;
        continue;
      }

      // Skip everything inside strings
      if (this.inString) continue;

      // Track object/array depth
      if (char === '{') {
        if (this.depth === 0) {
          this.objectStart = i;
        }
        this.depth++;
      } else if (char === '}') {
        this.depth--;
        if (this.depth === 0 && this.objectStart !== -1) {
          // Complete object found!
          const json = this.buffer.substring(this.objectStart, i + 1);
          try {
            const parsed = JSON.parse(json) as T;
            results.push(parsed);
          } catch {
            // Incomplete or invalid JSON, continue
          }
          // Keep buffer after this object
          this.buffer = this.buffer.substring(i + 1).replace(/^[\s,]+/, '');
          i = -1; // Reset loop
          this.objectStart = -1;
        }
      }
    }

    return results;
  }

  /**
   * Get the current partial buffer (useful for debugging)
   */
  getPartial(): string {
    return this.buffer;
  }

  /**
   * Reset the parser state
   */
  reset(): void {
    this.buffer = '';
    this.depth = 0;
    this.inString = false;
    this.escapeNext = false;
    this.arrayMode = false;
    this.objectStart = -1;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Example 1: Parse array items as they arrive
// ─────────────────────────────────────────────────────────────────────────────

console.log('Example 1: Parse JSON array items incrementally\n');

interface SearchResult {
  title: string;
  url: string;
  description?: string;
}

const parser1 = new IncrementalJSONParser<SearchResult>();
let resultCount = 0;
const parseStart = Date.now();

console.log('Results appearing as they stream:');
console.log('─'.repeat(50));

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: {
    input: 'Return a JSON array of 5 search results about TypeScript',
  },
  onEvent: (event) => {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        // Feed text to parser and get complete objects
        const objects = parser1.feed(data.text);

        for (const obj of objects) {
          resultCount++;
          const elapsed = Date.now() - parseStart;
          console.log(`\n[${elapsed}ms] Result #${resultCount}:`);
          console.log(`  Title: ${obj.title}`);
          console.log(`  URL: ${obj.url}`);
          if (obj.description) {
            console.log(`  Desc: ${obj.description.substring(0, 50)}...`);
          }
        }
      }
    }
  },
  onFinished: () => {
    console.log('─'.repeat(50));
    console.log(`\n✓ Stream complete. Parsed ${resultCount} objects incrementally.`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Example 2: Real-time progress with partial data
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n\nExample 2: Show progress with partial data\n');

interface ProfileData {
  name: string;
  company: string;
  role: string;
}

const parser2 = new IncrementalJSONParser<ProfileData>();
const profiles: ProfileData[] = [];

console.log('Extracting profiles (showing as they appear):');
console.log('─'.repeat(50));

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: {
    input: 'Extract 3 fictional LinkedIn profiles as JSON array',
  },
  onEvent: (event) => {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        const newProfiles = parser2.feed(data.text);

        for (const profile of newProfiles) {
          profiles.push(profile);
          console.log(`\n✓ Found: ${profile.name} - ${profile.role} @ ${profile.company}`);
        }

        // Show partial progress
        const partial = parser2.getPartial();
        if (partial.length > 10) {
          // Show we're parsing something
          process.stdout.write('.');
        }
      }
    }
  },
  onFinished: () => {
    console.log('\n' + '─'.repeat(50));
    console.log(`\nExtracted ${profiles.length} profiles before stream ended!`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Example 3: Callback-based incremental processing
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n\nExample 3: Callback-based processing\n');

/**
 * Process streaming JSON with a callback for each object.
 * This pattern is great for real-time UI updates.
 */
async function processStreamingJSON<T>(
  promptPath: string,
  parameters: Record<string, unknown>,
  onObject: (obj: T, index: number) => void,
): Promise<T[]> {
  const parser = new IncrementalJSONParser<T>();
  const allObjects: T[] = [];
  let index = 0;

  await latitude.prompts.run(promptPath, {
    stream: true,
    parameters,
    onEvent: (event) => {
      if (event.data && typeof event.data === 'object') {
        const data = event.data as Record<string, unknown>;
        if ('text' in data && typeof data.text === 'string') {
          const objects = parser.feed(data.text);
          for (const obj of objects) {
            allObjects.push(obj);
            onObject(obj, index++);
          }
        }
      }
    },
  });

  return allObjects;
}

// Usage example
interface Task {
  id: number;
  title: string;
  priority: string;
}

const tasks = await processStreamingJSON<Task>(
  'my-prompt',
  { input: 'Generate 3 tasks as JSON array with id, title, priority' },
  (task, idx) => {
    console.log(`[Callback] Task ${idx + 1}: ${task.title} (${task.priority})`);
  },
);

console.log(`\nTotal tasks processed: ${tasks.length}`);

// ─────────────────────────────────────────────────────────────────────────────
// Example 4: Timing comparison - Incremental vs Wait-for-complete
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n\nExample 4: Timing - Incremental vs Wait-for-complete\n');

// Incremental timing
const incrementalTimes: number[] = [];
const incrementalStart = Date.now();
const parser4 = new IncrementalJSONParser();

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'Return 5 items as JSON array' },
  onEvent: (event) => {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        const objects = parser4.feed(data.text);
        for (const _ of objects) {
          incrementalTimes.push(Date.now() - incrementalStart);
        }
      }
    }
  },
});
const incrementalTotal = Date.now() - incrementalStart;

// Sync (wait for complete)
const syncStart2 = Date.now();
await latitude.prompts.run('my-prompt', {
  stream: false,
  parameters: { input: 'Return 5 items as JSON array' },
});
const syncTotal2 = Date.now() - syncStart2;

console.log('Incremental parsing times (ms after start):');
incrementalTimes.forEach((t, i) => console.log(`  Item ${i + 1}: ${t}ms`));
console.log(`  Total: ${incrementalTotal}ms`);
console.log(`\nSync (wait for complete): ${syncTotal2}ms`);

if (incrementalTimes.length > 0) {
  const avgTimeSaved = syncTotal2 - incrementalTimes[0];
  console.log(`\n💡 First item available ${avgTimeSaved}ms earlier with streaming!`);
}

console.log('\n=== Streaming JSON Parser Examples Complete ===');
