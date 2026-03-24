import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS, CAMERA } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState, StatChangePayload } from '../core/GameEvents';
import { InputManager } from '../input/InputManager';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { InteractionZone } from '../entities/InteractionZone';
import { TileMapManager } from '../world/TileMapManager';
import { ChapterManager } from '../world/ChapterManager';
import { InkService } from '../narrative/InkService';
import { DialogueManager } from '../narrative/DialogueManager';
import { NarrativeDirector } from '../narrative/NarrativeDirector';
import { HUD } from '../ui/HUD';
import { DialogueBox } from '../ui/DialogueBox';
import { Toast } from '../ui/Toast';
import { TransitionOverlay } from '../ui/TransitionOverlay';
import { MobileControls } from '../ui/MobileControls';
import { ResponsiveManager } from '../ui/ResponsiveManager';
import { DesignSystem } from '../ui/DesignSystem';
import { InventoryPanel } from '../ui/InventoryPanel';
import { TutorialSystem } from '../ui/TutorialSystem';
import { TutorialOverlay } from '../ui/TutorialOverlay';
import { MiniMap } from '../ui/MiniMap';
import { ItemSystem } from '../systems/ItemSystem';
import { CHAPTER_ITEMS } from '../systems/ItemData';
import { MapEvent } from '../world/ChapterData';
import { ScreenShake } from '../fx/ScreenShake';
import { ParticleManager } from '../fx/ParticleManager';
import { MenuScene } from './MenuScene';
import { FALLBACK_DIALOGUES, Conversation, ConvLine } from '../narrative/data/fallbackDialogues';
import { CHAPTER_VERSES } from '../narrative/data/bibleVerses';
import { StatsManager } from '../core/StatsManager';

export class GameScene extends Phaser.Scene {
  private inputManager!: InputManager;
  private tileMapManager!: TileMapManager;
  private chapterManager!: ChapterManager;
  private inkService!: InkService;
  private dialogueManager!: DialogueManager;
  private narrativeDirector!: NarrativeDirector;

  private player!: Player;
  private npcs: NPC[] = [];
  private interactionZone!: InteractionZone;

  private hud!: HUD;
  private dialogueBox!: DialogueBox;
  private toast!: Toast;
  private transitionOverlay!: TransitionOverlay;
  private mobileControls: MobileControls | null = null;
  private inventoryPanel!: InventoryPanel;
  private tutorialSystem!: TutorialSystem;
  private miniMap!: MiniMap;
  private pauseBtn: Phaser.GameObjects.Container | null = null;

  private eventBus!: EventBus;
  private gameManager!: GameManager;
  private itemSystem!: ItemSystem;

  private screenShake!: ScreenShake;
  private particleManager!: ParticleManager;

  private pauseMenuCleanup: (() => void) | null = null;
  private locationTitle: Phaser.GameObjects.Container | null = null;
  private fallbackInteractionCount: Record<string, number> = {};
  private ambientParticles: Phaser.GameObjects.Graphics | null = null;
  private ambientData: { x: number; y: number; vy: number; a: number; s: number; color: number }[] = [];
  private triggeredEvents = new Set<string>();
  private itemSprites: Phaser.GameObjects.Container[] = [];
  private camLookX = 0;
  private camLookY = 0;
  private vignetteOverlay: Phaser.GameObjects.Graphics | null = null;
  private faithVignette: Phaser.GameObjects.Graphics | null = null;

  constructor() {
    super({ key: SCENE_KEYS.GAME });
  }

