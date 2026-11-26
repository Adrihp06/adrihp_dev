// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKnowledge } from '../../scripts/build-knowledge.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const fixtureSource = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/knowledge');
const tempRoots: string[] = [];

async function setup() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'adrihp-knowledge-'));
  tempRoots.push(root);
  const source = path.join(root, 'knowledge');
  await cp(fixtureSource, source, { recursive: true });
  const publicDir = path.join(root, 'public');
  const bundlePath = path.join(root, '.generated/knowledge.json');
  return { root, source, publicDir, bundlePath, build: (includeDrafts = false) => buildKnowledge({ rootPath: repo, sourceDir: source, publicDir, bundlePath, includeDrafts }) };
}

afterEach(async () => { await Promise.all(tempRoots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

describe('knowledge build contract', () => {
  it('publishes only non-drafts, strips comments and makes addressable section slugs', async () => {
    const paths = await setup();
    const bundle = await paths.build();
    expect(bundle.entries.map(entry => entry.id)).toEqual(['example-role']);
    expect(bundle.entries[0].sections.map((section: { slug: string }) => section.slug)).toEqual(['intro', 'route-optimization', 'outcomes']);
    expect(bundle.entries[0].markdown).not.toContain('private note');
    expect((await readFile(path.join(paths.publicDir, 'knowledge/example-role.md'), 'utf8'))).not.toContain('private note');
    expect((await readFile(path.join(paths.publicDir, 'llms.txt'), 'utf8'))).toContain('https://adrihp.dev/knowledge/example-role.md');
    const full = await readFile(path.join(paths.publicDir, 'llms-full.txt'), 'utf8');
    expect(full).not.toContain('Draft project');
    expect(full).not.toContain('adrianhdezp10@gmail.com');
    expect(bundle.profile.categories.find(item => item.category === 'work')?.count).toBe(1);
    expect(bundle.blogs.length).toBeGreaterThan(0);
  });

  it('builds cleanly when the knowledge folders have no entries', async () => {
    const paths = await setup();
    await rm(paths.source, { recursive: true, force: true });
    const bundle = await paths.build();
    expect(bundle.entries).toEqual([]);
    expect(bundle.profile.categories.every(item => item.count === 0)).toBe(true);
    expect((await readFile(path.join(paths.publicDir, 'llms.txt'), 'utf8'))).toContain('## Blog');
  });

  it.each([
    ['unknown category', 'category: invented', /unknown category/],
    ['invalid month', 'start: 2024-13', /start must be YYYY-MM/],
    ['invalid updated date', 'updated: 2026-02-31', /updated must be a valid YYYY-MM-DD/],
    ['missing required title', 'title: ""', /title is required/],
  ])('fails clearly on %s', async (_label, replacement, expected) => {
    const paths = await setup();
    const entryPath = path.join(paths.source, 'work/example-role.md');
    const source = await readFile(entryPath, 'utf8');
    const key = replacement.split(':')[0];
    const changed = source.replace(new RegExp(`^${key}:.*$`, 'm'), replacement);
    await writeFile(entryPath, changed);
    await expect(paths.build()).rejects.toThrow(expected);
  });

  it('keeps knowledge/_drafts out of the build unless drafts are explicitly included', async () => {
    const paths = await setup();
    const content = await readFile(path.join(paths.source, 'work/example-role.md'), 'utf8');
    await mkdir(path.join(paths.source, '_drafts/work'), { recursive: true });
    await writeFile(path.join(paths.source, '_drafts/work/pending-role.md'), `${content}\n<!-- TODO(Adrián): pending question -->\n`);
    expect((await paths.build()).entries.map(entry => entry.id)).toEqual(['example-role']);
    const local = await paths.build(true);
    expect(local.entries.map(entry => entry.id).sort()).toEqual(['draft-project', 'example-role', 'pending-role']);
    expect(JSON.stringify(local)).not.toContain('pending question');
  });

  it('refuses to publish an entry that still contains TODO comments', async () => {
    const paths = await setup();
    const entryPath = path.join(paths.source, 'work/example-role.md');
    await writeFile(entryPath, `${await readFile(entryPath, 'utf8')}\n<!-- TODO(Adrián): confirm dates -->\n`);
    await expect(paths.build()).rejects.toThrow(/must not contain TODO comments/);
  });

  it('rejects duplicate ids across category folders', async () => {
    const paths = await setup();
    const content = await readFile(path.join(paths.source, 'work/example-role.md'), 'utf8');
    await mkdir(path.join(paths.source, 'education'), { recursive: true });
    await writeFile(path.join(paths.source, 'education/example-role.md'), content.replace('category: work', 'category: education'));
    await expect(paths.build()).rejects.toThrow(/duplicate id example-role/);
  });
});
