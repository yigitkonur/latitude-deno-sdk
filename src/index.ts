import {
  type AssertedStreamType,
  type ChainEventDto,
  type DocumentLog,
  Providers,
  type PublicManualEvaluationResultV2,
  type ToolCallResponse,
  type ToolRequest,
} from './constants/index.ts';
import { MessageRole } from './constants/index.ts';
import type { Message, ToolCall } from './constants/index.ts';

import env from './env/index.ts';
import { type GatewayApiConfig, RouteResolver } from './utils/index.ts';
import { backgroundRun } from './utils/backgroundRun.ts';
import { ApiErrorCodes, type ApiErrorJsonResponse, LatitudeApiError } from './utils/errors.ts';
import { makeRequest } from './utils/request.ts';
import { streamAttach } from './utils/streamAttach.ts';
import { streamChat } from './utils/streamChat.ts';
import { streamRun } from './utils/streamRun.ts';
import { syncAttach } from './utils/syncAttach.ts';
import { syncChat } from './utils/syncChat.ts';
import { syncRun } from './utils/syncRun.ts';
import {
  type AttachRunOptions,
  type ChatOptions,
  type GenerationJob,
  type GenerationResponse,
  type GetOrCreatePromptOptions,
  type GetPromptOptions,
  HandlerType,
  LogSources,
  type Project,
  type Prompt,
  type RenderChainOptions,
  type RenderPromptOptions,
  type RenderToolCallDetails,
  type RenderToolCalledFn,
  type RunPromptOptions,
  type RunPromptResult,
  type SDKOptions,
  type ToolHandler,
  type ToolSpec,
  type Version,
} from './utils/types.ts';
import {
  type AdapterMessageType,
  Chain,
  type Config,
  ContentType,
  type Message as PromptlMessage,
  MessageRole as PromptlMessageRole,
  type ProviderAdapter,
  render,
  type ToolCallContent,
} from 'promptl-ai';

import { adaptPromptConfigToProvider } from './utils/adapters/adaptPromptConfigToProvider.ts';
import { getPromptlAdapterFromProvider } from './utils/adapters/getAdapterFromProvider.ts';

/** Default retry delay in milliseconds for failed requests. */
const WAIT_IN_MS_BEFORE_RETRY: number = 1000;

/** Default gateway configuration using environment variables. */
const DEFAULT_GATEWAY: GatewayApiConfig = {
  host: env.GATEWAY_HOSTNAME,
  port: env.GATEWAY_PORT,
  ssl: env.GATEWAY_SSL,
};

/** Default internal configuration for SDK operations. */
const DEFAULT_INTERNAL: { source: LogSources; retryMs: number } = {
  source: LogSources.API,
  retryMs: WAIT_IN_MS_BEFORE_RETRY,
};

/**
 * Configuration options for initializing the Latitude client.
 *
 * @example
 * ```ts
 * const options: Options = {
 *   projectId: 123,
 *   versionUuid: "live",
 * };
 * ```
 */
type Options = {
  /** UUID of the prompt version to use. Defaults to "live" if not specified. */
  versionUuid?: string;
  /** Project ID to scope operations to. Required for most operations. */
  projectId?: number;
  /** Internal configuration options. Not intended for public use. */
  __internal?: {
    /** Gateway API configuration for custom deployments. */
    gateway?: GatewayApiConfig;
    /** Source identifier for logging. */
    source?: LogSources;
    /** Retry delay in milliseconds. */
    retryMs?: number;
  };
};

/**
 * Main client for interacting with the Latitude API.
 *
 * The Latitude class provides methods for managing prompts, projects, versions,
 * and running AI completions. It supports both synchronous and streaming responses,
 * as well as tool calling.
 *
 * @example Basic usage
 * ```ts
 * import { Latitude } from "@yigitkonur/latitude-deno-sdk";
 *
 * const client = new Latitude("your-api-key", {
 *   projectId: 123,
 * });
 *
 * // Run a prompt
 * const result = await client.prompts.run("my-prompt", {
 *   parameters: { name: "World" },
 * });
 * ```
 *
 * @example With streaming
 * ```ts
 * const result = await client.prompts.run("my-prompt", {
 *   stream: true,
 *   onEvent: ({ event, data }) => console.log(event, data),
 *   onFinished: (response) => console.log(response.response.text),
 * });
 * ```
 *
 * @example With tool calling
 * ```ts
 * const result = await client.prompts.run("assistant", {
 *   tools: {
 *     get_weather: async (args) => {
 *       return { temperature: 72, conditions: "sunny" };
 *     },
 *   },
 * });
 * ```
 *
 * @class
 */
