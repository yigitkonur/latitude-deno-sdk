/**
 * Error handling utilities for the Latitude SDK.
 *
 * This module provides error classes and utilities for handling API errors.
 *
 * @module
 */

import {
  ApiErrorCodes,
  ApiErrorJsonResponse,
  ApiResponseCode,
  DbErrorRef,
  LatitudeErrorCodes,
  RunErrorCodes,
} from './errorConstants.ts';

function getErrorMessage({
  status,
  message,
  errorCode,
}: {
  status: number;
  message: string;
  errorCode: ApiResponseCode;
}) {
  const httpExeception = ApiErrorCodes.HTTPException;
  const internalServerError = ApiErrorCodes.InternalServerError;
  const isUnexpectedError = errorCode === httpExeception || errorCode === internalServerError;
  if (isUnexpectedError) {
    return `Unexpected API Error: ${status} ${message}`;
  }

  return message;
}

/**
 * Error class for Latitude API errors.
 *
 * This error is thrown when the Latitude API returns an error response.
 * It contains detailed information about the error including status code,
 * error code, and server response.
 *
 * @example
 * ```ts
 * try {
 *   await client.prompts.run("my-prompt", { parameters: {} });
 * } catch (error) {
 *   if (error instanceof LatitudeApiError) {
 *     console.error(`API Error ${error.status}: ${error.message}`);
 *     console.error(`Error Code: ${error.errorCode}`);
 *   }
 * }
 * ```
 *
 * @class
 * @extends Error
 */
export class LatitudeApiError extends Error {
  /** HTTP status code from the API response. */
  status: number;
  /** Human-readable error message. */
  override message: string;
  /** Raw server response body. */
  serverResponse: string;
  /** Machine-readable error code for programmatic handling. */
  errorCode: ApiResponseCode;
  /** Optional reference to the database entity related to this error. */
  dbErrorRef?: DbErrorRef;

  /**
   * Creates a new LatitudeApiError instance.
   *
   * @param options - Error configuration
   * @param options.status - HTTP status code
   * @param options.message - Error message from the server
   * @param options.serverResponse - Raw server response
   * @param options.errorCode - Machine-readable error code
   * @param options.dbErrorRef - Optional database error reference
   */
  constructor({
    status,
    message,
    serverResponse,
    errorCode,
    dbErrorRef,
  }: {
    status: number;
    message: string;
    serverResponse: string;
    errorCode: ApiResponseCode;
    dbErrorRef?: DbErrorRef;
  }) {
    const msg = getErrorMessage({ status, message, errorCode });
    super(message);

    this.status = status;
    this.message = msg;
    this.serverResponse = serverResponse;
    this.errorCode = errorCode;
    this.dbErrorRef = dbErrorRef;
  }
}

export type { ApiErrorJsonResponse, ApiResponseCode, DbErrorRef };
export { ApiErrorCodes, LatitudeErrorCodes, RunErrorCodes };
