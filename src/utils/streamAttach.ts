import { LatitudeApiError } from './errors.ts';
import { handleStream } from './handleStream.ts';
import { makeRequest } from './request.ts';
import {
  type AttachRunOptions,
  type GenerationResponse,
  HandlerType,
  type SDKOptions,
  type ToolSpec,
} from './types.ts';
import { ApiErrorCodes, type AssertedStreamType } from '../constants/index.ts';
import type { ApiErrorJsonResponse } from '../constants/index.ts';
import { handleToolCallFactory } from './streamRun.ts';

function handleError(
  error: LatitudeApiError,
  onError?: (error: LatitudeApiError) => void,
): Promise<undefined> | never {
  onError?.(error);
  return !onError ? Promise.reject(error) : Promise.resolve(undefined);
}

export async function streamAttach<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
>(
  uuid: string,
  {
    onEvent,
    onFinished,
    onError,
    tools,
    options,
  }: AttachRunOptions<Tools, S> & {
    options: SDKOptions;
  },
): Promise<GenerationResponse<S> | undefined> {
  try {
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.AttachRun,
      params: { conversationUuid: uuid },
      options: options,
      body: { stream: true },
    });

    if (!response.ok) {
      const json = (await response.json()) as ApiErrorJsonResponse;
      const error = new LatitudeApiError({
        status: response.status,
        serverResponse: json ? JSON.stringify(json) : response.statusText,
        message: json?.message ?? response.statusText,
        errorCode: json?.errorCode ?? ApiErrorCodes.InternalServerError,
        dbErrorRef: json?.dbErrorRef,
      });

      return handleError(error, onError);
    }

    const finalResponse = await handleStream<S>({
      body: response.body!, // Already a Web ReadableStream in Deno
      onEvent,
      onError,
      onToolCall: handleToolCallFactory({ tools, options }),
    });

    if (!finalResponse) return;

    onFinished?.(finalResponse);

    return Promise.resolve(finalResponse);
  } catch (e) {
    if (e instanceof LatitudeApiError) {
      return handleError(e, onError);
    }

    const err = e as Error;
    const error = new LatitudeApiError({
      status: 500,
      message: err.message,
      serverResponse: err.message,
      errorCode: ApiErrorCodes.InternalServerError,
    });

    return handleError(error, onError);
  }
}