class Latitude {
  /** Internal SDK configuration options. */
  protected options: SDKOptions;
  /** Optional instrumentation for tracing and monitoring. */
  protected static instrumentation?: Instrumentation;

  /**
   * Evaluation operations for annotating and scoring prompt runs.
   *
   * @example
   * ```ts
   * await client.evaluations.annotate(
   *   "conversation-uuid",
   *   0.9,
   *   "evaluation-uuid",
   *   { reason: "Great response" }
   * );
   * ```
   */
  public evaluations: {
    /**
     * Annotate a conversation with a score for a specific evaluation.
     *
     * @param uuid - The conversation UUID to annotate
     * @param score - The score value (typically 0-1)
     * @param evaluationUuid - The evaluation definition UUID
     * @param opts - Optional parameters including reason and version
     * @returns The created evaluation result
     */
    annotate: (
      uuid: string,
      score: number,
      evaluationUuid: string,
      opts?: {
        reason?: string;
        versionUuid?: string;
      },
    ) => Promise<PublicManualEvaluationResultV2>;
  };

  /**
   * Project management operations.
   *
   * @example List all projects
   * ```ts
   * const projects = await client.projects.getAll();
   * console.log(projects.map(p => p.name));
   * ```
   *
   * @example Create a new project
   * ```ts
   * const { project, version } = await client.projects.create("My New Project");
   * ```
   */
  public projects: {
    /**
     * Get all projects in the workspace.
     *
     * @returns Array of projects
     */
    getAll: () => Promise<Project[]>;
    /**
     * Create a new project.
     *
     * @param name - Name for the new project
     * @returns The created project and its initial version
     */
    create: (name: string) => Promise<{
      project: Project;
      version: Version;
    }>;
  };

  /**
   * Log creation operations for recording conversations.
   *
   * @example
   * ```ts
   * const log = await client.logs.create("my-prompt", messages, {
   *   response: "AI response text",
   * });
   * ```
   */
  public logs: {
    /**
     * Create a log entry for a conversation.
     *
     * @param path - The prompt path
     * @param messages - Array of conversation messages
     * @param options - Optional configuration
     * @returns The created document log
     */
    create: (
      path: string,
      messages: Message[],
      options?: {
        projectId?: number;
        versionUuid?: string;
        response?: string;
      },
    ) => Promise<DocumentLog>;
  };

