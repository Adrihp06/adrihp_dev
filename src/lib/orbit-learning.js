const TAU = 2 * Math.PI;
export const ORBITS = Object.freeze([
  { a: .9, e: .32, angle: -.45, phase: 0, color: '#365b47', light: '#b5c8ac' },
  { a: 1.12, e: .48, angle: 1.4, phase: 2.3, color: '#927049', light: '#ddc59e' },
  { a: 1.25, e: .55, angle: 2.85, phase: 4.4, color: '#546a82', light: '#b6c9da' },
].map(orbit => Object.freeze({ ...orbit, mu: 1 })));

export function orbitState(orbit, time) {
  const { a, e, mu, angle = 0, phase = 0 } = orbit;
  const n = Math.sqrt(mu / a ** 3), mean = ((n * time + phase) % TAU + TAU) % TAU;
  let E = mean;
  for (let i = 0; i < 9; i++) E -= (E - e * Math.sin(E) - mean) / (1 - e * Math.cos(E));
  const c = Math.cos(angle), s = Math.sin(angle), b = Math.sqrt(1 - e * e), rate = n / (1 - e * Math.cos(E));
  const x = a * (Math.cos(E) - e), y = a * b * Math.sin(E), vx = -a * Math.sin(E) * rate, vy = a * b * Math.cos(E) * rate;
  return { x: x * c - y * s, y: x * s + y * c, vx: vx * c - vy * s, vy: vx * s + vy * c };
}
export function initialState(orbit) {
  const target = orbitState(orbit, 0);
  return { x: target.x + .23, y: target.y - .19, vx: target.vx * .7, vy: target.vy * .7 };
}
function gravity(state, mu) {
  const radius = Math.max(.08, Math.hypot(state.x, state.y));
  return { x: -mu * state.x / radius ** 3, y: -mu * state.y / radius ** 3 };
}
export function acceleration(state, orbit, gains, time) {
  const target = orbitState(orbit, time), feed = gravity(target, orbit.mu);
  return {
    x: feed.x + gains.kp * (target.x - state.x) + gains.kd * (target.vx - state.vx),
    y: feed.y + gains.kp * (target.y - state.y) + gains.kd * (target.vy - state.vy),
  };
}
// Guided tracking controller: gravity feed-forward plus learned position/velocity
// correction gains. Target elements never change. Every visible position is integrated.
export function advance(state, orbit, gains, time, dt) {
  function derivative(p, t) {
    const a = acceleration(p, orbit, gains, t);
    return { x: p.vx, y: p.vy, vx: a.x, vy: a.y };
  }
  const add = (p, d, scale) => ({ x: p.x + d.x * scale, y: p.y + d.y * scale, vx: p.vx + d.vx * scale, vy: p.vy + d.vy * scale });
  const k1 = derivative(state, time), k2 = derivative(add(state, k1, dt / 2), time + dt / 2);
  const k3 = derivative(add(state, k2, dt / 2), time + dt / 2), k4 = derivative(add(state, k3, dt), time + dt);
  const combine = key => state[key] + dt / 6 * (k1[key] + 2 * k2[key] + 2 * k3[key] + k4[key]);
  return { x: combine('x'), y: combine('y'), vx: combine('vx'), vy: combine('vy') };
}
export class OrbitLearner {
  constructor(orbit) {
    this.orbit = orbit;
    this.gains = { kp: .08, kd: .08 };
    this.iterations = 0;
    this.step = .35;
  }
  loss(gains) {
    let state = initialState(this.orbit), cost = 0;
    for (let i = 0; i < 180; i++) {
      const t = i / 30, target = orbitState(this.orbit, t);
      const error = (state.x - target.x) ** 2 + (state.y - target.y) ** 2;
      const velocity = (state.vx - target.vx) ** 2 + (state.vy - target.vy) ** 2;
      cost += error + .07 * velocity + .003 * (gains.kp ** 2 * error + gains.kd ** 2 * velocity);
      state = advance(state, this.orbit, gains, t, 1 / 30);
    }
    return cost / 180;
  }
  train() {
    let improved = false;
    for (const key of ['kp', 'kd']) {
      let best = this.gains, loss = this.loss(best);
      for (const direction of [-1, 1]) {
        const candidate = { ...this.gains, [key]: Math.max(.04, Math.min(3.5, this.gains[key] + direction * this.step)) };
        const score = this.loss(candidate);
        if (score < loss) { best = candidate; loss = score; improved = true; }
      }
      this.gains = best;
    }
    if (!improved) this.step *= .65;
    this.iterations++;
  }
}
