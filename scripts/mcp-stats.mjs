#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
let days = 30;
let local = false;
for (let index = 0; index < args.length; index++) {
  if (args[index] === '--days') {
    const value = Number(args[++index]);
    if (!Number.isInteger(value) || value < 1 || value > 3650) throw new Error('--days must be an integer from 1 to 3650');
    days = value;
  } else if (args[index] === '--local') local = true;
  else throw new Error(`Unknown option: ${args[index]}`);
}

const since = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
const wrangler = process.platform === 'win32' ? 'npx.cmd' : 'npx';
function query(sql) {
  const result = spawnSync(wrangler, ['wrangler', 'd1', 'execute', 'adrihp-views', local ? '--local' : '--remote', '--env', 'production', '--json', '--command', sql], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `wrangler exited ${result.status}`);
  try {
    const parsed = JSON.parse(result.stdout);
    if (Array.isArray(parsed)) return parsed.flatMap(item => item.results ?? []);
    return parsed.results ?? [];
  } catch (error) {
    throw new Error(`Could not parse Wrangler JSON output: ${error instanceof Error ? error.message : error}\n${result.stdout}`);
  }
}

const reports = [
  ['Unique visitors by day and total', `SELECT day, COUNT(DISTINCT visitor_id) AS unique_visitors FROM mcp_events WHERE day >= '${since}' GROUP BY day UNION ALL SELECT 'TOTAL', COUNT(DISTINCT visitor_id) FROM mcp_events WHERE day >= '${since}' ORDER BY day`],
  ['Events by client', `SELECT COALESCE(client_name, client_token, '(unknown)') AS client, COALESCE(client_version, '') AS version, COUNT(*) AS events FROM mcp_events WHERE day >= '${since}' GROUP BY client, version ORDER BY events DESC`],
  ['Tool usage', `SELECT tool_name, COUNT(*) AS events FROM mcp_events WHERE day >= '${since}' AND method = 'tools/call' GROUP BY tool_name ORDER BY events DESC`],
  ['Top queries', `SELECT query, COUNT(*) AS searches, SUM(CASE WHEN result_count = 0 THEN 1 ELSE 0 END) AS zero_results FROM mcp_events WHERE day >= '${since}' AND query IS NOT NULL GROUP BY query ORDER BY searches DESC LIMIT 20`],
  ['Zero-result queries', `SELECT query, COUNT(*) AS searches, MAX(day) AS last_seen FROM mcp_events WHERE day >= '${since}' AND query IS NOT NULL AND result_count = 0 GROUP BY query ORDER BY searches DESC, last_seen DESC LIMIT 30`],
  ['Most-read entries and sections', `SELECT COALESCE(entry_id, '(profile)') AS entry_id, COALESCE(section, '(whole entry)') AS section, COUNT(*) AS reads FROM mcp_events WHERE day >= '${since}' AND (method = 'resources/read' OR tool_name = 'get_entry') AND is_error = 0 GROUP BY entry_id, section ORDER BY reads DESC LIMIT 30`],
  ['Latest questions', `SELECT timestamp, day, question, tool_name, query, entry_id FROM mcp_events WHERE day >= '${since}' AND question IS NOT NULL ORDER BY timestamp DESC LIMIT 30`],
];

console.log(`MCP usage · last ${days} days · ${local ? 'local' : 'production remote'} database`);
for (const [heading, sql] of reports) {
  const rows = query(sql);
  console.log(`\n${heading}`);
  if (!rows.length) console.log('  (no data)');
  else for (const row of rows) console.log(`  ${JSON.stringify(row)}`);
}
