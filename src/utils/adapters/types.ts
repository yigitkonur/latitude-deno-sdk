import { ToolDefinition, OpenAIToolList } from '../../constants/index.ts'

export type ClientTool = {
  [key: string]: ToolDefinition
}
export type ToolInputMap = ClientTool & {
  openai?: OpenAIToolList
}
