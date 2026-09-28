import { ORBITS, OrbitLearner, orbitState, initialState, advance } from './orbit-learning.js';

export function mountOrbit(canvas, motionPreference) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const root = canvas.closest('.dynamics');
  const status = root.querySelector('.orbit-status'), detail = root.querySelector('.orbit-detail');
  const pauseButton = root.querySelector('.motion-toggle'), restartButton = root.querySelector('.orbit-restart');
  const readout = document.createElement('div');readout.className = 'orbit-readout';
  const rows = ORBITS.map(orbit => {
    const row = document.createElement('div');row.className = 'orbit-row';row.style.setProperty('--planet-color', orbit.color);
    const equation = document.createElement('div');equation.className = 'orbit-motion-equation';
    const metric = document.createElement('div');metric.className = 'orbit-parameters';
    row.append(equation, metric);readout.append(row);return { equation, metric };
  });
  const legend = document.createElement('div');legend.className = 'orbit-legend';legend.textContent = 'r = planet position · r* = fixed target\ng* = −r* / |r*|³ · Δr = r* − r · Δv = v* − v';readout.append(legend);root.append(readout);
  const TAU = Math.PI * 2, STEP = 1 / 120;
  const paths = ORBITS.map(orbit => Array.from({ length: 145 }, (_, i) => orbitState(orbit, i / 144 * TAU * Math.sqrt(orbit.a ** 3 / orbit.mu))));
  let learners, appliedGains, previousGains, gainStart, states, trails, time, accumulator, nextTrain, nextMessage, nextTrail, stable;
  let width = 0, height = 0, visible = false, paused = false, frame = 0, last = 0, backgroundTimer = 0;
  function error(i) { const target = orbitState(ORBITS[i], time);return Math.hypot(states[i].x - target.x, states[i].y - target.y); }
  function message() {
    stable = learners.every((learner, i) => learner.iterations >= 10 && time - gainStart >= 6.4 && error(i) < .008);
    root.dataset.learningState = stable ? 'stable' : 'training';
    status.textContent = stable ? 'Three planets. Three fixed orbits.' : 'Learning to follow the orbit.';
    detail.textContent = motionPreference.matches ? 'Static view · trained controllers' : stable ? 'Steering learned · continuous motion' : `Simulation ${String(Math.min(10, learners[0].iterations)).padStart(2, '0')} · adjusting each planet’s motion`;
    pauseButton.textContent = paused ? '▶' : 'Ⅱ';pauseButton.setAttribute('aria-label', paused ? 'Resume orbital simulation' : 'Pause orbital simulation');pauseButton.setAttribute('aria-pressed', String(paused));pauseButton.hidden = motionPreference.matches;
    updateReadout();
  }
  function updateReadout() {
    rows.forEach(({ equation, metric }, i) => {
      const g = appliedGains[i], index = ['₁', '₂', '₃'][i];
      equation.textContent = `r̈${index} = g*${index} + ${g.kp.toFixed(3)} Δr${index} + ${g.kd.toFixed(3)} Δv${index}`;
      metric.textContent = `Tracking error ${error(i).toFixed(3)}`;
      equation.title = 'The integrated equation of motion. Learned coefficients are applied continuously to both this equation and the planet’s movement. Normalized units, μ = 1.';
    });
  }
  function reset() {
    learners = ORBITS.map(orbit => new OrbitLearner(orbit));states = ORBITS.map(initialState);trails = ORBITS.map(() => []);
    appliedGains = learners.map(learner => ({ ...learner.gains }));previousGains = appliedGains.map(g => ({ ...g }));gainStart = 0;
    time = 0;accumulator = 0;nextTrain = 6.4;nextMessage = 0;nextTrail = 0;stable = false;
    // Start the first rollout immediately; interpolate its gains from frame one.
    learners.forEach(learner => learner.train());
    if (motionPreference.matches) {
      learners.forEach(learner => {while (learner.iterations < 10) learner.train();});
      appliedGains = learners.map(learner => ({ ...learner.gains }));
      for (let i = 0; i < 1800; i++) {states = states.map((state, j) => advance(state, ORBITS[j], learners[j].gains, time, STEP));time += STEP;}
    }
    message();draw();
  }
  function tick(dt) {
    accumulator += dt * .8;
    while (accumulator >= STEP) {
      const blend = Math.min(1, Math.max(0, (time - gainStart) / 6.4));
      appliedGains = learners.map((learner, i) => ({
        kp: previousGains[i].kp + (learner.gains.kp - previousGains[i].kp) * blend,
        kd: previousGains[i].kd + (learner.gains.kd - previousGains[i].kd) * blend,
      }));
      states = states.map((state, i) => advance(state, ORBITS[i], appliedGains[i], time, STEP));
      time += STEP;accumulator -= STEP;
      if (time >= nextTrail) {
        states.forEach((state, i) => {
          trails[i].push({ x: state.x, y: state.y, time });
          while (trails[i].length && trails[i][0].time < time - 1.2) trails[i].shift();
        });
        nextTrail = time + .04;
      }
    }
    if (time >= nextTrain && learners[0].iterations < 10) {
      previousGains = appliedGains.map(g => ({ ...g }));gainStart = time;
      learners.forEach(learner => learner.train());nextTrain = time + 6.4;
    }
    if (time >= nextMessage) {message();nextMessage = time + .25;}

  }
  function point(p) {
    const area = Math.max(160, height - 280), scale = Math.min(width * .225, area * .26);
    return [width * .5 + p.x * scale, area * .5 + 12 + p.y * scale];
  }
  function path(points, color, thickness = 1) {
    ctx.beginPath();points.forEach((p, i) => {const q = point(p);if (!i) ctx.moveTo(...q);else ctx.lineTo(...q);});ctx.strokeStyle = color;ctx.lineWidth = thickness;ctx.stroke();
  }
  function draw() {
    if (!width || !height || !states) return;
    ctx.clearRect(0, 0, width, height);
    ctx.setLineDash([4, 5]);
    paths.forEach((points, i) => path(points, ORBITS[i].color + '85', .9));
    ctx.setLineDash([]);
    const sun = point({ x: 0, y: 0 });
    ctx.beginPath();ctx.arc(...sun, 5, 0, TAU);ctx.fillStyle = '#a98752';ctx.fill();ctx.beginPath();ctx.arc(...sun, 10, 0, TAU);ctx.strokeStyle = '#a9875235';ctx.stroke();
    states.forEach((state, i) => {
      const orbit = ORBITS[i], p = point(state), target = point(orbitState(orbit, time));
      path(trails[i], orbit.color + '60', 1.5);
      if (error(i) > .012) {
        ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...target);ctx.setLineDash([2, 4]);ctx.strokeStyle = orbit.color + '75';ctx.lineWidth = .8;ctx.stroke();ctx.setLineDash([]);
        ctx.beginPath();ctx.arc(...target, 3, 0, TAU);ctx.strokeStyle = orbit.color;ctx.stroke();
      }
      const dx = sun[0] - p[0], dy = sun[1] - p[1], length = Math.hypot(dx, dy) || 1;
      const light = ctx.createRadialGradient(p[0] + dx / length * 2.5, p[1] + dy / length * 2.5, .5, p[0], p[1], 7);
      light.addColorStop(0, orbit.light);light.addColorStop(1, orbit.color);
      ctx.beginPath();ctx.arc(...p, 6.5, 0, TAU);ctx.fillStyle = light;ctx.fill();
      ctx.font = '10px Inter, sans-serif';ctx.fillStyle = orbit.color;ctx.fillText(String(i + 1), p[0] + 10, p[1] - 9);
    });
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();if (!rect.width || !rect.height) return;
    width = rect.width;height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);canvas.width = Math.round(width * dpr);canvas.height = Math.round(height * dpr);ctx.setTransform(dpr, 0, 0, dpr, 0, 0);draw();
  }
  function loop(timestamp) {
    frame = 0;if (!visible || paused || motionPreference.matches || document.hidden) return;
    const dt = last ? Math.min((timestamp - last) / 1000, .05) : 0;last = timestamp;
    tick(dt);updateReadout();draw();frame = requestAnimationFrame(loop);
  }
  function sync() {
    cancelAnimationFrame(frame);clearTimeout(backgroundTimer);frame = 0;last = 0;
    if (visible && !paused && !motionPreference.matches && !document.hidden) frame = requestAnimationFrame(loop);
    // Keep the physical states and learning alive while the reader is below
    // the hero, but do not render offscreen. No work while manually paused.
    if (!visible && !paused && !motionPreference.matches && !document.hidden) {
      let previous = performance.now();
      const practice = () => {
        const now = performance.now();tick(Math.min((now - previous) / 1000, 2));previous = now;
        backgroundTimer = setTimeout(practice, 1000);
      };
      backgroundTimer = setTimeout(practice, 1000);
    }
    message();draw();
  }
  function onPause() { paused = !paused;sync(); }
  function onRestart() { paused = false;reset();sync(); }
  function onReducedMotion() { reset();sync(); }
  pauseButton.addEventListener('click', onPause);restartButton.addEventListener('click', onRestart);
  motionPreference.addEventListener('change', onReducedMotion);document.addEventListener('visibilitychange', sync);
  const sizes = new ResizeObserver(resize);sizes.observe(canvas);
  const intersection = new IntersectionObserver(entries => {visible = entries[0].isIntersecting;sync();}, {threshold: .08});
  reset();resize();intersection.observe(canvas);window.addEventListener('pageshow', sync);
  window.addEventListener('pagehide', event => {cancelAnimationFrame(frame);clearTimeout(backgroundTimer);if(event.persisted)return;sizes.disconnect();intersection.disconnect();motionPreference.removeEventListener('change', onReducedMotion);document.removeEventListener('visibilitychange', sync);window.removeEventListener('pageshow', sync);pauseButton.removeEventListener('click', onPause);restartButton.removeEventListener('click', onRestart);});
}
