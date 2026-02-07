import { describe, it, expect } from 'vitest';
import { getCV } from '../../src/utils/cvLoader';

describe('CV Loader', () => {
  it('should return a list of CV items', async () => {
    const cv = await getCV();
    expect(cv).toBeInstanceOf(Array);
    expect(cv.length).toBeGreaterThan(0);
  });

  it('should have the correct structure', async () => {
    const cv = await getCV();
    const item = cv[0];
    expect(item).toHaveProperty('role');
    expect(item).toHaveProperty('company');
    expect(item).toHaveProperty('date');
    expect(item).toHaveProperty('description');
  });
});
