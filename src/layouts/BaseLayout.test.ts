import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('BaseLayout', () => {
  it('should have BaseLayout.astro file', () => {
    const layoutPath = path.join(__dirname, 'BaseLayout.astro');
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('should contain required Astro component structure', () => {
    const layoutPath = path.join(__dirname, 'BaseLayout.astro');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    // Check for essential HTML structure
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('<html lang="en">');
    expect(content).toContain('<body>');
    expect(content).toContain('<slot />');
  });

  it('should define Anthropic-esque color variables', () => {
    const layoutPath = path.join(__dirname, 'BaseLayout.astro');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    // Check for warm, paper-like background color
    expect(content).toContain('--color-bg:');
    expect(content).toContain('--color-text:');
    expect(content).toContain('--color-accent:');
  });

  it('should use serif typography for headings', () => {
    const layoutPath = path.join(__dirname, 'BaseLayout.astro');
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    // Check for serif font family
    expect(content).toContain('--font-serif:');
    expect(content).toContain('Georgia');
  });
});
