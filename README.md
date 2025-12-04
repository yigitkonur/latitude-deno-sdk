# Latitude Deno SDK

[![JSR](https://jsr.io/badges/@yigitkonur/latitude-deno-sdk)](https://jsr.io/@yigitkonur/latitude-deno-sdk)
[![Tests](https://img.shields.io/badge/tests-20%2F20-brightgreen)](https://dugggxrwvfakrzmnlfif.supabase.co/functions/v1/latitude-test?action=all)

Latitude SDK for **Deno** and **Supabase Edge Functions**. Zero config - works out of the box.

## Install

```bash
deno add jsr:@yigitkonur/latitude-deno-sdk
```

Or in `deno.json`:
```json
{
  "imports": {
    "@yigitkonur/latitude-deno-sdk": "jsr:@yigitkonur/latitude-deno-sdk@^1.0.1"
  }
}
```

## Quick Start

```typescript
import { Latitude } from '@yigitkonur/latitude-deno-sdk'

const latitude = new Latitude('your-api-key', { projectId: 12345 })

// Run a prompt
const result = await latitude.prompts.run('my-prompt', {
  parameters: { name: 'World' }
})

console.log(result?.response?.text)
```

---

## Examples

### 1. Basic Prompt Execution

```typescript
import { Latitude } from '@yigitkonur/latitude-deno-sdk'

const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
  projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID'))
})

// Sync (wait for full response)
const result = await latitude.prompts.run('summarize', {
  stream: false,
  parameters: { text: 'Long article here...' }
})

console.log(result?.response?.text)
```

### 2. Streaming with Callbacks

```typescript
await latitude.prompts.run('generate-story', {
  stream: true,
  parameters: { genre: 'sci-fi' },
  onEvent: (event) => {
    // Called for each SSE event
    console.log('Event:', event.event, event.data)
  },
  onFinished: (result) => {
    // Called when complete
    console.log('Final:', result.response?.text)
  },
  onError: (error) => {
    console.error('Error:', error.message)
  }
})
```

### 3. Structured JSON Output

```typescript
// Prompts with JSON schema return parsed objects
const result = await latitude.prompts.run('extract-entities', {
  stream: false,
  parameters: { text: 'Apple announced iPhone 16 today.' }
})

// Access structured data directly
const entities = result?.response?.object as Array<{
  name: string
  type: string
}>

entities?.forEach(e => console.log(`${e.name} (${e.type})`))
```

### 4. Multi-turn Conversation

```typescript
// Start conversation
const chat = await latitude.prompts.run('assistant', {
  parameters: { context: 'You are a coding tutor' }
})

// Continue with follow-up
if (chat?.uuid) {
  const followUp = await latitude.prompts.chat(chat.uuid, [
    { role: 'user', content: 'Explain async/await in TypeScript' }
  ])
  
  console.log(followUp?.response?.text)
}
```

### 5. Supabase Edge Function

```typescript
// supabase/functions/ai-endpoint/index.ts
import { Latitude } from 'jsr:@yigitkonur/latitude-deno-sdk@^1.0.1'

Deno.serve(async (req) => {
  const { prompt, params } = await req.json()
  
  const latitude = new Latitude(Deno.env.get('LATITUDE_API_KEY')!, {
    projectId: Number(Deno.env.get('LATITUDE_PROJECT_ID'))
  })

  const result = await latitude.prompts.run(prompt, {
    stream: false,
    parameters: params
  })

  return new Response(JSON.stringify({
    text: result?.response?.text,
    usage: result?.response?.usage
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Deploy with:
```bash
supabase functions deploy ai-endpoint --no-verify-jwt
```

### 6. List & Manage Prompts

```typescript
// List all prompts
const prompts = await latitude.prompts.getAll()
prompts.forEach(p => console.log(p.path, p.config?.model))

// Get specific prompt
const prompt = await latitude.prompts.get('my-prompt')
console.log(prompt.content)

// Create new prompt
const newPrompt = await latitude.prompts.create('new-prompt', {
  prompt: '---\nmodel: gpt-4\n---\n<user>{{input}}</user>'
})
```

### 7. Logging & Analytics

```typescript
// Log a conversation for analytics
await latitude.logs.create('my-prompt', [
  { role: 'user', content: 'Hello' },
  { role: 'assistant', content: 'Hi there!' }
], {
  response: 'Hi there!'
})
```

### 8. Version Management

```typescript
// List all versions
const versions = await latitude.versions.getAll()

// Get specific version
const version = await latitude.versions.get(projectId, 'version-uuid')

// Create new version
const newVersion = await latitude.versions.create('v2-improvements')
```

### 9. Parallel Requests (Performance)

```typescript
// Run multiple prompts in parallel (133% faster than sequential)
const results = await Promise.all([
  latitude.prompts.run('prompt-1', { parameters: { q: 'query 1' } }),
  latitude.prompts.run('prompt-2', { parameters: { q: 'query 2' } }),
  latitude.prompts.run('prompt-3', { parameters: { q: 'query 3' } }),
])

results.forEach((r, i) => console.log(`Result ${i}:`, r?.response?.text))
```

---

## API Reference

### Initialization

```typescript
const latitude = new Latitude(apiKey: string, options?: {
  projectId?: number      // Default project ID
  versionUuid?: string    // Version UUID (default: 'live')
})
```

### Methods

| Namespace | Method | Description |
|-----------|--------|-------------|
| `prompts` | `.run(path, opts)` | Execute prompt |
| | `.chat(uuid, messages)` | Continue conversation |
| | `.get(path)` | Get prompt details |
| | `.getAll()` | List all prompts |
| | `.create(path, opts)` | Create prompt |
| | `.getOrCreate(path, opts)` | Get or create |
| `projects` | `.getAll()` | List projects |
| | `.create(name)` | Create project |
| `versions` | `.getAll()` | List versions |
| | `.get(projectId, uuid)` | Get version |
| | `.create(name)` | Create version |
| `logs` | `.create(path, messages)` | Create log |
| `runs` | `.attach(uuid)` | Attach to run |
| | `.stop(uuid)` | Stop run |
| `evaluations` | `.annotate(uuid, score, evalUuid)` | Annotate |

---

## Runtime Support

| Runtime | Status | Notes |
|---------|--------|-------|
| **Deno** | ✅ | Native support |
| **Supabase Edge Functions** | ✅ | Auto-detected, zero config |
| **Deno Deploy** | ✅ | Auto-detected |

The SDK automatically detects cloud runtimes and uses the production gateway.

---

## Live Tests

All 20 tests passing on remote Supabase:

```bash
curl "https://dugggxrwvfakrzmnlfif.supabase.co/functions/v1/latitude-test?action=all"
```

| Category | Tests | Status |
|----------|-------|--------|
| prompts | 6 | ✅ |
| projects | 1 | ✅ |
| versions | 2 | ✅ |
| logs | 1 | ✅ |
| streaming | 3 | ✅ |
| errors | 3 | ✅ |
| config | 2 | ✅ |
| performance | 2 | ✅ |

---

## Links

- **JSR Package**: [jsr.io/@yigitkonur/latitude-deno-sdk](https://jsr.io/@yigitkonur/latitude-deno-sdk)
- **GitHub**: [github.com/yigitkonur/latitude-deno-sdk](https://github.com/yigitkonur/latitude-deno-sdk)
- **Latitude Docs**: [docs.latitude.so](https://docs.latitude.so)
- **Original Node SDK**: [@latitude-data/sdk](https://www.npmjs.com/package/@latitude-data/sdk)

## License

MIT

---

## Development

### Versioning & Publishing

This package uses **automated publishing** to JSR via GitHub Actions.

1. **Make changes** to the codebase.
2. **Bump version** using helper tasks (updates `deno.json` and creates commit):
   ```bash
   deno task version:patch  # 1.0.0 -> 1.0.1
   deno task version:minor  # 1.0.0 -> 1.1.0
   deno task version:major  # 1.0.0 -> 2.0.0
   ```
3. **Push to main**:
   ```bash
   git push origin main
   ```

The workflow will automatically:
- Check if the version is already on JSR (skips if so).
- Verify types, lint, and format.
- Publish to JSR using OIDC authentication.

