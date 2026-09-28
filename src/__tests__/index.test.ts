import { beforeAll, describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { Window } from 'happy-dom';
const root = resolve(__dirname, '../..');
const dist = join(root, 'dist');
const documents = new Map<string, Window>();
beforeAll(() => {
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'pipe' });
  function visit(folder: string) {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.name.endsWith('.html')) {
        const url = '/' + path.slice(dist.length + 1).replace(/index\.html$/, '');
        const window = new Window({ url: 'https://site.test' + url });
        window.document.write(readFileSync(path, 'utf8'));
        documents.set(url, window);
      }
    }
  }
  visit(dist);
}, 30000);
describe('Published website', () => {
  it('serves every local navigation and asset URL, including fragment targets', () => {
    const broken: string[] = [];
    for (const [page, window] of documents) {
      for (const element of window.document.querySelectorAll('[href], [src]')) {
        const value = element.getAttribute('href') || element.getAttribute('src');
        if (!value) continue;
        const url = new URL(value, 'https://site.test' + page);
        if (url.origin !== 'https://site.test') continue;
        let file = join(dist, decodeURIComponent(url.pathname));
        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
        if (!existsSync(file)) { broken.push(page + ' → ' + value); continue; }
        if (url.hash && file.endsWith('.html')) {
          const target = documents.get(url.pathname.replace(/index\.html$/, '').replace(/\/?$/, '/')) || documents.get(url.pathname);
          if (!target?.document.getElementById(decodeURIComponent(url.hash.slice(1)))) broken.push(page + ' → ' + value);
        }
      }
    }
    expect(broken).toEqual([]);
  });
  it('publishes only the two selected English articles without private source pins', () => {
    const articles = [...documents].filter(([url]) => /^\/blog\/[^/]+\/$/.test(url));
    expect(articles).toHaveLength(2);
    for (const [, window] of articles) {
      expect(window.document.documentElement.lang).toBe('en');
      expect(window.document.body.textContent).not.toMatch(/49ee7458|a9049eaa|86eae31a|source audit|additional_tools/i);
    }
  });
  it('places writing before certifications and serves the orbital simulation on the home page', () => {
    const document = documents.get('/')!.document;
    const writing = document.getElementById('writing')!;
    const certifications = document.getElementById('certifications')!;
    expect(writing.compareDocumentPosition(certifications) & 4).toBe(4);
    expect(document.querySelector('canvas[aria-label*="Three planets"]')).not.toBeNull();
  });
});
