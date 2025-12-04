/**
 * Type definitions for the Latitude SDK.
 *
 * This module contains all type definitions used throughout the SDK,
 * including request/response types, configuration options, and handler types.
 *
 * @module
 */

/**
 * Generic handler configuration type mapping URL and body parameters.
 *
 * @typeParam U - URL parameter type
 * @typeParam B - Body parameter type
 */
export type HandlerConfig<U, B> = {
  /** URL parameters for the handler. */
  UrlParams: U;
  /** Body parameters for the handler. */
  BodyParams: B;
};

import type { RouteResolver } from './index.ts';
import type { LatitudeApiError } from './errors.ts';
import type {
  AssertedStreamType,
  ChainCallResponseDto,
  ChainEventDto,
  ChatSyncAPIResponse,
  Providers,
  RunSyncAPIResponse,
  StreamEventTypes,
} from '../constants/index.ts';

/** Re-exported synchronous chat API response type for backwards compatibility. */
export type { ChatSyncAPIResponse };
/** Re-exported synchronous run API response type for backwards compatibility. */
export type { RunSyncAPIResponse };

import type { Config, Message, ToolCall } from '../constants/index.ts';
import type { AdapterMessageType, Message as PromptlMessage, ProviderAdapter } from 'promptl-ai';

/**
 * Chain event wrapper containing event data and type.
 * Re-exported for backwards compatibility with legacy constants.
 */
export type ChainEvent = {
  /** The event payload data. */
  data: unknown;
  /** The stream event type. */
  event: StreamEventTypes;
};

/**
 * Types of events that can occur during chain execution.
 *
 * @enum {string}
 */
export enum ChainEventTypes {
  /** An error occurred during chain execution. */
  Error = 'chain-error',
  /** A new step in the chain has started. */
  Step = 'chain-step',
  /** The chain has completed execution. */
  Complete = 'chain-complete',
  /** A step in the chain has completed. */
  StepComplete = 'chain-step-complete',
}

/**
 * Types of parameters that can be passed to prompts.
 *
 * @enum {string}
 */
export enum ParameterType {
  /** Plain text parameter. */
  Text = 'text',
  /** Image parameter (base64 or URL). */
  Image = 'image',
  /** File parameter. */
  File = 'file',
}

/** URL parameters for listing all documents in a project. */
export type GetAllDocumentsParams = {
  /** The project ID to list documents from. */
  projectId: number;
  /** Optional version UUID, defaults to "live". */
  versionUuid?: string;
};

/** URL parameters for getting a specific document. */
export type GetDocumentUrlParams = GetAllDocumentsParams & {
  /** The document path. */
  path: string;
};

/** URL parameters for creating or getting a document. */
export type GetOrCreateDocumentUrlParams = {
  /** The project ID. */
  projectId: number;
  /** Optional version UUID. */
  versionUuid?: string;
};

/** URL parameters for running a document. */
export type RunDocumentUrlParams = {
  /** The project ID. */
  projectId: number;
  /** Optional version UUID. */
  versionUuid?: string;
};

/** URL parameters for chat operations. */
export type ChatUrlParams = {
  /** The conversation UUID. */
  conversationUuid: string;
};

/** URL parameters for stopping a run. */
export type StopRunUrlParams = {
  /** The conversation UUID to stop. */
  conversationUuid: string;
};

/** URL parameters for attaching to a run. */
export type AttachRunUrlParams = {
  /** The conversation UUID to attach to. */
  conversationUuid: string;
};

/** URL parameters for annotation operations. */
export type AnnotateUrlParams = {
  /** The conversation UUID to annotate. */
  conversationUuid: string;
  /** The evaluation UUID to use. */
  evaluationUuid: string;
};

/** Body parameters for annotation requests. */
export type AnnotateBodyParams = {
  /** The score value (typically 0-1). */
  score: number;
  /** Optional metadata with reason. */
  metadata?: { reason: string };
  /** Optional version UUID. */
  versionUuid?: string;
};

// =============================================================================
// PROJECT RELATED TYPES
// =============================================================================

/**
 * Project metadata representing a Latitude project.
 *
 * @example
 * ```ts
 * const projects = await client.projects.getAll();
 * projects.forEach(p => console.log(p.name, p.id));
 * ```
 */
