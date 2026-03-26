import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameState } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';
import { AudioManager } from '../audio/AudioManager';

export class SettingsScene extends Phaser.Scene {
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;
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
    this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55,
    ).setDepth(0);

    const cx = GAME_WIDTH / 2;
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    const bg = this.add.graphics();
    bg.fillStyle(0x12101e, 0.97);
    bg.fillRoundedRect(cx - 170, 18, 340, 238, 8);
    bg.lineStyle(1.5, COLORS.UI.PANEL_BORDER, 0.5);
    bg.strokeRoundedRect(cx - 170, 18, 340, 238, 8);
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.1);
    bg.strokeRoundedRect(cx - 167, 21, 334, 232, 7);

    this.add.text(cx, 40, gm.i18n.t('settings.title'),
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XL),
    ).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    line.lineBetween(cx - 120, 55, cx + 120, 55);

    let y = 72;

    this.add.text(cx - 140, y, gm.i18n.t('settings.bgm'),
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#b0a898'),
    );
    this.createSlider(cx + 30, y, this.bgmVolume, (val) => {
      this.bgmVolume = val;
      this.syncAudioVolume();
    });

    y += 32;
    this.add.text(cx - 140, y, gm.i18n.t('settings.sfx'),
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#b0a898'),
    );
    this.createSlider(cx + 30, y, this.sfxVolume, (val) => {
      this.sfxVolume = val;
      this.syncAudioVolume();
    });

    y += 32;
    this.add.text(cx - 140, y, gm.i18n.t('settings.language'),
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#b0a898'),
    );
    const langBtn = this.add.text(cx + 30, y, gm.language === 'ko' ? '한국어 ▸' : 'English ▸',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setInteractive({ useHandCursor: true });
    langBtn.on('pointerdown', () => {
      gm.language = gm.language === 'ko' ? 'en' : 'ko';
      langBtn.setText(gm.language === 'ko' ? '한국어 ▸' : 'English ▸');
    });
    langBtn.on('pointerover', () => langBtn.setColor('#ffffff'));
    langBtn.on('pointerout', () => langBtn.setColor('#d4a853'));

    y += 32;
    this.add.text(cx - 140, y, gm.i18n.t('settings.reduceMotion'),
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#b0a898'),
    );
    let motionReduced = false;
    const motionTxt = this.add.text(cx + 30, y, 'OFF',
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#6b5b4f'),
    ).setInteractive({ useHandCursor: true });
    motionTxt.on('pointerdown', () => {
      motionReduced = !motionReduced;
      motionTxt.setText(motionReduced ? 'ON' : 'OFF');
      motionTxt.setColor(motionReduced ? '#66cc66' : '#6b5b4f');
    });

    y += 32;
    this.add.text(cx - 140, y, gm.i18n.t('settings.colorblind'),
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#b0a898'),
    );
    const modes = ['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
    const modeLabels = ko
      ? ['없음', '적색맹', '녹색맹', '청색맹']
      : ['none', 'protanopia', 'deuteranopia', 'tritanopia'];
    let modeIdx = 0;
    const modeTxt = this.add.text(cx + 30, y, modeLabels[0],
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#6b5b4f'),
    ).setInteractive({ useHandCursor: true });
    modeTxt.on('pointerdown', () => {
      modeIdx = (modeIdx + 1) % modes.length;
      modeTxt.setText(modeLabels[modeIdx]);
    });

    y += 44;
    DesignSystem.createButton(this, cx, y, 150, 28,
      gm.i18n.t('settings.back'), () => this.goBack(),
      { fontSize: DesignSystem.FONT_SIZE.SM },
    );
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
    const w = 110;
    const h = 7;

    const bg = this.add.graphics();
    bg.fillStyle(0x333333, 0.7);
    bg.fillRoundedRect(x, y + 2, w, h, 3);

    const fill = this.add.graphics();
    const thumb = this.add.graphics();
    const valText = this.add.text(x + w + 12, y, `${Math.round(initial * 100)}%`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    );

    const drawSlider = (val: number) => {
      fill.clear();
      fill.fillStyle(COLORS.UI.GOLD, 0.6);
      fill.fillRoundedRect(x, y + 2, w * val, h, 3);
      thumb.clear();
      thumb.fillStyle(0xd4a853, 0.95);
      thumb.fillCircle(x + w * val, y + 5, 6);
      thumb.fillStyle(0xffffff, 0.2);
      thumb.fillCircle(x + w * val - 1, y + 4, 3);
      valText.setText(`${Math.round(val * 100)}%`);
    };
    drawSlider(initial);

    const hitZone = this.add.rectangle(x + w / 2, y + 5, w + 24, 24, 0, 0).setInteractive();
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