  /**
   * Prompt operations including get, create, run, and chat.
   *
   * @example Get a prompt
   * ```ts
   * const prompt = await client.prompts.get("my-prompt");
   * console.log(prompt.content);
   * ```
   *
   * @example Run a prompt
   * ```ts
   * const result = await client.prompts.run("my-prompt", {
   *   parameters: { name: "World" },
   * });
   * ```
   *
   * @example Chat with a prompt
   * ```ts
   * const response = await client.prompts.chat(conversationUuid, [
   *   { role: "user", content: [{ type: "text", text: "Hello" }] },
   * ]);
   * ```
   */
  public prompts: {
    /**
     * Get a prompt by path.
     *
     * @param path - The prompt path
     * @param args - Optional project and version configuration
     * @returns The prompt document
     */
    get: (path: string, args?: GetPromptOptions) => Promise<Prompt>;
    /**
     * Get all prompts in a project.
     *
     * @param args - Optional project and version configuration
     * @returns Array of prompts
     */
    getAll: (args?: GetPromptOptions) => Promise<Prompt[]>;
    /**
     * Create a new prompt.
     *
     * @param path - The prompt path
     * @param args - Optional configuration including initial content
     * @returns The created prompt
     */
    create: (path: string, args?: GetOrCreatePromptOptions) => Promise<Prompt>;
    /**
     * Get an existing prompt or create it if it doesn't exist.
     *
     * @param path - The prompt path
     * @param args - Optional configuration
     * @returns The existing or newly created prompt
     */
    getOrCreate: (
      path: string,
      args?: GetOrCreatePromptOptions,
    ) => Promise<Prompt>;
    /**
     * Run a prompt and get a response.
     *
     * @typeParam S - Stream type ('text' or object schema)
     * @typeParam Tools - Tool specification type
     * @typeParam Background - Whether to run in background mode
     * @param path - The prompt path
     * @param args - Run options including parameters and callbacks
     * @returns The generation response or job reference
     */
    run: <
      S extends AssertedStreamType = 'text',
      Tools extends ToolSpec = Record<string, never>,
      Background extends boolean = false,
    >(
      path: string,
      args: RunPromptOptions<Tools, S, Background>,
    ) => Promise<RunPromptResult<S, Background> | undefined>;
    /**
     * Continue a conversation with additional messages.
     *
     * @typeParam S - Stream type
     * @typeParam Tools - Tool specification type
     * @param uuid - The conversation UUID
     * @param messages - New messages to add
     * @param args - Optional chat configuration
     * @returns The generation response
     */
    chat: <S extends AssertedStreamType = 'text', Tools extends ToolSpec = Record<string, never>>(
      uuid: string,
      messages: Message[],
      args?: Omit<ChatOptions<Tools, S>, 'messages'>,
    ) => Promise<GenerationResponse<S> | undefined>;
    /**
     * Render a prompt template with parameters.
     *
     * @typeParam M - Message type
     * @param args - Render options including prompt and parameters
     * @returns The rendered config and messages
     */
    render: <M extends AdapterMessageType = PromptlMessage>(
      args: RenderPromptOptions<M>,
    ) => Promise<{ config: Config; messages: M[] }>;
    /**
     * Render a prompt chain with step-by-step processing.
     *
     * @typeParam M - Message type
     * @param args - Chain render options
     * @returns The final config and messages
     */
    renderChain: <M extends AdapterMessageType = PromptlMessage>(
      args: RenderChainOptions<M>,
    ) => Promise<{ config: Config; messages: M[] }>;
  };

  /**
   * Run management operations for attaching to and stopping runs.
   *
   * @example Attach to a running job
   * ```ts
   * const response = await client.runs.attach(jobUuid, {
   *   onEvent: ({ event, data }) => console.log(event, data),
   * });
   * ```
   *
   * @example Stop a running job
   * ```ts
   * await client.runs.stop(jobUuid);
   * ```
   */
  public runs: {
    /**
     * Attach to a running generation job.
     *
     * @typeParam S - Stream type
     * @typeParam Tools - Tool specification type
     * @param uuid - The job UUID to attach to
     * @param args - Optional attach configuration
     * @returns The generation response
     */
    attach: <
      S extends AssertedStreamType = 'text',
      Tools extends ToolSpec = Record<string, never>,
    >(
      uuid: string,
      args?: AttachRunOptions<Tools, S>,
    ) => Promise<GenerationResponse<S> | undefined>;
    /**
     * Stop a running generation job.
     *
     * @param uuid - The job UUID to stop
     */
    stop: (uuid: string) => Promise<void>;
  };

  /**
   * Version management operations for prompt versioning.
   *
   * @example Get a version
   * ```ts
   * const version = await client.versions.get(projectId, commitUuid);
   * ```
   *
   * @example Create a new version
   * ```ts
   * const version = await client.versions.create("v1.0.0", { projectId: 123 });
   * ```
   *
   * @example Push changes
   * ```ts
   * const { commitUuid } = await client.versions.push(projectId, baseCommitUuid, [
   *   { path: "prompt.md", content: "New content", status: "modified" },
   * ]);
   * ```
   */
  public versions: {
    /**
     * Get a specific version by commit UUID.
     *
     * @param projectId - The project ID
     * @param commitUuid - The commit UUID
     * @returns The version details
     */
    get: (projectId: number, commitUuid: string) => Promise<Version>;
    /**
     * Get all versions for a project.
     *
     * @param projectId - Optional project ID (uses default if not specified)
     * @returns Array of versions
     */
    getAll: (projectId?: number) => Promise<Version[]>;
    /**
     * Create a new version.
     *
     * @param name - Name for the new version
     * @param opts - Optional project ID
     * @returns The created version
     */
    create: (name: string, opts?: { projectId?: number }) => Promise<Version>;
    /**
     * Push changes to create a new commit.
     *
     * @param projectId - The project ID
     * @param baseCommitUuid - The base commit to apply changes to
     * @param changes - Array of document changes
     * @returns The new commit UUID
     */
    push: (
      projectId: number,
      baseCommitUuid: string,
      changes: Array<{
        path: string;
        content: string;
        status: 'added' | 'modified' | 'deleted' | 'unchanged';
        contentHash?: string;
      }>,
    ) => Promise<{ commitUuid: string }>;
  };

