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

    it('should include a downloadable CV link', () => {
      const content = fs.readFileSync(path.join(pagesDir, 'contact.astro'), 'utf-8');
      expect(content).toContain('/adrian-cv.pdf');
      expect(content).toContain('Download CV');
      expect(content).toContain('download');
    });
  });
});

describe('Navigation', () => {
  const navPath = path.join(__dirname, '../components/Navigation.astro');

  it('should have Navigation component', () => {
    expect(fs.existsSync(navPath)).toBe(true);
  });

  it('should have mobile hamburger menu', () => {
    const content = fs.readFileSync(navPath, 'utf-8');
    expect(content).toContain('mobile-menu-btn');
    expect(content).toContain('mobile-menu');
    expect(content).toContain('md:hidden');
    expect(content).toContain('aria-label');
  });

  it('should have desktop nav hidden on mobile', () => {
    const content = fs.readFileSync(navPath, 'utf-8');
    expect(content).toContain('hidden md:flex');
  });
});

describe('Decap CMS Admin', () => {
  const adminDir = path.join(__dirname, '../../public/admin');

  it('should have admin index.html', () => {
    expect(fs.existsSync(path.join(adminDir, 'index.html'))).toBe(true);
  });

  it('should have admin config.yml', () => {
    expect(fs.existsSync(path.join(adminDir, 'config.yml'))).toBe(true);
  });

  it('should load Decap CMS script', () => {
    const content = fs.readFileSync(path.join(adminDir, 'index.html'), 'utf-8');
    expect(content).toContain('decap-cms');
  });

  it('should configure blog and projects collections', () => {
    const config = fs.readFileSync(path.join(adminDir, 'config.yml'), 'utf-8');
    expect(config).toContain('name: blog');
    expect(config).toContain('name: projects');
    expect(config).toContain('folder: src/content/blog');
    expect(config).toContain('folder: src/content/projects');
  });
});

describe('Static assets', () => {
  it('should expose the downloadable CV PDF in public', () => {
    expect(fs.existsSync(path.join(__dirname, '../../public/adrian-cv.pdf'))).toBe(true);
  });
});
