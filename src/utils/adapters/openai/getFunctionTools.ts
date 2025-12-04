import { ProviderToolsResult } from '../getProviderTools.ts';

/** OpenAI function tool definition. */
export type OpenAIFunctionTool = {
  name: string;
  description: string | undefined;
  type: string;
  parameters: unknown;
};

export function getOpenAIResponseTools({
  clientTools,
  providerTools,
}: ProviderToolsResult): (OpenAIFunctionTool | unknown)[] {
  const client: OpenAIFunctionTool[] = Object.entries(clientTools).map(([name, definition]) => ({
    name, // Tool/function name
    description: definition.description,
    type: 'function',
    parameters: definition.parameters,
  }));

  return [...client, ...providerTools] as (OpenAIFunctionTool | unknown)[];
}