  /**
   * Creates a new Latitude client instance.
   *
   * @param apiKey - Your Latitude API key
   * @param options - Configuration options
   *
   * @example
   * ```ts
   * const client = new Latitude("lat_xxx", {
   *   projectId: 123,
   *   versionUuid: "live",
   * });
   * ```
   */
  constructor(
    apiKey: string,
    {
      projectId,
      versionUuid,
      __internal = {
        gateway: DEFAULT_GATEWAY,
      },
    }: Options = {
      __internal: {
        gateway: DEFAULT_GATEWAY,
      },
    },
  ) {
    const { source, retryMs } = { ...DEFAULT_INTERNAL, ...__internal };
    const { gateway = DEFAULT_GATEWAY } = __internal;

    this.options = {
      apiKey,
      retryMs,
      source,
      versionUuid,
      projectId,
      routeResolver: new RouteResolver({
        gateway,
        apiVersion: 'v3',
      }),
    };

    // Wrap methods for instrumentation
    this.wrapMethods();

    // Initialize evaluations namespace
    this.evaluations = {
      annotate: this.annotate.bind(this),
    };

    // Initialize projects namespace
    this.projects = {
      getAll: this.getAllProjects.bind(this),
      create: this.createProject.bind(this),
    };

    // Initialize prompts namespace
    this.prompts = {
      get: this.getPrompt.bind(this),
      getAll: this.getAllPrompts.bind(this),
      getOrCreate: this.getOrCreatePrompt.bind(this),
      create: this.createPrompt.bind(this),
      run: this.runPrompt.bind(this),
      chat: this.chat.bind(this),
      render: this.renderPrompt.bind(this),
      renderChain: this.renderChain.bind(this),
    };

    // Initialize runs namespace
    this.runs = {
      attach: this.attachRun.bind(this),
      stop: this.stopRun.bind(this),
    };

    // Initialize versions namespace
    this.versions = {
      get: this.getVersion.bind(this),
      getAll: this.getAllVersions.bind(this),
      create: this.createVersion.bind(this),
      push: this.pushVersion.bind(this),
    };

    // Initialize logs namespace
    this.logs = {
      create: this.createLog.bind(this),
    };
  }

  /**
   * Enable instrumentation for tracing and monitoring.
   *
   * @param instrumentation - The instrumentation implementation
   *
   * @example
   * ```ts
   * Latitude.instrument(myInstrumentation);
   * ```
   */
  static instrument(instrumentation: Instrumentation): void {
    Latitude.instrumentation = instrumentation;
  }

  /**
   * Disable instrumentation.
   */
  static uninstrument(): void {
    Latitude.instrumentation = undefined;
  }

