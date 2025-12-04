/**
 * Latitude SDK Constants
 * Bundled from @latitude-data/constants for standalone Deno compatibility
 */

import { z } from 'zod'

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

export const WebSearchToolSchema = z.object({
  type: z.enum(['web_search', 'web_search_preview', 'web_search_preview_2025_03_11']),
  web_search: z.object({ search_context_size: z.string().optional() }).optional(),
  web_search_preview: z.object({ search_context_size: z.string().optional() }).optional(),
})

export const FileSearchToolSchema = z.object({
  type: z.literal('file_search'),
  file_search: z.object({ max_num_results: z.number().optional() }).optional(),
})

export const ComputerCallSchema = z.object({
  type: z.literal('computer_use_preview'),
  computer_use_preview: z.object({
    display_width: z.number().optional(),
    display_height: z.number().optional(),
    environment: z.string().optional(),
  }).optional(),
})

// ============================================================================
// PROVIDERS
// ============================================================================

export const HEAD_COMMIT = 'live'

export enum Providers {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Groq = 'groq',
  Mistral = 'mistral',
  Azure = 'azure',
  Google = 'google',
  GoogleVertex = 'google_vertex',
  AnthropicVertex = 'anthropic_vertex',
  Custom = 'custom',
  XAI = 'xai',
  AmazonBedrock = 'amazon_bedrock',
  DeepSeek = 'deepseek',
  Perplexity = 'perplexity',
}

// ============================================================================
// ERROR CODES
// ============================================================================

export enum LatitudeErrorCodes {
  UnexpectedError = 'UnexpectedError',
  OverloadedError = 'OverloadedError',
  RateLimitError = 'RateLimitError',
  UnauthorizedError = 'UnauthorizedError',
  ForbiddenError = 'ForbiddenError',
  BadRequestError = 'BadRequestError',
  NotFoundError = 'NotFoundError',
  ConflictError = 'ConflictError',
  UnprocessableEntityError = 'UnprocessableEntityError',
  NotImplementedError = 'NotImplementedError',
  PaymentRequiredError = 'PaymentRequiredError',
  AbortedError = 'AbortedError',
}

export enum RunErrorCodes {
  AIProviderConfigError = 'ai_provider_config_error',
  AIRunError = 'ai_run_error',
  ChainCompileError = 'chain_compile_error',
  DefaultProviderExceededQuota = 'default_provider_exceeded_quota_error',
  DefaultProviderInvalidModel = 'default_provider_invalid_model_error',
  DocumentConfigError = 'document_config_error',
  ErrorGeneratingMockToolResult = 'error_generating_mock_tool_result',
  FailedToWakeUpIntegrationError = 'failed_to_wake_up_integration_error',
  InvalidResponseFormatError = 'invalid_response_format_error',
  MaxStepCountExceededError = 'max_step_count_exceeded_error',
  MissingProvider = 'missing_provider_error',
  RateLimit = 'rate_limit_error',
  Unknown = 'unknown_error',
  UnsupportedProviderResponseTypeError = 'unsupported_provider_response_type_error',
  PaymentRequiredError = 'payment_required_error',
  AbortError = 'abort_error',
}

export enum ApiErrorCodes {
  HTTPException = 'http_exception',
  InternalServerError = 'internal_server_error',
}

export type ApiResponseCode = RunErrorCodes | ApiErrorCodes | LatitudeErrorCodes

export type DbErrorRef = {
  entityUuid: string
  entityType: string
}

export type ApiErrorJsonResponse = {
  name: string
  message: string
  details: object
  errorCode: ApiResponseCode
  dbErrorRef?: DbErrorRef
}

// ============================================================================
// LEGACY COMPILER TYPES (Messages, Roles, etc.)
// ============================================================================

export enum MessageRole {
  system = 'system',
  user = 'user',
  assistant = 'assistant',
  tool = 'tool',
}

export type PromptlSourceRef = {
  start: number
  end: number
  identifier?: string
}

interface IMessageContent {
  type: string
  _promptlSourceMap?: PromptlSourceRef[]
  [key: string]: unknown
}

