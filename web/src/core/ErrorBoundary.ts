/**
 * Global runtime error boundary.
 * Catches unhandled JS errors and promise rejections, then shows a styled
 * HTML recovery overlay so the player never sees a blank/frozen screen.
 *
 * Install once at app startup before the Phaser game is created.
 */
export class ErrorBoundary {
  private static installed = false;
  private static lastErrorTime = 0;
  private static readonly DEBOUNCE_MS = 5000; // ignore rapid-fire identical errors

  static install(): void {
    if (this.installed) return;
    this.installed = true;

    window.addEventListener('error', (event: ErrorEvent) => {
      const err = event.error instanceof Error
        ? event.error
        : new Error(event.message);
      ErrorBoundary.handleError(err);
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const err = reason instanceof Error ? reason : new Error(String(reason ?? 'Promise rejected'));
      ErrorBoundary.handleError(err);
    });
  }

  private static handleError(err: Error): void {
    const now = Date.now();
    if (now - this.lastErrorTime < this.DEBOUNCE_MS) return;
    this.lastErrorTime = now;

    console.error('[ErrorBoundary]', err?.message ?? 'Unknown error', err?.stack ?? '');
    this.showOverlay(err?.message ?? 'Unknown error');
  }

  private static showOverlay(message: string): void {
    // Remove any prior overlay
    document.getElementById('error-boundary')?.remove();

    const truncated = message.length > 140 ? message.slice(0, 137) + '…' : message;

    const overlay = document.createElement('div');
    overlay.id = 'error-boundary';
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:9999',
      'background:rgba(5,2,15,0.93)', 'backdrop-filter:blur(6px)',
      'display:flex', 'align-items:center', 'justify-content:center',
      "font-family:'Noto Sans KR',sans-serif",
    ].join(';');

    overlay.innerHTML = `
      <div style="background:#12101e;border:1px solid #3a2f1a;border-radius:8px;
                  padding:28px 36px;max-width:400px;text-align:center;color:#e8dfc8;
                  box-shadow:0 0 40px rgba(0,0,0,0.7);">
        <div style="color:#d4a853;font-size:22px;margin-bottom:12px;">✝</div>
        <h2 style="font-size:14px;margin:0 0 6px;color:#e8dfc8;font-weight:600;">
          오류가 발생했습니다
        </h2>
        <p style="font-size:10px;color:#888870;margin:0 0 4px;">An error occurred</p>
        <p style="font-size:10px;color:#5a4f3f;margin:0 0 20px;line-height:1.6;
                  font-family:monospace;background:#0a0814;padding:8px;border-radius:4px;">
          ${truncated}
        </p>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="err-reload"
            style="background:#2a4a2a;color:#88cc88;border:1px solid #4a8a4a;
                   padding:8px 20px;border-radius:4px;cursor:pointer;font-size:12px;">
            새로고침 / Reload
          </button>
          <button id="err-dismiss"
            style="background:#1e1840;color:#c8bfaa;border:1px solid #3a2f1a;
                   padding:8px 20px;border-radius:4px;cursor:pointer;font-size:12px;">
            무시 / Dismiss
          </button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    document.getElementById('err-reload')?.addEventListener('click', () => location.reload());
    document.getElementById('err-dismiss')?.addEventListener('click', () => overlay.remove());
  }
}
