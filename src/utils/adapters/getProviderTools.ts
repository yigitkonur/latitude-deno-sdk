import { Adapters, ProviderAdapter } from 'promptl-ai';
import { ClientTool, ToolInputMap } from './types.ts';
import { getOpenAIResponsesBuiltinTools } from './openai/getOpenAIResponsesBuiltinTools.ts';

/** Return type for provider tool extraction. */
export type ProviderToolsResult = {
  clientTools: ClientTool;
  providerTools: unknown[];
};

export function getAIProviderTools({
  adapter,
  tools,
}: {
  adapter: ProviderAdapter<object>;
  tools: ToolInputMap;
}): ProviderToolsResult {
  if (adapter.type === Adapters.openaiResponses.type) {
    return getOpenAIResponsesBuiltinTools({ tools });
  }

  return {
    clientTools: tools,
    providerTools: [],
  };
}

/** @deprecated Use ProviderToolsResult instead */
export type ProviderToolResponse = ProviderToolsResult;
