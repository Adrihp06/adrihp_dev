/** Optional enhancement: static articles remain usable with no API or storage. */
export function initializePostViews() {
  const elements = [...document.querySelectorAll<HTMLElement>('[data-view-slug]')];
  if (!elements.length) return;
  const show = (element: HTMLElement, value: unknown) => {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return;
    element.textContent = `${new Intl.NumberFormat('en-US').format(value)} ${value === 1 ? 'view' : 'views'}`;
    element.hidden = false;
  };
  const article = elements.find(element => element.hasAttribute('data-record-view'));
  let posted = false;
  void fetch('/api/views', { signal: AbortSignal.timeout(5000) })
    .then(response => response.ok ? response.json() : null)
    .then(data => { if (!posted && data?.counts) elements.forEach(element => show(element, data.counts[element.dataset.viewSlug!])); })
    .catch(() => {});
  if (!article) return;
  let session: string;
  try {
    const key = 'blog-view-session';
    session = sessionStorage.getItem(key) || crypto.randomUUID();
    sessionStorage.setItem(key, session);
  } catch { return; } // No storage means no reliable deduplication: read counts only.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const record = async () => {
    document.removeEventListener('visibilitychange', visibility);
    try {
      const response = await fetch('/api/views', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: article.dataset.viewSlug, session }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) return;
      const data = await response.json();
      posted = true;
      show(article, data.views);
    } catch { /* Leave any previously loaded count visible. */ }
  };
  const visibility = () => {
    clearTimeout(timer);
    if (document.visibilityState === 'visible') timer = setTimeout(record, 3000);
  };
  document.addEventListener('visibilitychange', visibility);
  window.addEventListener('pagehide', () => {
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', visibility);
  }, { once: true });
  visibility();
}
