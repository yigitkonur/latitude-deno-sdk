import { LatitudeApiError } from './errors.ts';
import { makeRequest } from './request.ts';
import { waitForTools } from './streamRun.ts';
import {
  ChatOptionsWithSDKOptions,
  ChatSyncAPIResponse,
  GenerationResponse,
  HandlerType,
  ToolSpec,
} from './types.ts';
import { ApiErrorCodes, AssertedStreamType } from '../constants/index.ts';
import type { ApiErrorJsonResponse } from '../constants/index.ts';

export async function syncChat<
  Tools extends ToolSpec,
  S extends AssertedStreamType = 'text',
>(
  uuid: string,
  {
    messages,
    tools,
    onFinished,
    onError,
    options,
  }: ChatOptionsWithSDKOptions<Tools, S>,
): Promise<GenerationResponse<S> | undefined> {
  try {
    const response = await makeRequest({
      method: 'POST',
      handler: HandlerType.Chat,
      params: { conversationUuid: uuid },
      options: options,
      body: { messages, tools: waitForTools(tools), stream: false },
    });

    if (!response.ok) {
      const json = (await response.json()) as ApiErrorJsonResponse;
      const error = new LatitudeApiError({
        status: response.status,
        serverResponse: JSON.stringify(json),
        message: json.message,
        errorCode: json.errorCode,
        dbErrorRef: json.dbErrorRef,
      });

      onError?.(error);
      return !onError ? Promise.reject(error) : Promise.resolve(undefined);
    }

    const finalResponse = (await response.json()) as ChatSyncAPIResponse<S>;

    onFinished?.(finalResponse);

    return Promise.resolve(finalResponse);
  } catch (e) {
    const err = e as Error;
    const error = new LatitudeApiError({
      status: 500,
      message: err.message,
      serverResponse: err.message,
      errorCode: ApiErrorCodes.InternalServerError,
    });

    onError?.(error);
    return !onError ? Promise.reject(error) : Promise.resolve(undefined);
  }
}
