export function initializeAgentConfigCopy(): void {
  document.querySelectorAll<HTMLElement>('[data-agent-configs]').forEach((root) => {
    const status = root.querySelector<HTMLElement>('[data-agent-copy-status]');
    root.querySelectorAll<HTMLButtonElement>('[data-copy-agent]').forEach((button) => {
      const selector = button.dataset.copyAgent;
      const code = selector ? root.querySelector<HTMLElement>(selector) : null;
      if (!code || !status) return;
      button.hidden = false;
      button.addEventListener('click', async () => {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        try {
          await navigator.clipboard.writeText(code.textContent ?? '');
          status.textContent = 'Configuration copied.';
        } catch {
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(code);
          selection?.removeAllRanges();
          selection?.addRange(range);
          code.focus();
          status.textContent = 'Automatic copying is unavailable. The configuration is selected; copy it manually.';
        } finally {
          button.disabled = false;
          button.setAttribute('aria-busy', 'false');
        }
      });
    });
  });
}