export type ReasoningContent = IMessageContent & {
  type: 'reasoning'
  text: string
  id?: string
  isStreaming?: boolean
}

export type RedactedReasoningContent = IMessageContent & {
  type: 'redacted-reasoning'
  data: string
}

export type TextContent = IMessageContent & {
  type: 'text'
  text: string | undefined
}

export type ImageContent = IMessageContent & {
  type: 'image'
  image: string | Uint8Array | ArrayBuffer | URL
}

export type FileContent = IMessageContent & {
  type: 'file'
  file: string | Uint8Array | ArrayBuffer | URL
  mimeType: string
}

export type ToolContent = {
  type: 'tool-result'
  toolCallId: string
  toolName: string
  result: unknown
  isError?: boolean
}

export type ToolRequestContent = {
  type: 'tool-call'
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

export type MessageContent =
  | FileContent
  | ImageContent
  | ReasoningContent
  | RedactedReasoningContent
  | TextContent
  | ToolContent
  | ToolRequestContent

interface IMessage {
  role: MessageRole
  content: MessageContent[]
  [key: string]: unknown
}

export type SystemMessage = IMessage & {
  role: MessageRole.system
}

export type UserMessage = IMessage & {
  role: MessageRole.user
  name?: string
}

export type AssistantMessage = {
  role: MessageRole.assistant
  content: string | ToolRequestContent[] | MessageContent[]
  toolCalls: ToolCall[] | null
  _isGeneratingToolCall?: boolean
}

export type ToolMessage = {
  role: MessageRole.tool
  content: (TextContent | ToolContent)[]
  [key: string]: unknown
}

export type ToolCall = {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export type Message =
  | AssistantMessage
  | SystemMessage
  | ToolMessage
  | UserMessage

export type Config = Record<string, unknown>

export type Conversation = {
  config: Config
  messages: Message[]
}

// ============================================================================
// AI TYPES
// ============================================================================

export type ToolDefinition = {
  description: string
  parameters: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
    additionalProperties: boolean
  }
}

export type ToolDefinitionsMap = Record<string, ToolDefinition>

export type LegacyVercelSDKVersion4Usage = {
  inputTokens: number
  outputTokens: number
  promptTokens: number
  completionTokens: number
  totalTokens: number
  reasoningTokens: number
  cachedInputTokens: number
}

export type AssertedStreamType = 'text' | Record<string | symbol, unknown>

export type StreamType = 'object' | 'text'

type BaseResponse = {
  text: string
  usage: LegacyVercelSDKVersion4Usage
  documentLogUuid?: string
  providerLog?: unknown
}

export type ChainStepTextResponse = BaseResponse & {
  streamType: 'text'
  reasoning?: string | undefined
  toolCalls: ToolCall[] | null
}

export type ChainStepObjectResponse<S extends Record<string, unknown> = Record<string, unknown>> =
  BaseResponse & {
    streamType: 'object'
    object: S
  }

export type ChainStepResponse<T extends StreamType> = T extends 'text'
  ? ChainStepTextResponse
  : T extends 'object'
    ? ChainStepObjectResponse
    : never

export type ChainCallResponseDto<S extends AssertedStreamType = 'text'> =
  S extends 'text'
    ? ChainStepTextResponse
    : S extends Record<string | symbol, unknown>
      ? ChainStepObjectResponse<S>
      : never

export enum StreamEventTypes {
  Latitude = 'latitude-event',
  Provider = 'provider-event',
}

// ============================================================================
// PROVIDER DATA (Streaming chunks)
// ============================================================================

export type ProviderData =
  | { type: 'text-delta'; textDelta: string }
  | { type: 'tool-call'; toolCallId: string; toolName: string; args: Record<string, unknown> }
  | { type: 'tool-result'; toolCallId: string; toolName: string; args: Record<string, unknown>; result: unknown }
  | { type: 'finish'; finishReason: string }
  | { type: 'error'; error: unknown }
  | { type: string; [key: string]: unknown }

// ============================================================================
// CHAIN EVENT TYPES
// ============================================================================

export enum ChainEventTypes {
  ChainCompleted = 'chain-completed',
  ChainError = 'chain-error',
  ChainStarted = 'chain-started',
  IntegrationWakingUp = 'integration-waking-up',
  ProviderCompleted = 'provider-completed',
  ProviderStarted = 'provider-started',
  StepCompleted = 'step-completed',
  StepStarted = 'step-started',
  ToolCompleted = 'tool-completed',
  ToolResult = 'tool-result',
  ToolsStarted = 'tools-started',
}

interface GenericLatitudeEventData {
  type: ChainEventTypes
  timestamp: number
  messages: Message[]
  uuid: string
}

export interface LatitudeChainStartedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ChainStarted
}

