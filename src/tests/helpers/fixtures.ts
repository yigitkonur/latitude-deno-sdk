/**
 * Test fixtures for Latitude SDK tests.
 *
 * Contains mock response data matching the Node SDK test fixtures.
 * Ported from original-node-sdk/src/test/
 */

import {
  type ChainEvent,
  ChainEventTypes,
  type LatitudeProviderCompletedEventData,
  MessageRole,
  StreamEventTypes,
} from '../../constants/index.ts';

// =============================================================================
// STREAMING CHUNK EVENTS
// =============================================================================

export const CHUNK_EVENTS: ChainEvent[] = [
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ChainStarted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [],
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.StepStarted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
      ],
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ProviderStarted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
      ],
      config: {
        provider: 'openai',
        model: 'gpt-4o',
      },
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '9',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '.',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '9',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: ' is',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: ' bigger',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: ' than',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: ' ',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '9',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '.',
    },
  },
  {
    event: StreamEventTypes.Provider,
    data: {
      type: 'text-delta',
      textDelta: '11',
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ProviderCompleted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
      ],
      tokenUsage: {
        inputTokens: 19,
        outputTokens: 84,
        promptTokens: 19,
        completionTokens: 84,
        totalTokens: 103,
        reasoningTokens: 0,
        cachedInputTokens: 0,
      },
      finishReason: 'stop',
      providerLogUuid: '456',
      response: {
        streamType: 'text',
        text: '9.9 is bigger than 9.11',
        usage: {
          inputTokens: 19,
          outputTokens: 84,
          promptTokens: 19,
          completionTokens: 84,
          totalTokens: 103,
          reasoningTokens: 0,
          cachedInputTokens: 0,
        },
        toolCalls: [],
      },
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.StepCompleted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
      ],
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.StepStarted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: 'Expand your answer' }],
        },
      ],
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ProviderStarted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: 'Expand your answer' }],
        },
      ],
      config: {
        provider: 'openai',
        model: 'gpt-4o',
      },
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ProviderCompleted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: 'Expand your answer' }],
        },
        {
          role: MessageRole.assistant,
          content: [
            {
              type: 'text',
              text:
                "Sure, let's break it down step by step to understand why 9.9 is greater than 9.11",
            },
          ],
          toolCalls: [],
        },
      ],
      tokenUsage: {
        inputTokens: 114,
        outputTokens: 352,
        promptTokens: 114,
        completionTokens: 352,
        totalTokens: 466,
        reasoningTokens: 0,
        cachedInputTokens: 0,
      },
      finishReason: 'stop',
      providerLogUuid: '789',
      response: {
        streamType: 'text',
        text: "Sure, let's break it down step by step to understand why 9.9 is greater than 9.11",
        usage: {
          inputTokens: 114,
          outputTokens: 352,
          promptTokens: 114,
          completionTokens: 352,
          totalTokens: 466,
          reasoningTokens: 0,
          cachedInputTokens: 0,
        },
        toolCalls: [],
      },
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.StepCompleted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: 'Expand your answer' }],
        },
        {
          role: MessageRole.assistant,
          content: [
            {
              type: 'text',
              text:
                "Sure, let's break it down step by step to understand why 9.9 is greater than 9.11",
            },
          ],
          toolCalls: [],
        },
      ],
    },
  },
  {
    event: StreamEventTypes.Latitude,
    data: {
      type: ChainEventTypes.ChainCompleted,
      timestamp: 965044800000,
      uuid: '123',
      messages: [
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: "What's bigger 9.9 or 9.11?" }],
        },
        {
          role: MessageRole.assistant,
          content: [{ type: 'text', text: '9.9 is bigger than 9.11' }],
          toolCalls: [],
        },
        {
          role: MessageRole.system,
          content: [{ type: 'text', text: 'Expand your answer' }],
        },
        {
          role: MessageRole.assistant,
          content: [
            {
              type: 'text',
              text:
                "Sure, let's break it down step by step to understand why 9.9 is greater than 9.11",
            },
          ],
          toolCalls: [],
        },
      ],
      response: undefined,
      toolCalls: [],
      tokenUsage: {
        inputTokens: 114,
        outputTokens: 352,
        promptTokens: 114,
        completionTokens: 352,
        totalTokens: 466,
        reasoningTokens: 0,
        cachedInputTokens: 0,
      },
      finishReason: 'stop',
    },
  },
];

/**
 * SSE chunks formatted as strings (for direct comparison).
 */
export const CHUNKS: string[] = CHUNK_EVENTS.map((event): string => {
  return `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n`;
});

/**
 * Final response extracted from the last provider-completed event.
 */
const lastResponse: LatitudeProviderCompletedEventData = [...CHUNK_EVENTS]
  .reverse()
  .find((e): e is ChainEvent & { data: LatitudeProviderCompletedEventData } =>
    e.data.type === ChainEventTypes.ProviderCompleted
  )!
  .data as LatitudeProviderCompletedEventData;

export const FINAL_RESPONSE: {
  uuid: string;
  conversation: unknown[];
  response: unknown;
} = {
  uuid: lastResponse.uuid,
  conversation: lastResponse.messages,
  response: lastResponse.response,
};

// =============================================================================
// SYNC RESPONSE FIXTURES
// =============================================================================

/**
 * Mock response for non-streaming run requests.
 */
export const RUN_TEXT_RESPONSE: {
  uuid: string;
  conversation: unknown[];
  response: {
    streamType: 'text';
    text: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      reasoningTokens: number;
      cachedInputTokens: number;
    };
    toolCalls: unknown[];
  };
} = {
  uuid: 'a8f2e5d8-4c72-48c7-a6e0-23df3f1cbe2a',
  conversation: [] as unknown[],
  response: {
    streamType: 'text' as const,
    text: 'some-text',
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      reasoningTokens: 0,
      cachedInputTokens: 0,
    },
    toolCalls: [] as unknown[],
  },
};

// =============================================================================
// DOCUMENT/PROMPT FIXTURES
// =============================================================================

/**
 * Mock document/prompt response.
 */
export const DOCUMENT_RESPONSE = {
  versionUuid: 'd6723dee-90f3-4e51-b293-19ea36fc869d',
  uuid: 'e01a1035-6ed3-4edc-88e6-c0748ea300c7',
  path: 'prompt',
  content: '---\nprovider: Latitude\nmodel: gpt-4o-mini\n---',
  contentHash: 'b912acbafb25af5fbab08f946fc272e4',
  config: {
    provider: 'Latitude',
    model: 'gpt-4o-mini',
  },
  parameters: {},
  provider: 'openai',
};

// =============================================================================
// ERROR FIXTURES
// =============================================================================

/**
 * Mock 502 Bad Gateway error response.
 */
export const ERROR_502_RESPONSE = {
  name: 'LatitudeError',
  message: 'Something bad happened',
  errorCode: 'internal_server_error',
  details: {},
};

/**
 * Mock AI run error response.
 */
export const AI_RUN_ERROR_RESPONSE = {
  name: 'LatitudeError',
  errorCode: 'ai_run_error',
  message: 'AI provider error',
  details: {},
};

/**
 * Mock not found error response.
 */
export const NOT_FOUND_ERROR_RESPONSE = {
  name: 'LatitudeError',
  errorCode: 'not_found_error',
  message: 'Resource not found',
  details: {},
};
