export interface KnowledgeSection {
  slug: string;
  title: string;
  markdown: string;
  sourceUrl: string;
}

export interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  summary: string;
  organization: string | null;
  role: string | null;
  location: string | null;
  start: string | null;
  end: string | null;
  tags: string[];
  links: { label: string; url: string }[];
  markdown: string;
  sections: KnowledgeSection[];
  sourceUrl: string;
}

export interface KnowledgeBundle {
  profile: Record<string, unknown> & { categories: { category: string; count: number }[]; guidance: string };
  entries: KnowledgeEntry[];
  blogs: { title: string; summary: string; publishedAt: string; tags: string[]; url: string }[];
}

const VERSION = '2025-11-25';
const VERSIONS = ['2024-11-05', '2025-03-26', '2025-06-18', VERSION];
const MAX_BODY_BYTES = 64 * 1024;
const tools = [
  { name: 'get_profile', description: 'Return Adrián’s public profile, current role, location, languages, public links, published blog links and knowledge category counts. Answer only from returned data; cite source_url; say when something is not covered.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { name: { type: 'string' }, headline: { type: 'string' }, currentRole: { type: ['object', 'null'] }, location: { type: 'string' }, languages: { type: 'array' }, links: { type: 'object' }, categories: { type: 'array' }, publishedPosts: { type: 'array' }, guidance: { type: 'string' }, source_url: { type: 'string' } }, required: ['name', 'headline', 'location', 'links', 'categories', 'guidance', 'source_url'], additionalProperties: true }, annotations: { readOnlyHint: true } },
  { name: 'list_entries', description: 'List published knowledge entries, optionally filtered by category. Optional question: the user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.', inputSchema: { type: 'object', properties: { category: { type: 'string', enum: ['work', 'education', 'projects', 'interests'] }, question: { type: 'string', description: 'Optional. The user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.' } }, additionalProperties: false }, outputSchema: { type: 'object', properties: { entries: { type: 'array', items: { type: 'object' } }, error: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: true } },
  { name: 'get_entry', description: 'Read one published knowledge entry or a single section by its slug. Optional question: the user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.', inputSchema: { type: 'object', properties: { id: { type: 'string' }, section: { type: 'string' }, question: { type: 'string', description: 'Optional. The user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.' } }, required: ['id'], additionalProperties: false }, outputSchema: { type: 'object', properties: { id: { type: 'string' }, markdown: { type: 'string' }, source_url: { type: 'string' }, error: { type: 'string' } }, additionalProperties: true }, annotations: { readOnlyHint: true } },
  { name: 'search', description: 'Search published entry sections in Spanish or English. Returns ranked snippets with source links. Optional question: the user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.', inputSchema: { type: 'object', properties: { query: { type: 'string', minLength: 1 }, category: { type: 'string', enum: ['work', 'education', 'projects', 'interests'] }, limit: { type: 'integer', minimum: 1, maximum: 20, default: 5 }, question: { type: 'string', description: 'Optional. The user’s question in their own words, so the owner can improve this knowledge base. Logged anonymously; do not include personal data.' } }, required: ['query'], additionalProperties: false }, outputSchema: { type: 'object', properties: { results: { type: 'array', items: { type: 'object' } }, error: { type: 'string' } }, additionalProperties: false }, annotations: { readOnlyHint: true } },
];

export interface McpLogEvent {
  timestamp: number;
  day: string;
  clientName: string | null;
  clientVersion: string | null;
  clientToken: string | null;
  protocolVersion: string | null;
  method: string;
  toolName: string | null;
  entryId: string | null;
  section: string | null;
  category: string | null;
  query: string | null;
  question: string | null;
  resultCount: number | null;
  isError: boolean;
}
export type McpEventLogger = (event: McpLogEvent, request: Request) => void | Promise<void>;

type RpcRequest = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any };
const jsonHeaders = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tokens = (value: string): string[] => normalize(value).match(/[a-z0-9]+/g) ?? [];
const titleOf = (entry: KnowledgeEntry, section: KnowledgeSection) => section.slug === 'intro' ? entry.title : section.title;

function errorObject(id: unknown, code: number, message: string, data?: unknown) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function result(id: unknown, value: unknown) { return { jsonrpc: '2.0', id, result: value }; }

function textContent(text: string) { return [{ type: 'text', text }]; }

function toolResult(data: unknown, protocolVersion: string, isError = false) {
  const structured = Array.isArray(data) ? { entries: data } : data;
  return { content: textContent(typeof data === 'string' ? data : JSON.stringify(data, null, 2)), ...(protocolVersion !== '2024-11-05' && protocolVersion !== '2025-03-26' ? { structuredContent: structured } : {}), ...(isError ? { isError: true } : {}) };
}

function entryMetadata(entry: KnowledgeEntry) {
  return {
    id: entry.id, category: entry.category, title: entry.title, organization: entry.organization,
    role: entry.role, location: entry.location, start: entry.start, end: entry.end,
    summary: entry.summary, tags: entry.tags,
    sections: entry.sections.map(({ slug, title }) => ({ slug, title })), source_url: entry.sourceUrl,
  };
}

function profileData(bundle: KnowledgeBundle) {
  return {
    ...bundle.profile,
    publishedPosts: bundle.blogs.map(post => ({ title: post.title, summary: post.summary, published_at: post.publishedAt, tags: post.tags, source_url: post.url })),
    source_url: 'https://adrihp.dev/contact',
  };
}

function search(bundle: KnowledgeBundle, query: string, category?: string, limit = 5) {
  const terms = [...new Set(tokens(query))];
  if (!terms.length) return [];
  const chunks = bundle.entries.filter(entry => !category || entry.category === category).flatMap(entry => entry.sections.map(section => ({ entry, section })));
  const docFrequency = new Map(terms.map(term => [term, chunks.filter(({ entry, section }) => tokens(`${entry.title} ${section.title} ${entry.summary} ${section.markdown} ${entry.tags.join(' ')}`).includes(term)).length]));
  return chunks.map(({ entry, section }) => {
    const content = `${entry.title} ${section.title} ${entry.summary} ${entry.organization ?? ''} ${entry.role ?? ''} ${entry.tags.join(' ')} ${section.markdown}`;
    const words = tokens(content);
    const counts = new Map<string, number>();
    words.forEach(word => counts.set(word, (counts.get(word) ?? 0) + 1));
    let score = 0;
    for (const term of terms) {
      const tf = counts.get(term) ?? 0;
      if (tf) score += (1 + Math.log(tf)) * (Math.log(1 + (chunks.length - (docFrequency.get(term) ?? 0) + 0.5) / ((docFrequency.get(term) ?? 0) + 0.5)) + 1);
    }
    return { entry, section, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id) || a.section.slug.localeCompare(b.section.slug)).slice(0, limit).map(({ entry, section, score }) => {
    const text = section.markdown.replace(/[#*_`>\[\]()]/g, ' ').replace(/\s+/g, ' ').trim();
    const firstTerm = terms.find(term => tokens(text).includes(term));
    const index = firstTerm ? normalize(text).indexOf(firstTerm) : 0;
    const start = Math.max(0, index - 100);
    const snippet = `${start ? '…' : ''}${text.slice(start, start + 260).trim()}${start + 260 < text.length ? '…' : ''}`;
    return { id: entry.id, section: section.slug, title: titleOf(entry, section), snippet, score: Number(score.toFixed(3)), source_url: section.sourceUrl };
  });
}

function callTool(bundle: KnowledgeBundle, name: string, args: any) {
  if (!args || typeof args !== 'object' || Array.isArray(args)) return { error: 'Tool arguments must be an object.' };
  const allowed = name === 'get_profile' ? [] : name === 'list_entries' ? ['category', 'question'] : name === 'get_entry' ? ['id', 'section', 'question'] : name === 'search' ? ['query', 'category', 'limit', 'question'] : [];
  const extra = Object.keys(args).find(key => !allowed.includes(key));
  if (extra) return { error: `Unknown argument ${JSON.stringify(extra)} for ${name}.` };
  if (args.question !== undefined && typeof args.question !== 'string') return { error: 'question must be a string.' };
  if (name === 'get_profile') return profileData(bundle);
  if (name === 'list_entries') {
    if (args.category !== undefined && !['work', 'education', 'projects', 'interests'].includes(args.category)) return { error: 'Unknown category. Valid categories: work, education, projects, interests.' };
    return { entries: bundle.entries.filter(entry => !args.category || entry.category === args.category).map(entryMetadata) };
  }
  if (name === 'get_entry') {
    if (typeof args.id !== 'string') return { error: 'id must be a string.' };
    const entry = bundle.entries.find(item => item.id === args.id);
    if (!entry) return { error: `Unknown entry ${JSON.stringify(args.id)}. Valid ids: ${bundle.entries.map(item => item.id).join(', ') || '(none)'}.` };
    if (args.section === undefined) return { ...entryMetadata(entry), markdown: entry.markdown };
    if (typeof args.section !== 'string') return { error: 'section must be a string.' };
    const section = entry.sections.find(item => item.slug === args.section);
    if (!section) return { error: `Unknown section ${JSON.stringify(args.section)} for ${entry.id}. Valid sections: ${entry.sections.map(item => item.slug).join(', ') || '(none)'}.` };
    return { ...entryMetadata(entry), section: section.slug, section_title: section.title, markdown: section.markdown, source_url: section.sourceUrl };
  }
  if (name === 'search') {
    if (typeof args.query !== 'string' || !args.query.trim()) return { error: 'query must be a non-empty string.' };
    if (args.category !== undefined && !['work', 'education', 'projects', 'interests'].includes(args.category)) return { error: 'Unknown category. Valid categories: work, education, projects, interests.' };
    const limit = args.limit === undefined ? 5 : args.limit;
    if (!Number.isInteger(limit) || limit < 1 || limit > 20) return { error: 'limit must be an integer from 1 to 20.' };
    return { results: search(bundle, args.query, args.category, limit) };
  }
  return { error: `Unknown tool ${name}.` };
}

function readResource(bundle: KnowledgeBundle, uri: unknown) {
  if (uri === 'adrihp://profile') return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(profileData(bundle), null, 2) }] };
  if (typeof uri === 'string' && uri.startsWith('adrihp://knowledge/')) {
    const id = uri.slice('adrihp://knowledge/'.length);
    const entry = bundle.entries.find(item => item.id === id);
    if (entry) return { contents: [{ uri, mimeType: 'text/markdown', text: `# ${entry.title}\n\n${entry.summary}\n\n${entry.markdown}\n\nSource: ${entry.sourceUrl}` }] };
  }
  throw new Error(`Unknown resource ${JSON.stringify(uri)}. Use adrihp://profile or adrihp://knowledge/{id}.`);
}

function dispatch(bundle: KnowledgeBundle, request: RpcRequest, version: string) {
  if (!request || typeof request !== 'object' || Array.isArray(request)) return errorObject(null, -32600, 'Invalid Request');
  const { id, method, params = {} } = request;
  if (request.jsonrpc !== '2.0' || typeof method !== 'string' || (id !== undefined && !['string', 'number'].includes(typeof id))) return errorObject(id, -32600, 'Invalid Request');
  if (method.startsWith('notifications/')) return null;
  if (method === 'initialize') {
    const requested = params.protocolVersion;
    if (typeof requested !== 'string') return errorObject(id, -32602, 'initialize requires a protocolVersion string');
    return result(id, { protocolVersion: VERSIONS.includes(requested) ? requested : VERSION, capabilities: { tools: { listChanged: false }, resources: { subscribe: false, listChanged: false } }, serverInfo: { name: 'adrihp', version: '1.0.0' }, instructions: 'Read-only public information about Adrián Hernández Padrón. Use search/list_entries to locate sources, fetch details with get_entry, cite each source_url, and state when the public knowledge does not cover a question. Searches and questions are logged anonymously (no IP addresses) and deleted after 90 days.' });
  }
  if (id === undefined) return null;
  if (method === 'ping') return result(id, {});
  if (method === 'tools/list') return result(id, { tools: tools.map(({ outputSchema, annotations, ...tool }) => ({
    ...tool,
    ...(version !== '2024-11-05' ? { annotations } : {}),
    ...(['2025-06-18', '2025-11-25'].includes(version) ? { outputSchema } : {}),
  })) });
  if (method === 'tools/call') {
    if (typeof params.name !== 'string') return errorObject(id, -32602, 'tools/call requires a tool name');
    const output = callTool(bundle, params.name, params.arguments ?? {});
    return result(id, toolResult(output, version, Boolean((output as { error?: unknown }).error)));
  }
  if (method === 'resources/list') return result(id, { resources: [{ uri: 'adrihp://profile', name: 'Adrián’s public profile', mimeType: 'application/json', description: 'Profile facts and public links.' }, ...bundle.entries.map(entry => ({ uri: `adrihp://knowledge/${entry.id}`, name: entry.title, mimeType: 'text/markdown', description: entry.summary }))] });
  if (method === 'resources/read') {
    if (typeof params.uri !== 'string') return errorObject(id, -32602, 'resources/read requires a uri');
    try { return result(id, readResource(bundle, params.uri)); } catch (error) { return errorObject(id, -32602, (error as Error).message); }
  }
  if (method === 'resources/templates/list') return result(id, { resourceTemplates: [{ uriTemplate: 'adrihp://knowledge/{id}', name: 'Knowledge entry', mimeType: 'text/markdown', description: 'A published knowledge entry.' }] });
  return errorObject(id, -32601, `Method not found: ${method}`);
}

function response(body: unknown, status = 200, version?: string) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers: { ...jsonHeaders, ...(version ? { 'MCP-Protocol-Version': version } : {}) } });
}

