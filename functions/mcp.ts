import bundle from '../.generated/knowledge.json';
import { createMcpHandler } from '../src/mcp/handler';
import { createMcpLogger, type McpLogEnv } from '../src/mcp/logging';

export function onRequest({ request, env, waitUntil }: {
  request: Request;
  env: McpLogEnv;
  waitUntil(promise: Promise<unknown>): void;
}) {
  const logEvent = createMcpLogger(env);
  const handler = createMcpHandler(bundle, (event, req) => {
    waitUntil(Promise.resolve(logEvent(event, req)));
  });
  return handler(request);
}
