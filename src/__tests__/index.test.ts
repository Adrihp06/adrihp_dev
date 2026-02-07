import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Homepage (index.astro)', () => {
  const homePath = path.join(__dirname, '../pages/index.astro');
  const content = fs.readFileSync(homePath, 'utf-8');

  it('should have index.astro file', () => {
    expect(fs.existsSync(homePath)).toBe(true);
  });

  it('should use BaseLayout', () => {
    expect(content).toContain('BaseLayout');
    expect(content).toContain('import');
  });

  it('should contain main content sections', () => {
    expect(content).toContain('<main');
    expect(content).toContain('<section');
  });

  it('should import and use CV data loader', () => {
    expect(content).toContain("from '../utils/cv'");
    expect(content).toContain('loadCV');
    expect(content).toContain('getExperienceSorted');
    expect(content).toContain('getEducationSorted');
  });

  it('should render Hero section with name', () => {
    expect(content).toContain('{cv.name}');
    expect(content).toContain('Data Scientist & AI Engineer');
  });

  it('should render The Now section', () => {
    expect(content).toContain('The Now');
    expect(content).toContain('DISA Holding Energético');
  });

  it('should render Trajectory section with experience', () => {
    expect(content).toContain('Trajectory');
    expect(content).toContain('experience.map');
  });

  it('should render Education section', () => {
    expect(content).toContain('Education');
    expect(content).toContain('education.map');
  });

  it('should render Skills section', () => {
    expect(content).toContain('Skills');
    expect(content).toContain('{cv.skills.ai_engineering}');
    expect(content).toContain('{cv.skills.mlops}');
    expect(content).toContain('{cv.skills.data_science}');
  });

  it('should render Certifications section', () => {
    expect(content).toContain('Certifications');
    expect(content).toContain('cv.certifications.map');
  });
});
