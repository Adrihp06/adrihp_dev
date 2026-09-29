import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initializePostViews } from './post-views';
let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ counts: { example: 1248 } })));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  document.body.innerHTML = '';
});
it('renders a list count without registering visits', async () => {
  document.body.innerHTML = '<span data-view-slug="example" hidden></span>';
  initializePostViews();
  await vi.advanceTimersByTimeAsync(5000);
  expect(document.body.textContent).toBe('1,248 views');
  expect(document.querySelector('span')!.hidden).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('waits for three visible seconds and reuses the session on reload', async () => {
  document.body.innerHTML = '<span data-view-slug="example" data-record-view hidden></span>';
  initializePostViews();
  await vi.advanceTimersByTimeAsync(2000);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  await vi.advanceTimersByTimeAsync(5000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ views: 1249 })));
  await vi.advanceTimersByTimeAsync(3000);
  expect(document.body.textContent).toBe('1,249 views');
  const first = JSON.parse(fetchMock.mock.calls[1][1].body);
  window.dispatchEvent(new Event('pagehide'));
  fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ views: 1249 }))));
  initializePostViews();
  await vi.advanceTimersByTimeAsync(3000);
  expect(JSON.parse(fetchMock.mock.calls[3][1].body).session).toBe(first.session);
});
it('keeps the metric hidden when the API is unavailable', async () => {
  document.body.innerHTML = '<span data-view-slug="example" hidden></span>';
  fetchMock.mockRejectedValue(new Error('offline'));
  initializePostViews();
  await vi.advanceTimersByTimeAsync(5000);
  expect(document.querySelector('span')!.hidden).toBe(true);
  expect(document.body.textContent).toBe('');
});
