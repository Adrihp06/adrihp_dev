// Shared entrance language: the same easing and distances as the home page.
export function mountPageMotion(root, preference = matchMedia('(prefers-reduced-motion: reduce)')) {
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const running = new Set();
  const play = (element, frames, duration, delay = 0) => {
    if (!element || preference.matches) return;
    const animation = element.animate(frames, { duration, delay, easing: ease });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      observer.unobserve(element);
      play(element, [{ opacity: .45, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], 650);
      play(element.querySelector('img'), [{ clipPath: 'inset(0 12% 0 0)', transform: 'translateX(20px)' }, { clipPath: 'inset(0 0 0% 0)', transform: 'translateX(0)' }], 1000);
    }
  }, { threshold: .12 });
  function enter() {
    observer.disconnect();
    running.forEach(animation => animation.cancel());
    if (root.hidden || preference.matches) return;
    play(root.querySelector('h1'), [{ opacity: .4, transform: 'translateY(14px)' }, { opacity: 1, transform: 'translateY(0)' }], 800);
    root.querySelectorAll('[data-motion-entry]').forEach(element => observer.observe(element));
  }
  preference.addEventListener('change', enter);
  enter();
  return { enter, destroy() { observer.disconnect(); running.forEach(animation => animation.cancel()); preference.removeEventListener('change', enter); } };
}
