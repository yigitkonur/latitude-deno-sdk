# Latitude Deno SDK

[![JSR](https://jsr.io/badges/@yigitkonur/latitude-deno-sdk)](https://jsr.io/@yigitkonur/latitude-deno-sdk)
[![Tests](https://img.shields.io/badge/tests-40%2F40-brightgreen)](https://github.com/yigitkonur/latitude-deno-sdk)

Latitude SDK for **Deno** and **Supabase Edge Functions**. Zero config - works out of the box.

**100% Feature Parity** with the official Node.js SDK.

## Install

```bash
deno add jsr:@yigitkonur/latitude-deno-sdk
```

Or in `deno.json`:
```json
{
  "imports": {
    "@yigitkonur/latitude-deno-sdk": "jsr:@yigitkonur/latitude-deno-sdk@^1.0.6"
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

## Testing

The SDK includes comprehensive test coverage (40 tests) using Deno's built-in test runner.

### Run Tests

```bash
# Run all tests
deno task test

# Run with coverage
deno task test:coverage

# Watch mode for development
deno task test:watch

# Run specific test file
deno test --allow-net --allow-env src/tests/run.test.ts
```

### Test Structure

```
src/tests/
├── helpers/          # Test utilities
│   ├── mock_fetch.ts    # HTTP mocking
│   ├── mock_stream.ts   # SSE stream mocking
│   ├── fixtures.ts      # Test data
│   └── assertions.ts    # Custom assertions
├── run.test.ts       # prompts.run() - 13 tests
├── chat.test.ts      # prompts.chat() - 8 tests
├── get.test.ts       # prompts.get() - 3 tests
├── getAll.test.ts    # prompts.getAll() - 2 tests
├── getOrCreate.test.ts # prompts.getOrCreate() - 2 tests
├── create.test.ts    # prompts.create() - 1 test
├── projects.test.ts  # projects.* - 2 tests
├── versions.test.ts  # versions.* - 4 tests
├── eval.test.ts      # evaluations.annotate() - 2 tests
├── render.test.ts    # prompts.render() - 2 tests
└── smoke.test.ts     # Basic initialization - 1 test
```

### Test Coverage

| Category | Tests | Coverage |
|----------|-------|----------|
| Prompt Execution | 13 | Streaming, non-streaming, errors, retries |
| Chat Continuation | 8 | Multi-turn, callbacks, error handling |
| Prompt Management | 8 | Get, getAll, create, getOrCreate |
| Projects/Versions | 6 | CRUD operations, version push |
| Evaluations | 2 | Annotation, scoring |
| Rendering | 2 | Adapter integration |
| Smoke Tests | 1 | Initialization |

---

## Examples

The SDK includes 15 comprehensive examples demonstrating all features.

### Available Examples

| Example | Description | Required Env Vars |
|---------|-------------|-------------------|
| `basic_usage.ts` | List prompts, run sync, get details | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `streaming.ts` | Real-time streaming with SSE | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `streaming_json_parse.ts` | Structured JSON output | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `chat_conversation.ts` | Multi-turn conversations | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `error_handling.ts` | Error handling patterns | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `run_with_tools.ts` | Typed tool calling | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `pause_tools.ts` | Async tool pause pattern | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `get_prompt.ts` | Get single prompt | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `get_all_prompts.ts` | List all prompts | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `get_or_create_prompt.ts` | Get or create pattern | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `get_versions.ts` | Version management | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `create_log.ts` | Manual log creation | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `annotate_log.ts` | Evaluation annotation | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID`, `EVALUATION_UUID` |
| `render_chain.ts` | Chain rendering with external LLM | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |
| `rag_retrieval.ts` | RAG integration pattern | `LATITUDE_API_KEY`, `LATITUDE_PROJECT_ID` |

### Run Examples

```bash
# Type-check all examples
deno task examples

# Run a specific example
LATITUDE_API_KEY=xxx LATITUDE_PROJECT_ID=123 deno run --allow-env --allow-net examples/basic_usage.ts
```

### Supabase Edge Function Examples

The `examples/supabase-test/` folder contains complete Supabase Edge Function examples:

- `demo-latitude-run-prompt/` - Basic prompt execution
- `demo-latitude-chat/` - Chat continuation
- `demo-latitude-stream-json/` - Streaming JSON responses

Deploy with:
```bash
cd examples/supabase-test
supabase functions deploy demo-latitude-run-prompt
```

---

## Live Tests

All 40 tests passing on remote Supabase:

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

---

## Contributing

### Running Tests

```bash
# Run all tests
deno task test

# Run with coverage report
deno task test:coverage

# Watch mode during development
deno task test:watch
```

### Adding Tests

Tests use Deno's built-in test runner with custom helpers:

```typescript
import { assertEquals } from '@std/assert';
import { Latitude } from '../index.ts';
import { mockFetch, createMockJSONResponse } from './helpers/mod.ts';

Deno.test('my test', async () => {
  const restore = mockFetch({
    customHandler: () => Promise.resolve(createMockJSONResponse({ ok: true }))
  });

  try {
    const sdk = new Latitude('test-key');
    const result = await sdk.prompts.run('test');
    assertEquals(result?.response?.text, 'expected');
  } finally {
    restore();
  }
});
```

### Adding Examples

1. Create a new file in `examples/`
2. Add JSDoc header with description and run instructions
3. Use environment variables for configuration
4. Add to the examples table in README
5. Verify with `deno task examples`

### Code Quality

```bash
# Format code
deno fmt

# Lint code
deno lint

# Type check
deno check src/mod.ts
```

---