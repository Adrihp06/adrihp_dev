import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Homepage (index.astro)', () => {
  it('should have index.astro file', () => {
    const homePath = path.join(__dirname, '../pages/index.astro');
    expect(fs.existsSync(homePath)).toBe(true);
  });

  it('should use BaseLayout', () => {
    const homePath = path.join(__dirname, '../pages/index.astro');
    const content = fs.readFileSync(homePath, 'utf-8');
    
    expect(content).toContain('BaseLayout');
    expect(content).toContain('import');
  });

  it('should contain main content sections', () => {
    const homePath = path.join(__dirname, '../pages/index.astro');
    const content = fs.readFileSync(homePath, 'utf-8');
    
    // Check for semantic HTML
    expect(content).toContain('<main>');
    expect(content).toContain('<section');
  });
});
