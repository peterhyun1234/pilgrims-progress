import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';
import { AudioManager } from '../audio/AudioManager';

export class SettingsScene extends Phaser.Scene {
  private bgmVolume = 0.2;
  private sfxVolume = 0.3;
  private fromScene = 'MenuScene';

  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data?: { from?: string }): void {
    if (data?.from) this.fromScene = data.from;
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      const volumes = audio.getVolume();
      this.bgmVolume = volumes.bgm;
      this.sfxVolume = volumes.sfx;
    }
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6)
      .setDepth(0);

    // Panel
    const panelX = cx - 165;
    const panelY = 12;
    const panelW = 330;
    const panelH = 248;

    const bg = this.add.graphics().setDepth(1);
    bg.fillStyle(0x0e0c1c, 0.98);
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(1.5, COLORS.UI.PANEL_BORDER, 0.55);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.12);
    bg.strokeRoundedRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4, 7);
    // Header strip
    bg.fillStyle(COLORS.UI.GOLD, 0.07);
    bg.fillRoundedRect(panelX, panelY, panelW, 32, { tl: 8, tr: 8, bl: 0, br: 0 });

    // Cross icon
    this.add.text(cx - 60, panelY + 16, '✝', {
      fontSize: '10px', color: '#d4a853', fontFamily: 'serif',
    }).setOrigin(0.5).setAlpha(0.7).setDepth(2);

    this.add.text(cx, panelY + 16, gm.i18n.t('settings.title'), {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: '#d4a853',
      fontFamily: DesignSystem.getFontFamily(),
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);

    this.add.text(cx + 60, panelY + 16, '✝', {
      fontSize: '10px', color: '#d4a853', fontFamily: 'serif',
    }).setOrigin(0.5).setAlpha(0.7).setDepth(2);

    // Divider
    const divGfx = this.add.graphics().setDepth(2);
    divGfx.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    divGfx.lineBetween(cx - 130, panelY + 32, cx + 130, panelY + 32);
    divGfx.fillStyle(COLORS.UI.GOLD, 0.4);
    divGfx.fillCircle(cx, panelY + 32, 1.5);

    // — Audio section label —
    let y = panelY + 44;
    this.addSectionLabel(cx, y, ko ? '🔊  소리' : '🔊  Audio');

    // BGM slider
    y += 16;
    this.addRowLabel(panelX + 18, y, gm.i18n.t('settings.bgm'));
    this.createSlider(cx - 30, y, this.bgmVolume, (val) => {
      this.bgmVolume = val;
      this.syncAudioVolume();
    });

    y += 28;
    this.addRowLabel(panelX + 18, y, gm.i18n.t('settings.sfx'));
    this.createSlider(cx - 30, y, this.sfxVolume, (val) => {
      this.sfxVolume = val;
      this.syncAudioVolume();
    });

    // Section divider
    y += 24;
    this.addSectionDivider(cx, y);

    // — Display / Language section —
    y += 10;
    this.addSectionLabel(cx, y, ko ? '⚙  표시' : '⚙  Display');

    y += 16;
    this.addRowLabel(panelX + 18, y, gm.i18n.t('settings.language'));
    // Pill-style toggle for language
    const langToggle = this.createPillToggle(
      cx + 70, y + 3,
      ['한국어', 'English'],
      gm.language === 'ko' ? 0 : 1,
      (idx) => {
        gm.language = idx === 0 ? 'ko' : 'en';
      },
    );
    void langToggle;

    y += 26;
    this.addRowLabel(panelX + 18, y, gm.i18n.t('settings.reduceMotion'));
    this.createToggle(cx + 100, y + 3, gm.reduceMotion, (val) => {
      gm.reduceMotion = val;
      EventBus.getInstance().emit(GameEvent.SAVE_GAME);
    });

    y += 26;
    this.addRowLabel(panelX + 18, y, gm.i18n.t('settings.colorblind'));
    const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
    const modeLabels = ko
      ? ['없음', '적색맹', '녹색맹', '청색맹']
      : ['None', 'Protan.', 'Deutan.', 'Tritan.'];
    let modeIdx = Math.max(0, modes.indexOf(gm.colorblindMode));
    const modeBtn = this.add.text(cx + 100, y + 3, modeLabels[modeIdx], {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: modeIdx > 0 ? '#66cc66' : '#b0a898',
      fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });
    modeBtn.on('pointerdown', () => {
      modeIdx = (modeIdx + 1) % modes.length;
      gm.colorblindMode = modes[modeIdx];
      modeBtn.setText(modeLabels[modeIdx]);
      modeBtn.setColor(modeIdx > 0 ? '#66cc66' : '#b0a898');
      EventBus.getInstance().emit(GameEvent.SAVE_GAME);
    });
    modeBtn.on('pointerover', () => modeBtn.setAlpha(0.75));
    modeBtn.on('pointerout', () => modeBtn.setAlpha(1));

    // Back button
    y = panelY + panelH - 26;
    const backBg = this.add.graphics().setDepth(2);
    backBg.fillStyle(0x1a0a2a, 0.95);
    backBg.fillRoundedRect(cx - 60, y, 120, 22, 4);
    backBg.lineStyle(0.8, COLORS.UI.PANEL_BORDER, 0.5);
    backBg.strokeRoundedRect(cx - 60, y, 120, 22, 4);
    const backTxt = this.add.text(cx, y + 11, gm.i18n.t('settings.back'), {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: '#b0a898',
      fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5).setDepth(2);
    const backHit = this.add.rectangle(cx, y + 11, 120, 22, 0, 0)
      .setDepth(3).setInteractive({ useHandCursor: true });
    backHit.on('pointerover', () => {
      backBg.clear();
      backBg.fillStyle(0x2a1a3a, 0.98);
      backBg.fillRoundedRect(cx - 60, y, 120, 22, 4);
      backBg.lineStyle(1, COLORS.UI.GOLD, 0.4);
      backBg.strokeRoundedRect(cx - 60, y, 120, 22, 4);
      backTxt.setColor('#d4a853');
    });
    backHit.on('pointerout', () => {
      backBg.clear();
      backBg.fillStyle(0x1a0a2a, 0.95);
      backBg.fillRoundedRect(cx - 60, y, 120, 22, 4);
      backBg.lineStyle(0.8, COLORS.UI.PANEL_BORDER, 0.5);
      backBg.strokeRoundedRect(cx - 60, y, 120, 22, 4);
      backTxt.setColor('#b0a898');
    });
    backHit.on('pointerdown', () => {
      this.tweens.add({ targets: [backBg, backTxt], alpha: 0.6, duration: 60, yoyo: true });
      this.time.delayedCall(80, () => this.goBack());
    });

    // ESC to close
    this.input.keyboard?.once('keydown-ESC', () => this.goBack());

    DesignSystem.fadeIn(this, 200);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private addSectionLabel(cx: number, y: number, label: string): void {
    this.add.text(cx, y, label, {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#8a7a9a',
      fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5).setDepth(2);
  }

  private addSectionDivider(cx: number, y: number): void {
    const g = this.add.graphics().setDepth(2);
    g.lineStyle(0.5, 0x4a3a6a, 0.5);
    g.lineBetween(cx - 120, y, cx + 120, y);
  }

  private addRowLabel(x: number, y: number, label: string): void {
    this.add.text(x, y, label, {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: '#b0a898',
      fontFamily: DesignSystem.getFontFamily(),
    }).setDepth(2);
  }

  // Pill-style two-option toggle
  private createPillToggle(
    x: number, y: number,
    options: string[],
    initialIdx: number,
    onChange: (idx: number) => void,
  ): Phaser.GameObjects.Container {
    const pillW = 88;
    const pillH = 16;
    const halfW = pillW / 2;

    const container = this.add.container(x - pillW, y).setDepth(2);
    const pillBg = this.add.graphics();
    pillBg.fillStyle(0x1a1430, 0.95);
    pillBg.fillRoundedRect(0, 0, pillW, pillH, 8);
    pillBg.lineStyle(0.5, 0x4a3a6a, 0.6);
    pillBg.strokeRoundedRect(0, 0, pillW, pillH, 8);

    let idx = initialIdx;
    const thumb = this.add.graphics();
    const drawThumb = (i: number) => {
      thumb.clear();
      thumb.fillStyle(COLORS.UI.GOLD, 0.85);
      thumb.fillRoundedRect(i * halfW, 0, halfW, pillH, 8);
    };
    drawThumb(idx);

    const labels = options.map((opt, i) =>
      this.add.text(halfW / 2 + i * halfW, pillH / 2, opt, {
        fontSize: '7px',
        color: '#c8c0a0',
        fontFamily: DesignSystem.getFontFamily(),
      }).setOrigin(0.5),
    );

    const hit = this.add.rectangle(pillW / 2, pillH / 2, pillW, pillH, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      idx = ptr.x - (x - pillW) < halfW + container.x ? 0 : 1;
      drawThumb(idx);
      labels.forEach((l, i) => l.setColor(i === idx ? '#1a1430' : '#c8c0a0'));
      onChange(idx);
    });

    container.add([pillBg, thumb, ...labels, hit]);
    labels[idx]?.setColor('#1a1430');
    return container;
  }

  // ON/OFF slide toggle
  private createToggle(
    x: number, y: number,
    initial: boolean,
    onChange: (val: boolean) => void,
  ): void {
    const toggleW = 34;
    const toggleH = 16;
    let isOn = initial;

    const trackGfx = this.add.graphics().setDepth(2);
    const thumbGfx = this.add.graphics().setDepth(2);

    const draw = (on: boolean) => {
      trackGfx.clear();
      trackGfx.fillStyle(on ? 0x44aa55 : 0x3a3050, 0.9);
      trackGfx.fillRoundedRect(x - toggleW, y, toggleW, toggleH, 8);
      trackGfx.lineStyle(0.5, on ? 0x55cc66 : 0x5a4a7a, 0.7);
      trackGfx.strokeRoundedRect(x - toggleW, y, toggleW, toggleH, 8);
      thumbGfx.clear();
      const tx = on ? x - 5 : x - toggleW + 5;
      thumbGfx.fillStyle(0xffffff, 0.9);
      thumbGfx.fillCircle(tx, y + toggleH / 2, 6);
      thumbGfx.fillStyle(on ? 0x44aa55 : 0x999999, 0.4);
      thumbGfx.fillCircle(tx, y + toggleH / 2, 4);
    };
    draw(isOn);

    const hit = this.add.rectangle(x - toggleW / 2, y + toggleH / 2, toggleW, toggleH + 6, 0, 0)
      .setDepth(3).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      isOn = !isOn;
      this.tweens.add({ targets: thumbGfx, alpha: 0.5, duration: 60, yoyo: true });
      draw(isOn);
      onChange(isOn);
    });
  }

  private syncAudioVolume(): void {
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audio.setVolume(this.bgmVolume, this.sfxVolume);
    }
  }

  private goBack(): void {
    this.scene.stop();
    this.scene.resume(this.fromScene);
    if (this.fromScene === 'GameScene') {
      try {
        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        gm.changeState(GameState.GAME);
      } catch {
        // GameManager might not be accessible
      }
    }
  }

  private createSlider(
    x: number, y: number, initial: number,
    onChange: (v: number) => void,
  ): void {
    const w = 100;
    const h = 7;

    const trackBg = this.add.graphics().setDepth(2);
    trackBg.fillStyle(0x2a2040, 0.8);
    trackBg.fillRoundedRect(x, y + 2, w, h, 3);
    trackBg.lineStyle(0.5, 0x4a3a6a, 0.5);
    trackBg.strokeRoundedRect(x, y + 2, w, h, 3);

    const fill = this.add.graphics().setDepth(2);
    const thumb = this.add.graphics().setDepth(2);
    const valText = this.add.text(x + w + 10, y, `${Math.round(initial * 100)}%`, {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#8a8070',
      fontFamily: DesignSystem.getFontFamily(),
    }).setDepth(2);

    const drawSlider = (val: number) => {
      fill.clear();
      fill.fillStyle(COLORS.UI.GOLD, 0.55);
      fill.fillRoundedRect(x, y + 2, Math.max(w * val, 4), h, 3);
      thumb.clear();
      thumb.fillStyle(0xd4a853, 0.95);
      thumb.fillCircle(x + w * val, y + 5, 5);
      thumb.fillStyle(0xffffff, 0.25);
      thumb.fillCircle(x + w * val - 1, y + 4, 2.5);
      valText.setText(`${Math.round(val * 100)}%`);
    };
    drawSlider(initial);

    const hitZone = this.add.rectangle(x + w / 2, y + 5, w + 20, 22, 0, 0)
      .setDepth(3).setInteractive();
    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const val = Phaser.Math.Clamp((pointer.x - x) / w, 0, 1);
      drawSlider(val);
      onChange(val);
    });
    hitZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown) return;
      const val = Phaser.Math.Clamp((pointer.x - x) / w, 0, 1);
      drawSlider(val);
      onChange(val);
    });
  }
}