  private wrapMethods() {
    const _renderChain = this.renderChain.bind(this);
    this.renderChain = ((...args: Parameters<typeof _renderChain>) => {
      if (!Latitude.instrumentation) return _renderChain(...args);
      return Latitude.instrumentation.wrapRenderChain(_renderChain, ...args);
    }) as typeof _renderChain;

    const _renderStep = this.renderStep.bind(this);
    this.renderStep = ((...args: Parameters<typeof _renderStep>) => {
      if (!Latitude.instrumentation) return _renderStep(...args);
      return Latitude.instrumentation.wrapRenderStep(_renderStep, ...args);
    }) as typeof _renderStep;

    const _renderCompletion = this.renderCompletion.bind(this);
    this.renderCompletion = ((
      ...args: Parameters<typeof _renderCompletion>
    ) => {
      if (!Latitude.instrumentation) return _renderCompletion(...args);
      return Latitude.instrumentation.wrapRenderCompletion(
        _renderCompletion,
        ...args,
      );
    }) as typeof _renderCompletion;

    const _renderTool = this.renderTool.bind(this);
    this.renderTool = ((...args: Parameters<typeof _renderTool>) => {
      if (!Latitude.instrumentation) return _renderTool(...args);
      return Latitude.instrumentation.wrapRenderTool(_renderTool, ...args);
    }) as typeof _renderTool;
  }

