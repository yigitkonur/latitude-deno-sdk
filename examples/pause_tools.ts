/**
 * Example: Pause Tool Execution for Async Processing
 * 
 * Demonstrates how to pause tool execution for long-running async operations.
 * This pattern is useful for:
 * - Background job processing
 * - External API calls with webhooks
 * - Human-in-the-loop workflows
 * 
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/pause_tools.ts
 */

import { Latitude } from '../src/mod.ts';
import { MessageRole } from '../src/constants/index.ts';

// Define tool types
type Tools = {
  generate_travel_itinerary: {
    location: string;
    start_date: string;
    end_date: string;
    preferences: string;
  };
};

type ItineraryRequest = {
  data: {
    location: string;
    start_date: string;
    end_date: string;
    preferences: string;
  };
  toolId: string;
  toolName: string;
  conversationUuid: string;
};

// Simulate a job queue
let pendingJob: ItineraryRequest | undefined;

function enqueueJob(request: ItineraryRequest): void {
  console.log('[Job Queue] Enqueuing itinerary generation...');
  pendingJob = request;
}

function processItinerary(request: ItineraryRequest): Record<string, unknown> {
  console.log('[Job Queue] Processing itinerary...');
  return {
    location: request.data.location,
    start_date: request.data.start_date,
    end_date: request.data.end_date,
    preferences: request.data.preferences,
    recommendations: [
      'Visit the Sagrada Familia',
      'Explore Park Güell',
      'Take a stroll down La Rambla',
      'Relax at Barceloneta Beach',
      'Enjoy tapas at a local restaurant',
      'Visit the Picasso Museum',
    ],
  };
}

// Initialize client
const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Pause Tools Example ===\n');

try {
  // Step 1: Run prompt with tool that pauses execution
  console.log('Step 1: Running prompt with pausable tool...\n');

  await latitude.prompts.run<Tools>('travel-assistant', {
    parameters: {
      destination: 'Barcelona',
      start_date: '2025-06-02',
      end_date: '2025-06-10',
      preferences: 'museums, parks, and local cuisine',
    },
    tools: {
      generate_travel_itinerary: async (data, details) => {
        const typedData = data as Tools['generate_travel_itinerary'];
        console.log(`[Tool Called] generate_travel_itinerary for ${typedData.location}`);

        // Enqueue the job for background processing
        enqueueJob({
          data: typedData,
          toolId: details.id,
          toolName: details.name,
          conversationUuid: '', // Will be set from conversation
        });

        // Note: In the real implementation, you would call pauseExecution()
        // For this example, we'll simulate by not returning immediately
        console.log('[Tool] Job enqueued, pausing execution...');

        // Return a placeholder - in real usage with pause support,
        // the execution would pause here
        return { status: 'processing', message: 'Itinerary generation started' };
      },
    },
  });

  // Step 2: Simulate background job completion
  if (pendingJob) {
    console.log('\n[Background] Job completed, resuming conversation...\n');

    const itinerary = processItinerary(pendingJob);

    // In a real implementation with pause support, you would continue
    // the conversation with the tool result using chat()
    console.log('Generated Itinerary:');
    console.log(JSON.stringify(itinerary, null, 2));
  }
} catch (error) {
  console.error('Error:', error);
}

console.log('\n=== Example Complete ===');
console.log('\nNote: Full pause/resume support requires conversation continuation');
console.log('with prompts.chat() to send tool results after async processing.');
