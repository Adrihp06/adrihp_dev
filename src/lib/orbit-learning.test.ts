import { describe, it, expect } from 'vitest';
import { ORBITS, OrbitLearner, orbitState, initialState, advance } from './orbit-learning.js';

describe('Fixed orbits and learned steering', () => {
  it('keeps Kepler motion around the focus with faster motion at periapsis', () => {
    const orbit = { a: 2, e: .5, mu: 4 };
    const period = 2 * Math.PI * Math.sqrt(2);
    expect(orbitState(orbit, 0).x).toBe(1);
    expect(orbitState(orbit, period / 2).x).toBeCloseTo(-3, 9);
    expect(orbitState(orbit, period).x).toBeCloseTo(1, 9);
    expect(Math.abs(orbitState(orbit, 0).vy / orbitState(orbit, period / 2).vy)).toBeCloseTo(3, 9);
  });

  it.each(ORBITS)('steers a displaced body onto its immutable target (angle $angle)', orbit => {
    const fixed = { ...orbit }, learner = new OrbitLearner(orbit);
    const initialLoss = learner.loss(learner.gains);
    let state = initialState(orbit);
    const initialError = Math.hypot(state.x - orbitState(orbit, 0).x, state.y - orbitState(orbit, 0).y);
    // The same slow schedule as the UI: ten updates over 80 seconds of reading.
    for (let i = 0; i < 9600; i++) {
      if (i > 0 && i % 768 === 0 && learner.iterations < 10) learner.train();
      state = advance(state, orbit, learner.gains, i / 120, 1 / 120);
    }
    const target = orbitState(orbit, 80);
    expect(Math.hypot(state.x - target.x, state.y - target.y)).toBeLessThan(.001);
    expect(initialError).toBeGreaterThan(.2);
    expect(learner.loss(learner.gains)).toBeLessThan(initialLoss / 3);
    expect(orbit).toEqual(fixed);
    // With frozen gains, the integrated body keeps tracking for many further laps.
    for (let i = 9600; i < 24000; i++) state = advance(state, orbit, learner.gains, i / 120, 1 / 120);
    const later = orbitState(orbit, 200);
    expect(Math.hypot(state.x - later.x, state.y - later.y)).toBeLessThan(.001);
  });
});