  private async getPrompt(
    path: string,
    { projectId, versionUuid }: GetPromptOptions = {},
  ) {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    versionUuid = versionUuid ?? this.options.versionUuid;

    const response = await makeRequest({
      method: 'GET',
      handler: HandlerType.GetDocument,
      params: { projectId, versionUuid, path },
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Prompt;
  }

  private async getAllPrompts({
    projectId,
    versionUuid,
  }: GetPromptOptions = {}) {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    versionUuid = versionUuid ?? this.options.versionUuid;

    const response = await makeRequest({
      method: 'GET',
      handler: HandlerType.GetAllDocuments,
      params: { projectId, versionUuid },
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Prompt[];
  }

  private async createPrompt(
    path: string,
    { projectId, versionUuid, prompt }: GetOrCreatePromptOptions = {},
  ) {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    versionUuid = versionUuid ?? this.options.versionUuid;

    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.CreateDocument,
      params: { projectId: Number(projectId), versionUuid },
      body: { path, prompt },
      options: this.options,
    });

    return (await response.json()) as Prompt;
  }

  private async getOrCreatePrompt(
    path: string,
    { projectId, versionUuid, prompt }: GetOrCreatePromptOptions = {},
  ) {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    versionUuid = versionUuid ?? this.options.versionUuid;

    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.GetOrCreateDocument,
      params: { projectId, versionUuid },
      options: this.options,
      body: { path, prompt },
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;
      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Prompt;
  }

  private runPrompt<
    S extends AssertedStreamType = 'text',
    Tools extends ToolSpec = Record<string, never>,
    Background extends boolean = false,
  >(
    path: string,
    options: RunPromptOptions<Tools, S, Background>,
  ): Promise<RunPromptResult<S, Background> | undefined> {
    const _options = {
      ...options,
      stream: options.stream ?? true, // Note: making stream the default
      options: {
        ...this.options,
        signal: options.signal,
      },
      instrumentation: Latitude.instrumentation,
    };

    if (_options.background) {
      return backgroundRun<Tools, S>(path, _options) as unknown as Promise<
        RunPromptResult<S, Background>
      >; // prettier-ignore
    }

    if (_options.stream) {
      return streamRun<Tools, S>(path, _options) as unknown as Promise<
        RunPromptResult<S, Background>
      >; // prettier-ignore
    }

    return syncRun<Tools, S>(path, _options) as unknown as Promise<RunPromptResult<S, Background>>; // prettier-ignore
  }

  private chat<
    S extends AssertedStreamType = 'text',
    Tools extends ToolSpec = Record<string, never>,
  >(
    uuid: string,
    messages: Message[],
    options?: Omit<ChatOptions<Tools, S>, 'messages'>,
  ): Promise<GenerationResponse<S> | undefined> {
    // Note: options is optional and messages is omitted to maintain backwards compatibility
    const _options = {
      ...(options || {}),
      messages,
      stream: options?.stream ?? true, // Note: making stream the default
      options: {
        ...this.options,
        signal: options?.signal,
      },
      instrumentation: Latitude.instrumentation,
    };

    if (_options.stream) return streamChat<Tools, S>(uuid, _options);

    return syncChat<Tools, S>(uuid, _options);
  }

  private attachRun<
    S extends AssertedStreamType = 'text',
    Tools extends ToolSpec = Record<string, never>,
  >(
    uuid: string,
    options?: AttachRunOptions<Tools, S>,
  ): Promise<GenerationResponse<S> | undefined> {
    const _options = {
      ...(options || {}),
      stream: options?.stream ?? true, // Note: making stream the default
      options: {
        ...this.options,
        signal: options?.signal,
      },
      instrumentation: Latitude.instrumentation,
    };

    if (_options.stream) return streamAttach<Tools, S>(uuid, _options);

    return syncAttach<Tools, S>(uuid, _options);
  }

  private async stopRun(uuid: string) {
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.StopRun,
      params: { conversationUuid: uuid },
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }
  }

  private async renderPrompt<M extends AdapterMessageType = PromptlMessage>({
    prompt,
    parameters,
    adapter: _adapter,
  }: RenderPromptOptions<M>) {
    const adapter = _adapter ?? getPromptlAdapterFromProvider(Providers.OpenAI);
    const { config, messages } = await render({
      prompt: prompt.content,
      parameters,
      adapter,
    });

    return {
      config: adaptPromptConfigToProvider(config, adapter),
      messages,
    };
  }

  private async createLog(
    path: string,
    messages: Message[],
    {
      response,
      projectId,
      versionUuid,
    }: {
      projectId?: number;
      versionUuid?: string;
      response?: string;
    } = {},
  ) {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    versionUuid = versionUuid ?? this.options.versionUuid;

    const httpResponse = await makeRequest({
      method: 'POST',
      handler: HandlerType.Log,
      params: { projectId, versionUuid },
      body: { path, messages, response },
      options: this.options,
    });

    if (!httpResponse.ok) {
      throw new LatitudeApiError({
        status: httpResponse.status,
        message: httpResponse.statusText,
        serverResponse: await httpResponse.text(),
        errorCode: ApiErrorCodes.HTTPException,
      });
    }

    return (await httpResponse.json()) as DocumentLog;
  }

  protected async renderCompletion<
    M extends AdapterMessageType = PromptlMessage,
  >({
    messages,
    config,
    onStep,
    adapter,
  }: {
    provider: string;
    config: Config;
    prompt: string;
    parameters: Record<string, unknown>;
    messages: M[];
    adapter: ProviderAdapter<M>;
  } & Pick<RenderChainOptions<M>, 'onStep'>): Promise<{
    messages: M[];
    toolRequests: ToolRequest[];
  }> {
    const response = await onStep({ messages, config });
    const message: M = typeof response === 'string'
      ? adapter.fromPromptl({
        config: {},
        messages: [
          {
            role: PromptlMessageRole.assistant,
            content: [
              {
                // @ts-expect-error - TODO(compiler): fix types
                type: 'text',
                text: response,
              },
            ],
          },
        ],
      }).messages[0]!
      : ({
        ...response,
        role: PromptlMessageRole.assistant,
      } as M);

    const promptlMessage = adapter.toPromptl({
      messages: [message],
      config: {},
    }).messages[0]!;

    const toolRequests = promptlMessage.content.filter(
      (c) => c.type === 'tool-call',
    );

    return {
      messages: [message],
      toolRequests,
    };
  }

  protected async renderStep<M extends AdapterMessageType = PromptlMessage>({
    provider,
    messages,
    config,
    prompt,
    parameters,
    onStep,
    tools,
    adapter,
  }: {
    step: number;
    provider: string;
    config: Config;
    prompt: string;
    parameters: Record<string, unknown>;
    messages: M[];
    adapter: ProviderAdapter<M>;
  } & Pick<RenderChainOptions<M>, 'onStep' | 'tools'>): Promise<{ messages: M[] }> {
    const completion = await this.renderCompletion({
      provider,
      config,
      prompt,
      parameters,
      messages,
      adapter,
      onStep,
    });

    messages = completion.messages;

    if (completion.toolRequests.length > 0) {
      messages = messages.concat(
        await this.handleToolRequests({
          toolRequests: completion.toolRequests,
          tools: tools,
          adapter: adapter,
        }),
      );
    }

    return { messages };
  }

  protected async renderChain<M extends AdapterMessageType = PromptlMessage>({
    prompt,
    parameters,
    adapter: _adapter,
    onStep,
    tools,
  }: RenderChainOptions<M>): Promise<{ config: Config; messages: M[] }> {
    const adapter = _adapter ?? getPromptlAdapterFromProvider(prompt.provider);
    const chain = new Chain({
      prompt: prompt.content,
      parameters,
      adapter,
    });

    let lastResponse: M[];
    let step = await chain.step(undefined);
    let index = 1;

    while (!step.completed) {
      const config = adaptPromptConfigToProvider(step.config, adapter);

      const result = await this.renderStep({
        step: index,
        provider: (step.config.provider as string) || prompt.provider || 'unknown',
        config,
        prompt: prompt.content,
        parameters,
        messages: step.messages,
        onStep,
        tools,
        adapter,
      });
      lastResponse = result.messages;
      step = await chain.step(lastResponse);
      index++;
    }

    // TODO(compiler): Resubmit messages if maxSteps is > 1 or type: agent
    // (see: https://github.com/vercel/ai/blob/main/packages/ai/src/ui/should-resubmit-messages.ts#L3)

    return {
      config: adaptPromptConfigToProvider(step.config, adapter),
      messages: step.messages,
    };
  }

  protected async renderTool({
    tool,
    toolRequest,
  }: {
    tool: RenderToolCalledFn<ToolSpec>[string];
    toolRequest: ToolCallContent;
  }): Promise<{ result: unknown; isError: boolean }> {
    try {
      const result = await tool(toolRequest.toolArguments, {
        id: toolRequest.toolCallId,
        name: toolRequest.toolName,
      });

      return { result, isError: false };
    } catch (error) {
      return { result: (error as Error).message, isError: true };
    }
  }

  private handleToolRequests<
    M extends AdapterMessageType = PromptlMessage,
  >({
    toolRequests,
    tools,
    adapter,
  }: {
    toolRequests: ToolRequest[];
    tools?: RenderToolCalledFn<ToolSpec>;
    adapter: ProviderAdapter<M>;
  }): Promise<M[]> {
    return Promise.all(
      toolRequests
        .filter((t) => t.toolName in (tools || {}))
        .map(async (t) => {
          const tool = tools?.[t.toolName];
          if (!tool) {
            throw new Error(`Handler for tool '${t.toolName}' not found`);
          }

          const { result, isError } = await this.renderTool({
            tool: tool,
            toolRequest: t as unknown as ToolCallContent,
          });

          return adapter.fromPromptl({
            messages: [
              {
                role: PromptlMessageRole.tool,
                content: [
                  {
                    type: ContentType.text,
                    text: JSON.stringify(result),
                  },
                ],
                toolId: t.toolCallId,
                toolName: t.toolName,
                isError: isError,
              },
            ],
            config: {},
          }).messages[0]!;
        }),
    );
  }

  private async getAllProjects() {
    const response = await makeRequest({
      method: 'GET',
      handler: HandlerType.GetAllProjects,
      options: this.options,
    });

    return (await response.json()) as Project[];
  }

  private async createProject(name: string) {
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.CreateProject,
      body: { name },
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;
      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as {
      project: Project;
      version: Version;
    };
  }

  private async annotate(
    uuid: string,
    score: number,
    evaluationUuid: string,
    opts: {
      reason?: string;
      versionUuid?: string;
    } = {},
  ) {
    const { reason, versionUuid } = opts;
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.Annotate,
      params: {
        conversationUuid: uuid,
        evaluationUuid,
      },
      body: {
        score,
        metadata: reason ? { reason } : undefined,
        versionUuid: versionUuid ?? this.options.versionUuid,
      },
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as PublicManualEvaluationResultV2;
  }

  private async createVersion(
    name: string,
    { projectId }: { projectId?: number } = {},
  ): Promise<Version> {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.CreateVersion,
      params: {
        projectId,
      },
      body: { name },
      options: this.options,
    });
    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Version;
  }

  private async getVersion(
    projectId: number,
    versionUuid: string,
  ): Promise<Version> {
    const response = await makeRequest<HandlerType.GetVersion>({
      handler: HandlerType.GetVersion,
      params: { projectId, versionUuid },
      method: 'GET',
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Version;
  }

  private async getAllVersions(projectId?: number): Promise<Version[]> {
    projectId = projectId ?? this.options.projectId;
    if (!projectId) throw new Error('Project ID is required');

    const response = await makeRequest<HandlerType.GetAllVersions>({
      handler: HandlerType.GetAllVersions,
      params: { projectId },
      method: 'GET',
      options: this.options,
    });

    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    return (await response.json()) as Version[];
  }

  private async pushVersion(
    projectId: number,
    baseCommitUuid: string,
    changes: Array<{
      path: string;
      content: string;
      status: 'added' | 'modified' | 'deleted' | 'unchanged';
      contentHash?: string;
    }>,
  ): Promise<{ commitUuid: string }> {
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.PushVersion,
      params: { projectId, commitUuid: baseCommitUuid },
      body: { changes },
      options: this.options,
    });
    if (!response.ok) {
      const error = (await response.json()) as ApiErrorJsonResponse;

      throw new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(error),
        message: error.message,
        errorCode: error.errorCode,
        dbErrorRef: error.dbErrorRef,
      });
    }

    const result = (await response.json()) as {
      commitUuid: string;
      documentsProcessed: number;
    };

    return {
      commitUuid: result.commitUuid,
    };
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

