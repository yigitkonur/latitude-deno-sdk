import { assertExists } from '@std/assert'
import { Latitude } from '../mod.ts'

Deno.test('Latitude SDK Smoke Test', async (t) => {
  await t.step('initializes with API key', () => {
    const sdk = new Latitude('test-api-key')
    assertExists(sdk)
    assertExists(sdk.prompts)
    assertExists(sdk.prompts.run)
    assertExists(sdk.prompts.chat)
  })

  await t.step('initializes with custom options', () => {
    const sdk = new Latitude('test-api-key', {
      projectId: 123,
      versionUuid: 'test-uuid',
      __internal: {
        gateway: {
          host: 'test.example.com',
          port: 443,
          ssl: true
        }
      }
    })
    assertExists(sdk)
  })
})
