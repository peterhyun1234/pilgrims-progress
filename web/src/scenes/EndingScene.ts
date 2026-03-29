import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';
import { AudioManager } from '../audio/AudioManager';

type EndingTier = 'glory' | 'humble' | 'barely' | 'grace';

interface TierTheme {
  titleKo: string;
  titleEn: string;
  subtitleKo: string;
  subtitleEn: string;
  bgTint: number;
  lightColor: number;
  lightAlpha: number;
  particleColor: number;
  particleCount: number;
  titleColor: string;
}

const TIER_THEMES: Record<EndingTier, TierTheme> = {
  glory: {
    titleKo: '영광의 도착', titleEn: 'Glorious Arrival',
    subtitleKo: '빛나는 관을 쓰고 천성에 입성하였도다',
    subtitleEn: 'Crowned in glory, the gates stood wide open',
    bgTint: 0xffd700, lightColor: 0xffd700, lightAlpha: 0.38,
    particleColor: 0xffd700, particleCount: 40,
    titleColor: '#ffd700',
  },
  humble: {
    titleKo: '겸손한 도착', titleEn: 'A Humble Arrival',
    subtitleKo: '조용한 발걸음으로, 그러나 흔들리지 않는 믿음으로',
    subtitleEn: 'With quiet steps, yet unwavering faith',
    bgTint: 0xddbb66, lightColor: 0xeedd88, lightAlpha: 0.26,
    particleColor: 0xeedd88, particleCount: 25,
    titleColor: '#eedd88',
  },
  barely: {
    titleKo: '간신히 도착', titleEn: 'Arrived at Last',
    subtitleKo: '지친 발걸음이었으나, 마침내 이른 곳',
    subtitleEn: 'Exhausted, yet the journey is complete',
    bgTint: 0x998866, lightColor: 0xccbb99, lightAlpha: 0.18,
    particleColor: 0xccbb99, particleCount: 15,
    titleColor: '#ccbb99',
  },
  grace: {
    titleKo: '은혜의 도착', titleEn: 'Saved by Grace',
    subtitleKo: '넘어질 때마다 손을 내밀어 주신 분이 계셨다',
    subtitleEn: 'Every fall was met by a hand reaching down',
    bgTint: 0xaa88dd, lightColor: 0xddbbff, lightAlpha: 0.28,
    particleColor: 0xddbbff, particleCount: 30,
    titleColor: '#ddbbff',
  },
};

export class EndingScene extends Phaser.Scene {
  private gameManager!: GameManager;

  constructor() {
    super({ key: SCENE_KEYS.ENDING ?? 'EndingScene' });
  }

