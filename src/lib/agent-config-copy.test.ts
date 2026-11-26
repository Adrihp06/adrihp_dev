import { afterEach, describe, expect, it, vi } from 'vitest';
import { initializeAgentConfigCopy } from './agent-config-copy';

function mount() {
  document.body.innerHTML = '<section data-agent-configs><button data-copy-agent="#config" hidden>Copy config</button><pre id="config" tabindex="-1">{ "mcpServers": {} }</pre><p data-agent-copy-status role="status"></p></section>';
  initializeAgentConfigCopy();
  return {
    button: document.querySelector<HTMLButtonElement>('button')!,
    config: document.querySelector<HTMLElement>('#config')!,
    status: document.querySelector<HTMLElement>('[role="status"]')!,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('agent MCP configuration copy', () => {
  it('copies the exact configuration and confirms after the clipboard write', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);
    const { button, config, status } = mount();
    expect(button.hidden).toBe(false);
    button.click();
    await vi.waitFor(() => expect(status.textContent).toBe('Configuration copied.'));
    expect(writeText).toHaveBeenCalledWith(config.textContent);
    expect(button.disabled).toBe(false);
  });

  it('selects the configuration for manual copying if clipboard access fails', async () => {
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as Clipboard);
    const { button, config, status } = mount();
    button.click();
    await vi.waitFor(() => expect(status.textContent).toContain('copy it manually'));
    expect(window.getSelection()?.toString()).toBe(config.textContent);
    expect(document.activeElement).toBe(config);
  });
});