/** Main Latitude client class. */
export { Latitude };

/** Error class for API errors. */
export { LatitudeApiError };

/** Enum of log source identifiers. */
export { LogSources };

/** Enum of message roles (system, user, assistant, tool). */
export { MessageRole };

/** Provider adapters from promptl-ai. */
export { Adapters } from 'promptl-ai';

/**
 * Type exports for TypeScript consumers.
 */
export type {
  /** Chain event data transfer object. */
  ChainEventDto,
  /** Content type enum from promptl-ai. */
  ContentType,
  /** Background generation job reference. */
  GenerationJob,
  /** Response from a generation request. */
  GenerationResponse,
  /** Message type for conversations. */
  Message,
  /** Client initialization options. */
  Options,
  /** Project metadata. */
  Project,
  /** Prompt document. */
  Prompt,
  /** Tool call details for rendering. */
  RenderToolCallDetails,
  /** Tool call information. */
  ToolCall,
  /** Tool call response. */
  ToolCallResponse,
  /** Tool handler function type. */
  ToolHandler,
  /** Tool specification type. */
  ToolSpec,
};

/**
 * Interface for implementing custom instrumentation.
 *
 * Implement this interface to add tracing, logging, or monitoring
 * to Latitude SDK operations.
 *
 * @example
 * ```ts
 * const myInstrumentation: Instrumentation = {
 *   wrapRenderChain: async (fn, ...args) => {
 *     console.log("Starting render chain");
 *     const result = await fn(...args);
 *     console.log("Finished render chain");
 *     return result;
 *   },
 *   // ... implement other methods
 * };
 *
 * Latitude.instrument(myInstrumentation);
 * ```
 */
