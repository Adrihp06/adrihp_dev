// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Miniflare } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import type { D1Database } from '@cloudflare/workers-types';
import { onRequest } from '../../functions/api/views';

const origin = 'https://blog.example.com';
const slug = 'jev-travel-ruter-context-cache-agent-efficiency';
let mf: Miniflare;
let db: D1Database;
const request = (method = 'GET', data?: unknown, overrides = {}, headers = {}, host = origin) => onRequest({
  request: new Request(`${host}/api/views`, {
    method, headers: { Origin: origin, 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1', ...headers },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  }),
  env: { VIEWS_DB: db, VIEWS_ENABLED: 'true', VIEWS_ORIGIN: origin, VIEWS_HASH_SECRET: 'test-secret-at-least-32-characters-long', ...overrides },
} as Parameters<typeof onRequest>[0]);

beforeAll(async () => {
  mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("ok") } }', d1Databases: ['VIEWS_DB'] });
  db = await mf.getD1Database('VIEWS_DB') as unknown as D1Database;
  const schema = await readFile(new URL('../../migrations/0001_post_views.sql', import.meta.url), 'utf8');
  // D1 exec is line-oriented: preserve the multi-statement trigger as one line.
  await db.exec(schema.split('\n').filter(line => !line.trim().startsWith('--')).join(' '));
});
beforeEach(async () => {
  await db.batch(['DELETE FROM view_sessions', 'DELETE FROM post_views', 'DELETE FROM view_limits'].map(sql => db.prepare(sql)));
});
afterAll(async () => { await mf?.dispose(); });

describe('persistent public view API', () => {
  it('starts at zero, counts distinct sessions, and deduplicates concurrent retries', async () => {
    expect((await (await request()).json()).counts[slug]).toBe(0);
    const session = randomUUID();
    const responses = await Promise.all(Array.from({ length: 8 }, () => request('POST', { slug, session })));
    expect(responses.every(response => response.status === 200)).toBe(true);
    expect((await (await request()).json()).counts[slug]).toBe(1);
    expect((await (await request('POST', { slug, session: randomUUID() })).json()).views).toBe(2);
    expect((await (await request('POST', { slug, session })).json()).views).toBe(2);
  });

  it('shares counts across both production hosts while rejecting cross-origin writes and preview aliases', async () => {
    const hosts = ['https://adrihp.dev', 'https://adrihp.pages.dev'];
    const env = { VIEWS_ORIGINS: hosts.join(',') };
    for (const host of hosts) {
      expect((await request('POST', { slug, session: randomUUID() }, env, { Origin: host }, host)).status).toBe(200);
    }
    for (const host of hosts) {
      expect((await (await request('GET', undefined, env, {}, host)).json()).counts[slug]).toBe(2);
    }
    expect((await request('POST', { slug, session: randomUUID() }, env, { Origin: hosts[1] }, hosts[0])).status).toBe(403);
    expect((await request('POST', { slug, session: randomUUID() }, env, { Origin: 'https://preview.adrihp.pages.dev' }, 'https://preview.adrihp.pages.dev')).status).toBe(503);
    expect((await (await request('GET', undefined, env, {}, hosts[0])).json()).counts[slug]).toBe(2);
  });

  it('bounds fresh-session abuse while allowing other network origins to count', async () => {
    for (let i = 0; i < 102; i++) await request('POST', { slug, session: randomUUID() });
    expect((await (await request()).json()).counts[slug]).toBe(100);
    const response = await request('POST', { slug, session: randomUUID() }, {}, { 'CF-Connecting-IP': '192.0.2.2' });
    expect((await response.json()).views).toBe(101);
    // Real persistence contains hashes, never the IP or client session UUID.
    const rows = await db.prepare('SELECT * FROM view_sessions').all();
    expect(JSON.stringify(rows)).not.toContain('192.0.2.');
  });

  it.each([
    ['preview disabled', {}, { VIEWS_ENABLED: 'false' }, {}, origin, 503],
    ['preview alias', {}, {}, {}, 'https://branch.example.com', 503],
    ['missing database', {}, { VIEWS_DB: undefined }, {}, origin, 503],
    ['foreign origin', {}, {}, { Origin: 'https://foreign.example' }, origin, 403],
    ['unknown article', { slug: 'draft', session: randomUUID() }, {}, {}, origin, 400],
    ['invalid session', { slug, session: 'fake' }, {}, {}, origin, 400],
    ['oversized body', { slug, session: 'x'.repeat(600) }, {}, {}, origin, 413],
  ])('rejects %s without changing totals', async (_name, body, env, headers, host, status) => {
    expect((await request('POST', body, env, headers, host)).status).toBe(status);
    expect((await (await request()).json()).counts[slug]).toBe(0);
  });
});
