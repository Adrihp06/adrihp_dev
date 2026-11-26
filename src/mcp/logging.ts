import type { D1Database } from '@cloudflare/workers-types';
import type { McpEventLogger } from './handler';

export interface McpLogEnv {
  MCP_LOG_ENABLED?: string;
  VIEWS_DB?: D1Database;
  VIEWS_HASH_SECRET?: string;
}

const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, '0')).join('');
const clean = (value: string | null, limit: number) => value?.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, limit) || null;
const coarseUserAgent = (value: string | null) => clean(value?.match(/^[^\s/]+(?:\/[^\s]+)?/)?.[0] ?? null, 120);

export function createMcpLogger(env: McpLogEnv, options: { now?: () => number; random?: () => number } = {}): McpEventLogger {
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  return async (event, request) => {
    const db = env.VIEWS_DB;
    const secret = env.VIEWS_HASH_SECRET;
    // Without a keyed identity, we cannot enforce the per-visitor write budget safely.
    if (env.MCP_LOG_ENABLED !== 'true' || !db || !secret || secret.length < 32) return;
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return;
    try {
      const timestamp = now();
      const day = new Date(timestamp).toISOString().slice(0, 10);
      const userAgent = request.headers.get('User-Agent') ?? '';
      const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const visitorId = hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`adrihp.dev:mcp:${day}:${ip}:${userAgent}`))).slice(0, 32);
      const insert = db.prepare(`INSERT INTO mcp_events (
        timestamp, day, visitor_id, client_name, client_version, client_token, protocol_version,
        method, tool_name, entry_id, section, category, query, question, result_count, is_error
      ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      WHERE (SELECT COUNT(*) FROM mcp_events WHERE visitor_id = ? AND day = ?) < 300`)
        .bind(timestamp, day, visitorId,
          clean(event.clientName, 120), clean(event.clientVersion, 80), coarseUserAgent(event.method === 'initialize' ? event.clientToken : event.clientToken ?? request.headers.get('User-Agent')),
          clean(event.protocolVersion, 40), event.method, clean(event.toolName, 80), clean(event.entryId, 160),
          clean(event.section, 120), clean(event.category, 80), clean(event.query, 200), clean(event.question, 500),
          event.resultCount, event.isError ? 1 : 0, visitorId, day);
      const writes = [insert];
      if (event.method === 'initialize' && random() < 0.02) writes.unshift(db.prepare('DELETE FROM mcp_events WHERE timestamp < ?').bind(timestamp - 90 * 86_400_000));
      await db.batch(writes);
    } catch (error) {
      // Deliberately avoid logging request data or identifiers on this best-effort path.
      console.error('MCP usage logging failed', error instanceof Error ? error.message : 'unknown error');
    }
  };
}
