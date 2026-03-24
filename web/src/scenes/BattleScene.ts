import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';
import { CombatSystem, CombatState } from '../systems/CombatSystem';
import { EnemyDef, ENEMIES, SkillDef } from '../systems/SkillData';

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

  private enemyId = 'doubt';
  private isAnimating = false;

  constructor() {
    super(SCENE_KEYS.BATTLE);
  }

  init(data?: { enemyId?: string }): void {
    this.enemyId = data?.enemyId ?? 'doubt';
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

  private createBattleBackground(): void {
    const bg = this.add.graphics().setDepth(0);

    bg.fillStyle(0x1a0a0a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    for (let i = 0; i < 20; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT * 0.5;
      bg.fillStyle(0xff3300, 0.03 + Math.random() * 0.05);
      bg.fillCircle(x, y, 2 + Math.random() * 8);
    }

    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.15);
    bg.lineBetween(0, GAME_HEIGHT * 0.45, GAME_WIDTH, GAME_HEIGHT * 0.45);
  }

  private createEnemyDisplay(enemy: EnemyDef, state: CombatState): void {
    this.enemyContainer = this.add.container(GAME_WIDTH / 2, 60).setDepth(10);

    const gfx = this.add.graphics();
    gfx.fillStyle(enemy.iconColor, 0.4);
    gfx.fillCircle(0, 0, 30);
    gfx.lineStyle(2, enemy.iconColor, 0.8);
    gfx.strokeCircle(0, 0, 30);

    if (enemy.isBoss) {
      gfx.lineStyle(1, 0xff0000, 0.4);
      gfx.strokeCircle(0, 0, 35);
    }

    gfx.fillStyle(enemy.iconColor, 0.8);
    gfx.fillCircle(0, -5, 8);
    gfx.fillRect(-6, 5, 12, 15);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI - Math.PI / 2;
      gfx.fillStyle(enemy.iconColor, 0.3);
      gfx.fillCircle(Math.cos(angle) * 20, Math.sin(angle) * 20, 4);
    }

    this.enemyContainer.add(gfx);

    const ko = this.gameManager.language === 'ko';
    const nameText = this.add.text(0, -48, ko ? enemy.nameKo : enemy.nameEn,
      DesignSystem.dangerTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);
    this.enemyContainer.add(nameText);

    const hpBar = DesignSystem.createProgressBar(
      this, -50, 38, 100, 6, enemy.iconColor, 0x222222, state.enemyHp / state.enemyMaxHp,
    );
    this.enemyHpBar = hpBar;
    this.enemyContainer.add([hpBar.bg, hpBar.fill]);

    this.enemyHpText = this.add.text(0, 48, `${state.enemyHp}/${state.enemyMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);
    this.enemyContainer.add(this.enemyHpText);

    if (enemy.isBoss) {
      this.tweens.add({
        targets: this.enemyContainer, scaleX: 1.02, scaleY: 1.02,
        duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });
    }
  }

  private createPlayerDisplay(state: CombatState): void {
    this.playerContainer = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 80).setDepth(10);

    const ko = this.gameManager.language === 'ko';
    const label = this.add.text(0, -16, ko ? '크리스천' : 'Christian',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);

    const hpBar = DesignSystem.createProgressBar(
      this, -50, -4, 100, 6, COLORS.STAT.FAITH, 0x222222, state.playerHp / state.playerMaxHp,
    );
    this.playerHpBar = hpBar;

    this.playerHpText = this.add.text(0, 6, `HP: ${state.playerHp}/${state.playerMaxHp}`,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    this.playerContainer.add([label, hpBar.bg, hpBar.fill, this.playerHpText]);
  }

  private createActionMenu(): void {
    this.actionMenu = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 30).setDepth(100);

    const ko = this.gameManager.language === 'ko';
    const actions = [
      { label: ko ? '🙏 기도' : '🙏 Pray', action: () => this.onPray(), color: 0x2a4a2a },
      { label: ko ? '🛡 방어' : '🛡 Defend', action: () => this.onDefend(), color: 0x2a3a5a },
      { label: ko ? '✦ 스킬' : '✦ Skills', action: () => this.showSkillPanel(), color: 0x3a2a5a },
      { label: ko ? '📦 아이템' : '📦 Items', action: () => this.onUseItem(), color: 0x4a3a2a },
    ];

    const btnW = 80;
    const gap = 6;
    const totalW = actions.length * btnW + (actions.length - 1) * gap;
    const startX = -totalW / 2 + btnW / 2;

    actions.forEach((a, i) => {
      const btn = DesignSystem.createButton(
        this, startX + i * (btnW + gap), 0, btnW, 28, a.label, a.action,
        { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: a.color, hoverColor: a.color + 0x111111 },
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

    const ko = this.gameManager.language === 'ko';
    this.skillPanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(200).setAlpha(0);

    const bg = DesignSystem.createPanel(this, -130, -60, 260, 175);
    this.skillPanel.add(bg);

    const title = this.add.text(0, -48, ko ? '스킬 선택' : 'Select Skill',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    ).setOrigin(0.5);
    this.skillPanel.add(title);

    const skills = state.availableSkills;
    if (skills.length === 0) {
      const noSkill = this.add.text(0, 0, ko ? '사용 가능한 스킬 없음' : 'No skills available',
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
      this, 0, 90, 80, 24, ko ? '닫기' : 'Close',
      () => { this.skillPanel?.destroy(true); this.skillPanel = null; },
      { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: 0x3a1a1a },
    );
    this.skillPanel.add(closeBtn);

    this.tweens.add({ targets: this.skillPanel, alpha: 1, duration: 150, ease: 'Sine.easeOut' });
  }

  private async onPray(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

    await this.animatePlayerAction('🙏');
    const state = this.combatSystem.pray();
    if (state) this.updateDisplay(state);

    this.isAnimating = false;

    if (state?.finished) this.endBattle(state);
  }

  private async onDefend(): Promise<void> {
    if (this.isAnimating) return;
    this.isAnimating = true;

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
      const effect = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, icon, {
        fontSize: '24px',
      }).setOrigin(0.5).setDepth(300).setAlpha(0);

      this.tweens.add({
        targets: effect,
        alpha: 1, y: GAME_HEIGHT / 2 - 20, scaleX: 1.5, scaleY: 1.5,
        duration: 300, ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: effect,
            alpha: 0, y: GAME_HEIGHT / 2 - 40,
            duration: 200,
            onComplete: () => { effect.destroy(); resolve(); },
          });
        },
      });
    });
  }

  private updateDisplay(state: CombatState): void {
    this.playerHpBar.update(state.playerHp / state.playerMaxHp);
    this.enemyHpBar.update(state.enemyHp / state.enemyMaxHp);
    this.playerHpText.setText(`HP: ${state.playerHp}/${state.playerMaxHp}`);
    this.enemyHpText.setText(`${state.enemyHp}/${state.enemyMaxHp}`);
    this.updateLog(state);

    if (state.enemyHp < state.enemyMaxHp * 0.3) {
      this.cameras.main.shake(100, 0.005);
    }
  }

  private async endBattle(state: CombatState): Promise<void> {
    const ko = this.gameManager.language === 'ko';

    await new Promise<void>(resolve => this.time.delayedCall(800, resolve));

    if (state.victory) {
      const victoryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
        ko ? '✝ 승리!' : '✝ Victory!',
        DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XXL),
      ).setOrigin(0.5).setDepth(500).setAlpha(0);

      this.tweens.add({
        targets: victoryText, alpha: 1, scaleX: 1.2, scaleY: 1.2,
        duration: 500, ease: 'Back.easeOut',
      });
    } else {
      const graceText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20,
        ko ? '은혜로 다시 일어선다...' : 'Grace lifts you up again...',
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.LG, '#aaaaff'),
      ).setOrigin(0.5).setDepth(500).setAlpha(0);

      this.tweens.add({
        targets: graceText, alpha: 1, duration: 800,
      });
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
  }
}
