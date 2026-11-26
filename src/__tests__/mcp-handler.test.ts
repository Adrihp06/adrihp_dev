// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createMcpHandler, type KnowledgeBundle } from '../mcp/handler';

const bundle: KnowledgeBundle = {
  profile: { name: 'Adrián Hernández Padrón', headline: 'Data scientist working on production ML.', currentRole: { title: 'Senior Data Scientist', organization: 'Example', start: '2026-01' }, location: 'Tenerife', languages: [{ language: 'Spanish', level: 'Native' }], links: { github: 'https://github.com/Adrihp06', linkedin: 'https://linkedin.com/in/adrianhernandezpadron', site: 'https://adrihp.dev' }, categories: [{ category: 'work', count: 1 }, { category: 'education', count: 0 }, { category: 'projects', count: 0 }, { category: 'interests', count: 0 }], guidance: 'Answer only from returned data; cite source_url; say when something is not covered.' },
  entries: [{ id: 'disa-role', category: 'work', title: 'Data Scientist at DISA', organization: 'DISA', role: 'Data Scientist', location: null, start: '2023-09', end: '2025-12', summary: 'Optimized route planning and production ML.', tags: ['optimization', 'mlops'], links: [], markdown: 'Built route optimization systems with Spanish place names.\n\n## Results\n\nImproved planning efficiency.', sections: [{ slug: 'intro', title: 'Introduction', markdown: 'Built route optimization systems with Spanish place names.', sourceUrl: 'https://adrihp.dev/knowledge/disa-role.md' }, { slug: 'results', title: 'Results', markdown: 'Improved planning efficiency.', sourceUrl: 'https://adrihp.dev/knowledge/disa-role.md#results' }], sourceUrl: 'https://adrihp.dev/knowledge/disa-role.md' }],
  blogs: [{ title: 'Public article', summary: 'A published note.', publishedAt: '2026-01-01', tags: ['agents'], url: 'https://adrihp.dev/blog/public-article' }],
};
const handler = createMcpHandler(bundle);
const rpc = async (method: string, params: unknown = {}, options: { id?: number | string; version?: string; origin?: string; headers?: Record<string, string> } = {}) => {
  const { id = 1, version, origin, headers = {} } = options;
  return handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(version ? { 'MCP-Protocol-Version': version } : {}), ...(origin ? { Origin: origin } : {}), ...headers }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }));
};
const call = async (name: string, args = {}, version = '2025-11-25') => rpc('tools/call', { name, arguments: args }, { version });