export interface Instrumentation {
  /**
   * Wrap the renderChain method for instrumentation.
   *
   * @param fn - The original renderChain function
   * @param args - Arguments passed to renderChain
   * @returns The result of renderChain
   */
  wrapRenderChain<F extends Latitude['renderChain']>(
    fn: F,
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>>;

  /**
   * Wrap the renderStep method for instrumentation.
   *
   * @param fn - The original renderStep function
   * @param args - Arguments passed to renderStep
   * @returns The result of renderStep
   */
  wrapRenderStep<F extends Latitude['renderStep']>(
    fn: F,
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>>;

  /**
   * Wrap the renderCompletion method for instrumentation.
   *
   * @param fn - The original renderCompletion function
   * @param args - Arguments passed to renderCompletion
   * @returns The result of renderCompletion
   */
  wrapRenderCompletion<F extends Latitude['renderCompletion']>(
    fn: F,
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>>;

  /**
   * Wrap the renderTool method for instrumentation.
   *
   * @param fn - The original renderTool function
   * @param args - Arguments passed to renderTool
   * @returns The result of renderTool
   */
  wrapRenderTool<F extends Latitude['renderTool']>(
    fn: F,
    ...args: Parameters<F>
  ): Promise<Awaited<ReturnType<F>>>;
}
