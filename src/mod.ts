/**
 * # Latitude Deno SDK
 *
 * Type-safe SDK for interacting with the Latitude API from Deno and Supabase Edge Functions.
 * This is a community fork of the official Node.js SDK, rebuilt for Deno compatibility.
 *
 * ## Installation
 *
 * ```ts
 * import { Latitude } from "jsr:@yigitkonur/latitude-deno-sdk";
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { Latitude } from "jsr:@yigitkonur/latitude-deno-sdk";
 *
 * // Initialize the client
 * const client = new Latitude("your-api-key", {
 *   projectId: 123,
 *   versionUuid: "live", // optional
 * });
 *
 * // Run a prompt
 * const result = await client.prompts.run("my-prompt", {
 *   parameters: { name: "World" },
 * });
 *
 * console.log(result.response.text);
 * ```
 *
 * ## Features
 *
 * - **Prompt Management**: Get, create, run, and chat with prompts
 * - **Project Management**: List and create projects
 * - **Version Control**: Manage prompt versions
 * - **Streaming Support**: Real-time streaming responses
 * - **Tool Calling**: Define and handle custom tools
 * - **Evaluations**: Annotate and evaluate prompt runs
 *
 * ## Environment Variables
 *
 * - `GATEWAY_HOSTNAME`: Override the API gateway hostname (default: gateway.latitude.so)
 * - `GATEWAY_PORT`: Override the API gateway port
 * - `GATEWAY_SSL`: Enable/disable SSL (default: true in production)
 *
 * @example Run a prompt with streaming
 * ```ts
 * const result = await client.prompts.run("chat-prompt", {
 *   parameters: { topic: "TypeScript" },
 *   stream: true,
 *   onEvent: ({ event, data }) => console.log(event, data),
 *   onFinished: (response) => console.log("Done:", response.response.text),
 * });
 * ```
 *
 * @example Chat with conversation history
 * ```ts
 * const firstRun = await client.prompts.run("assistant", {
 *   parameters: {},
 * });
 *
 * // Continue the conversation
 * const followUp = await client.prompts.chat(firstRun.uuid, [
 *   { role: "user", content: [{ type: "text", text: "Tell me more" }] },
 * ]);
 * ```
 *
 * @module
 * @license MIT
 * @see {@link https://docs.latitude.so | Latitude Documentation}
 */

export * from './index.ts';