export interface LatitudeStepStartedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.StepStarted
}

export interface LatitudeProviderStartedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ProviderStarted
  config: Config
}

export interface LatitudeProviderCompletedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ProviderCompleted
  providerLogUuid: string
  tokenUsage: LegacyVercelSDKVersion4Usage
  finishReason: string
  response: ChainStepResponse<StreamType>
}

export interface LatitudeToolsStartedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ToolsStarted
  tools: ToolCall[]
}

export interface LatitudeToolCompletedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ToolCompleted
}

export interface LatitudeStepCompletedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.StepCompleted
}

export interface LatitudeChainCompletedEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ChainCompleted
  response: ChainStepResponse<StreamType> | undefined
  toolCalls: ToolCall[]
  tokenUsage: LegacyVercelSDKVersion4Usage
  finishReason: string
}

export interface LatitudeChainErrorEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.ChainError
  error: { name: string; message: string; stack?: string }
}

export interface LatitudeIntegrationWakingUpEventData extends GenericLatitudeEventData {
  type: ChainEventTypes.IntegrationWakingUp
  integrationName: string
}

export type LatitudeEventData =
  | LatitudeChainStartedEventData
  | LatitudeStepStartedEventData
  | LatitudeProviderStartedEventData
  | LatitudeProviderCompletedEventData
  | LatitudeToolsStartedEventData
  | LatitudeToolCompletedEventData
  | LatitudeStepCompletedEventData
  | LatitudeChainCompletedEventData
  | LatitudeChainErrorEventData
  | LatitudeIntegrationWakingUpEventData

export type ChainEventDto = ProviderData | LatitudeEventData

export type ChainEvent =
  | { event: StreamEventTypes.Latitude; data: LatitudeEventData }
  | { event: StreamEventTypes.Provider; data: ProviderData }

// ============================================================================
// LATITUDE PROMPT SCHEMA TYPES
// ============================================================================

export type OpenAIToolList = Array<
  | { type: 'file_search'; file_search?: { max_num_results?: number } }
  | { type: 'web_search'; web_search?: { search_context_size?: string } }
  | { type: 'web_search_preview'; web_search_preview?: { search_context_size?: string } }
  | { type: 'web_search_preview_2025_03_11'; web_search_preview?: { search_context_size?: string } }
  | { type: 'computer_use_preview'; computer_use_preview?: { display_width?: number; display_height?: number; environment?: string } }
>

export type LatitudePromptConfig = {
  provider: string
  model: string
  temperature?: number
  type?: 'agent' | 'prompt'
  name?: string
  description?: string
  maxSteps?: number
  tools?: unknown
  schema?: unknown
}

// ============================================================================
// SYNC API RESPONSE TYPES
// ============================================================================

export type RunSyncAPIResponse<S extends AssertedStreamType = 'text'> = {
  uuid: string
  conversation: Message[]
  response: ChainCallResponseDto<S>
}

export type ChatSyncAPIResponse<S extends AssertedStreamType = 'text'> = RunSyncAPIResponse<S>

// ============================================================================
// ADDITIONAL EXPORTS
// ============================================================================

export type DocumentLog = {
  uuid: string
  [key: string]: unknown
}

export type PublicManualEvaluationResultV2 = {
  uuid: string
  score: number
  [key: string]: unknown
}

export type ToolRequest = {
  type: 'tool-call'
  toolCallId: string
  toolName: string
  toolArguments: Record<string, unknown>
}

export type ToolCallResponse = {
  toolCallId: string
  result: unknown
}
