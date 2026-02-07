import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Pages', () => {
  const pagesDir = path.join(__dirname, '../pages');

  it('should have projects page', () => {
    const filePath = path.join(pagesDir, 'projects.astro');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should have blog index page', () => {
    const filePath = path.join(pagesDir, 'blog/index.astro');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should have blog post dynamic page', () => {
    const filePath = path.join(pagesDir, 'blog/[...slug].astro');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should have contact page', () => {
    const filePath = path.join(pagesDir, 'contact.astro');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should have tag filtering page', () => {
    const filePath = path.join(pagesDir, 'tags/[tag].astro');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  describe('Projects page', () => {
    it('should use content collections', () => {
      const content = fs.readFileSync(path.join(pagesDir, 'projects.astro'), 'utf-8');
      expect(content).toContain("getCollection('projects')");
      expect(content).toContain('BaseLayout');
    });
  });

  describe('Blog index page', () => {
    it('should use content collections and tag utilities', () => {
      const content = fs.readFileSync(path.join(pagesDir, 'blog/index.astro'), 'utf-8');
      expect(content).toContain("getCollection('blog'");
      expect(content).toContain('getUniqueTags');
      expect(content).toContain('BaseLayout');
    });
  });

  describe('Contact page', () => {
    it('should use CV data loader', () => {
      const content = fs.readFileSync(path.join(pagesDir, 'contact.astro'), 'utf-8');
      expect(content).toContain('loadCV');
      expect(content).toContain('BaseLayout');
    });
  });
});
