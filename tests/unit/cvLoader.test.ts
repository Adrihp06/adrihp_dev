import { describe, it, expect } from 'vitest';
import { getCV } from '../../src/utils/cvLoader';

describe('CV Loader', () => {
  it('should return a CV object', async () => {
    const cv = await getCV();
    expect(cv).toBeInstanceOf(Object);
  });

  it('should have experience items', async () => {
    const cv = await getCV();
    expect(cv.experience).toBeInstanceOf(Array);
    expect(cv.experience.length).toBeGreaterThan(0);

    const item = cv.experience[0];
    expect(item).toHaveProperty('role');
    expect(item).toHaveProperty('company');
    expect(item).toHaveProperty('date');
  });

  it('should have education items', async () => {
    const cv = await getCV();
    expect(cv.education).toBeInstanceOf(Array);
    expect(cv.education.length).toBeGreaterThan(0);

    const item = cv.education[0];
    expect(item).toHaveProperty('degree');
    expect(item).toHaveProperty('institution');
  });

  it('should have projects', async () => {
    const cv = await getCV();
    expect(cv.projects).toBeInstanceOf(Array);
    expect(cv.projects.length).toBeGreaterThan(0);

    const item = cv.projects[0];
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('description');
  });

  it('should have certifications and languages', async () => {
    const cv = await getCV();
    expect(cv.certifications).toBeInstanceOf(Array);
    expect(cv.languages).toBeInstanceOf(Array);
  });
});
