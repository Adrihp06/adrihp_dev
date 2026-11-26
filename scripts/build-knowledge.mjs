import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument } from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const categories = ['work', 'education', 'projects', 'interests'];
const dateMonth = /^\d{4}-(0[1-9]|1[0-2])$/;
const dateDay = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const validCalendarDate = value => {
  const match = value.match(dateDay);
  if (!match) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

function fail(file, message) {
  throw new Error(`Knowledge entry ${path.relative(root, file)}: ${message}`);
}

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripComments(markdown) {
  return markdown.replace(/<!--[\s\S]*?-->/g, '').replace(/\n{3,}/g, '\n\n').trim();
}

function parseEntry(file, raw, expectedCategory, id) {
  const match = raw.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)([\s\S]*)$/);
  if (!match) fail(file, 'missing YAML frontmatter delimited by ---');
  const document = parseDocument(match[1], { uniqueKeys: true });
  if (document.errors.length) fail(file, `invalid YAML: ${document.errors.map(error => error.message).join('; ')}`);
  const data = document.toJS();
  if (!data || typeof data !== 'object' || Array.isArray(data)) fail(file, 'frontmatter must be a YAML mapping');
  if (typeof data.title !== 'string' || !data.title.trim()) fail(file, 'title is required and must be a string');
  if (!categories.includes(data.category)) fail(file, `unknown category ${JSON.stringify(data.category)}; expected ${categories.join(', ')}`);
  if (data.category !== expectedCategory) fail(file, `category must match its folder (${expectedCategory})`);
  if (typeof data.summary !== 'string' || !data.summary.trim()) fail(file, 'summary is required and must be a string');
  if (typeof data.updated !== 'string' || !validCalendarDate(data.updated)) {
    fail(file, 'updated must be a valid YYYY-MM-DD date');
  }
  for (const field of ['start', 'end']) {
    if (data[field] != null && (typeof data[field] !== 'string' || !dateMonth.test(data[field]))) fail(file, `${field} must be YYYY-MM or null`);
  }
  if (data.start && data.end && data.end < data.start) fail(file, 'end must not be earlier than start');
  for (const field of ['organization', 'role', 'location']) {
    if (data[field] !== undefined && data[field] !== null && typeof data[field] !== 'string') fail(file, `${field} must be a string or null`);
  }
  if (data.tags !== undefined && (!Array.isArray(data.tags) || data.tags.some(tag => typeof tag !== 'string'))) fail(file, 'tags must be a list of strings');
  if (data.links !== undefined && !Array.isArray(data.links)) fail(file, 'links must be a list of { label, url } entries with public HTTP(S) URLs');
  if (data.links?.some(link => {
    if (!link || typeof link.label !== 'string' || typeof link.url !== 'string') return true;
    try {
      const url = new URL(link.url);
      return !['https:', 'http:'].includes(url.protocol) || Boolean(url.username || url.password);
    } catch { return true; }
  })) {
    fail(file, 'links must be a list of { label, url } entries with public HTTP(S) URLs');
  }
  if (data.order !== undefined && (!Number.isFinite(data.order) || typeof data.order !== 'number')) fail(file, 'order must be a number');
  if (data.draft !== undefined && typeof data.draft !== 'boolean') fail(file, 'draft must be true or false');

  const body = stripComments(match[2]);
  const sections = [];
  const sectionSlugs = new Set();
  let current = { slug: 'intro', title: 'Introduction', markdown: '' };
  let fence = null;
  for (const line of body.split(/\r?\n/)) {
    const fenceLine = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceLine) {
      const marker = fenceLine[1][0];
      if (!fence) fence = marker;
      else if (fence === marker) fence = null;
      current.markdown += `${line}\n`;
      continue;
    }
    const heading = !fence && line.match(/^##\s+(.+?)\s*#*\s*$/);
    if (heading) {
      if (current.markdown.trim()) sections.push({ ...current, markdown: current.markdown.trim() });
      const title = heading[1].trim();
      const slug = slugify(title);
      if (!slug) fail(file, `section heading ${JSON.stringify(title)} has no usable slug`);
      if (sectionSlugs.has(slug)) fail(file, `duplicate section slug ${slug}`);
      sectionSlugs.add(slug);
      current = { slug, title, markdown: '' };
    } else current.markdown += `${line}\n`;
  }
  if (current.markdown.trim() || !sections.length) sections.push({ ...current, markdown: current.markdown.trim() });
  if (sections.some(section => section.markdown.includes('<!--'))) fail(file, 'unclosed HTML comment in body');
  return {
    id, category: data.category, title: data.title.trim(), summary: data.summary.trim(),
    organization: data.organization ?? null, role: data.role ?? null, location: data.location ?? null,
    start: data.start ?? null, end: data.end ?? null, tags: data.tags ?? [], links: data.links ?? [],
    updated: data.updated ?? null, order: data.order ?? 0, draft: data.draft ?? false, markdown: body,
    sections: sections.map(section => ({ ...section, sourceUrl: `https://adrihp.dev/knowledge/${id}.md${section.slug === 'intro' ? '' : `#${section.slug}`}` })),
    sourceUrl: `https://adrihp.dev/knowledge/${id}.md`,
  };
}

async function walk(directory, sourceDir) {
  let items;
  try { items = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const item of items) {
    const full = path.join(directory, item.name);
    // Folders starting with "_" (for example the gitignored _drafts/) are never published.
    if (item.isDirectory()) { if (!item.name.startsWith('_')) files.push(...await walk(full, sourceDir)); }
    else if (item.isFile() && item.name.endsWith('.md') && full !== path.join(sourceDir, 'README.md')) files.push(full);
  }
  return files;
}

// Read synchronously only for the tiny, build-time publication metadata files.
import { readFileSync as requireReadFileSync } from 'node:fs';

export async function buildKnowledge({ rootPath = root, sourceDir = path.join(rootPath, 'knowledge'), bundlePath = path.join(rootPath, '.generated', 'knowledge.json'), publicDir = path.join(rootPath, 'public'), includeDrafts = process.env.KNOWLEDGE_INCLUDE_DRAFTS === '1' } = {}) {
  // Drafts live in knowledge/_drafts/<category>/ (gitignored, because this repo is public) and are
  // only built locally with KNOWLEDGE_INCLUDE_DRAFTS=1. Entries with `draft: true` follow the same rule.
  const draftsDir = path.join(sourceDir, '_drafts');
  const sources = [
    ...(await walk(sourceDir, sourceDir)).map(file => ({ file, base: sourceDir, inDrafts: false })),
    ...(includeDrafts ? (await walk(draftsDir, draftsDir)).map(file => ({ file, base: draftsDir, inDrafts: true })) : []),
  ];
  const entriesById = new Map();
  for (const { file, base, inDrafts } of sources.sort((a, b) => a.file.localeCompare(b.file))) {
    const relative = path.relative(base, file).split(path.sep);
    const category = relative[0];
    if (!categories.includes(category)) fail(file, `unknown category folder ${category}; expected ${categories.join(', ')}`);
    if (relative.length !== 2) fail(file, 'entries must be directly inside a category folder');
    const id = path.basename(file, '.md');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail(file, 'filename id must be lowercase kebab-case');
    if (entriesById.has(id)) fail(file, `duplicate id ${id} (also in ${entriesById.get(id).file})`);
    const raw = await readFile(file, 'utf8');
    const parsed = parseEntry(file, raw, category, id);
    if (inDrafts) parsed.draft = true;
    // Committed, published entries must not carry editorial questions: the repository is public.
    if (!parsed.draft && /TODO\(/.test(raw)) fail(file, 'published entries must not contain TODO comments; resolve them or move the entry to knowledge/_drafts/');
    entriesById.set(id, { file, parsed });
  }
  const entries = [...entriesById.values()].map(({ parsed }) => parsed).filter(entry => includeDrafts || !entry.draft).sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category) || a.order - b.order || a.title.localeCompare(b.title));

  const cv = JSON.parse(await readFile(path.join(rootPath, 'src/data/cv.json'), 'utf8'));
  const currentRole = cv.experience?.find(item => item.end == null);
  const profile = {
    name: cv.name,
    headline: cv.summary,
    currentRole: currentRole ? { title: currentRole.role, organization: currentRole.company, start: currentRole.start } : null,
    location: cv.location,
    languages: cv.languages ?? [],
    links: {
      github: `https://github.com/${cv.github}`,
      linkedin: `https://linkedin.com/in/${cv.linkedin}`,
      site: 'https://adrihp.dev',
    },
    categories: categories.map(category => ({ category, count: entries.filter(entry => entry.category === category).length })),
    guidance: 'Answer only from returned data; cite source_url; say when something is not covered.',
    source_url: 'https://adrihp.dev/contact',
  };
  let posts = [];
  try { posts = JSON.parse(await readFile(path.join(rootPath, 'posts/published.json'), 'utf8')); } catch { /* site can build without blog metadata */ }
  const blogs = posts.map(post => {
    let metadata = {};
    try { metadata = JSON.parse(requireReadFileSync(path.join(rootPath, 'posts', post.folder, 'web', 'metadata.json'))); } catch { /* published list is the source of publication */ }
    return { title: metadata.title ?? metadata.seo_title ?? post.folder, summary: metadata.seo_description ?? metadata.subtitle ?? '', publishedAt: post.published_at, tags: post.tags ?? metadata.tags ?? [], url: `https://adrihp.dev/blog/${post.folder}` };
  });
  const bundle = { profile, entries, blogs };
  await mkdir(path.dirname(bundlePath), { recursive: true });
  await writeFile(bundlePath, `${JSON.stringify(bundle, null, 2)}\n`);
  const knowledgeDir = path.join(publicDir, 'knowledge');
  await rm(knowledgeDir, { recursive: true, force: true });
  await mkdir(knowledgeDir, { recursive: true });
  for (const entry of entries) {
    const frontmatter = `# ${entry.title}\n\n${entry.summary}\n\n`;
    const metadata = [entry.organization && `Organization: ${entry.organization}`, entry.role && `Role: ${entry.role}`, entry.start && `Dates: ${entry.start}–${entry.end ?? 'present'}`].filter(Boolean).join(' · ');
    await writeFile(path.join(knowledgeDir, `${entry.id}.md`), `${frontmatter}${metadata ? `${metadata}\n\n` : ''}${entry.markdown}\n\nSource: ${entry.sourceUrl}\n`);
  }
  const categoryLinks = categories.map(category => {
    const rows = entries.filter(entry => entry.category === category).map(entry => `- [${entry.title}](${entry.sourceUrl}): ${entry.summary}`);
    return rows.length ? `## ${category[0].toUpperCase()}${category.slice(1)}\n\n${rows.join('\n')}` : '';
  }).filter(Boolean);
  const blogLinks = blogs.map(post => `- [${post.title}](${post.url})${post.summary ? `: ${post.summary}` : ''}`);
  const llms = `# Adrián Hernández Padrón\n\n> ${cv.summary}\n\n## About\n\n- [Full profile](https://adrihp.dev/llms-full.txt)\n- [Contact](https://adrihp.dev/contact)\n\n${[...categoryLinks, `## Blog\n\n${blogLinks.join('\n') || '- No published posts.'}`].join('\n\n')}\n`;
  const full = `${llms}\n## Profile\n\nName: ${profile.name}\n\nHeadline: ${profile.headline}\n\nLocation: ${profile.location}\n\nCurrent role: ${profile.currentRole ? `${profile.currentRole.title} at ${profile.currentRole.organization} (since ${profile.currentRole.start})` : 'Not specified'}\n\nLanguages: ${profile.languages.map(language => `${language.language} (${language.level})`).join(', ')}\n\nPublic links: GitHub ${profile.links.github}; LinkedIn ${profile.links.linkedin}; website ${profile.links.site}\n\n${entries.map(entry => `## ${entry.title}\n\nCategory: ${entry.category}\n\nSummary: ${entry.summary}\n\nSource: ${entry.sourceUrl}\n\n${entry.markdown}`).join('\n\n')}\n`;
  await writeFile(path.join(publicDir, 'llms.txt'), llms);
  await writeFile(path.join(publicDir, 'llms-full.txt'), full);
  return bundle;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await buildKnowledge();
    console.log(`Built knowledge bundle (${result.entries.length} published entries, ${result.blogs.length} blog posts).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
