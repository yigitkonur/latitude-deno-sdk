/**
 * Latitude SDK Constants
 *
 * This module contains all constants, enums, and type definitions used throughout
 * the Latitude SDK. These are bundled from @latitude-data/constants for standalone
 * Deno compatibility.
 *
 * @module
 */

import { z } from 'zod'

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/** Zod schema for web search tool configuration. */
export const WebSearchToolSchema: z.ZodObject<{
  type: z.ZodEnum<['web_search', 'web_search_preview', 'web_search_preview_2025_03_11']>
  web_search: z.ZodOptional<z.ZodObject<{ search_context_size: z.ZodOptional<z.ZodString> }>>
  web_search_preview: z.ZodOptional<z.ZodObject<{ search_context_size: z.ZodOptional<z.ZodString> }>>
}> = z.object({
  type: z.enum(['web_search', 'web_search_preview', 'web_search_preview_2025_03_11']),
  web_search: z.object({ search_context_size: z.string().optional() }).optional(),
  web_search_preview: z.object({ search_context_size: z.string().optional() }).optional(),
})

/** Zod schema for file search tool configuration. */
export const FileSearchToolSchema: z.ZodObject<{
  type: z.ZodLiteral<'file_search'>
  file_search: z.ZodOptional<z.ZodObject<{ max_num_results: z.ZodOptional<z.ZodNumber> }>>
}> = z.object({
  type: z.literal('file_search'),
  file_search: z.object({ max_num_results: z.number().optional() }).optional(),
})

/** Zod schema for computer use tool configuration. */
export const ComputerCallSchema: z.ZodObject<{
  type: z.ZodLiteral<'computer_use_preview'>
  computer_use_preview: z.ZodOptional<z.ZodObject<{
    display_width: z.ZodOptional<z.ZodNumber>
    display_height: z.ZodOptional<z.ZodNumber>
    environment: z.ZodOptional<z.ZodString>
  }>>
}> = z.object({
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

/** The default commit identifier for the live/published version. */
export const HEAD_COMMIT: string = 'live'

/**
 * Supported AI providers.
 *
 * @enum {string}
 *
 * @example
 * ```ts
 * import { Providers } from "@yigitkonur/latitude-deno-sdk";
 *
 * const prompt = await client.prompts.get("my-prompt");
 * if (prompt.provider === Providers.OpenAI) {
 *   console.log("Using OpenAI");
 * }
 * ```
 */
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

/**
 * Latitude-specific error codes.
 *
 * @enum {string}
 */
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

/**
 * Error codes specific to prompt execution.
 *
 * @enum {string}
 */
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

/**
 * General API error codes.
 *
 * @enum {string}
 */
export enum ApiErrorCodes {
  /** HTTP exception occurred. */
  HTTPException = 'http_exception',
  /** Internal server error. */
  InternalServerError = 'internal_server_error',
}

/** Union type of all possible API response error codes. */
export type ApiResponseCode = RunErrorCodes | ApiErrorCodes | LatitudeErrorCodes

/** Reference to a database entity related to an error. */
export type DbErrorRef = {
  /** UUID of the related entity. */
  entityUuid: string
  /** Type of the related entity. */
  entityType: string
}

/** JSON response structure for API errors. */
export type ApiErrorJsonResponse = {
  /** Error name/type. */
  name: string
  /** Human-readable error message. */
  message: string
  /** Additional error details. */
  details: object
  /** Machine-readable error code. */
  errorCode: ApiResponseCode
  /** Optional database error reference. */
  dbErrorRef?: DbErrorRef
}

// ============================================================================
// LEGACY COMPILER TYPES (Messages, Roles, etc.)
// ============================================================================

/**
 * Roles for conversation messages.
 *
 * @enum {string}
 *
 * @example
 * ```ts
 * import { MessageRole } from "@yigitkonur/latitude-deno-sdk";
 *
 * const message = {
 *   role: MessageRole.user,
 *   content: [{ type: "text", text: "Hello!" }],
 * };
 * ```
 */
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

/**
 * Union type of all message types in a conversation.
 *
 * @example
 * ```ts
 * const messages: Message[] = [
 *   { role: MessageRole.system, content: [{ type: "text", text: "You are helpful." }] },
 *   { role: MessageRole.user, content: [{ type: "text", text: "Hello!" }] },
 * ];
 * ```
 */
export type Message =
  | AssistantMessage
  | SystemMessage
  | ToolMessage
  | UserMessage

/** Configuration object for prompts and providers. */
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

/**
 * Types of streaming events.
 *
 * @enum {string}
 */
export enum StreamEventTypes {
  /** Event from the Latitude platform. */
  Latitude = 'latitude-event',
  /** Event from the AI provider. */
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

/**
 * Types of events during chain/prompt execution.
 *
 * @enum {string}
 */
export enum ChainEventTypes {
  /** Chain execution completed successfully. */
  ChainCompleted = 'chain-completed',
  /** An error occurred during chain execution. */
  ChainError = 'chain-error',
  /** Chain execution started. */
  ChainStarted = 'chain-started',
  /** Integration is waking up (cold start). */
  IntegrationWakingUp = 'integration-waking-up',
  /** Provider call completed. */
  ProviderCompleted = 'provider-completed',
  /** Provider call started. */
  ProviderStarted = 'provider-started',
  /** A step in the chain completed. */
  StepCompleted = 'step-completed',
  /** A step in the chain started. */
  StepStarted = 'step-started',
  /** Tool execution completed. */
  ToolCompleted = 'tool-completed',
  /** Tool returned a result. */
  ToolResult = 'tool-result',
  /** Tool executions started. */
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

/** Document log entry from the Latitude API. */
export type DocumentLog = {
  /** Unique log identifier. */
  uuid: string
  /** Additional log properties. */
  [key: string]: unknown
}

/** Result of a manual evaluation. */
export type PublicManualEvaluationResultV2 = {
  /** Unique result identifier. */
  uuid: string
  /** The evaluation score. */
  score: number
  /** Additional result properties. */
  [key: string]: unknown
}

/** Request to execute a tool. */
export type ToolRequest = {
  /** Discriminator type. */
  type: 'tool-call'
  /** Unique call identifier. */
  toolCallId: string
  /** Name of the tool to call. */
  toolName: string
  /** Arguments to pass to the tool. */
  toolArguments: Record<string, unknown>
}

/** Response from a tool execution. */
export type ToolCallResponse = {
  /** The call ID this response is for. */
  toolCallId: string
  /** The tool execution result. */
  result: unknown
}