export type Project = {
  /** Unique project identifier. */
  id: number;
  /** Project display name. */
  name: string;
  /** Workspace this project belongs to. */
  workspaceId: number;
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
  /** ISO timestamp of last edit (optional). */
  lastEditedAt?: string;
  /** ISO timestamp of deletion, null if not deleted. */
  deletedAt: string | null;
};

/**
 * Commit metadata representing a version commit.
 */
export type Commit = {
  /** Unique commit identifier. */
  id: number;
  /** Commit UUID. */
  uuid: string;
  /** Commit title/name. */
  title: string;
  /** Commit description. */
  description: string;
  /** Project this commit belongs to. */
  projectId: number;
  /** Version number. */
  version: number;
  /** User who created this commit. */
  userId: string;
  /** ISO timestamp when merged. */
  mergedAt: string;
  /** ISO timestamp of deletion, null if not deleted. */
  deletedAt: string | null;
  /** UUID of the main document, if any. */
  mainDocumentUuid: string | null;
};

/**
 * Version metadata representing a prompt version.
 *
 * @example
 * ```ts
 * const versions = await client.versions.getAll(projectId);
 * const live = versions.find(v => v.title === "live");
 * ```
 */
export type Version = {
  /** ISO timestamp of creation. */
  createdAt: string;
  /** ISO timestamp of last update. */
  updatedAt: string;
  /** Unique version identifier. */
  id: number;
  /** Version UUID used in API calls. */
  uuid: string;
  /** Version title/name. */
  title: string;
  /** Version description, if any. */
  description: string | null;
  /** Project this version belongs to. */
  projectId: number;
  /** Version number, if numbered. */
  version: number | null;
  /** User who created this version. */
  userId: string;
  /** ISO timestamp when merged, null if draft. */
  mergedAt: string | null;
  /** ISO timestamp of deletion, null if not deleted. */
  deletedAt: string | null;
};

/** Body parameters for creating a project. */
export type CreateProjectBodyParams = {
  /** Name for the new project. */
  name: string;
};

/** URL parameters for creating a version. */
export type CreateVersionUrlParams = {
  /** The project ID. */
  projectId: number;
};

/** Body parameters for creating a version. */
export type CreateVersionBodyParams = {
  /** Name for the new version. */
  name: string;
};

/** URL parameters for getting a version. */
export type GetversionUrlParams = {
  /** The project ID. */
  projectId: number;
  /** The version UUID. */
  versionUuid: string;
};

/** URL parameters for getting all versions. */
export type GetAllVersionsUrlParams = {
  /** The project ID. */
  projectId: number;
};

/** URL parameters for pushing to a version. */
export type PushVersionUrlParams = {
  /** The project ID. */
  projectId: number;
  /** The base commit UUID. */
  commitUuid: string;
};

/** Body parameters for pushing version changes. */
export type PushVersionBodyParams = {
  /** Array of document changes to push. */
  changes: Array<{
    /** Document path. */
    path: string;
    /** New document content. */
    content: string;
    /** Change status. */
    status: 'added' | 'modified' | 'deleted' | 'unchanged';
    /** Optional content hash for verification. */
    contentHash?: string;
  }>;
};

/** Body parameters for creating a log. */
export type LogBodyParams = {
  /** The prompt path. */
  path: string;
  /** Conversation messages. */
  messages: Message[];
  /** Optional response text. */
  response?: string;
};

/** Body parameters for tool results. */
export type ToolResultsBodyParams = {
  /** The tool call ID this result is for. */
  toolCallId: string;
  /** The tool execution result. */
  result: unknown;
  /** Whether the tool execution resulted in an error. */
  isError?: boolean;
};

/**
 * Enum of API handler types for routing requests.
 *
 * @enum {string}
 * @internal
 */
