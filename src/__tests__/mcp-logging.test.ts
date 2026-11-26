// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFile } from 'node:fs/promises';
import type { D1Database } from '@cloudflare/workers-types';
import { createMcpLogger, type McpLogEnv } from '../mcp/logging';
import { createMcpHandler, type KnowledgeBundle } from '../mcp/handler';

const nowStart = Date.UTC(2026, 10, 15, 12);
const secret = 'test-secret-at-least-32-characters-long';
let mf: Miniflare;
let db: D1Database;
const request = (ip = '192.0.2.42', userAgent = 'ExampleClient/2.3 extra') => new Request('https://adrihp.dev/mcp', { headers: { 'CF-Connecting-IP': ip, 'User-Agent': userAgent } });
const event = (overrides: Record<string, unknown> = {}) => ({
  timestamp: nowStart, day: '2026-11-15', clientName: 'Test Client', clientVersion: '1.2', clientToken: null,
  protocolVersion: '2025-11-25', method: 'tools/call', toolName: 'search', entryId: null,
  section: null, category: null, query: 'machine learning', question: 'Where did I use ML?', resultCount: 0, isError: false,
  ...overrides,
});
const env = (overrides: Partial<McpLogEnv> = {}): McpLogEnv => ({ MCP_LOG_ENABLED: 'true', VIEWS_DB: db, VIEWS_HASH_SECRET: secret, ...overrides });
const rows = () => db.prepare('SELECT * FROM mcp_events ORDER BY id').all<Record<string, unknown>>();

beforeAll(async () => {
  mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok") } }', d1Databases: ['VIEWS_DB'] });
  db = await mf.getD1Database('VIEWS_DB') as unknown as D1Database;
  const schema = await readFile(new URL('../../migrations/0002_mcp_events.sql', import.meta.url), 'utf8');
  await db.exec(schema.split('\n').filter(line => !line.trim().startsWith('--')).join(' '));
});
beforeEach(async () => { await db.prepare('DELETE FROM mcp_events').run(); });
afterAll(async () => { await mf?.dispose(); });

describe('anonymous MCP event logging', () => {
  it('writes the event fields without persisting an IP address', async () => {
    await createMcpLogger(env(), { now: () => nowStart })(event() as never, request());
    const result = await rows();
    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      timestamp: nowStart, day: '2026-11-15', client_name: 'Test Client', client_version: '1.2',
      client_token: 'ExampleClient/2.3', protocol_version: '2025-11-25', method: 'tools/call', tool_name: 'search',
      query: 'machine learning', question: 'Where did I use ML?', result_count: 0, is_error: 0,
    });
    expect(JSON.stringify(result.results)).not.toContain('192.0.2.42');
    expect(result.results[0]).not.toHaveProperty('ip');
  });

  it('rotates the daily HMAC visitor identifier', async () => {
    const log = createMcpLogger(env(), { now: () => nowStart });
    await log(event(), request());
    const first = (await rows()).results[0].visitor_id;
    await createMcpLogger(env(), { now: () => nowStart + 86_400_000 })(event(), request());
    const result = await rows();
    expect(result.results[1].visitor_id).not.toBe(first);
    expect(result.results[1].day).toBe('2026-11-16');
  });

  it('strips controls and truncates free text to the agreed limits', async () => {
    await createMcpLogger(env(), { now: () => nowStart })(event({ query: 'q'.repeat(210) + '\nsecret', question: 'x\u0000'.repeat(260) }), request());
    const row = (await rows()).results[0];
    expect(row.query).toBe('q'.repeat(200));
    expect(row.question).toBe('x'.repeat(260));
    expect(String(row.query)).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/);
    expect(String(row.question)).not.toMatch(/[\u0000-\u001f\u007f-\u009f]/);
  });

  it('caps each daily visitor at 300 events', async () => {
    const log = createMcpLogger(env(), { now: () => nowStart });
    for (let index = 0; index < 305; index++) await log(event({ query: `query ${index}` }), request());
    expect((await db.prepare('SELECT COUNT(*) AS count FROM mcp_events').first<{ count: number }>())?.count).toBe(300);
  });

  it('deletes rows older than 90 days on a sampled initialize event', async () => {
    await db.prepare(`INSERT INTO mcp_events (timestamp, day, visitor_id, method) VALUES (?, ?, ?, ?)`)
      .bind(nowStart - 91 * 86_400_000, '2026-08-16', 'old-visitor', 'tools/call').run();
    await createMcpLogger(env(), { now: () => nowStart, random: () => 0 })(event({ method: 'initialize', toolName: null }), request());
    const result = await rows();
    expect(result.results).toHaveLength(1);
    expect(result.results[0].method).toBe('initialize');
  });

  it.each([
    ['disabled flag', { MCP_LOG_ENABLED: 'false' }],
    ['missing binding', { VIEWS_DB: undefined }],
    ['missing or short secret', { VIEWS_HASH_SECRET: 'short' }],
  ])('skips logging with %s', async (_name, overrides) => {
    await createMcpLogger(env(overrides as Partial<McpLogEnv>), { now: () => nowStart })(event(), request());
    expect((await rows()).results).toHaveLength(0);
  });

  it('uses a coarse client token for non-initialize events', async () => {
    await createMcpLogger(env(), { now: () => nowStart })(event({ clientName: null, clientVersion: null }), request('192.0.2.42', 'AgentBrowser/6.2 (Macintosh)'));
    expect((await rows()).results[0].client_token).toBe('AgentBrowser/6.2');
  });

  it('keeps logging failures off the MCP response path and accepts validated questions', async () => {
    const bundle = { profile: { categories: [], guidance: '' }, entries: [], blogs: [] } as unknown as KnowledgeBundle;
    const handler = createMcpHandler(bundle, () => Promise.reject(new Error('D1 down')));
    const response = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'list_entries', arguments: { question: 'Where is the project work?' } } }) }));
    expect(response.status).toBe(200);
    expect((await response.json()).result.structuredContent.entries).toEqual([]);
    const invalid = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'search', arguments: { query: 'x', question: 42 } } }) }));
    expect((await invalid.json()).result.isError).toBe(true);
  });

  it('discloses logging in both MCP instructions and the contact page', async () => {
    const bundle = { profile: { categories: [], guidance: '' }, entries: [], blogs: [] } as unknown as KnowledgeBundle;
    const response = await createMcpHandler(bundle)(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } }) }));
    expect((await response.json()).result.instructions).toContain('logged anonymously (no IP addresses) and deleted after 90 days');
    const contact = await readFile(new URL('../../components/portfolio/contact.html', import.meta.url), 'utf8').catch(async () => readFile(new URL('../components/portfolio/contact.html', import.meta.url), 'utf8'));
    expect(contact).toContain('logged anonymously (no IP addresses) and deleted after 90 days');
  });
});
