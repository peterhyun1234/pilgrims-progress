import { GAME_WIDTH, COLORS } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, ToastPayload } from '../core/GameEvents';
import { DesignSystem } from './DesignSystem';

interface ToastItem {
  container: Phaser.GameObjects.Container;
  createdAt: number;
  duration: number;
}

export class Toast {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private queue: ToastPayload[] = [];
  private activeToasts: ToastItem[] = [];
  private static readonly MAX_VISIBLE = 3;

  private onToastShow = (p: ToastPayload | undefined) => { if (p) this.enqueue(p); };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.eventBus.on(GameEvent.TOAST_SHOW, this.onToastShow);
  }

  private enqueue(payload: ToastPayload): void {
    if (this.activeToasts.length >= Toast.MAX_VISIBLE) {
      this.queue.push(payload);
    } else {
      this.showToast(payload);
    }
  }

  private showToast(payload: ToastPayload): void {
    const duration = payload.duration ?? 2000;
    const y = 10 + this.activeToasts.length * 20;

    const container = this.scene.add.container(GAME_WIDTH / 2, y - 12)
      .setDepth(400).setScrollFactor(0).setAlpha(0);

    const isPositive = payload.type === 'stat-positive' || payload.type === 'achievement';
    const bgColor = payload.type === 'card' ? 0x2a2040
      : isPositive ? 0x1a3020 : 0x301a1a;
    const textColor = payload.statColor
      ? DesignSystem.hex(payload.statColor)
      : (isPositive ? '#88cc88' : '#cc8888');

    const icon = payload.icon ?? (payload.type === 'card' ? '✝' : (isPositive ? '▲' : '▼'));
    const fullText = `${icon} ${payload.text}`;

    const text = this.scene.add.text(0, 0, fullText,
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, textColor),
    ).setOrigin(0.5);

    const pw = text.width + 24;
    const ph = 16;
    const bg = this.scene.add.graphics();
    bg.fillStyle(bgColor, 0.88);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);
    bg.lineStyle(0.8, payload.statColor ?? COLORS.UI.PANEL_BORDER, 0.4);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);

    container.add([bg, text]);

    const item: ToastItem = { container, createdAt: Date.now(), duration };
    this.activeToasts.push(item);

    this.scene.tweens.add({
      targets: container, alpha: 1, y, duration: 250, ease: 'Back.easeOut',
    });

    this.scene.time.delayedCall(duration, () => {
      this.scene.tweens.add({
        targets: container, alpha: 0, y: y - 10, duration: 250, ease: 'Sine.easeIn',
        onComplete: () => {
          container.destroy(true);
          this.activeToasts = this.activeToasts.filter(t => t !== item);
          this.processQueue();
        },
      });
    });
  }

  private processQueue(): void {
    if (this.queue.length > 0 && this.activeToasts.length < Toast.MAX_VISIBLE) {
      this.showToast(this.queue.shift()!);
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.TOAST_SHOW, this.onToastShow);
    this.activeToasts.forEach(t => t.container.destroy(true));
    this.activeToasts = [];
    this.queue = [];
  }
}
