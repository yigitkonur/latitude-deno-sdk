community-maintained Deno port of the official Latitude SDK. run, stream, and manage AI prompts on the [Latitude](https://latitude.so) platform from Deno, Supabase Edge Functions, and Deno Deploy — no Node.js polyfills needed.

```typescript
import { Latitude } from "jsr:@yigitkonur/sdk-deno-latitude";

const sdk = new Latitude("your-api-key", { projectId: 123 });
const result = await sdk.prompts.run("my-prompt", { stream: false });
console.log(result.response);
```

[![JSR](https://jsr.io/badges/@yigitkonur/sdk-deno-latitude)](https://jsr.io/@yigitkonur/sdk-deno-latitude)
[![deno](https://img.shields.io/badge/deno-2.x-93450a.svg?style=flat-square)](https://deno.land/)
[![license](https://img.shields.io/badge/license-MIT-grey.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## why this fork exists

the official `@latitude-data/sdk` depends on `node-fetch`, `process.env`, and Node.js `Readable` streams. none of that works in Deno Deploy or Supabase Edge Functions. this fork replaces all of it with native `fetch()`, `Deno.env`, and web `ReadableStream`. also bundles `@latitude-data/constants` inline to drop the Node-only npm dependency.

## what it does

- **prompt execution** — `prompts.run()` with streaming (SSE), non-streaming, and fire-and-forget background modes
- **multi-turn chat** — `prompts.chat()` continues conversations by UUID
- **tool calling** — pass typed tool handlers, SDK manages the call/result loop with the server
- **local rendering** — `prompts.render()` and `prompts.renderChain()` render templates locally via `promptl-ai`, no API call
- **background runs** — `prompts.run({ background: true })` returns a job UUID, attach later with `runs.attach(uuid)`
- **run control** — `runs.stop(uuid)` aborts in-progress jobs
- **prompt management** — `get`, `getAll`, `create`, `getOrCreate` for prompts stored on Latitude
- **project and version CRUD** — create projects, manage versions, push document changes atomically
- **log creation** — record external LLM calls to Latitude for observability
- **evaluation annotations** — `evaluations.annotate()` posts manual scores
- **instrumentation hooks** — `Latitude.instrument()` for OpenTelemetry or custom tracing
- **automatic retry** — retries up to 3 times on 5xx with configurable delay

## install

```typescript
import { Latitude } from "jsr:@yigitkonur/sdk-deno-latitude";
```

no install step. Deno pulls from JSR on first import.

## usage

### basic

```typescript
const sdk = new Latitude(Deno.env.get("LATITUDE_API_KEY")!, {
  projectId: 123,
});

// run a prompt
const result = await sdk.prompts.run("my-prompt", {
  parameters: { topic: "rust" },
  stream: false,
});
console.log(result.response);
```

### streaming

```typescript
await sdk.prompts.run("my-prompt", {
  stream: true,
  onEvent: ({ event, data }) => console.log(event, data),
  onFinished: (response) => console.log("done:", response.conversation),
  onError: (error) => console.error(error.message),
});
```

### tool calling

```typescript
type Tools = {
  search: { query: string };
  calculate: { expression: string };
};

await sdk.prompts.run<undefined, Tools>("agent-prompt", {
  tools: {
    search: async ({ query }) => {
      return await searchDatabase(query);
    },
    calculate: async ({ expression }) => {
      return eval(expression);
    },
  },
});
```

### multi-turn chat

```typescript
const initial = await sdk.prompts.run("chat-prompt", { stream: false });

const followUp = await sdk.prompts.chat(initial.uuid, [
  { role: "user", content: "tell me more" },
], { stream: false });
```

### background runs

```typescript
const job = await sdk.prompts.run("heavy-prompt", { background: true });
// returns { uuid: "..." } immediately

// attach later to get the result
const result = await sdk.runs.attach(job.uuid, { stream: false });
```

### local rendering (no API call)

```typescript
import { Adapters } from "jsr:@yigitkonur/sdk-deno-latitude";

const { config, messages } = await sdk.prompts.render({
  prompt: { content: "---\nmodel: gpt-4o\n---\nhello {{ name }}" },
  parameters: { name: "world" },
  adapter: Adapters.openai,
});
// pass messages directly to OpenAI, Anthropic, etc.
```

### logging external LLM calls

```typescript
await sdk.logs.create("my-prompt", [
  { role: "user", content: "hello" },
  { role: "assistant", content: "hi there" },
], { response: "hi there" });
```

### supabase edge function

```typescript
import { Latitude } from "jsr:@yigitkonur/sdk-deno-latitude";

Deno.serve(async (req) => {
  const sdk = new Latitude(Deno.env.get("LATITUDE_API_KEY")!, {
    projectId: Number(Deno.env.get("LATITUDE_PROJECT_ID")),
  });

  const { prompt, parameters } = await req.json();
  const result = await sdk.prompts.run(prompt, {
    parameters,
    stream: false,
  });

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
});
```

## configuration

### constructor options

```typescript
new Latitude(apiKey: string, options?: {
  projectId?: number;       // default project ID (required for most operations)
  versionUuid?: string;     // default version (defaults to "live")
  __internal?: {
    gateway?: { host: string; port?: number; ssl: boolean };
    source?: LogSources;    // default: LogSources.API
    retryMs?: number;       // retry delay on 5xx (default: 1000ms)
  };
});
```

### environment variables

| variable | default | description |
|:---|:---|:---|
| `GATEWAY_HOSTNAME` | `gateway.latitude.so` | API gateway host |
| `GATEWAY_PORT` | — | API gateway port |
| `GATEWAY_SSL` | `true` | `"false"` to disable HTTPS |

## API surface

| namespace | methods |
|:---|:---|
| `sdk.prompts` | `get`, `getAll`, `create`, `getOrCreate`, `run`, `chat`, `render`, `renderChain` |
| `sdk.projects` | `getAll`, `create` |
| `sdk.versions` | `get`, `getAll`, `create`, `push` |
| `sdk.logs` | `create` |
| `sdk.evaluations` | `annotate` |
| `sdk.runs` | `attach`, `stop` |
| `Latitude` (static) | `instrument`, `uninstrument` |

## supported providers

OpenAI, Anthropic, Google, Google Vertex, Anthropic Vertex, Azure, Groq, Mistral, XAI, Amazon Bedrock, DeepSeek, Perplexity, and custom providers. adapter mapping is handled automatically based on your Latitude prompt config.

## dependencies

| package | purpose |
|:---|:---|
| `eventsource-parser` | SSE stream parsing |
| `zod` | runtime validation for built-in tool configs |
| `promptl-ai` | prompt template rendering and provider adapters |

no Node.js-specific packages. all npm deps used via Deno's npm compatibility layer.

## tests

```bash
deno test
```

40 tests across 11 test files covering the full API surface. test infra includes mock fetch, mock SSE streams, and assertion helpers.

## license

MIT