  create(): void {
    this.gameManager = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const tier = this.getEndingTier();
    const theme = TIER_THEMES[tier];

    this.cameras.main.setBackgroundColor(0x000000);
    this.createStarfield(theme);
    this.createParticles(theme);
    this.runEpilogueSequence(tier, theme);

    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audioMgr = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audioMgr.ambient.init(12);
      this.time.delayedCall(500, () => audioMgr.ambient.playCelestialArrival());
    }
  }

  private getEndingTier(): EndingTier {
    return this.gameManager.stats.getEndingTier() as EndingTier;
  }

  private createStarfield(theme: TierTheme): void {
    const bg = this.add.graphics().setDepth(0);
    const strips = 20;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Math.round(0x00 + 0x08 * t);
      const g = Math.round(0x00 + 0x04 * t);
      const b = Math.round(0x08 + 0x18 * t);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, Math.floor(t * GAME_HEIGHT), GAME_WIDTH, Math.ceil(GAME_HEIGHT / strips) + 1);
    }
    // Stars
    for (let i = 0; i < 80; i++) {
      const hash = (i * 137 * 31 + 7) & 0xffff;
      const sx = hash % GAME_WIDTH;
      const sy = (hash * 3) % GAME_HEIGHT;
      const brightness = 0.3 + (hash % 10) * 0.07;
      const size = 0.5 + (hash % 3) * 0.4;
      bg.fillStyle(0xffffff, brightness);
      bg.fillCircle(sx, sy, size);
    }
    // Holy light beam — wide outer shaft
    bg.fillStyle(theme.lightColor, theme.lightAlpha * 0.45);
    bg.fillTriangle(GAME_WIDTH / 2 - 80, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.75, GAME_WIDTH / 2 + 80, 0);
    // Inner bright core
    bg.fillStyle(theme.lightColor, theme.lightAlpha);
    bg.fillTriangle(GAME_WIDTH / 2 - 40, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.6, GAME_WIDTH / 2 + 40, 0);
    // Tight inner glow
    bg.fillStyle(theme.lightColor, theme.lightAlpha * 1.3 > 0.6 ? 0.6 : theme.lightAlpha * 1.3);
    bg.fillTriangle(GAME_WIDTH / 2 - 16, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.4, GAME_WIDTH / 2 + 16, 0);
    // Tier-specific tint overlay
    bg.fillStyle(theme.bgTint, 0.06);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createParticles(theme: TierTheme): void {
    const gfx = this.add.graphics().setDepth(5);
    const particles: { x: number; y: number; vy: number; size: number; alpha: number; phase: number }[] = [];

    for (let i = 0; i < theme.particleCount; i++) {
      particles.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        vy: -(0.1 + Math.random() * 0.3),
        size: 0.5 + Math.random() * 1.2,
        alpha: 0.1 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2,
      });
    }

    this.time.addEvent({
      delay: 33,
      loop: true,
      callback: () => {
        gfx.clear();
        const t = this.time.now * 0.001;
        particles.forEach(p => {
          p.y += p.vy;
          p.x += Math.sin(t + p.phase) * 0.2;
          if (p.y < -5) { p.y = GAME_HEIGHT + 5; p.x = Math.random() * GAME_WIDTH; }
          const a = p.alpha * (0.6 + Math.sin(t * 2 + p.phase) * 0.4);
          gfx.fillStyle(theme.particleColor, a);
          gfx.fillCircle(p.x, p.y, p.size);
        });
      },
    });
  }

  private runEpilogueSequence(tier: EndingTier, theme: TierTheme): void {
    const ko = this.gameManager.language === 'ko';

    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
      .setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 2000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        flash.destroy();
        this.showEpilogueText(ko, tier, theme);
      },
    });
  }

  private showEpilogueText(ko: boolean, tier: EndingTier, theme: TierTheme): void {
    const cx = GAME_WIDTH / 2;
    const FS = DesignSystem.FONT_SIZE;

    const title = ko ? theme.titleKo : theme.titleEn;
    const subtitle = ko ? theme.subtitleKo : theme.subtitleEn;
    const scriptures = this.getScripture(tier, ko);

    // No empty spacer lines — keep layout compact for 270px height
    const epilogueLines = [
      { text: title, color: theme.titleColor, size: FS.XL },
      { text: subtitle, color: '#c8b8a0', size: FS.XS },
      ...this.getNarrativeLines(tier, ko, FS),
      ...scriptures,
    ];

    // Reserve space at bottom for stats+button (≈55px)
    const BOTTOM_RESERVE = 55;
    const availableH = GAME_HEIGHT - BOTTOM_RESERVE;
    const lineSpacing = 4;
    const totalHeight = epilogueLines.reduce((acc, l) => acc + l.size + lineSpacing, 0);
    // Start from top-quarter if content is tall, otherwise centre in available area
    const startY = Math.max(16, (availableH - totalHeight) / 2);
    let delay = 0;
    let curY = startY;

    epilogueLines.forEach(line => {
      const y = curY;
      curY += line.size + lineSpacing;
      const txt = this.add.text(cx, y, line.text, {
        fontSize: `${line.size}px`,
        color: line.color,
        fontFamily: FONT_FAMILY,
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 40 },
      }).setOrigin(0.5, 0).setAlpha(0).setDepth(10);

      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: txt, alpha: 1, duration: 700, ease: 'Sine.easeIn' });
      });
      delay += 420;
    });

    // Pass the bottom of last line so stats render below it cleanly
    this.time.delayedCall(delay + 800, () => this.showStats(ko, curY));
  }

  private getNarrativeLines(tier: EndingTier, ko: boolean, FS: typeof DesignSystem.FONT_SIZE) {
    const narratives: Record<EndingTier, { ko: string[]; en: string[] }> = {
      glory: {
        ko: ['크리스천은 영광 중에 천성에 입성하였다.', '긴 싸움 끝에 빛나는 면류관이 그를 기다렸고,', '온 천군이 환호하며 맞이하였도다.'],
        en: ['Christian entered the Celestial City in glory.', 'After every battle, a crown of light awaited,', 'and all of heaven rejoiced at his coming.'],
      },
      humble: {
        ko: ['크리스천은 조용히 천성의 문을 지나갔다.', '화려하지 않았으나 흔들리지 않는 발걸음이었고,', '문지기들이 따뜻이 맞아주었도다.'],
        en: ['Christian passed through the gates quietly.', 'No fanfare, but his steps never wavered,', 'and the gatekeepers welcomed him warmly.'],
      },
      barely: {
        ko: ['크리스천은 마침내 천성에 도착했다.', '지치고 상처투성이었으나,', '그가 바라던 곳에 이른 것이다.'],
        en: ['Christian had arrived at last.', 'Battered and weary, yet standing,', 'the gates of the Celestial City stood open.'],
      },
      grace: {
        ko: ['크리스천은 넘어질 때마다 은혜의 손에 이끌려', '마침내 천성에 도착했다.', '그의 힘이 아니라 은혜가 그를 이끈 여정이었도다.'],
        en: ['Lifted by grace at every fall,', 'Christian arrived at the Celestial City.', 'Not by his strength, but by grace alone.'],
      },
    };
    const lines = ko ? narratives[tier].ko : narratives[tier].en;
    return lines.map((text, i) => ({
      text,
      color: i === 0 ? '#e8e0d0' : '#c8b8a0',
      size: FS.SM,
    }));
  }

  private getScripture(tier: EndingTier, ko: boolean) {
    const FS = DesignSystem.FONT_SIZE;
    const scriptures: Record<EndingTier, { ko: string[]; en: string[]; ref: string }> = {
      glory: {
        ko: ['"이제 후로는 나를 위하여 의의 면류관이 예비되었으니"'],
        en: ['"Now there is in store for me the crown of righteousness"'],
        ref: ko ? '— 디모데후서 4:8' : '— 2 Timothy 4:8',
      },
      humble: {
        ko: ['"잘하였도다 착하고 충성된 종아"'],
        en: ['"Well done, good and faithful servant"'],
        ref: ko ? '— 마태복음 25:23' : '— Matthew 25:23',
      },
      barely: {
        ko: ['"하나님이 그들의 눈에서 모든 눈물을 씻어 주실 것이요"', '"다시는 사망이 없고 애통하는 것이나"', '"아픈 것이 다시 있지 아니하리니"'],
        en: ['"God shall wipe away all tears from their eyes;"', '"and there shall be no more death,"', '"neither shall there be any more pain."'],
        ref: ko ? '— 요한계시록 21:4' : '— Revelation 21:4',
      },
      grace: {
        ko: ['"너는 내 은혜가 네게 족하도다"', '"이는 내 능력이 약한 데서 온전하여짐이라"'],
        en: ['"My grace is sufficient for you,"', '"for my power is made perfect in weakness."'],
        ref: ko ? '— 고린도후서 12:9' : '— 2 Corinthians 12:9',
      },
    };
    const s = scriptures[tier];
    const lines = ko ? s.ko : s.en;
    return [
      ...lines.map(text => ({ text, color: '#d4a853', size: FS.SM })),
      { text: s.ref, color: '#b0a898', size: FS.XS },
    ];
  }

  private showStats(ko: boolean, baseY: number): void {
    const cx = GAME_WIDTH / 2;
    // Clamp so stats never go off-screen; leave 48px for button below
    const statsY = Math.min(baseY + 10, GAME_HEIGHT - 48);

    const divider = this.add.graphics().setDepth(10);
    divider.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    divider.lineBetween(cx - 70, statsY - 6, cx + 70, statsY - 6);

    const liveStats = this.gameManager.stats.getAll();
    const grace = this.gameManager.stats.getHidden().graceCounter ?? 0;

    const statLines = ko ? [
      `믿음 ${liveStats.faith} · 용기 ${liveStats.courage} · 지혜 ${liveStats.wisdom} · 은혜 ${grace}회`,
    ] : [
      `Faith ${liveStats.faith} · Courage ${liveStats.courage} · Wisdom ${liveStats.wisdom} · Grace ×${grace}`,
    ];

    statLines.forEach((line, i) => {
      const statTxt = this.add.text(cx, statsY + i * 14, line, {
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#b0a898',
        fontFamily: FONT_FAMILY,
        align: 'center',
      }).setOrigin(0.5, 0).setAlpha(0).setDepth(10);
      this.tweens.add({ targets: statTxt, alpha: 1, duration: 600 });
    });

    this.time.delayedCall(800, () => {
      const menuLabel = this.gameManager.i18n.t('ending.return');
      const btnY = Math.min(statsY + 22, GAME_HEIGHT - 18);
      const btn = DesignSystem.createButton(
        this, cx, btnY, 150, 26, menuLabel,
        () => {
          void DesignSystem.fadeOut(this, 800).then(() => {
            this.scene.start(SCENE_KEYS.MENU);
          });
        },
        { fontSize: DesignSystem.FONT_SIZE.SM, bgColor: 0x2a1a06 },
      );
      btn.setAlpha(0);
      btn.setDepth(20);
      this.tweens.add({ targets: btn, alpha: 1, duration: 600 });
    });
  }
}