  create(): void {
    this.eventBus = EventBus.getInstance();
    this.gameManager = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    this.cameras.main.setDeadzone(CAMERA.DEADZONE_X, CAMERA.DEADZONE_Y);

    this.inputManager = new InputManager(this);
    ServiceLocator.register(SERVICE_KEYS.INPUT_MANAGER, this.inputManager);

    this.itemSystem = new ItemSystem();
    ServiceLocator.register(SERVICE_KEYS.ITEM_SYSTEM, this.itemSystem);

    this.tileMapManager = new TileMapManager(this);
    this.chapterManager = new ChapterManager(this, this.tileMapManager);

    this.inkService = new InkService(this);
    ServiceLocator.register(SERVICE_KEYS.INK_SERVICE, this.inkService);

    this.dialogueManager = new DialogueManager(this.inkService, this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.DIALOGUE_MANAGER, this.dialogueManager);

    this.narrativeDirector = new NarrativeDirector(this);

    this.screenShake = new ScreenShake(this);
    this.particleManager = new ParticleManager(this);

    const chapterConfig = this.chapterManager.loadChapter(this.gameManager.currentChapter);

    this.player = new Player(this, chapterConfig.spawn.x, chapterConfig.spawn.y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(CAMERA.ZOOM_DEFAULT);

    const colliders = this.tileMapManager.getColliders();
    if (colliders) {
      this.physics.add.collider(this.player.sprite, colliders);
    }

    this.npcs = this.chapterManager.spawnNPCs();
    this.interactionZone = new InteractionZone(this, this.player, this.npcs);

    this.hud = new HUD(this);

    // Show tutorial on first play
    const saveKey = 'pp_tutorial_done';
    if (!localStorage.getItem(saveKey)) {
      new TutorialOverlay(this, () => {
        localStorage.setItem(saveKey, '1');
      });
    }

    this.dialogueBox = new DialogueBox(this);
    this.toast = new Toast(this);
    this.transitionOverlay = new TransitionOverlay(this);
    this.inventoryPanel = new InventoryPanel(this, this.itemSystem);
    this.tutorialSystem = new TutorialSystem(this);
    this.miniMap = new MiniMap(this);
    this.miniMap.setChapter(chapterConfig);

    this.createPauseButton();
    this.createAmbientParticles(chapterConfig.mapWidth, chapterConfig.mapHeight, chapterConfig.theme.ambientParticleColor, chapterConfig.theme.ambientCount);
    this.spawnChapterItems(this.gameManager.currentChapter);

    const responsive = ServiceLocator.get<ResponsiveManager>(SERVICE_KEYS.RESPONSIVE_MANAGER);
    if (responsive.isTouchDevice) {
      this.mobileControls = new MobileControls(this);
      this.mobileControls.showControls();
    }

    this.setupEvents();
    this.setupKeyboardShortcuts();

    const locName = this.chapterManager.getLocationName?.()
      ?? chapterConfig.locationName
      ?? `Chapter ${this.gameManager.currentChapter}`;
    this.showLocationTitle(locName);

    this.gameManager.changeState(GameState.GAME);
    DesignSystem.fadeIn(this, 600);

    this.tutorialSystem.showForChapter(this.gameManager.currentChapter);
  }

  private createAmbientParticles(mapW: number, mapH: number, color: number, count: number): void {
    this.ambientParticles = this.add.graphics().setDepth(3);
    for (let i = 0; i < count; i++) {
      this.ambientData.push({
        x: Math.random() * mapW,
        y: Math.random() * mapH,
        vy: -(0.05 + Math.random() * 0.15),
        a: 0.04 + Math.random() * 0.08,
        s: 0.5 + Math.random() * 1,
        color,
      });
    }
  }

  private spawnChapterItems(chapter: number): void {
    const items = CHAPTER_ITEMS[chapter];
    if (!items) return;

    items.forEach(itemEntry => {
      if (this.itemSystem.hasItem(itemEntry.itemId)) return;

      const c = this.add.container(itemEntry.x, itemEntry.y).setDepth(8);

      const glow = this.add.graphics();
      glow.fillStyle(0xd4a853, 0.1);
      glow.fillCircle(0, 0, 10);

      const icon = this.add.text(0, 0,
        this.itemSystem.getItemDef(itemEntry.itemId)?.icon ?? '?',
        { fontSize: '12px' },
      ).setOrigin(0.5);

      c.add([glow, icon]);

      this.tweens.add({
        targets: c, y: itemEntry.y - 3, duration: 1500,
        yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
      });

      const hitZone = this.add.circle(itemEntry.x, itemEntry.y, 12, 0, 0);
      this.physics.add.existing(hitZone, true);

      this.physics.add.overlap(this.player.sprite, hitZone, () => {
        if (this.itemSystem.addItem(itemEntry.itemId)) {
          const def = this.itemSystem.getItemDef(itemEntry.itemId);
          const ko = this.gameManager.language === 'ko';
          this.eventBus.emit(GameEvent.TOAST_SHOW, {
            text: `${def?.icon ?? '?'} ${ko ? def?.nameKo : def?.nameEn}`,
            type: 'achievement',
            duration: 2500,
          });
          this.particleManager.emit('holy_light', itemEntry.x, itemEntry.y, 8);
          c.destroy(true);
          hitZone.destroy();
          this.tutorialSystem.showById('item_pickup');
        }
      });

      this.itemSprites.push(c);
    });
  }

  private createPauseButton(): void {
    const c = this.add.container(GAME_WIDTH - 18, 10).setDepth(200).setScrollFactor(0);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1428, 0.5);
    bg.fillRoundedRect(-12, -8, 24, 16, 3);
    bg.lineStyle(0.5, 0xd4a853, 0.15);
    bg.strokeRoundedRect(-12, -8, 24, 16, 3);
    const txt = this.add.text(0, 0, '❚❚',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);
    c.add([bg, txt]);
    const hit = this.add.rectangle(0, 0, 28, 22, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.openPauseMenu());
    c.add(hit);
    this.pauseBtn = c;
  }

