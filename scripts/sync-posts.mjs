import { readFile, writeFile, mkdir, cp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const publications = JSON.parse(await readFile(join(root, 'posts/published.json'), 'utf8'));
const content = join(root, 'src/content/blog');
const assets = join(root, 'public/posts');
await mkdir(content, { recursive: true });
await mkdir(assets, { recursive: true });
const slugs = new Set();
for (const publication of publications) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(publication.folder)) throw new Error('Invalid post folder');
  const folder = join(root, 'posts', publication.folder, 'web');
  const meta = JSON.parse(await readFile(join(folder, 'metadata.json'), 'utf8'));
  if (meta.language !== 'en' || meta.slug !== publication.folder || slugs.has(meta.slug)) throw new Error(`Invalid publication: ${publication.folder}`);
  slugs.add(meta.slug);
  let body = await readFile(join(folder, 'article-en.md'), 'utf8');
  body = body.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
  body = body.replace(/^# .+\r?\n\s*/, '');
  body = body.replace(/\]\((images|data)\/([^\s)]+)\)/g, `](/posts/${meta.slug}/$1/$2)`);
  const fields = {
    title: meta.title,
    pubDate: publication.published_at,
    description: meta.seo_description,
    tags: publication.tags,
    draft: false,
    language: 'en',
    author: meta.author || 'Adrián Hernández Padrón',
    ...(meta.original_url ? { originalUrl: meta.original_url } : {}),
    ...(meta.cover_image ? { cover: `/posts/${meta.slug}/${meta.cover_image}` } : {}),
  };
  const frontmatter = Object.entries(fields).map(([key, value]) => `${key}: ${key === 'pubDate' ? value : JSON.stringify(value)}`).join('\n');
  await writeFile(join(content, `${meta.slug}.md`), `---\n${frontmatter}\n---\n\n${body}`);
  const assetFolder = join(assets, meta.slug);
  await rm(assetFolder, { recursive: true, force: true });
  await mkdir(assetFolder, { recursive: true });
  for (const name of ['images', 'data']) {
    if ((await readdir(folder)).includes(name)) await cp(join(folder, name), join(assetFolder, name), { recursive: true });
  }
}
// This directory is generated: excluded drafts must not retain public routes.
for (const name of await readdir(content)) if (name.endsWith('.md') && !slugs.has(name.slice(0, -3))) await rm(join(content, name));
for (const name of await readdir(assets)) if (!slugs.has(name)) await rm(join(assets, name), { recursive: true, force: true });
console.log(`Prepared ${slugs.size} English posts from posts/published.json.`);