export enum HandlerType {
  /** Annotate a conversation. */
  Annotate = 'annotate',
  /** Chat with a prompt. */
  Chat = 'chat',
  /** Create a new document. */
  CreateDocument = 'create-document',
  /** Create a new project. */
  CreateProject = 'create-project',
  /** Create a new version. */
  CreateVersion = 'create-version',
  /** Get all documents in a project. */
  GetAllDocuments = 'get-all-documents',
  /** Get all projects. */
  GetAllProjects = 'get-all-projects',
  /** Get a specific document. */
  GetDocument = 'get-document',
  /** Get or create a document. */
  GetOrCreateDocument = 'get-or-create-document',
  /** Get a specific version. */
  GetVersion = 'get-version',
  /** Get all versions. */
  GetAllVersions = 'get-all-versions',
  /** Push changes to a version. */
  PushVersion = 'push-version',
  /** Run a document. */
  RunDocument = 'run-document',
  /** Create a log entry. */
  Log = 'log',
  /** Submit tool results. */
  ToolResults = 'tool-results',
  /** Stop a running job. */
  StopRun = 'stop-run',
  /** Attach to a running job. */
  AttachRun = 'attach-run',
}

export type HandlerConfigs = {
  [HandlerType.Annotate]: HandlerConfig<AnnotateUrlParams, AnnotateBodyParams>;
  [HandlerType.Chat]: HandlerConfig<ChatUrlParams, ChatBodyParams>;
  [HandlerType.CreateDocument]: HandlerConfig<
    GetOrCreateDocumentUrlParams,
    GetOrCreateDocumentBodyParams
  >;
  [HandlerType.CreateProject]: HandlerConfig<never, CreateProjectBodyParams>;
  [HandlerType.CreateVersion]: HandlerConfig<
    CreateVersionUrlParams,
    CreateVersionBodyParams
  >;
  [HandlerType.GetAllDocuments]: HandlerConfig<GetAllDocumentsParams, never>;
  [HandlerType.GetAllProjects]: HandlerConfig<never, never>;
  [HandlerType.GetDocument]: HandlerConfig<GetDocumentUrlParams, never>;
  [HandlerType.GetOrCreateDocument]: HandlerConfig<
    GetOrCreateDocumentUrlParams,
    GetOrCreateDocumentBodyParams
  >;
  [HandlerType.GetVersion]: HandlerConfig<GetversionUrlParams, never>;
  [HandlerType.GetAllVersions]: HandlerConfig<GetAllVersionsUrlParams, never>;
  [HandlerType.PushVersion]: HandlerConfig<
    PushVersionUrlParams,
    PushVersionBodyParams
  >;
  [HandlerType.RunDocument]: HandlerConfig<
    RunDocumentUrlParams,
    RunDocumentBodyParams
  >;
  [HandlerType.Log]: HandlerConfig<RunDocumentUrlParams, LogBodyParams>;
  [HandlerType.ToolResults]: HandlerConfig<never, ToolResultsBodyParams>;
  [HandlerType.StopRun]: HandlerConfig<StopRunUrlParams, never>;
  [HandlerType.AttachRun]: HandlerConfig<
    AttachRunUrlParams,
    AttachRunBodyParams
  >;
};

export type UrlParams<H extends HandlerType> = HandlerConfigs[H]['UrlParams'];
export type BodyParams<H extends HandlerType> = HandlerConfigs[H]['BodyParams'];

/**
 * Reference to a background generation job.
 *
 * @example
 * ```ts
 * const job = await client.prompts.run("my-prompt", {
 *   background: true,
 *   parameters: {},
 * });
 * console.log("Job started:", job.uuid);
 * ```
 */
export type GenerationJob = {
  /** UUID of the background job for status tracking. */
  uuid: string;
};

/**
 * Response from a generation request.
 *
 * @typeParam S - The stream type ('text' or object schema)
 *
 * @example
 * ```ts
 * const response = await client.prompts.run("my-prompt", { parameters: {} });
 * console.log(response.response.text);
 * console.log(response.conversation);
 * ```
 */
export type GenerationResponse<S extends AssertedStreamType = 'text'> = {
  /** Conversation UUID for follow-up messages. */
  uuid: string;
  /** Full conversation history including the response. */
  conversation: Message[];
  /** The AI response data. */
  response: ChainCallResponseDto<S>;
};