describe('stateless MCP endpoint', () => {
  it('negotiates initialize, acknowledges initialized without a body, and answers ping', async () => {
    const initialize = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } }, { version: '2025-06-18' });
    const initBody = await initialize.json();
    expect(initBody.result.protocolVersion).toBe('2025-06-18');
    expect(initBody.result.serverInfo.name).toBe('adrihp');
    expect(initialize.headers.get('Cache-Control')).toBe('no-store');
    const notification = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) }));
    expect(notification.status).toBe(202);
    expect(await notification.text()).toBe('');
    expect((await (await rpc('ping')).json()).result).toEqual({});
  });

  it('lists tools and returns structured plus text output for every read operation', async () => {
    const listing = await rpc('tools/list', {}, { version: '2025-11-25' });
    const listedTools = (await listing.json()).result.tools;
    expect(listedTools.map((tool: { name: string }) => tool.name)).toEqual(['get_profile', 'list_entries', 'get_entry', 'search']);
    expect(listedTools.every((tool: { annotations?: { readOnlyHint?: boolean }; outputSchema?: object }) => tool.annotations?.readOnlyHint && tool.outputSchema)).toBe(true);
    for (const name of ['list_entries', 'get_entry', 'search']) {
      const tool = listedTools.find((item: { name: string }) => item.name === name);
      expect(tool.inputSchema.properties.question.type).toBe('string');
      expect(tool.inputSchema.additionalProperties).toBe(false);
    }
    const legacyTools = (await (await rpc('tools/list', {}, { version: '2025-03-26' })).json()).result.tools;
    expect(legacyTools.every((tool: { outputSchema?: object }) => tool.outputSchema === undefined)).toBe(true);
    const profile = (await (await call('get_profile')).json()).result;
    expect(profile.structuredContent.links.github).toBe('https://github.com/Adrihp06');
    expect(profile.structuredContent.publishedPosts[0].source_url).toBe('https://adrihp.dev/blog/public-article');
    expect(profile.content[0].text).toContain('source_url');
    expect((await (await call('list_entries', { category: 'work' })).json()).result.structuredContent.entries).toHaveLength(1);
    expect((await (await call('get_entry', { id: 'disa-role' })).json()).result.structuredContent.markdown).toContain('route optimization');
    const section = (await (await call('get_entry', { id: 'disa-role', section: 'results' })).json()).result.structuredContent;
    expect(section.source_url).toContain('#results');
    const matches = (await (await call('search', { query: 'systéms route', limit: 4 })).json()).result.structuredContent.results;
    expect(matches[0].id).toBe('disa-role');
    expect(matches[0].source_url).toContain('/knowledge/disa-role.md');
  });

  it('sends initialize and tool metadata to the injected logger without changing responses', async () => {
    const logged: any[] = [];
    const loggingHandler = createMcpHandler(bundle, event => { logged.push(event); });
    const init = await loggingHandler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestAgent/4.0' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: 'Example MCP', version: '2.1' } } }) }));
    expect(init.status).toBe(200);
    await loggingHandler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'TestAgent/4.0' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'search', arguments: { query: 'nothingmatches', question: 'What about this?' } } }) }));
    expect(logged[0]).toMatchObject({ method: 'initialize', clientName: 'Example MCP', clientVersion: '2.1', protocolVersion: '2025-11-25' });
    expect(logged[1]).toMatchObject({ method: 'tools/call', toolName: 'search', query: 'nothingmatches', question: 'What about this?', resultCount: 0, clientToken: 'TestAgent/4.0' });
  });

  it('returns useful tool errors and JSON-RPC method/parameter errors', async () => {
    const badId = (await (await call('get_entry', { id: 'missing' })).json()).result;
    expect(badId.isError).toBe(true);
    expect(badId.content[0].text).toContain('disa-role');
    const badSection = (await (await call('get_entry', { id: 'disa-role', section: 'missing' })).json()).result;
    expect(badSection.content[0].text).toContain('results');
    const method = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'no/such-method' }) }));
    expect((await method.json()).error.code).toBe(-32601);
    const tool = await rpc('tools/call', { name: 'search', arguments: { query: 'x', limit: 21 } });
    expect((await tool.json()).result.isError).toBe(true);
  });

  it('lists and reads profile and entry resources, and lists a URI template', async () => {
    const resources = (await (await rpc('resources/list')).json()).result.resources;
    expect(resources.map((resource: { uri: string }) => resource.uri)).toEqual(['adrihp://profile', 'adrihp://knowledge/disa-role']);
    const profile = (await (await rpc('resources/read', { uri: 'adrihp://profile' })).json()).result.contents[0];
    expect(profile.mimeType).toBe('application/json');
    const entry = (await (await rpc('resources/read', { uri: 'adrihp://knowledge/disa-role' })).json()).result.contents[0];
    expect(entry.mimeType).toBe('text/markdown');
    expect(entry.text).toContain('Data Scientist at DISA');
    expect((await (await rpc('resources/templates/list')).json()).result.resourceTemplates[0].uriTemplate).toBe('adrihp://knowledge/{id}');
  });

  it('applies HTTP, CORS, origin, content, body-size and JSON parsing rules', async () => {
    for (const method of ['GET', 'DELETE']) {
      const response = await handler(new Request(`https://adrihp.dev/mcp`, { method }));
      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toContain('POST');
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
    const preflight = await handler(new Request('https://adrihp.dev/mcp', { method: 'OPTIONS' }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(preflight.headers.get('Access-Control-Allow-Headers')).toContain('mcp-protocol-version');
    expect((await rpc('ping', {}, { origin: 'http://localhost:6274' })).status).toBe(200);
    expect((await rpc('ping', {}, { origin: 'not a url' })).status).toBe(403);
    expect((await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: '{}' }))).status).toBe(415);
    const large = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: ' '.repeat(65 * 1024) }));
    expect(large.status).toBe(413);
    const malformed = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }));
    expect(malformed.status).toBe(400);
    expect((await malformed.json()).error.code).toBe(-32700);
  });

  it('supports JSON-RPC batch requests only with the version that defines them', async () => {
    const batch = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-03-26' }, body: JSON.stringify([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', id: 2, method: 'tools/list' }]) }));
    expect((await batch.json()).map((item: { id: number }) => item.id)).toEqual([1, 2]);
    const unsupported = await handler(new Request('https://adrihp.dev/mcp', { method: 'POST', headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-11-25' }, body: JSON.stringify([{ jsonrpc: '2.0', id: 1, method: 'ping' }]) }));
    expect(unsupported.status).toBe(400);
  });
});
