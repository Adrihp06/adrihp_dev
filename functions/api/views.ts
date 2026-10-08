import type { D1Database } from '@cloudflare/workers-types';
import publications from '../../posts/published.json';

interface Env {
  VIEWS_DB?: D1Database;
  VIEWS_ENABLED?: string;
  VIEWS_ORIGIN?: string;
  VIEWS_ORIGINS?: string;
  VIEWS_HASH_SECRET?: string;
}
const slugs = new Set(publications.map(({ folder }) => folder));
const encoder = new TextEncoder();
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

export async function onRequest({ request, env }: { request: Request; env: Env }) {
  const url = new URL(request.url);
  const origins = (env.VIEWS_ORIGINS ?? env.VIEWS_ORIGIN ?? '').split(',').map(origin => origin.trim());
  // Fail closed: preview aliases cannot write even if bindings are copied.
  if (env.VIEWS_ENABLED !== 'true' || !env.VIEWS_DB || !origins.includes(url.origin)) {
    return json({ error: 'Views unavailable' }, 503);
  }
  if (!['GET', 'POST'].includes(request.method)) {
    return new Response(null, { status: 405, headers: { Allow: 'GET, POST' } });
  }
  try {
    if (request.method === 'GET') {
      const { results } = await env.VIEWS_DB.prepare('SELECT slug, views FROM post_views').all<{ slug: string; views: number }>();
      const counts = Object.fromEntries([...slugs].map(slug => [slug, 0]));
      for (const row of results) if (slugs.has(row.slug)) counts[row.slug] = row.views;
      return json({ counts });
    }
    if (request.headers.get('Origin') !== url.origin) return json({ error: 'Invalid origin' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'Expected JSON' }, 415);
    if (!env.VIEWS_HASH_SECRET || env.VIEWS_HASH_SECRET.length < 32) return json({ error: 'Views unavailable' }, 503);
    // Limit the actual stream, including bodies without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Invalid request' }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512) { await reader.cancel(); return json({ error: 'Request too large' }, 413); }
      chunks.push(value);
    }
    let data: { slug?: unknown; session?: unknown };
    try { data = JSON.parse(new TextDecoder().decode(new Uint8Array(chunks.flatMap(c => [...c])))); }
    catch { return json({ error: 'Invalid JSON' }, 400); }
    if (!data || typeof data.slug !== 'string' || !slugs.has(data.slug) ||
      typeof data.session !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.session)) {
      return json({ error: 'Invalid article or session' }, 400);
    }
    const ip = request.headers.get('CF-Connecting-IP');
    if (!ip) return json({ error: 'Views unavailable' }, 503);
    const day = Math.floor(Date.now() / 86_400_000);
    const key = await crypto.subtle.importKey('raw', encoder.encode(env.VIEWS_HASH_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const bucket = hex(await crypto.subtle.sign('HMAC', key, encoder.encode(`${day}:${ip}`)));
    const session = hex(await crypto.subtle.digest('SHA-256', encoder.encode(data.session)));
    const result = await env.VIEWS_DB.batch([
      env.VIEWS_DB.prepare('DELETE FROM view_limits WHERE expires <= ?').bind(Date.now()),
      env.VIEWS_DB.prepare(`INSERT OR IGNORE INTO view_sessions (slug, session_hash, visitor_bucket, bucket_expires)
        SELECT ?, ?, ?, ? WHERE COALESCE((SELECT views FROM view_limits WHERE bucket = ?), 0) < 100`)
        .bind(data.slug, session, bucket, (day + 1) * 86_400_000, bucket),
      env.VIEWS_DB.prepare('SELECT views FROM post_views WHERE slug = ?').bind(data.slug),
    ]);
    return json({ views: (result[2].results[0] as { views: number } | undefined)?.views ?? 0 });
  } catch {
    // An unavailable metric must never interfere with reading the static page.
    return json({ error: 'Views unavailable' }, 503);
  }
};
