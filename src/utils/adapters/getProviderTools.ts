import { Adapters, ProviderAdapter } from 'promptl-ai'
import { ToolInputMap } from './types.ts'
import { getOpenAIResponsesBuiltinTools } from './openai/getOpenAIResponsesBuiltinTools.ts'

export function getAIProviderTools({
  adapter,
  tools,
}: {
  adapter: ProviderAdapter<object>
  tools: ToolInputMap
}) {
  if (adapter.type === Adapters.openaiResponses.type) {
    return getOpenAIResponsesBuiltinTools({ tools })
  }

  return {
    clientTools: tools,
    providerTools: [],
  }
}

export type ProviderToolResponse = ReturnType<typeof getAIProviderTools>