  private setupKeyboardShortcuts(): void {
    this.input.keyboard?.on('keydown-ESC', () => {
      if (this.gameManager.isState(GameState.INVENTORY)) {
        this.inventoryPanel.close();
        return;
      }
      if (this.gameManager.isState(GameState.DIALOGUE)) return;
      if (this.gameManager.isState(GameState.PAUSE)) {
        this.closePauseMenu();
        return;
      }
      this.openPauseMenu();
    });

    this.input.keyboard?.on('keydown-I', () => {
      if (this.gameManager.isState(GameState.DIALOGUE) || this.gameManager.isState(GameState.PAUSE)) return;
      this.inventoryPanel.toggle();
      this.tutorialSystem.showById('inventory');
    });

    this.input.keyboard?.on('keydown-M', () => {
      this.miniMap.toggle();
    });
  }

  private openPauseMenu(): void {
    if (this.gameManager.isState(GameState.PAUSE)) return;
    this.gameManager.changeState(GameState.PAUSE);

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0,
    ).setDepth(500).setScrollFactor(0);
    this.tweens.add({ targets: overlay, alpha: 0.55, duration: 200 });

    const panel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(501).setScrollFactor(0);
    const bg = DesignSystem.createPanel(this, -110, -80, 220, 200);

    const ko = this.gameManager.language === 'ko';
    const title = this.add.text(0, -58, ko ? '일시정지' : 'Paused',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    line.lineBetween(-60, -42, 60, -42);

    panel.add([bg, title, line]);

    const buttons: Phaser.GameObjects.Container[] = [];
    const cleanup = () => {
      overlay.destroy();
      panel.destroy();
      buttons.forEach(b => b.destroy());
      this.pauseMenuCleanup = null;
    };
    this.pauseMenuCleanup = cleanup;

    buttons.push(DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, 170, 28,
      ko ? '계속하기' : 'Resume', () => {
        cleanup();
        this.gameManager.changeState(GameState.GAME);
      }, { fontSize: DesignSystem.FONT_SIZE.SM, bgColor: 0x2a4a2a, hoverColor: 0x3a6a3a },
    ).setDepth(502).setScrollFactor(0));

