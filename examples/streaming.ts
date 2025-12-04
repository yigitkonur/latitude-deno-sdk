/**
 * Streaming example for Latitude Deno SDK.
 * Demonstrates real-time streaming with callbacks for progressive UI updates.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/streaming.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Latitude SDK Streaming Examples ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic streaming with text output
// ─────────────────────────────────────────────────────────────────────────────
console.log('1. Basic streaming (text appears progressively)...\n');

let charCount = 0;
const startTime = Date.now();

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'Write a short poem about coding' },
  onEvent: (event) => {
    // Process each streaming event
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        // Print text as it arrives (no newline for streaming effect)
        Deno.stdout.writeSync(new TextEncoder().encode(data.text));
        charCount += data.text.length;
      }
    }
  },
  onFinished: (result) => {
    const duration = Date.now() - startTime;
    console.log('\n');
    console.log(`✓ Stream complete: ${charCount} chars in ${duration}ms`);
    console.log(`  Tokens: ${result.response?.usage?.totalTokens ?? 'N/A'}`);
  },
  onError: (error) => {
    console.error('\n✗ Stream error:', error.message);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Streaming with event type tracking
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n2. Streaming with event tracking...\n');

interface EventStats {
  type: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

const eventStats: Map<string, EventStats> = new Map();
const trackStart = Date.now();

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'Explain TypeScript in one sentence' },
  onEvent: (event) => {
    const eventType = event.event || 'unknown';
    const now = Date.now() - trackStart;

    if (!eventStats.has(eventType)) {
      eventStats.set(eventType, {
        type: eventType,
        count: 0,
        firstSeen: now,
        lastSeen: now,
      });
    }

    const stats = eventStats.get(eventType)!;
    stats.count++;
    stats.lastSeen = now;
  },
  onFinished: () => {
    console.log('Event statistics:');
    for (const [type, stats] of eventStats) {
      console.log(`  ${type}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    First: ${stats.firstSeen}ms, Last: ${stats.lastSeen}ms`);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Streaming with progress indicator
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n3. Streaming with progress indicator...\n');

let tokenEstimate = 0;
const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;

const progressInterval = setInterval(() => {
  Deno.stdout.writeSync(
    new TextEncoder().encode(`\r${spinner[spinnerIndex]} Processing... (~${tokenEstimate} tokens)`),
  );
  spinnerIndex = (spinnerIndex + 1) % spinner.length;
}, 100);

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'List 3 programming languages' },
  onEvent: (event) => {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        // Rough estimate: 4 chars per token
        tokenEstimate += Math.ceil(data.text.length / 4);
      }
    }
  },
  onFinished: (result) => {
    clearInterval(progressInterval);
    console.log(
      `\r✓ Complete! Actual tokens: ${result.response?.usage?.totalTokens ?? tokenEstimate}`,
    );
  },
  onError: (error) => {
    clearInterval(progressInterval);
    console.log(`\r✗ Error: ${error.message}`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Streaming with buffer accumulation
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n4. Streaming with buffer accumulation...\n');

const textBuffer: string[] = [];

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'What is Deno?' },
  onEvent: (event) => {
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data && typeof data.text === 'string') {
        textBuffer.push(data.text);
      }
    }
  },
  onFinished: () => {
    const fullText = textBuffer.join('');
    console.log('Accumulated response:');
    console.log(`  Chunks received: ${textBuffer.length}`);
    console.log(`  Total length: ${fullText.length} chars`);
    console.log(`  Preview: ${fullText.substring(0, 150)}...`);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Streaming vs Sync comparison
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n5. Streaming vs Sync timing comparison...\n');

// Streaming - time to first byte
let ttfb = 0;
const streamStart = Date.now();
let firstByteReceived = false;

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'Hi' },
  onEvent: () => {
    if (!firstByteReceived) {
      ttfb = Date.now() - streamStart;
      firstByteReceived = true;
    }
  },
});
const streamTotal = Date.now() - streamStart;

// Sync - no TTFB, just total time
const syncStart = Date.now();
await latitude.prompts.run('my-prompt', {
  stream: false,
  parameters: { input: 'Hi' },
});
const syncTotal = Date.now() - syncStart;

console.log('Timing comparison:');
console.log(`  Streaming:`);
console.log(`    Time to first byte: ${ttfb}ms`);
console.log(`    Total time: ${streamTotal}ms`);
console.log(`  Sync:`);
console.log(`    Total time: ${syncTotal}ms`);
console.log(`  Advantage: Streaming shows content ${streamTotal - ttfb}ms earlier`);

console.log('\n=== Streaming Examples Complete ===');
