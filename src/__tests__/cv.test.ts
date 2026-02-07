import { describe, it, expect } from 'vitest';
import { loadCV, getExperienceSorted, getEducationSorted, formatDateRange } from '../utils/cv';

describe('CV Data Loader', () => {
  it('should load CV data successfully', () => {
    const cv = loadCV();
    expect(cv).toBeDefined();
    expect(cv.name).toBe('Adrián Hernández Padrón');
  });

  it('should contain required personal info fields', () => {
    const cv = loadCV();
    expect(cv.email).toBe('adrianhdezp10@gmail.com');
    expect(cv.github).toBe('Adrihp06');
    expect(cv.linkedin).toBe('adrianhernandezpadron');
    expect(cv.location).toContain('Tenerife');
  });

  it('should have experience entries', () => {
    const cv = loadCV();
    expect(cv.experience.length).toBeGreaterThan(0);
    expect(cv.experience[0]).toHaveProperty('role');
    expect(cv.experience[0]).toHaveProperty('company');
    expect(cv.experience[0]).toHaveProperty('start');
    expect(cv.experience[0]).toHaveProperty('highlights');
  });

  it('should have education entries', () => {
    const cv = loadCV();
    expect(cv.education.length).toBeGreaterThan(0);
    expect(cv.education[0]).toHaveProperty('institution');
    expect(cv.education[0]).toHaveProperty('degree');
  });

  it('should return experience sorted by date (most recent first)', () => {
    const experience = getExperienceSorted();
    for (let i = 0; i < experience.length - 1; i++) {
      const current = new Date(experience[i].start).getTime();
      const next = new Date(experience[i + 1].start).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should return education sorted by date (most recent first)', () => {
    const education = getEducationSorted();
    for (let i = 0; i < education.length - 1; i++) {
      const current = new Date(education[i].start).getTime();
      const next = new Date(education[i + 1].start).getTime();
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should format date range with present for null end date', () => {
    const result = formatDateRange('2023-09', null);
    expect(result).toContain('Sep 2023');
    expect(result).toContain('Present');
  });

  it('should format date range with both dates', () => {
    const result = formatDateRange('2023-01', '2023-08');
    expect(result).toContain('Jan 2023');
    expect(result).toContain('Aug 2023');
  });

  it('should have skills data', () => {
    const cv = loadCV();
    expect(cv.skills).toBeDefined();
    expect(cv.skills.ai_engineering).toBeDefined();
    expect(cv.skills.mlops).toBeDefined();
    expect(cv.skills.data_science).toBeDefined();
  });

  it('should have certifications', () => {
    const cv = loadCV();
    expect(cv.certifications.length).toBeGreaterThan(0);
    expect(cv.certifications[0]).toHaveProperty('year');
    expect(cv.certifications[0]).toHaveProperty('name');
    expect(cv.certifications[0]).toHaveProperty('issuer');
  });
});