// The server only exposes public, read-only data and has no credentials or sessions, so DNS
// rebinding gives an attacker nothing they could not fetch directly. Any well-formed Origin is
// accepted, including localhost (e.g. the MCP Inspector running in a local browser).
function validateOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin === null || origin === 'null') return true;
  try { return ['https:', 'http:'].includes(new URL(origin).protocol); } catch { return false; }
}

async function readBody(request: Request) {
  const advertised = Number(request.headers.get('Content-Length'));
  if (Number.isFinite(advertised) && advertised > MAX_BODY_BYTES) throw new RangeError('Request body too large');
  const reader = request.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new RangeError('Request body too large'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  chunks.forEach(chunk => { bytes.set(chunk, offset); offset += chunk.length; });
  return new TextDecoder().decode(bytes);
}

function countFor(method: string, output: any): number | null {
  if (method === 'initialize') return null;
  if (method === 'tools/call') {
    let data = output?.result?.structuredContent;
    if (!data && typeof output?.result?.content?.[0]?.text === 'string') {
      try { data = JSON.parse(output.result.content[0].text); } catch { /* Keep best-effort count unknown. */ }
    }
    if (Array.isArray(data?.results)) return data.results.length;
    if (Array.isArray(data?.entries)) return data.entries.length;
    return data?.error || output?.result?.isError ? 0 : 1;
  }
  if (method === 'resources/read') return Array.isArray(output?.result?.contents) ? output.result.contents.length : 0;
  return null;
}

function eventFor(rpcRequest: RpcRequest, output: any, request: Request, version: string): McpLogEvent | null {
  const method = rpcRequest.method;
  if (method !== 'initialize' && method !== 'tools/call' && method !== 'resources/read') return null;
  const params = rpcRequest.params ?? {};
  const args = params.arguments ?? {};
  let data = output?.result?.structuredContent;
  if (!data && typeof output?.result?.content?.[0]?.text === 'string') {
    try { data = JSON.parse(output.result.content[0].text); } catch { /* Older clients still get logged without result metadata. */ }
  }
  const initialize = method === 'initialize';
  const rawInfo = initialize ? params.clientInfo : undefined;
  const resourceId = method === 'resources/read' && typeof params.uri === 'string' && params.uri.startsWith('adrihp://knowledge/') ? params.uri.slice('adrihp://knowledge/'.length) : null;
  return {
    timestamp: Date.now(), day: new Date().toISOString().slice(0, 10),
    clientName: typeof rawInfo?.name === 'string' ? rawInfo.name : null,
    clientVersion: typeof rawInfo?.version === 'string' ? rawInfo.version : null,
    clientToken: initialize ? null : request.headers.get('User-Agent'),
    protocolVersion: initialize && typeof output?.result?.protocolVersion === 'string' ? output.result.protocolVersion : version,
    method,
    toolName: method === 'tools/call' && typeof params.name === 'string' ? params.name : null,
    entryId: method === 'tools/call' && typeof args.id === 'string' ? args.id : resourceId ?? (typeof data?.id === 'string' ? data.id : null),
    section: typeof args.section === 'string' ? args.section : (typeof data?.section === 'string' ? data.section : null),
    category: typeof args.category === 'string' ? args.category : (typeof data?.category === 'string' ? data.category : null),
    query: typeof args.query === 'string' ? args.query : null,
    question: typeof args.question === 'string' ? args.question : null,
    resultCount: countFor(method, output),
    isError: Boolean(output?.error || output?.result?.isError),
  };
}

export function createMcpHandler(bundle: KnowledgeBundle, logEvent?: McpEventLogger) {
  return async function handle(request: Request): Promise<Response> {
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'content-type, mcp-protocol-version, mcp-session-id, authorization', 'Access-Control-Max-Age': '86400' };
    const finish = (body: unknown, status = 200, version?: string) => {
      const res = response(body, status, version);
      for (const [key, value] of Object.entries(cors)) res.headers.set(key, value);
      return res;
    };
    if (request.method === 'OPTIONS') return finish(null, 204);
    if (request.method === 'GET' || request.method === 'DELETE') {
      const res = finish(null, 405);
      res.headers.set('Allow', 'POST, OPTIONS');
      return res;
    }
    if (request.method !== 'POST') return finish({ error: 'Method not allowed' }, 405);
    if (!validateOrigin(request)) return finish({ error: 'Invalid Origin' }, 403);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') ?? '')) return finish({ error: 'Expected application/json' }, 415);
    let body: unknown;
    try { body = JSON.parse(await readBody(request)); }
    catch (error) {
      if (error instanceof RangeError) return finish({ error: error.message }, 413);
      return finish(errorObject(null, -32700, 'Parse error'), 400);
    }
    const input = Array.isArray(body) ? body : [body];
    const headerVersion = request.headers.get('MCP-Protocol-Version');
    const requestedVersion = input.map(item => (item as RpcRequest | undefined)?.method === 'initialize' ? (item as RpcRequest).params?.protocolVersion : undefined).find(Boolean);
    const version = headerVersion ?? (typeof requestedVersion === 'string' && VERSIONS.includes(requestedVersion) ? requestedVersion : '2025-03-26');
    if (headerVersion && !VERSIONS.includes(headerVersion)) return finish(errorObject((body as RpcRequest)?.id, -32600, 'Unsupported MCP protocol version'), 400, VERSION);
    if (Array.isArray(body) && version !== '2025-03-26') return finish(errorObject(null, -32600, 'JSON-RPC batches are supported only with protocol version 2025-03-26'), 400, version);
    if (Array.isArray(body) && body.length === 0) return finish(errorObject(null, -32600, 'Invalid Request'), 200, version);
    const outputs = input.map(item => {
      const rpcRequest = item as RpcRequest;
      const output = dispatch(bundle, rpcRequest, version);
      if (output !== null && logEvent) {
        const event = eventFor(rpcRequest, output, request, version);
        if (event) { try { Promise.resolve(logEvent(event, request)).catch(() => {}); } catch { /* Observability must never affect the MCP response. */ } }
      }
      return output;
    }).filter(item => item !== null);
    if (outputs.length) {
      const selected = !Array.isArray(body) && (body as RpcRequest).method === 'initialize' && !('error' in (outputs[0] as object))
        ? ((outputs[0] as { result?: { protocolVersion?: string } }).result?.protocolVersion ?? version)
        : version;
      return finish(Array.isArray(body) ? outputs : outputs[0], 200, selected);
    }
    return finish(null, 202, version);
  };
}