    buttons.push(DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 170, 28,
      ko ? '설정' : 'Settings', () => {
        cleanup();
        this.scene.pause();
        this.scene.launch('SettingsScene', { from: 'GameScene' });
      }, { fontSize: DesignSystem.FONT_SIZE.SM },
    ).setDepth(502).setScrollFactor(0));

    buttons.push(DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 170, 28,
      ko ? '전체화면' : 'Fullscreen', () => {
        MenuScene.toggleFullscreen();
      }, { fontSize: DesignSystem.FONT_SIZE.SM },
    ).setDepth(502).setScrollFactor(0));

    buttons.push(DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 84, 170, 28,
      ko ? '메인메뉴' : 'Quit to Menu', async () => {
        cleanup();
        await DesignSystem.fadeOut(this, 400);
        this.shutdown();
        this.scene.start(SCENE_KEYS.MENU);
      }, { fontSize: DesignSystem.FONT_SIZE.SM, bgColor: 0x3a1a1a, hoverColor: 0x5a2a2a },
    ).setDepth(502).setScrollFactor(0));
  }

  private closePauseMenu(): void {
    if (!this.gameManager.isState(GameState.PAUSE)) return;
    this.pauseMenuCleanup?.();
    this.gameManager.changeState(GameState.GAME);
  }

  private onNpcInteract = (npcId: string) => {
    const npc = this.npcs.find(n => n.npcId === npcId);
    if (npc) {
      this.particleManager.emit('light', npc.sprite.x, npc.sprite.y - 8, 4);
    }
    this.startDialogue(npcId);
  };

  private onStatChanged = (payload: StatChangePayload | undefined) => {
    if (!payload) return;
    if (payload.amount === 0) return;
    const isPositive = payload.amount > 0;
    const ko = this.gameManager.language === 'ko';
    const statLabel = ko
      ? DesignSystem.STAT_LABELS_KO[payload.stat]
      : DesignSystem.STAT_LABELS_EN[payload.stat];
    const sign = isPositive ? '+' : '';
    this.eventBus.emit(GameEvent.TOAST_SHOW, {
      text: `${statLabel} ${sign}${payload.amount}`,
      type: isPositive ? 'stat-positive' : 'stat-negative',
      statColor: DesignSystem.STAT_COLORS[payload.stat],
      duration: 1500,
    });
    this.spawnStatFloat(statLabel, payload.amount, DesignSystem.STAT_COLORS[payload.stat]);
  };

  private spawnStatFloat(label: string, amount: number, color: number): void {
    if (!this.player) return;
    const sign = amount > 0 ? '+' : '';
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 14;
    const txt = this.add.text(px, py, `${sign}${amount} ${label}`, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '5px',
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(50);

    this.tweens.add({
      targets: txt,
      y: py - 20,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  private showDialogueVignette(): void {
    if (this.vignetteOverlay) return;
    const g = this.add.graphics().setDepth(95).setScrollFactor(0).setAlpha(0);
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const edgeW = Math.round(W * 0.22);
    const edgeH = Math.round(H * 0.22);
    // Dark edges (4 gradient-like strips)
    for (let i = 0; i < edgeW; i++) {
      const a = ((edgeW - i) / edgeW) * 0.55;
      g.fillStyle(0x000000, a);
      g.fillRect(i, 0, 1, H);
      g.fillRect(W - 1 - i, 0, 1, H);
    }
    for (let j = 0; j < edgeH; j++) {
      const a = ((edgeH - j) / edgeH) * 0.55;
      g.fillStyle(0x000000, a);
      g.fillRect(0, j, W, 1);
      g.fillRect(0, H - 1 - j, W, 1);
    }
    this.vignetteOverlay = g;
    this.tweens.add({ targets: g, alpha: 1, duration: 350 });
  }

  private hideDialogueVignette(): void {
    if (!this.vignetteOverlay) return;
    const g = this.vignetteOverlay;
    this.vignetteOverlay = null;
    this.tweens.add({
      targets: g, alpha: 0, duration: 300,
      onComplete: () => g.destroy(),
    });
  }

  private updateFaithVignette(): void {
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const faith = sm.get('faith');
    if (faith <= 10) {
      if (!this.faithVignette) {
        const g = this.add.graphics().setDepth(94).setScrollFactor(0).setAlpha(0);
        const W = GAME_WIDTH;
        const H = GAME_HEIGHT;
        const edge = 40;
        for (let i = 0; i < edge; i++) {
          const a = ((edge - i) / edge) * 0.45;
          g.fillStyle(0x8b0000, a);
          g.fillRect(i, 0, 1, H);
          g.fillRect(W - 1 - i, 0, 1, H);
          g.fillRect(0, i, W, 1);
          g.fillRect(0, H - 1 - i, W, 1);
        }
        this.faithVignette = g;
        this.tweens.add({ targets: g, alpha: 1, duration: 600 });
      } else {
        // Pulse the faith vignette
        const t = this.time.now * 0.002;
        this.faithVignette.setAlpha(0.6 + Math.sin(t) * 0.4);
      }
    } else if (this.faithVignette) {
      const g = this.faithVignette;
      this.faithVignette = null;
      this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    }
  }

  private onBibleCard = (cardId: string) => {
    this.eventBus.emit(GameEvent.TOAST_SHOW, {
      text: `✝ ${cardId}`, type: 'card', duration: 3000,
    });
  };

  private onChapterEnter = (chapter: number) => {
    this.transitionToChapter(chapter);
  };

  private onDialogueEnd = () => {
    this.player?.exitInteract();
    this.hideDialogueVignette();
    this.tweens.add({
      targets: this.cameras.main,
      zoom: CAMERA.ZOOM_DEFAULT,
      duration: 400,
      ease: 'Sine.easeOut',
    });
  };

  private onBattleEnd = () => {
    this.gameManager.changeState(GameState.GAME);
  };

  private setupEvents(): void {
    this.eventBus.on('npc_interact', this.onNpcInteract);
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.BIBLE_CARD_COLLECTED, this.onBibleCard);
    this.eventBus.on(GameEvent.CHAPTER_ENTER, this.onChapterEnter);
    this.eventBus.on(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    this.eventBus.on(GameEvent.BATTLE_END, this.onBattleEnd);
  }

  private cleanupEvents(): void {
    this.eventBus.off('npc_interact', this.onNpcInteract);
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.BIBLE_CARD_COLLECTED, this.onBibleCard);
    this.eventBus.off(GameEvent.CHAPTER_ENTER, this.onChapterEnter);
    this.eventBus.off(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    this.eventBus.off(GameEvent.BATTLE_END, this.onBattleEnd);
  }

  private startDialogue(npcId: string): void {
    if (this.gameManager.isState(GameState.DIALOGUE)) return;

    const storyKey = `ch0${this.gameManager.currentChapter}`;
    const data = this.cache.json.get(`${storyKey}_ink`);

    if (data) {
      try {
        this.inkService.loadStory(data as Record<string, never>);
        this.dialogueManager.start(npcId);
        return;
      } catch { /* fallback */ }
    }

    this.showFallbackDialogue(npcId);
  }

  private showFallbackDialogue(npcId: string): void {
    const npc = this.npcs.find(n => n.npcId === npcId);
    if (!npc) return;

    const ko = this.gameManager.language === 'ko';
    const name = ko ? npc.nameKo : npc.nameEn;

    const langConv = FALLBACK_DIALOGUES[npcId];
    if (!langConv) {
      // Unknown NPC — minimal dialogue
      this.runConversation(name, { lines: [{ text: '...', emotion: 'neutral' }] });
      return;
    }

    const count = this.fallbackInteractionCount[npcId] ?? 0;
    this.fallbackInteractionCount[npcId] = count + 1;

    const conv = ko ? langConv.ko : langConv.en;

    // On repeat interactions, show shortened 'repeated' lines if available
    if (count > 0 && conv.repeated && conv.repeated.length > 0) {
      this.runConversation(name, { lines: conv.repeated });
    } else {
      this.runConversation(name, conv);
    }
  }

  /**
   * Runs a full multi-line conversation with optional choice branches.
   * Properly handles advance (DIALOGUE_CHOICE_SELECTED -1) and choice selection.
   */
  private runConversation(defaultSpeaker: string, conv: Conversation): void {
    this.gameManager.changeState(GameState.DIALOGUE);
    this.showDialogueVignette();
    this.tweens.add({
      targets: this.cameras.main,
      zoom: CAMERA.ZOOM_DIALOGUE,
      duration: 400,
      ease: 'Sine.easeOut',
    });
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    let lineQueue: ConvLine[] = [...conv.lines];
    let choicePhase = false;

    const applyLine = (line: ConvLine) => {
      if (line.stat && line.amount !== undefined) {
        sm.change(line.stat, line.amount);
      }
      this.eventBus.emit(GameEvent.DIALOGUE_LINE, {
        text: line.text,
        speaker: line.speaker ?? defaultSpeaker,
        emotion: line.emotion ?? 'neutral',
        tags: [],
      });
    };

    const end = () => {
      this.eventBus.off(GameEvent.DIALOGUE_CHOICE_SELECTED, onChoice);
      this.eventBus.emit(GameEvent.DIALOGUE_END);
    };

    const showNextOrEnd = () => {
      if (lineQueue.length > 0) {
        choicePhase = false;
        applyLine(lineQueue.shift()!);
      } else if (!choicePhase && conv.choices && conv.choices.length > 0) {
        choicePhase = true;
        this.eventBus.emit(GameEvent.DIALOGUE_CHOICE, {
          choices: conv.choices.map((c, i) => ({
            text: c.text,
            index: i,
            isHidden: false,
            requiredStat: c.requires?.stat,
            requiredValue: c.requires?.min,
          })),
        });
      } else {
        end();
      }
    };

    const onChoice = (index: number) => {
      if (index === -1) {
        // Space/click advance — only valid outside choice phase
        if (!choicePhase) showNextOrEnd();
      } else {
        // A choice button was clicked
        const choice = conv.choices?.[index];
        if (!choice) { end(); return; }
        // Block locked choices
        if (choice.requires && sm.get(choice.requires.stat) < choice.requires.min) return;
        if (choice.stat && choice.amount !== undefined) {
          sm.change(choice.stat, choice.amount);
        }
        if (choice.lines && choice.lines.length > 0) {
          choicePhase = false;
          lineQueue = [...choice.lines];
          showNextOrEnd();
        } else {
          end();
        }
      }
    };

    this.eventBus.on(GameEvent.DIALOGUE_CHOICE_SELECTED, onChoice);
    showNextOrEnd();
  }

  private showLocationTitle(name: string): void {
    if (this.locationTitle) this.locationTitle.destroy(true);

    const ko = this.gameManager.language === 'ko';
    const chapter = this.gameManager.currentChapter;
    const verse = CHAPTER_VERSES[chapter];

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10)
      .setDepth(300).setScrollFactor(0).setAlpha(0);

    // Dark panel — Korean needs more height for 11px verse text
    const panelW = GAME_WIDTH - 40;
    const panelH = verse ? (ko ? 76 : 60) : 32;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);

    // Gold lines
    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.4);
    line.lineBetween(-panelW / 2 + 10, -panelH / 2 + 2, panelW / 2 - 10, -panelH / 2 + 2);
    line.lineBetween(-panelW / 2 + 10, panelH / 2 - 2, panelW / 2 - 10, panelH / 2 - 2);

    // Location name
    const nameY = verse ? -panelH / 2 + (ko ? 18 : 14) : 0;
    const text = this.add.text(0, nameY, name,
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);

    container.add([bg, line, text]);

    if (verse) {
      // Chapter number (small) — use language-appropriate font
      const chapLabel = ko ? `제 ${chapter} 장` : `Chapter ${chapter}`;
      const chapFontSize = ko ? DesignSystem.FONT_SIZE.XS : 6;
      const chapText = this.add.text(0, -panelH / 2 + (ko ? 7 : 5), chapLabel, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${chapFontSize}px`,
        color: '#888877',
      }).setOrigin(0.5);

      // Bible verse — use language-appropriate font and size
      const verseText = ko ? verse.ko : verse.en;
      const refText = ko ? verse.refKo : verse.refEn;
      const verseFontSize = ko ? DesignSystem.FONT_SIZE.XS : 6;
      const vt = this.add.text(0, nameY + (ko ? 18 : 16), `"${verseText}"`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${verseFontSize}px`,
        color: '#c8b898',
        wordWrap: { width: panelW - 40 },
        align: 'center',
      }).setOrigin(0.5);
      const rt = this.add.text(0, panelH / 2 - (ko ? 9 : 7), `— ${refText}`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${verseFontSize}px`,
        color: '#888870',
      }).setOrigin(0.5);
      container.add([chapText, vt, rt]);
    }

    this.locationTitle = container;

    this.tweens.add({
      targets: container, alpha: 1, duration: 700,
      hold: 3500, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => { container.destroy(true); this.locationTitle = null; },
    });
  }

  private checkMapEvents(): void {
    const config = this.chapterManager.getCurrentConfig();
    if (!config?.events) return;

    config.events.forEach((event: MapEvent) => {
      if (this.triggeredEvents.has(event.id)) return;

      const px = this.player.sprite.x;
      const py = this.player.sprite.y;
      if (px >= event.x && px <= event.x + event.width &&
          py >= event.y && py <= event.y + event.height) {

        if (event.triggerOnce) this.triggeredEvents.add(event.id);

        switch (event.type) {
          case 'battle':
            this.startBattle(event.data.enemyId as string);
            break;
          case 'cutscene':
            this.eventBus.emit(GameEvent.MAP_EVENT, event);
            break;
        }
      }
    });
  }

  private startBattle(enemyId: string): void {
    this.scene.pause();
    this.scene.launch(SCENE_KEYS.BATTLE, { enemyId });

    const battleEndHandler = () => {
      this.eventBus.off(GameEvent.BATTLE_END, battleEndHandler);
      this.scene.resume();
    };
    this.eventBus.on(GameEvent.BATTLE_END, battleEndHandler);
  }

  private showSaveIndicator(): void {
    const ko = this.gameManager.language === 'ko';
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, ko ? '● 저장됨' : '● Saved',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5).setDepth(400).setScrollFactor(0).setAlpha(0);
    this.tweens.add({
      targets: txt, alpha: 0.8, duration: 300, hold: 1200, yoyo: true,
      ease: 'Sine.easeInOut', onComplete: () => txt.destroy(),
    });
  }

  private async transitionToChapter(chapter: number): Promise<void> {
    await DesignSystem.fadeOut(this, 500);
    this.eventBus.emit(GameEvent.SAVE_GAME);
    this.showSaveIndicator();
    this.gameManager.setChapter(chapter);

    this.npcs.forEach(n => n.destroy());
    this.npcs = [];
    this.itemSprites.forEach(s => s.destroy(true));
    this.itemSprites = [];
    this.triggeredEvents.clear();

    const config = this.chapterManager.loadChapter(chapter);

    const colliders = this.tileMapManager.getColliders();
    if (colliders) {
      this.physics.add.collider(this.player.sprite, colliders);
    }

    this.player.setPosition(config.spawn.x, config.spawn.y);
    this.npcs = this.chapterManager.spawnNPCs();
    this.interactionZone.setNPCs(this.npcs);

    this.ambientData = [];
    this.createAmbientParticles(config.mapWidth, config.mapHeight,
      config.theme.ambientParticleColor, config.theme.ambientCount);
    this.miniMap.setChapter(config);
    this.spawnChapterItems(chapter);
    this.tutorialSystem.showForChapter(chapter);

    const locName = this.chapterManager.getLocationName?.()
      ?? config.locationName
      ?? `Chapter ${chapter}`;
    this.showLocationTitle(locName);
    DesignSystem.fadeIn(this, 600);
  }

  update(_time: number, delta: number): void {
    if (this.gameManager.isState(GameState.PAUSE) ||
        this.gameManager.isState(GameState.INVENTORY)) return;

    this.updateAmbientParticles();

    if (this.gameManager.isState(GameState.DIALOGUE) || this.gameManager.isState(GameState.CUTSCENE)) {
      this.dialogueBox.update();
      return;
    }

    const input = this.inputManager.getInput();

    if (this.mobileControls) {
      const vi = this.mobileControls.virtualInput;
      if (vi.x !== 0 || vi.y !== 0) {
        input.x = vi.x;
        input.y = vi.y;
      }
      if (vi.interact) { input.interact = true; vi.interact = false; }

      if (this.player.nearbyNPC) {
        this.mobileControls.setActionLabel('!');
      } else {
        this.mobileControls.setActionLabel('A');
      }
    }

    this.player.update(input, delta);
    this.updateCameraLookAhead(input.x, input.y, delta);
    this.interactionZone.update();
    this.hud.update();
    this.dialogueBox.update();

    const cam = this.cameras.main;
    const margin = 64;
    const camL = cam.scrollX - margin;
    const camR = cam.scrollX + cam.width + margin;
    const camT = cam.scrollY - margin;
    const camB = cam.scrollY + cam.height + margin;
    this.npcs.forEach(npc => {
      const nx = npc.sprite.x;
      const ny = npc.sprite.y;
      if (nx >= camL && nx <= camR && ny >= camT && ny <= camB) {
        npc.sprite.setVisible(true);
        npc.update();
      } else {
        npc.sprite.setVisible(false);
      }
    });

    this.miniMap.update(this.player.sprite.x, this.player.sprite.y, this.npcs);
    this.particleManager.update(delta);
    this.checkMapEvents();
    this.tutorialSystem.checkStuck(this.player.sprite.x, this.player.sprite.y, delta);
    this.updateFaithVignette();
  }

  private updateCameraLookAhead(inputX: number, inputY: number, delta: number): void {
    const LOOK_DIST = 30;
    const LOOK_SPEED = 3.5;
    const t = 1 - Math.pow(0.01, (LOOK_SPEED * delta) / 1000);
    const targetX = inputX * LOOK_DIST;
    const targetY = inputY * LOOK_DIST;
    this.camLookX += (targetX - this.camLookX) * t;
    this.camLookY += (targetY - this.camLookY) * t;
    this.cameras.main.setFollowOffset(-this.camLookX, -this.camLookY);
  }

  private updateAmbientParticles(): void {
    if (!this.ambientParticles) return;
    this.ambientParticles.clear();
    const cam = this.cameras.main;
    this.ambientData.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(p.y * 0.01) * 0.1;
      if (p.y < cam.scrollY - 20) {
        p.y = cam.scrollY + GAME_HEIGHT + 10;
        p.x = cam.scrollX + Math.random() * GAME_WIDTH;
      }
      if (p.x > cam.scrollX - 10 && p.x < cam.scrollX + GAME_WIDTH + 10 &&
          p.y > cam.scrollY - 10 && p.y < cam.scrollY + GAME_HEIGHT + 10) {
        this.ambientParticles!.fillStyle(p.color, p.a);
        this.ambientParticles!.fillCircle(p.x, p.y, p.s);
      }
    });
  }

  shutdown(): void {
    this.cleanupEvents();
    this.inputManager?.destroy();
    this.hud?.destroy();
    this.dialogueBox?.destroy();
    this.toast?.destroy();
    this.transitionOverlay?.destroy();
    this.mobileControls?.destroy();
    this.narrativeDirector?.destroy();
    this.inventoryPanel?.destroy();
    this.tutorialSystem?.destroy();
    this.miniMap?.destroy();
    this.screenShake?.destroy();
    this.particleManager?.destroy();
    this.pauseBtn?.destroy(true);
    this.ambientParticles?.destroy();
    this.itemSprites.forEach(s => s.destroy(true));
    this.npcs.forEach(n => n.destroy());
    this.player?.destroy();
  }
}
