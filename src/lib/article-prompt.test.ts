import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildArticlePrompt, initializeArticlePrompt } from './article-prompt';

const article = {
  title: 'Context selection with JEV',
  author: 'Adrián Hernández Padrón',
  description: 'A controlled comparison of two agent architectures.',
  body: '## Results\n\n| Architecture | Latency |\n| --- | --- |\n| Reference | 12.16 s |\n\n```python\nprint("<source>")\n```\n\nThe evaluation is small and nonblind.',
};

function mount() {
  document.body.innerHTML = '<section data-article-prompt><button data-copy-prompt hidden>Copy prompt</button><p data-prompt-status role="status"></p><details><summary>View prompt</summary><textarea readonly></textarea></details></section>';
  const text = document.querySelector('textarea')!;
  text.defaultValue = buildArticlePrompt(article);
  initializeArticlePrompt();
  return {
    text,
    button: document.querySelector('button')!,
    status: document.querySelector<HTMLElement>('[role="status"]')!,
    details: document.querySelector('details')!,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('Article prompt', () => {
  it('provides a summary-and-examples prompt with the complete, unaltered article and attribution', () => {
    const prompt = buildArticlePrompt(article);
    expect(prompt).toContain('Summarize the article');
    expect(prompt).toContain('concrete examples');
    expect(prompt).toContain(article.title);
    expect(prompt).toContain(article.author);
    expect(prompt).toContain(article.description);
    expect(prompt).toContain(article.body);
  });

  it('copies the preview and confirms success only after the clipboard write finishes', async () => {
    let finish!: () => void;
    const writeText = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);
    const { button, text, status } = mount();
    expect(button.hidden).toBe(false);
    button.click();
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe('Copy prompt');
    expect(status.hidden).toBe(false);
    expect(status.textContent).not.toContain('copied');
    expect(writeText).toHaveBeenCalledWith(text.value);
    expect(text.value).toContain(article.body);
    finish();
    await vi.waitFor(() => expect(status.textContent).toContain('copied'));
    expect(status.hidden).toBe(false);
    expect(button.disabled).toBe(false);
  });

  it.each(['denied', 'unavailable'])('offers selected text for manual copying when the clipboard is %s', async (failure) => {
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(failure === 'unavailable'
      ? undefined as unknown as Clipboard
      : { writeText: vi.fn().mockRejectedValue(new Error('Permission denied')) } as unknown as Clipboard);
    const { button, text, status, details } = mount();
    button.click();
    await vi.waitFor(() => expect(details.open).toBe(true));
    expect(status.textContent).toContain('Copy the selected text');
    expect(status.hidden).toBe(false);
    expect(document.activeElement).toBe(text);
    expect(text.selectionStart).toBe(0);
    expect(text.selectionEnd).toBe(text.value.length);
    expect(button.disabled).toBe(false);
  });
});
