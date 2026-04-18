import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';
import { CombatSystem, CombatState } from '../systems/CombatSystem';
import { EnemyDef, ENEMIES, SkillDef } from '../systems/SkillData';
import { AudioManager } from '../audio/AudioManager';

export class BattleScene extends Phaser.Scene {
  private combatSystem!: CombatSystem;
  private eventBus!: EventBus;
  private gameManager!: GameManager;

  private enemyContainer!: Phaser.GameObjects.Container;
  private playerContainer!: Phaser.GameObjects.Container;
  private actionMenu!: Phaser.GameObjects.Container;
  private logContainer!: Phaser.GameObjects.Container;
  private skillPanel: Phaser.GameObjects.Container | null = null;

  private playerHpBar!: { update: (v: number) => void };
  private enemyHpBar!: { update: (v: number) => void };
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;

  // Sprites for cinematic rendering
  private playerSprite: Phaser.GameObjects.Sprite | null = null;
  private enemySprite: Phaser.GameObjects.Sprite | null = null;

  // Boss phase system
  private bossPhase = 0;
  private bossPhaseThresholds = [0.75, 0.5, 0.25];
  private bossPhaseDialogues: string[][] = [];

  private enemyId = 'doubt';
  private currentChapter = 1;
  private isAnimating = false;
  private battleAuraGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super(SCENE_KEYS.BATTLE);
  }

  init(data?: { enemyId?: string; chapter?: number }): void {
    this.enemyId = data?.enemyId ?? 'doubt';
    this.currentChapter = data?.chapter ?? 1;
  }

  create(): void {
    this.eventBus = EventBus.getInstance();
    this.gameManager = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    this.combatSystem = new CombatSystem();

    this.cameras.main.setBackgroundColor(COLORS.BATTLE.BG);

    // Start battle BGM (chapter 0 = dedicated battle theme)
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audio.bgm.play(0, 800);
    }

    const enemy = ENEMIES[this.enemyId];
    if (!enemy) {
      this.scene.start(SCENE_KEYS.GAME);
      return;
    }

    const state = this.combatSystem.startCombat(enemy);

    this.createBattleBackground();
    this.createEnemyDisplay(enemy, state);
    this.createPlayerDisplay(state);
    this.createActionMenu();
    this.createLogPanel(state);

    this.gameManager.changeState(GameState.BATTLE);
    DesignSystem.fadeIn(this, 400);

    this.setupBattleEvents();
  }

  /** Returns chapter-specific battle arena sky/ground palette: [skyTop, skyBot, glowColor, groundColor, dividerColor] */
  private getBattlePalette(): [number, number, number, number, number] {
    const ch = this.currentChapter;
    // Ch1: dark ember | Ch2: murky swamp | Ch3: rocky dusk | Ch4: shadowed stone
    // Ch5: golden dusk | Ch6: dark valley | Ch7: death valley (purple) | Ch8: apollyon (volcanic)
    // Ch9: shadow (near-black) | Ch10: vanity fair (cold city) | Ch11: doubting castle (grey) | Ch12: celestial
    const palettes: Record<number, [number, number, number, number, number]> = {
      1:  [0x1a0c10, 0x2a1008, 0x882200, 0x060210, 0xcc4400],
      2:  [0x0c1a10, 0x101c14, 0x224422, 0x060c08, 0x448844],
      3:  [0x0a1a2a, 0x1a2a1a, 0x224444, 0x060e08, 0x4488aa],
      4:  [0x140c1a, 0x1a1228, 0x442266, 0x060210, 0x8844cc],
      5:  [0x1a1208, 0x2a1e08, 0x884400, 0x0e0804, 0xd4a853],
      6:  [0x0a0c08, 0x101408, 0x224422, 0x040604, 0x446633],
      7:  [0x080408, 0x0e060c, 0x440022, 0x040204, 0x880044],
      8:  [0x120406, 0x1a0804, 0xcc2200, 0x080202, 0xff4400],
      9:  [0x060206, 0x080406, 0x220011, 0x040104, 0x660033],
      10: [0x101428, 0x1a2040, 0x223366, 0x080a14, 0x4466aa],
      11: [0x0c0c14, 0x101020, 0x222244, 0x060608, 0x555588],
      12: [0x1a1428, 0x2a2048, 0xaa6600, 0x100c1c, 0xffd700],
    };
    return palettes[ch] ?? palettes[1];
  }

  private createBattleBackground(): void {
    const W = GAME_WIDTH, H = GAME_HEIGHT;
    const ground = H * 0.48;

    const [skyTop, skyBot, glowColor, groundColor, dividerColor] = this.getBattlePalette();

    // Sky: chapter-tinted gradient
    const sky = this.add.graphics().setDepth(0);
    const strips = 16;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const topR = (skyTop >> 16) & 0xff, topG = (skyTop >> 8) & 0xff, topB = skyTop & 0xff;
      const botR = (skyBot >> 16) & 0xff, botG = (skyBot >> 8) & 0xff, botB = skyBot & 0xff;
      const r = Math.round(topR + (botR - topR) * t);
      const g2 = Math.round(topG + (botG - topG) * t);
      const b = Math.round(topB + (botB - topB) * t);
      sky.fillStyle((r << 16) | (g2 << 8) | b, 1);
      sky.fillRect(0, Math.floor(t * ground), W, Math.ceil(ground / strips) + 1);
    }

    // Chapter-specific supernatural glow
    sky.fillStyle(glowColor, 0.105);
    sky.fillEllipse(W / 2, ground * 0.7, W * 0.85, ground * 0.55);
    sky.fillStyle(glowColor, 0.06);
    sky.fillEllipse(W / 2, ground * 0.85, W * 0.5, ground * 0.3);

    // Stars / supernatural lights
    for (let i = 0; i < 30; i++) {
      const hash = (i * 137 * 31) & 0xffff;
      const starBrightness = this.currentChapter === 12 ? 0.25 : 0.18;
      sky.fillStyle(0xffffff, starBrightness + (hash % 8) * 0.03);
      sky.fillCircle(hash % W, (hash * 3) % (ground * 0.7), 0.5 + (hash % 2) * 0.3);
    }

    // Chapter-specific background environment features
    if (this.currentChapter === 7 || this.currentChapter === 8) {
      // Bone/volcanic silhouettes
      for (let i = 0; i < 5; i++) {
        const hash = (i * 131 + this.currentChapter * 29) & 0xff;
        const sx = (hash % (W - 40)) + 10;
        const sh = 8 + (hash % 20);
        sky.fillStyle(this.currentChapter === 8 ? 0x1a0804 : 0x0a0408, 0.5);
        sky.fillTriangle(sx, ground, sx + sh / 2, ground - sh, sx + sh, ground);
      }
    } else if (this.currentChapter === 5) {
      // Cross silhouette in background
      sky.fillStyle(0x3a2a1a, 0.35);
      sky.fillRect(W / 2 - 2, ground * 0.15, 4, 30);
      sky.fillRect(W / 2 - 12, ground * 0.25, 24, 3);
      // Golden glow from cross
      sky.fillStyle(0xffd700, 0.05);
      sky.fillCircle(W / 2, ground * 0.3, 30);
    } else if (this.currentChapter === 12) {
      // Celestial city silhouette
      for (let b = 0; b < 5; b++) {
        const hash = (b * 97 + 12 * 13) & 0xff;
        const bx = W * 0.1 + b * (W * 0.18);
        const bh = 25 + (hash % 20);
        sky.fillStyle(0xffd700, 0.12);
        sky.fillRect(bx, ground - bh, 12 + (hash % 10), bh);
      }
      // Radiant rays
      sky.fillStyle(0xffd700, 0.04);
      sky.fillTriangle(W / 2 - 60, 0, W / 2, ground * 0.5, W / 2 + 60, 0);
    }

    // Ground (chapter-tinted)
    const gr = this.add.graphics().setDepth(0);
    const groundStrips = 8;
    for (let i = 0; i < groundStrips; i++) {
      const baseR = (groundColor >> 16) & 0xff;
      const baseG = (groundColor >> 8) & 0xff;
      const baseB = groundColor & 0xff;
      gr.fillStyle(((baseR + i) << 16) | ((baseG + i) << 8) | (baseB + i * 2), 1);
      gr.fillRect(0, ground + i * (H - ground) / groundStrips, W, (H - ground) / groundStrips + 1);
    }

    // Ground divider line — chapter-colored
    gr.lineStyle(1, dividerColor, 0.525);
    gr.lineBetween(0, ground, W, ground);
    gr.fillStyle(dividerColor, 0.225);
    for (let x = 0; x < W; x += 30) {
      gr.fillRect(x, ground - 0.5, 15, 1);
    }

    // Subtle grid in ground
    gr.lineStyle(0.3, 0x333355, 0.15);
    for (let x2 = 20; x2 < W; x2 += 20) {
      gr.lineBetween(x2, ground, x2 - 10, H);
    }

    // Vignette
    const vig = this.add.graphics().setDepth(1);
    for (let i = 0; i < 8; i++) {
      const t = i / 8;
      vig.fillStyle(0x000000, 0.2 * (1 - t));
      vig.fillRect(0, 0, W, 4 - i * 0.5 + 1);
      vig.fillRect(0, H - 4 + i, W, 4);
      vig.fillRect(0, 0, 4, H);
      vig.fillRect(W - 4, 0, 4, H);
    }
  }

  private createEnemyDisplay(enemy: EnemyDef, state: CombatState): void {
    this.enemyContainer = this.add.container(GAME_WIDTH / 2, 60).setDepth(10);

    // Try to use a real sprite; fall back to procedural silhouette
    const spriteKey = this.textures.exists(enemy.id)
      ? enemy.id
      : (this.textures.exists(`${enemy.id}_gen`) ? `${enemy.id}_gen` : null);

    const bossScale = enemy.isBoss ? 2.5 : 1.8;

    if (spriteKey) {
      this.enemySprite = this.add.sprite(0, 0, spriteKey, 0)
        .setScale(bossScale)
        .setFlipX(true);
      const animKey = `${spriteKey}_idle_down`;
      if (this.anims.exists(animKey)) this.enemySprite.play(animKey, true);
      this.enemyContainer.add(this.enemySprite);
    } else {
      // Procedural SANABI-style menacing silhouette
      const gfx = this.add.graphics();
      const bs = enemy.isBoss ? 1.5 : 1.0;
      const ec = enemy.iconColor;

      // Multi-layer outer aura (dark entity effect)
      gfx.fillStyle(ec, 0.06); gfx.fillEllipse(0, 0, 90 * bs, 75 * bs);
      gfx.fillStyle(ec, 0.10); gfx.fillEllipse(0, 0, 68 * bs, 56 * bs);
      gfx.fillStyle(0x000000, 0.35); gfx.fillEllipse(0, 0, 55 * bs, 45 * bs);

      // Ground shadow
      gfx.fillStyle(0x000000, 0.40); gfx.fillEllipse(0, 22 * bs, 38 * bs, 8 * bs);

      // Robe / body (dark layered)
      gfx.fillStyle(0x080410, 0.95); gfx.fillEllipse(0, 6 * bs, 30 * bs, 40 * bs);
      gfx.fillStyle(ec, 0.20); gfx.fillEllipse(0, 6 * bs, 26 * bs, 36 * bs);
      // Body highlight edge
      gfx.lineStyle(1.5, ec, 0.45);
      gfx.strokeEllipse(0, 6 * bs, 26 * bs, 36 * bs);

      // Head
      gfx.fillStyle(0x000000, 0.90); gfx.fillCircle(0, -16 * bs, 12 * bs);
      gfx.fillStyle(ec, 0.30); gfx.fillCircle(0, -16 * bs, 10 * bs);
      gfx.lineStyle(1, ec, 0.50); gfx.strokeCircle(0, -16 * bs, 10 * bs);

      // Eye sockets
      gfx.fillStyle(0x000000, 1.0);
      gfx.fillEllipse(-4.5 * bs, -17 * bs, 5 * bs, 3 * bs);
      gfx.fillEllipse(4.5 * bs, -17 * bs, 5 * bs, 3 * bs);
      // Glowing pupils
      gfx.fillStyle(0xff2200, 1.0);
      gfx.fillCircle(-4.5 * bs, -17 * bs, 1.8 * bs);
      gfx.fillCircle(4.5 * bs, -17 * bs, 1.8 * bs);
      // Eye bloom
      gfx.fillStyle(0xff6644, 0.7);
      gfx.fillCircle(-4.5 * bs, -17 * bs, 1.0 * bs);
      gfx.fillCircle(4.5 * bs, -17 * bs, 1.0 * bs);
      // Eye glow trails
      gfx.fillStyle(0xff3300, 0.18);
      gfx.fillEllipse(-4.5 * bs, -14 * bs, 4 * bs, 5 * bs);
      gfx.fillEllipse(4.5 * bs, -14 * bs, 4 * bs, 5 * bs);

      // Boss-specific features
      if (enemy.isBoss) {
        // Triple-crown horns
        const hornPositions = [[-6 * bs, -26 * bs], [0, -30 * bs], [6 * bs, -26 * bs]];
        for (const [hx, hy] of hornPositions) {
          gfx.fillStyle(ec, 0.85);
          gfx.fillTriangle(hx - 2.5 * bs, hy + 8 * bs, hx, hy, hx + 2.5 * bs, hy + 8 * bs);
          gfx.lineStyle(1, ec, 0.6);
          gfx.strokeTriangle(hx - 2.5 * bs, hy + 8 * bs, hx, hy, hx + 2.5 * bs, hy + 8 * bs);
        }
        // Menacing aura ring
        gfx.lineStyle(1.5, 0xff0000, 0.35);
        gfx.strokeEllipse(0, 0, 54, 44);
        gfx.lineStyle(0.5, ec, 0.25);
        gfx.strokeEllipse(0, 0, 62, 52);
      }

      // Clawed arms (more detailed)
      const armY = 2 * bs;
      gfx.lineStyle(2.5, 0x080410, 0.9);
      gfx.lineBetween(-13 * bs, armY, -24 * bs, -10 * bs);
      gfx.lineBetween(13 * bs, armY, 24 * bs, -10 * bs);
      gfx.lineStyle(1.5, ec, 0.55);
      gfx.lineBetween(-13 * bs, armY, -24 * bs, -10 * bs);
      gfx.lineBetween(13 * bs, armY, 24 * bs, -10 * bs);
      // Claw tips (3-prong)
      gfx.lineStyle(1, ec, 0.75);
      for (const [sx, sy, dx, dy] of [
        [-24 * bs, -10 * bs, -28 * bs, -15 * bs],
        [-24 * bs, -10 * bs, -26 * bs, -5 * bs],
        [-24 * bs, -10 * bs, -29 * bs, -8 * bs],
        [24 * bs, -10 * bs, 28 * bs, -15 * bs],
        [24 * bs, -10 * bs, 26 * bs, -5 * bs],
        [24 * bs, -10 * bs, 29 * bs, -8 * bs],
      ]) {
        gfx.lineBetween(sx, sy, dx, dy);
      }

      this.enemyContainer.add(gfx);
    }

    // Enemy aura — layered static glow (HEAD) + rotating orbit dots (agent)
    const auraR = enemy.isBoss ? 52 : 36;
    const auraGfx = this.add.graphics();
    auraGfx.fillStyle(enemy.iconColor, 0.06); auraGfx.fillCircle(0, 0, auraR * 1.5);
    auraGfx.fillStyle(enemy.iconColor, 0.12); auraGfx.fillCircle(0, 0, auraR);
    auraGfx.fillStyle(enemy.iconColor, 0.20); auraGfx.fillCircle(0, 0, auraR * 0.6);
    this.enemyContainer.addAt(auraGfx, 0);

    // Rotating aura orbit dots animation
    this.battleAuraGraphics = this.add.graphics().setDepth(11);
    const auraColor = enemy.iconColor;
    const auraRadius = enemy.isBoss ? 48 : 34;
    const auraState = { angle: 0 };
    this.tweens.add({
      targets: auraState,
      angle: Math.PI * 2,
      duration: enemy.isBoss ? 1800 : 2800,
      repeat: -1,
      ease: 'Linear',
      onUpdate: () => {
        if (!this.battleAuraGraphics) return;
        this.battleAuraGraphics.clear();
        const cx = GAME_WIDTH / 2;
        const cy = 60;
        const dotCount = enemy.isBoss ? 8 : 5;
        for (let d = 0; d < dotCount; d++) {
          const a = auraState.angle + (d / dotCount) * Math.PI * 2;
          const dx = cx + Math.cos(a) * auraRadius;
          const dy = cy + Math.sin(a) * (auraRadius * 0.55);
          const alpha = 0.35 + Math.sin(a * 2) * 0.2;
          this.battleAuraGraphics.fillStyle(auraColor, Math.max(0.1, alpha));
          this.battleAuraGraphics.fillCircle(dx, dy, enemy.isBoss ? 3 : 2);
        }
        // Counter-rotating inner ring
        const innerCount = enemy.isBoss ? 5 : 3;
        for (let d = 0; d < innerCount; d++) {
          const a = -auraState.angle * 1.5 + (d / innerCount) * Math.PI * 2;
          const dx = cx + Math.cos(a) * auraRadius * 0.65;
          const dy = cy + Math.sin(a) * (auraRadius * 0.35);
          this.battleAuraGraphics.fillStyle(auraColor, 0.2);
          this.battleAuraGraphics.fillCircle(dx, dy, 1.5);
        }
      },
    });

    const ko = this.gameManager.language === 'ko';
    const nameText = this.add.text(0, -52, ko ? enemy.nameKo : enemy.nameEn, {
      fontSize: `${DesignSystem.FONT_SIZE.BASE}px`,
      color: '#ffd700',
      fontFamily: DesignSystem.getFontFamily(),
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.enemyContainer.add(nameText);

    // Boss badge — XS(11px) Korean ~15px; name SM(13px) Korean top at -52-9=-61; badge bottom at -68+7=-61 → flush
    if (enemy.isBoss) {
      const bossBadge = this.add.text(0, -68,
        ko ? '【 BOSS 】' : '【 BOSS 】',
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, '#ff4444'),
      ).setOrigin(0.5);
      this.enemyContainer.add(bossBadge);
    }

    // Enemy HP bar — single bar with HP text on the right (no label to avoid glyph artifacts)
    const hpBar = DesignSystem.createProgressBar(
      this, -55, 42, 110, 8, enemy.iconColor, 0x1a0a0a, state.enemyHp / state.enemyMaxHp,
    );
    this.enemyHpBar = hpBar;
    this.enemyContainer.add([hpBar.bg, hpBar.fill]);

    this.enemyHpText = this.add.text(55, 42, `${state.enemyHp}/${state.enemyMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(1, 0);
    this.enemyContainer.add(this.enemyHpText);

    // Boss health bar at top of screen (Phase 6B)
    if (enemy.isBoss && enemy.hp > 50) {
      this.createBossTopBar(enemy, state);
    }

    if (enemy.isBoss) {
      this.tweens.add({
        targets: this.enemyContainer, scaleX: 1.04, scaleY: 1.04,
        duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      // Boss menacing float
      const enemyBaseY = this.enemyContainer.y;
      this.tweens.add({
        targets: this.enemyContainer,
        y: enemyBaseY - 3,
        duration: 1400,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
      // Set up boss phase dialogues
      const languageIsBossKo = ko;
      this.bossPhaseDialogues = enemy.id === 'apollyon' ? [
        [languageIsBossKo ? '\"내 영역에서 도망칠 수 없다!\"' : '"You cannot escape my domain!"'],
        [languageIsBossKo ? '\"너의 믿음은 아무것도 아니다!\"' : '"Your faith is nothing!"'],
        [languageIsBossKo ? '\"이제 끝이다, 순례자여!\"' : '"This is the end, pilgrim!"'],
      ] : [
        [languageIsBossKo ? '\"아직도 희망을 품느냐?\"' : '"You still dare to hope?"'],
        [languageIsBossKo ? '\"절망은 영원하다!\"' : '"Despair is eternal!"'],
        [languageIsBossKo ? '\"굴복하라!\"' : '"Submit!"'],
      ];
    }
  }

  private bossTopBarFill: Phaser.GameObjects.Graphics | null = null;

  private createBossTopBar(enemy: EnemyDef, state: CombatState): void {
    const barW = GAME_WIDTH - 40;
    const barH = 8;
    const bx = 20;
    const by = 4;
    const topBarContainer = this.add.container(0, 0).setDepth(60);

    const bg2 = this.add.graphics();
    bg2.fillStyle(0x0a0814, 0.85);
    bg2.fillRoundedRect(bx - 4, by - 2, barW + 8, barH + 12, 3);
    bg2.lineStyle(0.5, enemy.iconColor, 0.3);
    bg2.strokeRoundedRect(bx - 4, by - 2, barW + 8, barH + 12, 3);

    const trackBg = this.add.graphics();
    trackBg.fillStyle(0x222222, 0.8);
    trackBg.fillRoundedRect(bx, by, barW, barH, 2);

    const fillGfx = this.add.graphics();
    const ratio = state.enemyHp / state.enemyMaxHp;
    fillGfx.fillStyle(enemy.iconColor, 0.85);
    fillGfx.fillRoundedRect(bx, by, Math.max(barW * ratio, 2), barH, 2);
    fillGfx.fillStyle(0xffffff, 0.15);
    fillGfx.fillRoundedRect(bx, by, Math.max(barW * ratio - 2, 1), 3, 1);
    this.bossTopBarFill = fillGfx;

    const ko = this.gameManager.language === 'ko';
    const bossLabel = this.add.text(bx, by + barH + 1,
      `⚠ ${ko ? enemy.nameKo : enemy.nameEn}`,
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, '#' + enemy.iconColor.toString(16).padStart(6, '0')),
    );

    topBarContainer.add([bg2, trackBg, fillGfx, bossLabel]);
    // Slide in from top
    topBarContainer.setY(-20);
    this.tweens.add({ targets: topBarContainer, y: 0, duration: 500, ease: 'Back.easeOut' });
  }

  private updateBossTopBar(state: CombatState): void {
    if (!this.bossTopBarFill) return;
    const barW = GAME_WIDTH - 40;
    const bx = 20;
    const by = 4;
    const enemy = ENEMIES[this.enemyId];
    if (!enemy) return;
    const ratio = state.enemyHp / state.enemyMaxHp;
    this.bossTopBarFill.clear();
    this.bossTopBarFill.fillStyle(enemy.iconColor, 0.85);
    this.bossTopBarFill.fillRoundedRect(bx, by, Math.max(barW * ratio, 2), 8, 2);
    this.bossTopBarFill.fillStyle(0xffffff, 0.15);
    this.bossTopBarFill.fillRoundedRect(bx, by, Math.max(barW * ratio - 2, 1), 3, 1);
  }

  private createPlayerDisplay(state: CombatState): void {
    // y=195 keeps player aura top (195-28=167) below log bottom (≈157), no overlap
    this.playerContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 75).setDepth(10);

    // Player sprite — use generated texture if available, otherwise procedural silhouette
    const pTexKey = this.textures.exists('christian_gen') ? 'christian_gen'
      : this.textures.exists('christian') ? 'christian' : null;

    if (pTexKey) {
      this.playerSprite = this.add.sprite(0, -28, pTexKey, 0).setScale(1.8);
      const idleAnim = `${pTexKey}_idle_down`;
      if (this.anims.exists(idleAnim)) this.playerSprite.play(idleAnim, true);
      this.playerContainer.add(this.playerSprite);
    } else {
      // Procedural pilgrim silhouette (pixel art style)
      const gfx = this.add.graphics();
      const bs = 1.4;
      // Outer glow (faith/holy aura)
      gfx.fillStyle(0xd4a853, 0.10);
      gfx.fillEllipse(0, -16, 48 * bs, 40 * bs);
      // Body shadow
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillEllipse(0, -4 * bs, 22 * bs, 28 * bs);
      // Cloak / body
      gfx.fillStyle(0x3a4a6a, 0.9);
      gfx.fillEllipse(0, -4 * bs, 18 * bs, 24 * bs);
      // Head
      gfx.fillStyle(0x000000, 0.6);
      gfx.fillCircle(0, -16 * bs, 10 * bs);
      gfx.fillStyle(0xc8a878, 0.85);
      gfx.fillCircle(0, -16 * bs, 8 * bs);
      // Eyes (determined look)
      gfx.fillStyle(0x3366cc, 1);
      gfx.fillRect(-3 * bs, -17 * bs, 2 * bs, 2 * bs);
      gfx.fillRect(1 * bs, -17 * bs, 2 * bs, 2 * bs);
      // Cross badge on chest (Christian's identifying mark)
      gfx.fillStyle(0xffd080, 0.9);
      gfx.fillRect(-1, -6 * bs, 2, 6 * bs);
      gfx.fillRect(-3, -4 * bs, 6, 2);
      // Staff
      gfx.lineStyle(2, 0x8b6a40, 1);
      gfx.lineBetween(10 * bs, -14 * bs, 12 * bs, 10 * bs);
      this.playerContainer.add(gfx);
    }

    const ko = this.gameManager.language === 'ko';
    const label = this.add.text(0, -2, ko ? '크리스천' : 'Christian',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    // HP label (prominent)
    const hpBar = DesignSystem.createProgressBar(
      this, -55, 8, 110, 8, COLORS.STAT.FAITH, 0x1a1a2a, state.playerHp / state.playerMaxHp,
    );
    this.playerHpBar = hpBar;

    this.playerHpText = this.add.text(55, 8, `${state.playerHp}/${state.playerMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(1, 0);

    this.playerContainer.add([label, hpBar.bg, hpBar.fill, this.playerHpText]);

    // Idle breathing bob for player
    const baseY = this.playerContainer.y;
    this.tweens.add({
      targets: this.playerContainer,
      y: baseY - 3,
      duration: 1600,
      yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private createActionMenu(): void {
    // 2×2 grid centered at bottom of screen
    const gridCenterX = GAME_WIDTH / 2;
    const gridCenterY = GAME_HEIGHT - 26;
    this.actionMenu = this.add.container(gridCenterX, gridCenterY).setDepth(100);

    const i18n = this.gameManager.i18n;
    // SANABI-quality action buttons with icon + color hierarchy
    const actions = [
      { label: i18n.t('battle.pray'),   icon: '✝', action: () => this.onPray(),        bgColor: 0x2a4a18, borderColor: 0xd4a853, textColor: '#ffe88a' },
      { label: i18n.t('battle.defend'), icon: '🛡', action: () => this.onDefend(),      bgColor: 0x182a4a, borderColor: 0x7799cc, textColor: '#aaccff' },
      { label: i18n.t('battle.skill'),  icon: '✦', action: () => this.showSkillPanel(), bgColor: 0x2a1a4a, borderColor: 0xaa66dd, textColor: '#cc99ff' },
      { label: i18n.t('battle.item'),   icon: '⚗', action: () => this.onUseItem(),      bgColor: 0x3a2210, borderColor: 0x997755, textColor: '#ccaa88' },
    ];

    const btnW = 88;
    const gap = 5;
    const totalW = actions.length * btnW + (actions.length - 1) * gap;
    const startX = -totalW / 2 + btnW / 2;

    actions.forEach((a, i) => {
      const bx = startX + i * (btnW + gap);
      const container = this.add.container(bx, 0);

      // Button background with rounded rect
      const bg = this.add.graphics();
      bg.fillStyle(a.bgColor, 0.95);
      bg.fillRoundedRect(-btnW / 2, -17, btnW, 34, 4);
      bg.lineStyle(1, a.borderColor, 0.55);
      bg.strokeRoundedRect(-btnW / 2, -17, btnW, 34, 4);
      // Top highlight strip
      bg.fillStyle(0xffffff, 0.06);
      bg.fillRoundedRect(-btnW / 2 + 1, -16, btnW - 2, 8, 3);

      // Icon (left side)
      const iconTxt = this.add.text(-btnW / 2 + 8, 0, a.icon, {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`, color: a.textColor, fontFamily: 'serif',
      }).setOrigin(0, 0.5);

      // Label text (centered-right)
      const labelTxt = this.add.text(4, 0, a.label, {
        fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
        color: a.textColor,
        fontFamily: DesignSystem.getFontFamily(),
      }).setOrigin(0, 0.5);

      // Hit area
      const hit = this.add.rectangle(0, 0, btnW, 34, 0, 0)
        .setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(a.bgColor + 0x181818, 0.98);
        bg.fillRoundedRect(-btnW / 2, -17, btnW, 34, 4);
        bg.lineStyle(1.5, a.borderColor, 0.9);
        bg.strokeRoundedRect(-btnW / 2, -17, btnW, 34, 4);
        bg.fillStyle(a.borderColor, 0.12);
        bg.fillRoundedRect(-btnW / 2, -17, btnW, 34, 4);
        labelTxt.setColor('#ffffff');
      });
      hit.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(a.bgColor, 0.95);
        bg.fillRoundedRect(-btnW / 2, -17, btnW, 34, 4);
        bg.lineStyle(1, a.borderColor, 0.55);
        bg.strokeRoundedRect(-btnW / 2, -17, btnW, 34, 4);
        bg.fillStyle(0xffffff, 0.06);
        bg.fillRoundedRect(-btnW / 2 + 1, -16, btnW - 2, 8, 3);
        labelTxt.setColor(a.textColor);
      });
      hit.on('pointerdown', () => {
        this.tweens.add({ targets: container, scaleX: 0.94, scaleY: 0.94, duration: 60, yoyo: true });
        this.time.delayedCall(70, a.action);
      });

      container.add([bg, iconTxt, labelTxt, hit]);
      this.actionMenu.add(container);
    });
  }

  private createLogPanel(state: CombatState): void {
    // Position log just below ground divider (y≈130), above player sprite (y≈167)
    this.logContainer = this.add.container(8, GAME_HEIGHT * 0.45 + 6).setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0814, 0.70);
    bg.fillRoundedRect(0, 0, GAME_WIDTH - 16, 28, 4);
    bg.lineStyle(0.5, 0x333355, 0.35);
    bg.strokeRoundedRect(0, 0, GAME_WIDTH - 16, 28, 4);
    this.logContainer.add(bg);

    this.updateLog(state);
  }

  private updateLog(state: CombatState): void {
    this.logContainer.getAll().forEach((obj, i) => {
      if (i > 0) obj.destroy();
    });

    const ko = this.gameManager.language === 'ko';
    const lastEntries = state.log.slice(-2);

    lastEntries.forEach((entry, i) => {
      const color = entry.type === 'player' ? '#88ccff' :
                    entry.type === 'enemy' ? '#ff8888' :
                    entry.type === 'heal' ? '#88ff88' : '#d4a853';
      const text = this.add.text(8, 4 + i * 12, ko ? entry.textKo : entry.textEn,
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, color),
      );
      this.logContainer.add(text);
    });
  }

  private showSkillPanel(): void {
    if (this.skillPanel || this.isAnimating) return;

    const state = this.combatSystem.getState();
    if (!state) return;

    const i18n = this.gameManager.i18n;
    const ko = this.gameManager.language === 'ko';
    this.skillPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(200).setAlpha(0);

    // Skill type color palette
    const TYPE_COLORS: Record<string, { bg: number; border: number; text: string; badge: string }> = {
      attack:  { bg: 0x3a1a1a, border: 0xdd4444, text: '#ff9999', badge: '⚔' },
      defend:  { bg: 0x1a2a3a, border: 0x4477cc, text: '#88bbff', badge: '🛡' },
      heal:    { bg: 0x1a3a1a, border: 0x44aa55, text: '#88ff99', badge: '✦' },
      special: { bg: 0x2a1a3a, border: 0xaa55dd, text: '#cc88ff', badge: '★' },
    };

    const skills = state.availableSkills;
    const panelH = skills.length === 0 ? 100 : 56 + skills.length * 36;
    const panelW = 260;
    const panelHalf = panelH / 2;

    // Panel background
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x060312, 0.96);
    panelBg.fillRoundedRect(-panelW / 2, -panelHalf, panelW, panelH, 6);
    panelBg.lineStyle(1, COLORS.UI.GOLD, 0.4);
    panelBg.strokeRoundedRect(-panelW / 2, -panelHalf, panelW, panelH, 6);
    panelBg.lineStyle(0.5, COLORS.UI.GOLD, 0.15);
    panelBg.strokeRoundedRect(-panelW / 2 + 2, -panelHalf + 2, panelW - 4, panelH - 4, 5);
    // Top header strip
    panelBg.fillStyle(COLORS.UI.GOLD, 0.08);
    panelBg.fillRoundedRect(-panelW / 2, -panelHalf, panelW, 22, { tl: 6, tr: 6, bl: 0, br: 0 });
    this.skillPanel.add(panelBg);

    const title = this.add.text(0, -panelHalf + 11, i18n.t('battle.selectSkill'),
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);
    this.skillPanel.add(title);

    if (skills.length === 0) {
      const noSkill = this.add.text(0, 10, i18n.t('battle.noSkills'),
        DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
      ).setOrigin(0.5);
      this.skillPanel.add(noSkill);
    } else {
      skills.slice(0, 5).forEach((skill, i) => {
        const sy = -panelHalf + 30 + i * 36;
        const tc = TYPE_COLORS[skill.type] ?? TYPE_COLORS.special;
        const btnW = panelW - 20;
        const btnH = 32;
        const bx = -btnW / 2;

        const skillRow = this.add.container(0, sy);

        // Row background
        const rowBg = this.add.graphics();
        rowBg.fillStyle(tc.bg, 0.9);
        rowBg.fillRoundedRect(bx, 0, btnW, btnH, 3);
        rowBg.lineStyle(0.8, tc.border, 0.5);
        rowBg.strokeRoundedRect(bx, 0, btnW, btnH, 3);
        // Top highlight
        rowBg.fillStyle(0xffffff, 0.05);
        rowBg.fillRoundedRect(bx + 1, 1, btnW - 2, 8, { tl: 3, tr: 3, bl: 0, br: 0 });

        // Type badge (left circle)
        const badgeBg = this.add.graphics();
        badgeBg.fillStyle(tc.border, 0.25);
        badgeBg.fillCircle(bx + 16, btnH / 2, 11);
        badgeBg.lineStyle(0.5, tc.border, 0.6);
        badgeBg.strokeCircle(bx + 16, btnH / 2, 11);

        const badgeTxt = this.add.text(bx + 16, btnH / 2, skill.icon, {
          fontSize: '10px', fontFamily: 'serif',
        }).setOrigin(0.5);

        // Skill name
        const nameTxt = this.add.text(bx + 32, btnH / 2 - 4,
          ko ? skill.nameKo : skill.nameEn, {
            fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
            color: tc.text,
            fontFamily: DesignSystem.getFontFamily(),
            fontStyle: 'bold',
          }).setOrigin(0, 0.5);

        // Cost indicator (right side)
        const statColorMap: Record<string, string> = {
          faith: '#d4a853', courage: '#cc5555', wisdom: '#5599dd', burden: '#cc8844',
        };
        const costColor = statColorMap[skill.costStat] ?? '#aaaaaa';
        const costTxt = this.add.text(btnW / 2 - 4, btnH / 2, `-${skill.cost}`, {
          fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
          color: costColor,
          fontFamily: DesignSystem.getFontFamily(),
        }).setOrigin(1, 0.5);

        // Hit area
        const hit = this.add.rectangle(0, btnH / 2, btnW, btnH, 0, 0)
          .setInteractive({ useHandCursor: true });
        hit.on('pointerover', () => {
          rowBg.clear();
          rowBg.fillStyle(tc.bg + 0x101010, 0.98);
          rowBg.fillRoundedRect(bx, 0, btnW, btnH, 3);
          rowBg.lineStyle(1.5, tc.border, 0.9);
          rowBg.strokeRoundedRect(bx, 0, btnW, btnH, 3);
          rowBg.fillStyle(tc.border, 0.10);
          rowBg.fillRoundedRect(bx, 0, btnW, btnH, 3);
          nameTxt.setColor('#ffffff');
        });
        hit.on('pointerout', () => {
          rowBg.clear();
          rowBg.fillStyle(tc.bg, 0.9);
          rowBg.fillRoundedRect(bx, 0, btnW, btnH, 3);
          rowBg.lineStyle(0.8, tc.border, 0.5);
          rowBg.strokeRoundedRect(bx, 0, btnW, btnH, 3);
          rowBg.fillStyle(0xffffff, 0.05);
          rowBg.fillRoundedRect(bx + 1, 1, btnW - 2, 8, { tl: 3, tr: 3, bl: 0, br: 0 });
          nameTxt.setColor(tc.text);
        });
        hit.on('pointerdown', () => {
          this.tweens.add({ targets: skillRow, scaleX: 0.97, scaleY: 0.97, duration: 60, yoyo: true });
          this.time.delayedCall(70, () => this.onSkill(skill));
        });

        skillRow.add([rowBg, badgeBg, badgeTxt, nameTxt, costTxt, hit]);
        this.skillPanel!.add(skillRow);
      });
    }

    // Close button (bottom)
    const closeBtnY = panelHalf - 14;
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0x3a1818, 0.9);
    closeBg.fillRoundedRect(-35, closeBtnY - 10, 70, 20, 3);
    closeBg.lineStyle(0.5, 0x884444, 0.5);
    closeBg.strokeRoundedRect(-35, closeBtnY - 10, 70, 20, 3);
    const closeTxt = this.add.text(0, closeBtnY, i18n.t('battle.close'), {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`, color: '#cc8888',
      fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5);
    const closeHit = this.add.rectangle(0, closeBtnY, 70, 20, 0, 0).setInteractive({ useHandCursor: true });
    closeHit.on('pointerdown', () => { this.skillPanel?.destroy(true); this.skillPanel = null; });
    this.skillPanel.add([closeBg, closeTxt, closeHit]);

    this.tweens.add({ targets: this.skillPanel, alpha: 1, duration: 150, ease: 'Sine.easeOut' });
  }

  private getAudio() {
    return ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)
      ? ServiceLocator.get<import('../audio/AudioManager').AudioManager>(SERVICE_KEYS.AUDIO_MANAGER)
      : null;
  }

  private async onPray(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.getAudio()?.procedural?.playStatGain();
    await this.animatePlayerAction('🙏');
    const state = this.combatSystem.pray();
    if (state) this.updateDisplay(state);

    this.isAnimating = false;
    if (state?.finished) this.endBattle(state);
  }

  private async onDefend(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.getAudio()?.procedural?.playUIClick();
    await this.animatePlayerAction('🛡');
    const state = this.combatSystem.defend();
    if (state) this.updateDisplay(state);

    this.isAnimating = false;
    if (state?.finished) this.endBattle(state);
  }

  private async onSkill(skill: SkillDef): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.skillPanel?.destroy(true);
    this.skillPanel = null;

    this.getAudio()?.procedural?.playPickup();
    await this.animatePlayerAction(skill.icon);
    const state = this.combatSystem.useSkill(skill.id);
    if (state) this.updateDisplay(state);

    this.isAnimating = false;
    if (state?.finished) this.endBattle(state);
  }

  private onUseItem(): void {
    const ko = this.gameManager.language === 'ko';
    this.eventBus.emit(GameEvent.TOAST_SHOW, {
      text: ko ? '전투 중 아이템 사용은 준비 중입니다' : 'Items in battle coming soon',
      type: 'info',
    });
  }

  private animatePlayerAction(icon: string): Promise<void> {
    return new Promise(resolve => {
      // Lunge player sprite toward enemy
      if (this.playerSprite) {
        this.tweens.add({
          targets: this.playerSprite,
          y: this.playerSprite.y - 12,
          duration: 120,
          ease: 'Back.easeOut',
          yoyo: true,
        });
        this.tweens.add({
          targets: this.playerSprite,
          scaleX: 2.0,
          duration: 80,
          yoyo: true,
        });
      }

      // Icon effect
      const effect = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, icon, {
        fontSize: `${DesignSystem.FONT_SIZE.XL}px`,
      }).setOrigin(0.5).setDepth(300).setAlpha(0);

      this.tweens.add({
        targets: effect,
        alpha: 1,
        y: GAME_HEIGHT / 2 - 10,
        scaleX: 1.4,
        scaleY: 1.4,
        duration: 250,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: effect,
            alpha: 0,
            y: GAME_HEIGHT / 2 - 30,
            duration: 200,
            onComplete: () => { effect.destroy(); resolve(); },
          });
        },
      });

      // Slash arc graphic
      const slash = this.add.graphics().setDepth(299);
      const cx = GAME_WIDTH / 2;
      const cy = GAME_HEIGHT * 0.48 - 10;
      slash.lineStyle(2, 0xffd700, 0.7);
      slash.beginPath();
      slash.arc(cx - 10, cy, 28, -0.6, 0.6);
      slash.strokePath();

      this.tweens.add({
        targets: slash,
        alpha: 0,
        x: 8,
        duration: 300,
        onComplete: () => slash.destroy(),
      });
    });
  }

  private updateDisplay(state: CombatState): void {
    this.playerHpBar.update(state.playerHp / state.playerMaxHp);
    this.enemyHpBar.update(state.enemyHp / state.enemyMaxHp);
    this.playerHpText.setText(`${state.playerHp}/${state.playerMaxHp}`);
    this.enemyHpText.setText(`${state.enemyHp}/${state.enemyMaxHp}`);
    this.updateLog(state);
    this.updateBossTopBar(state);

    // Player hurt reaction — screen shake + red edge pulse for impact
    const lastEntry = state.log[state.log.length - 1];
    if (lastEntry?.type === 'enemy') {
      this.flashSprite(this.playerSprite, 0xff4444);
      DesignSystem.screenShake(this, 0.008, 180);
      DesignSystem.screenFlash(this, 0x880000, 0.28, 350);
      DesignSystem.edgePulse(this, 0xff2200, 0.35, 600);
    }
    // Enemy hurt reaction — brief white flash + particle burst at enemy
    if (lastEntry?.type === 'player') {
      this.flashSprite(this.enemySprite, 0xffffff);
      DesignSystem.screenShake(this, 0.004, 100);
      const enemy = ENEMIES[this.enemyId];
      if (enemy) {
        DesignSystem.particleBurst(this, GAME_WIDTH / 2, 60, enemy.iconColor, 6, { speed: 20, size: 2, depth: 250 });
      }
    }
    // Heal reaction — green flash
    if (lastEntry?.type === 'heal') {
      DesignSystem.screenFlash(this, 0x00aa44, 0.18, 400);
    }

    // Low HP camera shake escalation
    const hpRatio = state.enemyHp / state.enemyMaxHp;
    if (hpRatio < 0.3) {
      DesignSystem.screenShake(this, 0.003, 80);
    }

    // Boss phase transitions
    this.checkBossPhase(state);
  }

  private flashSprite(sprite: Phaser.GameObjects.Sprite | null, color: number): void {
    if (!sprite) return;
    sprite.setTint(color);
    this.time.delayedCall(120, () => sprite.clearTint());
  }

  private checkBossPhase(state: CombatState): void {
    if (this.bossPhaseDialogues.length === 0) return;
    const hpRatio = state.enemyHp / state.enemyMaxHp;

    for (let p = this.bossPhase; p < this.bossPhaseThresholds.length; p++) {
      if (hpRatio <= this.bossPhaseThresholds[p]) {
        this.bossPhase = p + 1;
        this.triggerBossPhase(p);
        break;
      }
    }
  }

  private triggerBossPhase(phaseIndex: number): void {
    const lines = this.bossPhaseDialogues[phaseIndex];
    if (!lines || lines.length === 0) return;
    const line = lines[0];

    // Boss phase audio warning
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER).ambient.playBossWarning();
    }

    // Screen shake + red flash
    this.cameras.main.shake(300, 0.015);
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x440000, 0.4)
      .setDepth(400);
    this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });

    // Boss escalation: grow enemy container
    this.tweens.add({
      targets: this.enemyContainer,
      scaleX: 1 + phaseIndex * 0.08,
      scaleY: 1 + phaseIndex * 0.08,
      duration: 400,
      ease: 'Back.easeOut',
    });

    // Boss speech bubble
    const bubble = this.add.container(GAME_WIDTH / 2, 20).setDepth(400).setAlpha(0);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0808, 0.92);
    bg.fillRoundedRect(-160, 0, 320, 36, 5);
    bg.lineStyle(1, 0xff4444, 0.6);
    bg.strokeRoundedRect(-160, 0, 320, 36, 5);
    const speechText = this.add.text(0, 18, line, {
      fontSize: `${DesignSystem.FONT_SIZE.SM}px`,
      color: '#ff8888',
      fontFamily: DesignSystem.getFontFamily(),
      wordWrap: { width: 300 },
      align: 'center',
    }).setOrigin(0.5);
    bubble.add([bg, speechText]);

    this.tweens.add({
      targets: bubble, alpha: 1, duration: 300,
      onComplete: () => {
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: bubble, alpha: 0, duration: 400,
            onComplete: () => bubble.destroy(true),
          });
        });
      },
    });
  }

  private async endBattle(state: CombatState): Promise<void> {
    const i18n = this.gameManager.i18n;

    await new Promise<void>(resolve => this.time.delayedCall(600, resolve));

    if (state.victory) {
      this.getAudio()?.procedural?.playChapterComplete();

      // Enemy dissolve effect
      if (this.enemyContainer) {
        this.tweens.add({
          targets: this.enemyContainer,
          alpha: 0,
          scaleX: 0.3,
          scaleY: 0.3,
          y: this.enemyContainer.y - 20,
          duration: 600,
          ease: 'Sine.easeIn',
        });
        // Burst particles at enemy position
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const dot = this.add.circle(
            this.enemyContainer.x + Math.cos(angle) * 10,
            this.enemyContainer.y + Math.sin(angle) * 10,
            2, 0xffd700, 0.8,
          ).setDepth(350);
          this.tweens.add({
            targets: dot,
            x: dot.x + Math.cos(angle) * 30,
            y: dot.y + Math.sin(angle) * 30,
            alpha: 0,
            duration: 500,
            onComplete: () => dot.destroy(),
          });
        }
      }

      await new Promise<void>(resolve => this.time.delayedCall(500, resolve));

      // Celebrate player sprite
      if (this.playerSprite) {
        this.tweens.add({
          targets: this.playerSprite,
          y: this.playerSprite.y - 10,
          duration: 150,
          ease: 'Sine.easeOut',
          yoyo: true,
          repeat: 2,
        });
      }

      const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
        `✝ ${i18n.t('battle.victory')}`,
        DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XXL),
      ).setOrigin(0.5).setDepth(500).setAlpha(0);

      this.tweens.add({
        targets: victoryText, alpha: 1, scaleX: 1.2, scaleY: 1.2,
        duration: 500, ease: 'Back.easeOut',
      });

      // Phase 6B: floating stat gain text
      const ko = this.gameManager.language === 'ko';
      const statGains = [
        { label: ko ? '+5 믿음' : '+5 Faith', color: 0xd4a853, delay: 600 },
        { label: ko ? '+3 용기' : '+3 Courage', color: 0x88aaff, delay: 900 },
      ];
      statGains.forEach(sg => {
        this.time.delayedCall(sg.delay, () => {
          const floatTxt = this.add.text(
            GAME_WIDTH / 2 + (Math.random() - 0.5) * 60,
            GAME_HEIGHT / 2 + 10,
            sg.label,
            { fontSize: `${DesignSystem.FONT_SIZE.SM}px`, color: '#' + sg.color.toString(16).padStart(6, '0'),
              fontFamily: DesignSystem.getFontFamily(), fontStyle: 'bold' },
          ).setOrigin(0.5).setDepth(501).setAlpha(0);
          this.tweens.add({
            targets: floatTxt, alpha: 1, y: floatTxt.y - 24,
            duration: 800, ease: 'Sine.easeOut',
            onComplete: () => this.tweens.add({
              targets: floatTxt, alpha: 0, duration: 400,
              onComplete: () => floatTxt.destroy(),
            }),
          });
        });
      });

      // Phase 6B: fanfare chord via Web Audio
      this.playVictoryFanfare();

      // Gold sparkle ring
      const sparkRing = this.add.graphics().setDepth(499);
      this.tweens.add({
        targets: { t: 0 },
        t: 1,
        duration: 800,
        onUpdate: (tween) => {
          sparkRing.clear();
          const t2 = tween.getValue() ?? 0;
          sparkRing.lineStyle(1.5, 0xffd700, (1 - t2) * 0.5);
          sparkRing.strokeCircle(GAME_WIDTH / 2, GAME_HEIGHT / 2, t2 * 60);
        },
        onComplete: () => sparkRing.destroy(),
      });
    } else {
      this.getAudio()?.procedural?.playStatLoss();

      // White flash — grace
      const graceFlash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0.7)
        .setDepth(490);
      this.tweens.add({
        targets: graceFlash, alpha: 0, duration: 1200,
        onComplete: () => graceFlash.destroy(),
      });

      const graceText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
        i18n.t('battle.graceLift'),
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.LG, '#aaaaff'),
      ).setOrigin(0.5).setDepth(500).setAlpha(0);

      this.tweens.add({ targets: graceText, alpha: 1, duration: 800 });
    }

    this.time.delayedCall(2000, async () => {
      await DesignSystem.fadeOut(this, 500);
      this.eventBus.emit(GameEvent.BATTLE_END, {
        victory: state.victory,
        enemyId: this.enemyId,
        turnsUsed: state.turn,
      });
      this.scene.stop();
    });
  }

  private onPlayerDamaged = () => {
    this.cameras.main.shake(150, 0.01);
    this.tweens.add({
      targets: this.playerContainer,
      x: this.playerContainer.x + 3, duration: 50,
      yoyo: true, repeat: 2,
    });
  };

  private onEnemyDamaged = () => {
    this.tweens.add({
      targets: this.enemyContainer,
      x: this.enemyContainer.x + 4, duration: 60,
      yoyo: true, repeat: 1,
    });
  };

  private playVictoryFanfare(): void {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + i * 0.12 + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.7);
      });
    } catch (_e) {
      // Web Audio not available — silent fallback
    }
  }

  private setupBattleEvents(): void {
    this.eventBus.on(GameEvent.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.on(GameEvent.ENEMY_DAMAGED, this.onEnemyDamaged);

    this.events.on('shutdown', () => this.cleanupEvents());
    this.events.on('destroy', () => this.cleanupEvents());
  }

  private cleanupEvents(): void {
    this.eventBus.off(GameEvent.PLAYER_DAMAGED, this.onPlayerDamaged);
    this.eventBus.off(GameEvent.ENEMY_DAMAGED, this.onEnemyDamaged);
    this.battleAuraGraphics?.destroy();
    this.battleAuraGraphics = null;
  }
}
