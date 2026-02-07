import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Content Collections', () => {
  const contentDir = path.join(__dirname, '../content');

  it('should have content config file', () => {
    const configPath = path.join(contentDir, 'config.ts');
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should define blog and projects collections', () => {
    const config = fs.readFileSync(path.join(contentDir, 'config.ts'), 'utf-8');
    expect(config).toContain('const blog = defineCollection');
    expect(config).toContain('const projects = defineCollection');
    expect(config).toContain('collections');
  });

  it('should have blog schema with required fields', () => {
    const config = fs.readFileSync(path.join(contentDir, 'config.ts'), 'utf-8');
    expect(config).toContain('title: z.string()');
    expect(config).toContain('pubDate: z.date()');
    expect(config).toContain('description: z.string()');
    expect(config).toContain('tags: z.array(z.string())');
    expect(config).toContain('draft: z.boolean()');
  });

  it('should have projects schema with required fields', () => {
    const config = fs.readFileSync(path.join(contentDir, 'config.ts'), 'utf-8');
    expect(config).toContain('featured: z.boolean()');
    expect(config).toContain('link: z.string().url().optional()');
    expect(config).toContain('repo: z.string().url().optional()');
  });

  describe('Blog content', () => {
    const blogDir = path.join(contentDir, 'blog');

    it('should have blog posts', () => {
      const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have valid frontmatter in blog posts', () => {
      const files = fs.readdirSync(blogDir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('title:');
        expect(content).toContain('pubDate:');
        expect(content).toContain('tags:');
      }
    });
  });

  describe('Projects content', () => {
    const projectsDir = path.join(contentDir, 'projects');

    it('should have project entries', () => {
      const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md'));
      expect(files.length).toBeGreaterThan(0);
    });

    it('should have valid frontmatter in project entries', () => {
      const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith('.md'));
      for (const file of files) {
        const content = fs.readFileSync(path.join(projectsDir, file), 'utf-8');
        expect(content).toMatch(/^---\n/);
        expect(content).toContain('title:');
        expect(content).toContain('description:');
        expect(content).toContain('tags:');
      }
    });
  });
});
