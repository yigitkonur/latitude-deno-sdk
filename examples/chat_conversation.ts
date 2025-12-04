/**
 * Multi-turn conversation example for Latitude Deno SDK.
 * Demonstrates chat continuation and conversation management.
 *
 * Run with:
 * LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/chat_conversation.ts
 */

import { Latitude } from '../src/mod.ts';

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID')),
});

console.log('=== Multi-turn Conversation Examples ===\n');

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic Chat Continuation
// ─────────────────────────────────────────────────────────────────────────────

console.log('1. Basic Chat Continuation\n');

// Start a conversation
const initial = await latitude.prompts.run('my-prompt', {
  stream: false,
  parameters: { input: 'What is TypeScript?' },
});

console.log('Initial response:');
console.log(`  ${initial?.response?.text?.substring(0, 100)}...`);
console.log(`  Conversation UUID: ${initial?.uuid}`);

// Continue the conversation
if (initial?.uuid) {
  try {
    const followUp = await latitude.prompts.chat(initial.uuid, [
      { role: 'user', content: 'How does it compare to JavaScript?' },
    ]);

    console.log('\nFollow-up response:');
    console.log(`  ${followUp?.response?.text?.substring(0, 100)}...`);
  } catch (error) {
    console.log('\nChat continuation note:', (error as Error).message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Multi-turn Conversation
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n2. Multi-turn Conversation\n');

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

async function conductConversation(
  promptPath: string,
  initialPrompt: string,
  followUpQuestions: string[],
): Promise<ConversationTurn[]> {
  const history: ConversationTurn[] = [];

  // Initial message
  const initial = await latitude.prompts.run(promptPath, {
    stream: false,
    parameters: { input: initialPrompt },
  });

  history.push({ role: 'user', content: initialPrompt });
  history.push({ role: 'assistant', content: initial?.response?.text ?? '' });

  let conversationUuid = initial?.uuid;

  // Follow-up questions
  for (const question of followUpQuestions) {
    if (!conversationUuid) break;

    try {
      const response = await latitude.prompts.chat(conversationUuid, [
        { role: 'user', content: question },
      ]);

      history.push({ role: 'user', content: question });
      history.push({ role: 'assistant', content: response?.response?.text ?? '' });

      // UUID may change or remain same depending on API
      conversationUuid = response?.uuid ?? conversationUuid;
    } catch {
      console.log(`  (Chat continuation not supported for this prompt)`);
      break;
    }
  }

  return history;
}

const conversation = await conductConversation(
  'my-prompt',
  'Explain async/await in one sentence.',
  ['Give me an example.', 'What about error handling?'],
);

console.log('Conversation transcript:');
for (const turn of conversation) {
  const prefix = turn.role === 'user' ? '👤 User:' : '🤖 Assistant:';
  console.log(`${prefix} ${turn.content.substring(0, 80)}...`);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Streaming Chat
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n3. Streaming Chat\n');

// Start with streaming
let chatUuid: string | undefined;

await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { input: 'What is Deno?' },
  onEvent: (event) => {
    // Show streaming progress
    if (event.data && typeof event.data === 'object') {
      const data = event.data as Record<string, unknown>;
      if ('text' in data) {
        Deno.stdout.writeSync(new TextEncoder().encode('.'));
      }
    }
  },
  onFinished: (result) => {
    chatUuid = result.uuid;
    console.log('\n  Initial streaming complete');
  },
});

// Continue with streaming follow-up
if (chatUuid) {
  console.log('  Continuing conversation with streaming...');

  try {
    await latitude.prompts.chat(
      chatUuid,
      [{ role: 'user', content: 'How does it differ from Node.js?' }],
      {
        stream: true,
        onEvent: () => {
          Deno.stdout.writeSync(new TextEncoder().encode('.'));
        },
        onFinished: () => {
          console.log('\n  Follow-up streaming complete');
        },
      },
    );
  } catch {
    console.log('\n  (Streaming chat not supported)');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Conversation Context Management
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n4. Conversation Context Management\n');

class ConversationManager {
  private latitude: Latitude;
  private conversations: Map<string, string> = new Map(); // name -> uuid

  constructor(apiKey: string, projectId: number) {
    this.latitude = new Latitude(apiKey, { projectId });
  }

  async startConversation(name: string, promptPath: string, initialMessage: string) {
    const result = await this.latitude.prompts.run(promptPath, {
      stream: false,
      parameters: { input: initialMessage },
    });

    if (result?.uuid) {
      this.conversations.set(name, result.uuid);
    }

    return {
      name,
      uuid: result?.uuid,
      response: result?.response?.text,
    };
  }

  async continueConversation(name: string, message: string) {
    const uuid = this.conversations.get(name);
    if (!uuid) {
      throw new Error(`Conversation '${name}' not found`);
    }

    const result = await this.latitude.prompts.chat(uuid, [
      { role: 'user', content: message },
    ]);

    return {
      name,
      uuid,
      response: result?.response?.text,
    };
  }

  getConversationIds(): string[] {
    return Array.from(this.conversations.keys());
  }
}

const manager = new ConversationManager(
  Deno.env.get('LATITUDE_API_KEY')!,
  Number(Deno.env.get('LATITUDE_PROJECT_ID')),
);

// Start multiple conversations
await manager.startConversation('tech-chat', 'my-prompt', 'What is React?');
await manager.startConversation('general-chat', 'my-prompt', 'Hello!');

console.log('Active conversations:', manager.getConversationIds());

// Continue a specific conversation
try {
  const response = await manager.continueConversation(
    'tech-chat',
    'What about Vue.js?',
  );
  console.log(`Response: ${response.response?.substring(0, 50)}...`);
} catch (error) {
  console.log('Continuation not supported:', (error as Error).message);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Conversation with History Display
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n5. Interactive Conversation Simulator\n');

async function simulateInteractiveChat(
  promptPath: string,
  exchanges: Array<{ user: string; expected?: string }>,
) {
  let uuid: string | undefined;
  let turnNumber = 0;

  for (const exchange of exchanges) {
    turnNumber++;
    console.log(`\n--- Turn ${turnNumber} ---`);
    console.log(`👤 User: ${exchange.user}`);

    let response: string | undefined;

    if (!uuid) {
      // First turn
      const result = await latitude.prompts.run(promptPath, {
        stream: false,
        parameters: { input: exchange.user },
      });
      uuid = result?.uuid;
      response = result?.response?.text;
    } else {
      // Subsequent turns
      try {
        const result = await latitude.prompts.chat(uuid, [
          { role: 'user', content: exchange.user },
        ]);
        response = result?.response?.text;
      } catch {
        response = '(Chat continuation not supported)';
      }
    }

    console.log(`🤖 Assistant: ${response?.substring(0, 100)}...`);
  }
}

await simulateInteractiveChat('my-prompt', [
  { user: 'What is functional programming?' },
  { user: 'Can you give an example in JavaScript?' },
  { user: 'How does this relate to React?' },
]);

console.log('\n=== Chat Conversation Examples Complete ===');
