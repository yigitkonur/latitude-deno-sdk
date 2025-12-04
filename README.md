# Latitude Deno SDK

Community fork of the official [Latitude Node.js SDK](https://www.npmjs.com/package/@latitude-data/sdk), rebuilt for Deno and Supabase Edge Functions.

[![JSR](https://jsr.io/badges/@yigitkonur/latitude-deno-sdk)](https://jsr.io/@yigitkonur/latitude-deno-sdk)

## Installation

### JSR

```bash
deno add @yigitkonur/latitude-deno-sdk
```

### Import Map

```json
{
  "imports": {
    "@yigitkonur/latitude-deno-sdk": "jsr:@yigitkonur/latitude-deno-sdk"
  }
}
```

## Quick Start

```typescript
import { Latitude } from '@yigitkonur/latitude-deno-sdk'

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!)

// Run a prompt
const result = await latitude.prompts.run('my-prompt', {
  parameters: { topic: 'Deno' }
})

console.log(result?.response?.text)
```

## Usage Examples

### Sync Request

```typescript
const result = await latitude.prompts.run('my-prompt', {
  stream: false,
  parameters: { name: 'World' }
})
```

### Streaming with Callbacks

```typescript
await latitude.prompts.run('my-prompt', {
  stream: true,
  parameters: { topic: 'AI' },
  onEvent: (event) => console.log('Event:', event),
  onFinished: (result) => console.log('Done:', result),
  onError: (error) => console.error('Error:', error)
})
```

### Supabase Edge Function

```typescript
import { Latitude } from '@yigitkonur/latitude-deno-sdk'

Deno.serve(async (req) => {
  const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!)
  
  const prompts = await latitude.prompts.getAll({
    projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID'))
  })
  
  return new Response(JSON.stringify(prompts), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Chat Conversation

```typescript
// Start a conversation
const result = await latitude.prompts.run('chatbot', {
  parameters: { context: 'You are a helpful assistant' }
})

// Continue the conversation
if (result?.uuid) {
  await latitude.prompts.chat(result.uuid, [
    { role: 'user', content: 'Tell me more' }
  ])
}
```

## API Reference

### `new Latitude(apiKey, options?)`

| Option | Type | Description |
|--------|------|-------------|
| `projectId` | `number` | Default project ID |
| `versionUuid` | `string` | Version UUID (default: `'live'`) |
| `__internal` | `object` | Internal gateway config |

### `latitude.prompts`

| Method | Description |
|--------|-------------|
| `.run(path, options)` | Execute a prompt |
| `.chat(uuid, messages)` | Continue a conversation |
| `.get(path, options)` | Get prompt details |
| `.getAll(options)` | List all prompts |
| `.create(path, options)` | Create a new prompt |
| `.getOrCreate(path, options)` | Get or create prompt |

### `latitude.logs`

| Method | Description |
|--------|-------------|
| `.create(path, messages, options)` | Create a log entry |

### `latitude.evaluations`

| Method | Description |
|--------|-------------|
| `.trigger(uuid, options)` | Trigger evaluation |
| `.createResult(uuid, options)` | Create evaluation result |

## Features

- ✅ **Native Deno**: Uses `fetch`, `ReadableStream`, `Deno.env`
- ✅ **Zero Config**: All types bundled, no external dependencies
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Streaming**: SSE streaming with callbacks
- ✅ **Supabase Ready**: Works in Edge Functions

## Development

```bash
# Type check
deno check src/mod.ts

# Run tests
deno test --allow-net --allow-env

# Format
deno fmt

# Lint
deno lint
```

## License

[MIT License](LICENSE.md)