export type StreamResponseCallbacks<S extends AssertedStreamType = 'text'> = {
  onEvent?: ({
    event,
    data,
  }: {
    event: StreamEventTypes;
    data: ChainEventDto;
  }) => void;
  onFinished?: (data: GenerationResponse<S>) => void;
  onError?: (error: LatitudeApiError) => void;
};

/**
 * Sources that can create logs in Latitude.
 *
 * @enum {string}
 */
export enum LogSources {
  /** Logs created via the API/SDK. */
  API = 'api',
  /** Logs created from the Latitude playground. */
  Playground = 'playground',
  /** Logs created during evaluations. */
  Evaluation = 'evaluation',
}

/**
 * Details about a tool call for rendering purposes.
 */
export type RenderToolCallDetails = {
  /** The tool call ID. */
  id: string;
  /** The tool name. */
  name: string;
};

/**
 * Type specification for defining tool schemas.
 * Maps tool names to their argument types.
 *
 * @example
 * ```ts
 * type MyTools = {
 *   get_weather: { location: string; unit?: 'celsius' | 'fahrenheit' };
 *   search: { query: string; limit?: number };
 * };
 * ```
 */
export type ToolSpec = Record<string, Record<string, unknown>>;

/**
 * Handler function type for processing tool calls.
 *
 * @typeParam T - The tool specification type
 * @typeParam K - The specific tool key
 */
export type ToolHandler<T extends ToolSpec, K extends keyof T> = (
  toolCall: T[K],
  details: ToolCall,
) => Promise<unknown>;

/**
 * Map of tool handlers keyed by tool name.
 *
 * @typeParam Tools - The tool specification type
 *
 * @example
 * ```ts
 * const tools: ToolCalledFn<MyTools> = {
 *   get_weather: async (args, details) => {
 *     return { temperature: 72 };
 *   },
 * };
 * ```
 */
export type ToolCalledFn<Tools extends ToolSpec> = {
  [K in keyof Tools]: ToolHandler<Tools, K>;
};

/**
 * Handler function type for rendering tool results.
 *
 * @typeParam T - The tool specification type
 * @typeParam K - The specific tool key
 */
export type RenderToolHandler<T extends ToolSpec, K extends keyof T> = (
  toolCall: T[K],
  details: RenderToolCallDetails,
) => Promise<string | Omit<PromptlMessage, 'role'> | PromptlMessage[]>;

/**
 * Map of render tool handlers keyed by tool name.
 *
 * @typeParam Tools - The tool specification type
 */
export type RenderToolCalledFn<Tools extends ToolSpec> = {
  [K in keyof Tools]: RenderToolHandler<Tools, K>;
};

/** Supported SDK API versions. */
export type SdkApiVersion = 'v1' | 'v2' | 'v3';

// Note: ChainEvent, ChainEventTypes already defined above
// ChatSyncAPIResponse, RunSyncAPIResponse, StreamEventTypes re-exported from constants

/**
 * Options for getting a prompt.
 *
 * @example
 * ```ts
 * const prompt = await client.prompts.get("my-prompt", {
 *   projectId: 123,
 *   versionUuid: "live",
 * });
 * ```
 */
export type GetPromptOptions = {
  /** Project ID to get the prompt from. */
  projectId?: number;
  /** Version UUID, defaults to "live". */
  versionUuid?: string;
};

/**
 * Options for getting or creating a prompt.
 *
 * @example
 * ```ts
 * const prompt = await client.prompts.getOrCreate("new-prompt", {
 *   prompt: "You are a helpful assistant.",
 * });
 * ```
 */
export type GetOrCreatePromptOptions = {
  /** Project ID. */
  projectId?: number;
  /** Version UUID. */
  versionUuid?: string;
  /** Initial prompt content if creating. */
  prompt?: string;
};

/**
 * Options for running a prompt.
 *
 * @typeParam Tools - Tool specification type
 * @typeParam S - Stream type ('text' or object schema)
 * @typeParam Background - Whether to run in background mode
 *
 * @example
 * ```ts
 * const result = await client.prompts.run("my-prompt", {
 *   parameters: { name: "World" },
 *   stream: true,
 *   onEvent: ({ event, data }) => console.log(event),
 *   onFinished: (response) => console.log(response.response.text),
 * });
 * ```
 */
