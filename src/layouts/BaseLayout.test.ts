import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('BaseLayout', () => {
  const layoutPath = path.join(__dirname, 'BaseLayout.astro');
  const content = fs.readFileSync(layoutPath, 'utf-8');

  it('should have BaseLayout.astro file', () => {
    expect(fs.existsSync(layoutPath)).toBe(true);
  });

  it('should contain required Astro component structure', () => {
    expect(content).toContain('<!doctype html>');
    expect(content).toContain('<html lang="en">');
    expect(content).toContain('<body');
    expect(content).toContain('<slot />');
  });

  it('should include Navigation and Footer components', () => {
    expect(content).toContain("import Navigation from '../components/Navigation.astro'");
    expect(content).toContain("import Footer from '../components/Footer.astro'");
    expect(content).toContain('<Navigation />');
    expect(content).toContain('<Footer />');
  });

  it('should load Fraunces and Inter fonts from Google Fonts', () => {
    expect(content).toContain('fonts.googleapis.com');
    expect(content).toContain('Fraunces');
    expect(content).toContain('Inter');
  });

  it('should use Tailwind utility classes on body', () => {
    expect(content).toContain('bg-paper');
    expect(content).toContain('text-ink');
    expect(content).toContain('font-sans');
  });

  it('should define Anthropic-esque heading styles with Fraunces', () => {
    expect(content).toContain("font-family: 'Fraunces'");
  });

  it('should set accent color for selection', () => {
    expect(content).toContain('::selection');
    expect(content).toContain('#D97757');
  });
});
