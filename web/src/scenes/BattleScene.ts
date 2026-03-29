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
    sky.fillStyle(glowColor, 0.07);
    sky.fillEllipse(W / 2, ground * 0.7, W * 0.85, ground * 0.55);
    sky.fillStyle(glowColor, 0.04);
    sky.fillEllipse(W / 2, ground * 0.85, W * 0.5, ground * 0.3);

    // Stars / supernatural lights
    for (let i = 0; i < 30; i++) {
      const hash = (i * 137 * 31) & 0xffff;
      const starBrightness = this.currentChapter === 12 ? 0.25 : 0.08;
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
    gr.lineStyle(1, dividerColor, 0.35);
    gr.lineBetween(0, ground, W, ground);
    gr.fillStyle(dividerColor, 0.15);
    for (let x = 0; x < W; x += 30) {
      gr.fillRect(x, ground - 0.5, 15, 1);
    }

    // Subtle grid in ground
    gr.lineStyle(0.3, 0x333355, 0.1);
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
      // Procedural silhouette (existing style)
      const gfx = this.add.graphics();
      const baseScale = enemy.isBoss ? 1.4 : 1.0;
      gfx.fillStyle(enemy.iconColor, 0.4);
      gfx.fillCircle(0, 0, 30 * baseScale);
      gfx.lineStyle(2, enemy.iconColor, 0.8);
      gfx.strokeCircle(0, 0, 30 * baseScale);
      if (enemy.isBoss) {
        gfx.lineStyle(1.5, 0xff0000, 0.5);
        gfx.strokeCircle(0, 0, 42);
      }
      gfx.fillStyle(enemy.iconColor, 0.9);
      gfx.fillCircle(0, -6 * baseScale, 9 * baseScale);
      gfx.fillRect(-7 * baseScale, 6 * baseScale, 14 * baseScale, 18 * baseScale);
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI - Math.PI / 2;
        gfx.fillStyle(enemy.iconColor, 0.3);
        gfx.fillCircle(Math.cos(angle) * 22 * baseScale, Math.sin(angle) * 22 * baseScale, 5 * baseScale);
      }
      this.enemyContainer.add(gfx);
    }

    // Battle aura — rotating colored ring animation
    const auraBaseR = enemy.isBoss ? 48 : 34;
    // Static base glow
    const staticAura = this.add.graphics();
    staticAura.fillStyle(enemy.iconColor, 0.07);
    staticAura.fillCircle(0, 0, auraBaseR + 4);
    staticAura.fillStyle(enemy.iconColor, 0.03);
    staticAura.fillCircle(0, 0, auraBaseR + 14);
    this.enemyContainer.addAt(staticAura, 0);

    // Rotating aura ring — draw orbit dots, animate with tween
    this.battleAuraGraphics = this.add.graphics().setDepth(11);
    const auraColor = enemy.iconColor;
    const auraRadius = auraBaseR;
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
    const nameText = this.add.text(0, -52, ko ? enemy.nameKo : enemy.nameEn,
      DesignSystem.dangerTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);
    this.enemyContainer.add(nameText);

    // Boss badge
    if (enemy.isBoss) {
      const bossBadge = this.add.text(0, -64,
        ko ? '【 BOSS 】' : '【 BOSS 】',
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, '#ff4444'),
      ).setOrigin(0.5);
      this.enemyContainer.add(bossBadge);
    }

    // Enemy HP bar — prominent display with label
    const ko2 = this.gameManager.language === 'ko';
    const enemyHpLabel = this.add.text(-55, 38, ko2 ? '생명력' : 'HP',
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, '#ff8888'),
    );
    this.enemyContainer.add(enemyHpLabel);

    const hpBar = DesignSystem.createProgressBar(
      this, -55, 46, 110, 8, enemy.iconColor, 0x1a0a0a, state.enemyHp / state.enemyMaxHp,
    );
    this.enemyHpBar = hpBar;
    this.enemyContainer.add([hpBar.bg, hpBar.fill]);

    this.enemyHpText = this.add.text(55, 46, `${state.enemyHp}/${state.enemyMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(1, 0);
    this.enemyContainer.add(this.enemyHpText);

    if (enemy.isBoss) {
      this.tweens.add({
        targets: this.enemyContainer, scaleX: 1.03, scaleY: 1.03,
        duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
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

  private createPlayerDisplay(state: CombatState): void {
    this.playerContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80).setDepth(10);

    // Player sprite
    const pTexKey = this.textures.exists('christian_gen') ? 'christian_gen' : 'christian';
    this.playerSprite = this.add.sprite(0, -28, pTexKey, 0).setScale(1.8);
    const idleAnim = `${pTexKey}_idle_down`;
    if (this.anims.exists(idleAnim)) this.playerSprite.play(idleAnim, true);
    this.playerContainer.add(this.playerSprite);

    const ko = this.gameManager.language === 'ko';
    const label = this.add.text(0, -2, ko ? '크리스천' : 'Christian',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    // HP label (prominent)
    const hpLabel = this.add.text(-55, 6, ko ? '생명력' : 'HP',
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.XS, '#88ccff'),
    );

    const hpBar = DesignSystem.createProgressBar(
      this, -55, 14, 110, 8, COLORS.STAT.FAITH, 0x1a1a2a, state.playerHp / state.playerMaxHp,
    );
    this.playerHpBar = hpBar;

    this.playerHpText = this.add.text(55, 14, `${state.playerHp}/${state.playerMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(1, 0);

    this.playerContainer.add([label, hpLabel, hpBar.bg, hpBar.fill, this.playerHpText]);
  }

  private createActionMenu(): void {
    // 2×2 grid centered at bottom of screen
    const gridCenterX = GAME_WIDTH / 2;
    const gridCenterY = GAME_HEIGHT - 26;
    this.actionMenu = this.add.container(gridCenterX, gridCenterY).setDepth(100);

    const i18n = this.gameManager.i18n;
    const actions = [
      { label: `🙏 ${i18n.t('battle.pray')}`,   action: () => this.onPray(),        color: 0x1e3a1e },
      { label: `🛡 ${i18n.t('battle.defend')}`,  action: () => this.onDefend(),      color: 0x1e2a4a },
      { label: `✦ ${i18n.t('battle.skill')}`,    action: () => this.showSkillPanel(),color: 0x2a1e4a },
      { label: `📦 ${i18n.t('battle.item')}`,    action: () => this.onUseItem(),     color: 0x3a2a1a },
    ];

    // 2×2 grid layout
    const btnW = 90;
    const btnH = 22;
    const gapX = 6;
    const gapY = 5;
    // positions: [col, row] → offsets from center
    const positions = [
      [-(btnW / 2 + gapX / 2), -(btnH / 2 + gapY / 2)], // top-left
      [ (btnW / 2 + gapX / 2), -(btnH / 2 + gapY / 2)], // top-right
      [-(btnW / 2 + gapX / 2),  (btnH / 2 + gapY / 2)], // bottom-left
      [ (btnW / 2 + gapX / 2),  (btnH / 2 + gapY / 2)], // bottom-right
    ];

    actions.forEach((a, i) => {
      const [px, py] = positions[i];
      const btn = DesignSystem.createButton(
        this, px, py, btnW, btnH, a.label, a.action,
        { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: a.color, hoverColor: a.color + 0x101010 },
      );
      this.actionMenu.add(btn);
    });
  }

  private createLogPanel(state: CombatState): void {
    this.logContainer = this.add.container(10, GAME_HEIGHT * 0.45 + 8).setDepth(50);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0814, 0.6);
    bg.fillRoundedRect(0, 0, GAME_WIDTH - 20, 50, 4);
    this.logContainer.add(bg);

    this.updateLog(state);
  }

  private updateLog(state: CombatState): void {
    this.logContainer.getAll().forEach((obj, i) => {
      if (i > 0) obj.destroy();
    });

    const ko = this.gameManager.language === 'ko';
    const lastEntries = state.log.slice(-3);

    lastEntries.forEach((entry, i) => {
      const color = entry.type === 'player' ? '#88ccff' :
                    entry.type === 'enemy' ? '#ff8888' :
                    entry.type === 'heal' ? '#88ff88' : '#d4a853';
      const text = this.add.text(8, 6 + i * 14, ko ? entry.textKo : entry.textEn,
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

    const bg = DesignSystem.createPanel(this, -130, -60, 260, 175);
    this.skillPanel.add(bg);

    const title = this.add.text(0, -48, i18n.t('battle.selectSkill'),
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);
    this.skillPanel.add(title);

    const skills = state.availableSkills;
    if (skills.length === 0) {
      const noSkill = this.add.text(0, 0, i18n.t('battle.noSkills'),
        DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
      ).setOrigin(0.5);
      this.skillPanel.add(noSkill);
    } else {
      skills.slice(0, 4).forEach((skill, i) => {
        const sy = -24 + i * 28;
        const btn = DesignSystem.createButton(
          this, 0, sy, 220, 24,
          `${skill.icon} ${ko ? skill.nameKo : skill.nameEn}`,
          () => this.onSkill(skill),
          { fontSize: DesignSystem.FONT_SIZE.XS },
        );
        this.skillPanel!.add(btn);
      });
    }

    const closeBtn = DesignSystem.createButton(
      this, 0, 90, 80, 24, i18n.t('battle.close'),
      () => { this.skillPanel?.destroy(true); this.skillPanel = null; },
      { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: 0x3a1a1a },
    );
    this.skillPanel.add(closeBtn);

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
        fontSize: '20px',
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

    // Player hurt reaction
    const lastEntry = state.log[state.log.length - 1];
    if (lastEntry?.type === 'enemy') {
      this.flashSprite(this.playerSprite, 0xff4444);
    }
    // Enemy hurt reaction
    if (lastEntry?.type === 'player') {
      this.flashSprite(this.enemySprite, 0xffffff);
    }

    // Low HP camera shake escalation
    const hpRatio = state.enemyHp / state.enemyMaxHp;
    if (hpRatio < 0.3) {
      this.cameras.main.shake(80, 0.003);
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
    bg.fillRoundedRect(-100, 0, 200, 28, 5);
    bg.lineStyle(1, 0xff4444, 0.6);
    bg.strokeRoundedRect(-100, 0, 200, 28, 5);
    const speechText = this.add.text(0, 14, line, {
      fontSize: '4px',
      color: '#ff8888',
      fontFamily: 'Silkscreen',
      wordWrap: { width: 190 },
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