export type RunPromptOptions<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
  Background extends boolean = false,
> =
  & StreamResponseCallbacks<S>
  & {
    /** Project ID to run the prompt from. */
    projectId?: number;
    /** Version UUID, defaults to "live". */
    versionUuid?: string;
    /** Custom identifier for tracking. */
    customIdentifier?: string;
    /** Parameters to pass to the prompt template. */
    parameters?: Record<string, unknown>;
    /** Whether to stream the response. */
    stream?: boolean;
    /** Tool handlers for function calling. */
    tools?: ToolCalledFn<Tools>;
    /** Abort signal for cancellation. */
    signal?: AbortSignal;
    /** Optional user message to append. */
    userMessage?: string;
  }
  & (Background extends true ? { background: Background }
    : { background?: Background });

/**
 * Result type for running a prompt.
 * Returns GenerationJob for background runs, GenerationResponse otherwise.
 *
 * @typeParam S - Stream type
 * @typeParam Background - Whether running in background mode
 */
export type RunPromptResult<
  S extends AssertedStreamType = 'text',
  Background extends boolean = false,
> = Background extends true ? GenerationJob : GenerationResponse<S>;

export type RenderPromptOptions<M extends AdapterMessageType = PromptlMessage> = {
  prompt: {
    content: string;
  };
  parameters: Record<string, unknown>;
  adapter?: ProviderAdapter<M>;
};

export type RenderChainOptions<
  M extends AdapterMessageType = PromptlMessage,
  Tool extends ToolSpec = ToolSpec,
> = {
  prompt: Prompt;
  parameters: Record<string, unknown>;
  adapter?: ProviderAdapter<M>;
  onStep: (args: {
    config: Config;
    messages: M[];
  }) => Promise<string | Omit<M, 'role'>>;
  tools?: RenderToolCalledFn<Tool>;
  logResponses?: boolean;
};

export type ChatOptions<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
> = StreamResponseCallbacks<S> & {
  messages: Message[];
  stream?: boolean;
  tools?: ToolCalledFn<Tools>;
  signal?: AbortSignal;
};

export type AttachRunOptions<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
> = StreamResponseCallbacks<S> & {
  stream?: boolean;
  tools?: ToolCalledFn<Tools>;
  signal?: AbortSignal;
};

export type SDKOptions = {
  apiKey: string;
  retryMs: number;
  source: LogSources;
  routeResolver: RouteResolver;
  versionUuid?: string;
  projectId?: number;
  signal?: AbortSignal;
};

export type ChatOptionsWithSDKOptions<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
> = ChatOptions<Tools, S> & {
  options: SDKOptions;
};

export interface EvalOptions {
  evaluationUuids?: string[];
}

export type EvalPromptOptions = {
  projectId?: number;
  versionUuid?: string;
};

/**
 * Prompt document containing template content and configuration.
 *
 * @example
 * ```ts
 * const prompt = await client.prompts.get("my-prompt");
 * console.log(prompt.path, prompt.content);
 * console.log(prompt.parameters); // { name: { type: 'text' } }
 * ```
 */
export type Prompt = {
  /** Version UUID this prompt belongs to. */
  versionUuid: string;
  /** Unique prompt UUID. */
  uuid: string;
  /** Prompt path (e.g., "folder/my-prompt"). */
  path: string;
  /** The prompt template content. */
  content: string;
  /** Content hash for change detection. */
  contentHash?: string;
  /** Parsed prompt configuration. */
  config: Config;
  /** Parameter definitions with their types. */
  parameters: Record<string, { type: ParameterType }>;
  /** AI provider for this prompt. */
  provider?: Providers;
};

type GetOrCreateDocumentBodyParams = {
  path: string;
  prompt?: string;
};

type RunDocumentBodyParams = {
  path: string;
  parameters?: Record<string, unknown>;
  customIdentifier?: string;
  stream?: boolean;
  background?: boolean;
  tools?: string[];
  userMessage?: string;
};

type ChatBodyParams = {
  messages: Message[];
  stream?: boolean;
  tools?: string[];
};

type AttachRunBodyParams = {
  stream?: boolean;
};
