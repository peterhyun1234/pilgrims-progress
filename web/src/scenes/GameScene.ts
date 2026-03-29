import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS, CAMERA } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState, StatChangePayload, NpcPhaseChangedPayload } from '../core/GameEvents';
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
import { DebugPanel } from '../ui/DebugPanel';
import { ItemSystem } from '../systems/ItemSystem';
import { NpcStateManager } from '../systems/NpcStateManager';
import { CHAPTER_ITEMS } from '../systems/ItemData';
import { ChapterConfig, MapEvent, MapObject } from '../world/ChapterData';
import { ScreenShake } from '../fx/ScreenShake';
import { ParticleManager } from '../fx/ParticleManager';
import { JuiceEffects } from '../fx/JuiceEffects';
import { LightingManager } from '../fx/LightingManager';
import { TransitionEffects } from '../fx/TransitionEffects';
import { MenuScene } from './MenuScene';
import { FALLBACK_DIALOGUES, Conversation, ConvLine } from '../narrative/data/fallbackDialogues';
import { CHAPTER_VERSES } from '../narrative/data/bibleVerses';
import { StatsManager } from '../core/StatsManager';
import { SaveManager } from '../save/SaveManager';
import { GamePlayState } from '../core/GamePlayState';
import { CutsceneEngine } from './CutsceneEngine';
import { CUTSCENE_REGISTRY } from '../narrative/data/cutsceneDefinitions';
import { EnvironmentAnimations } from '../fx/EnvironmentAnimations';
import { Companion } from '../entities/Companion';
import { AudioManager } from '../audio/AudioManager';

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
  private debugPanel: DebugPanel | null = null;
  private pauseBtn: Phaser.GameObjects.Container | null = null;

  private eventBus!: EventBus;
  private gameManager!: GameManager;
  private itemSystem!: ItemSystem;
  private npcStateManager!: NpcStateManager;
  private gamePlayState!: GamePlayState;

  private screenShake!: ScreenShake;
  private particleManager!: ParticleManager;
  private juiceEffects!: JuiceEffects;
  private lightingManager!: LightingManager;
  private transitionEffects!: TransitionEffects;

  private pauseMenuCleanup: (() => void) | null = null;
  private locationTitle: Phaser.GameObjects.Container | null = null;
  private ambientParticles: Phaser.GameObjects.Graphics | null = null;
  private ambientData: { x: number; y: number; vy: number; a: number; s: number; color: number }[] = [];
  private itemSprites: Phaser.GameObjects.Container[] = [];
  private camLookX = 0;
  private camLookY = 0;
  private vignetteOverlay: Phaser.GameObjects.Graphics | null = null;
  private faithVignette: Phaser.GameObjects.Graphics | null = null;

  /** Chapter-level ambient speed modifier (e.g. mud in Ch2). */
  private chapterSpeedMod = 1.0;
  /** NPC currently in dialogue (used to resume patrol after end). */
  private activeDialogueNpc: NPC | null = null;
  /** Map object containers by objectId. */
  private mapObjectSprites: Record<string, Phaser.GameObjects.Container> = {};
  /** Exit-hint cooldown guard. */
  private exitHintCooldown = 0;
  /** Cutscene engine for key emotional scenes. */
  private cutsceneEngine!: CutsceneEngine;
  private environmentAnimations!: EnvironmentAnimations;
  /** Active companion (Faithful Ch9, Hopeful Ch11+). */
  private companion: Companion | null = null;

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

    // v3: gameplay state store
    this.gamePlayState = new GamePlayState();
    ServiceLocator.register(SERVICE_KEYS.GAMEPLAY_STATE, this.gamePlayState);

    // v3: NPC state manager
    this.npcStateManager = new NpcStateManager(this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.NPC_STATE_MANAGER, this.npcStateManager);

    this.tileMapManager = new TileMapManager(this);
    this.chapterManager = new ChapterManager(this, this.tileMapManager);

    this.inkService = new InkService(this);
    ServiceLocator.register(SERVICE_KEYS.INK_SERVICE, this.inkService);

    this.dialogueManager = new DialogueManager(this.inkService, this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.DIALOGUE_MANAGER, this.dialogueManager);

    this.narrativeDirector = new NarrativeDirector(this);
    ServiceLocator.register(SERVICE_KEYS.NARRATIVE_DIRECTOR, this.narrativeDirector);

    this.cutsceneEngine = new CutsceneEngine(this);
    this.environmentAnimations = new EnvironmentAnimations(this);

    this.screenShake = new ScreenShake(this);
    this.particleManager = new ParticleManager(this);
    this.juiceEffects = new JuiceEffects(this);
    this.lightingManager = new LightingManager(this);
    this.transitionEffects = new TransitionEffects(this);

    // ── Restore state from last save ─────────────────────────────────────
    if (ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) {
      const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      const saved = saveManager.getLastLoaded();
      if (saved) {
        this.npcStateManager.initFromSave(saved.npcStates ?? {}, saved.talkedNpcs ?? {});
        this.inkService.initFromSave(saved.inkState ?? {});
        this.gamePlayState.triggeredEvents = new Set(saved.triggeredEvents ?? []);
        this.gamePlayState.mapState = { ...(saved.mapState ?? {}) };
        this.narrativeDirector.initFiredTriggers(saved.firedTriggers ?? []);
      }
    }

    const chapterConfig = this.chapterManager.loadChapter(this.gameManager.currentChapter);
    this.environmentAnimations.init(chapterConfig);

    // Start chapter-specific ambient soundscape
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audioMgr = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audioMgr.ambient.init(this.gameManager.currentChapter);
      audioMgr.ambient.playChapterStinger(this.gameManager.currentChapter);
    }

    this.player = new Player(this, chapterConfig.spawn.x, chapterConfig.spawn.y);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(CAMERA.ZOOM_DEFAULT);

    // Setup dynamic lighting for this chapter
    this.lightingManager.setChapterLighting(this.gameManager.currentChapter);
    this.lightingManager.addFollowLight('player', this.player.sprite, 60, 0xffd4a0, 0.7);

    const colliders = this.tileMapManager.getColliders();
    if (colliders) {
      this.physics.add.collider(this.player.sprite, colliders);
    }

    this.initChapterNpcs(chapterConfig);
    this.interactionZone = new InteractionZone(this, this.player, this.npcs);

    this.hud = new HUD(this);

    if (!localStorage.getItem('pp_tutorial_done')) {
      new TutorialOverlay(this, () => {
        localStorage.setItem('pp_tutorial_done', '1');
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
    this.createAmbientParticles(chapterConfig);
    this.spawnChapterItems(this.gameManager.currentChapter);
    this.spawnMapObjects(chapterConfig);

    // Apply chapter-level modifiers
    this.applyChapterModifiers(chapterConfig);

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

    this.debugPanel = new DebugPanel(this);
  }

  // ── Chapter NPC management ───────────────────────────────────────────────

  private initChapterNpcs(config: ChapterConfig): void {
    // Register each NPC with the state manager (preserves existing save state)
    config.npcs.forEach(npcConfig => {
      this.npcStateManager.initNpc(npcConfig.id, npcConfig.unlockedAt);
    });

    // Check stat-based unlocks immediately
    this.npcStateManager.checkStatUnlocks();

    this.npcs = this.chapterManager.spawnNPCs();

    // Apply persisted phase visuals
    this.npcs.forEach(npc => {
      const phase = this.npcStateManager.getPhase(npc.npcId);
      npc.setPhase(phase);
    });
  }

  // ── Chapter theming ──────────────────────────────────────────────────────

  private applyChapterModifiers(config: ChapterConfig): void {
    this.chapterSpeedMod = config.theme.playerSpeedMod ?? 1.0;
  }

  // ── Companion ─────────────────────────────────────────────────────────────

  private spawnChapterCompanion(chapter: number, x: number, y: number): void {
    this.companion?.destroy();
    this.companion = null;

    if (chapter === 9) {
      this.companion = Companion.createFaithful(this, x, y);
    } else if (chapter >= 11 && chapter <= 12) {
      this.companion = Companion.createHopeful(this, x, y);
    }
  }

  // ── Map objects ──────────────────────────────────────────────────────────

  private spawnMapObjects(config: ChapterConfig): void {
    if (!config.mapObjects) return;

    config.mapObjects.forEach(obj => {
      const savedState = this.gamePlayState.getObjectState(obj.id);
      const isOpen = savedState?.open ?? obj.open ?? false;

      switch (obj.type) {
        case 'gate':
          this.spawnGate(obj, isOpen);
          break;
        case 'sign':
          this.spawnSign(obj);
          break;
        default:
          break;
      }
    });
  }

  private spawnGate(obj: MapObject, isOpen: boolean): void {
    const c = this.add.container(obj.x, obj.y).setDepth(10);

    const g = this.add.graphics();
    if (!isOpen) {
      g.fillStyle(0x5a5050, 1);
      g.fillRect(-4, -20, 8, 20);
      g.lineStyle(1, 0xd4a853, 0.6);
      g.strokeRect(-4, -20, 8, 20);
    }
    c.add(g);
    this.mapObjectSprites[obj.id] = c;

    // Listen for NPC completion to open gate
    if (obj.opensOnNpcComplete) {
      const targetNpc = obj.opensOnNpcComplete;
      const handler = (payload: NpcPhaseChangedPayload | undefined) => {
        if (!payload || payload.npcId !== targetNpc || payload.phase !== 'completed') return;
        this.openGate(obj.id, c, g);
        this.eventBus.off(GameEvent.NPC_PHASE_CHANGED, handler);
      };
      this.eventBus.on(GameEvent.NPC_PHASE_CHANGED, handler);
    }
  }

  private openGate(objectId: string, container: Phaser.GameObjects.Container, graphics: Phaser.GameObjects.Graphics): void {
    this.cameras.main.shake(300, 0.004);

    this.tweens.add({
      targets: container,
      scaleX: 0,
      duration: 400,
      ease: 'Back.easeIn',
      onComplete: () => {
        graphics.clear();
        container.destroy(true);
        delete this.mapObjectSprites[objectId];
      },
    });

    this.particleManager.emit('holy_light', container.x, container.y, 12);
    this.gamePlayState.setObjectState(objectId, { open: true });
  }

  private spawnSign(obj: MapObject): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const label = (gm.language === 'ko' ? obj.label : obj.labelEn) ?? obj.label ?? '';

    const c = this.add.container(obj.x, obj.y).setDepth(8);
    const pole = this.add.graphics();
    pole.fillStyle(0x8b6a3a, 1);
    pole.fillRect(-1, 0, 2, 12);
    const board = this.add.graphics();
    board.fillStyle(0xd4a853, 0.8);
    board.fillRoundedRect(-20, -14, 40, 12, 2);
    const txt = this.add.text(0, -9, label, {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#1a1428',
      fontFamily: DesignSystem.getFontFamily(),
    }).setOrigin(0.5);
    c.add([pole, board, txt]);
    this.mapObjectSprites[obj.id] = c;
  }

  // ── Ambient particles ────────────────────────────────────────────────────

  private createAmbientParticles(config: ChapterConfig): void {
    const { mapWidth, mapHeight, theme } = config;
    this.ambientParticles = this.add.graphics().setDepth(3);
    for (let i = 0; i < theme.ambientCount; i++) {
      const vy = theme.ambientDirection === 'down'
        ? 0.05 + Math.random() * 0.12    // falls down (ash)
        : -(0.05 + Math.random() * 0.15); // rises up (default)
      this.ambientData.push({
        x: Math.random() * mapWidth,
        y: Math.random() * mapHeight,
        vy,
        a: 0.04 + Math.random() * 0.08,
        s: 0.5 + Math.random() * 1,
        color: theme.ambientParticleColor,
      });
    }
  }

  // ── Item spawning ────────────────────────────────────────────────────────

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

  // ── Pause button & menu ──────────────────────────────────────────────────

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
    this.tweens.add({ targets: overlay, alpha: 0.55, duration: 200, ease: 'Sine.easeOut' });

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

  // ── Dialogue ─────────────────────────────────────────────────────────────

  private onNpcInteract = (npcId: string) => {
    const npc = this.npcs.find(n => n.npcId === npcId);

    // Locked NPCs are not interactable
    const phase = this.npcStateManager.getPhase(npcId);
    if (phase === 'locked') return;

    if (npc) {
      this.particleManager.emit('light', npc.sprite.x, npc.sprite.y - 8, 4);
      npc.pausePatrol();
      this.activeDialogueNpc = npc;
    }
    this.startDialogue(npcId);
  };

  private startDialogue(npcId: string): void {
    if (this.gameManager.isState(GameState.DIALOGUE)) return;

    const phase = this.npcStateManager.getPhase(npcId);

    // Completed/idle NPCs: check cooldown before showing idle chat
    if (phase === 'completed' || phase === 'idle') {
      if (this.npcStateManager.isIdleCooldownActive(npcId)) {
        this.showThoughtBubble(npcId);
        return;
      }
    }

    const storyKey = 'story_ink';
    const data = this.cache.json.get(storyKey);

    if (data) {
      try {
        this.inkService.loadStory(data as Record<string, never>, storyKey);
        this.inkService.setCurrentNpc(npcId);

        // If returning mid-arc, jump to saved knot pointer
        const npcState = this.npcStateManager.getState(npcId);
        if (npcState?.knotPointer) {
          this.inkService.jumpToKnot(npcState.knotPointer);
        } else if (phase === 'available' || phase === 'active') {
          const introKnot = `npc_${npcId}_intro`;
          this.inkService.jumpToKnot(introKnot); // no-op if knot doesn't exist
        } else if (phase === 'completed') {
          const idleKnot = `npc_${npcId}_idle`;
          this.inkService.jumpToKnot(idleKnot); // no-op if knot doesn't exist
        }

        // Only start ink dialogue if the story actually has content
        if (this.inkService.canContinue() || this.inkService.hasChoices()) {
          this.npcStateManager.beginTalk(npcId, this.gameManager.currentChapter);
          this.dialogueManager.start(npcId);
          return;
        }
        // No content — fall through to fallback dialogue
      } catch { /* fallback */ }
    }

    this.npcStateManager.beginTalk(npcId, this.gameManager.currentChapter);
    this.showFallbackDialogue(npcId);
  }

  private showThoughtBubble(npcId: string): void {
    const npc = this.npcs.find(n => n.npcId === npcId);
    if (!npc) return;
    const bubble = this.add.text(npc.sprite.x, npc.sprite.y - 22, '...', {
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#9a9a88',
      fontFamily: 'monospace',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(22);

    this.tweens.add({
      targets: bubble, alpha: 0, y: npc.sprite.y - 30,
      duration: 1200, ease: 'Sine.easeOut',
      onComplete: () => bubble.destroy(),
    });
  }

  private showFallbackDialogue(npcId: string): void {
    // Prevent re-entry while a dialogue is already active
    if (this.gameManager.isState(GameState.DIALOGUE)) return;

    const npc = this.npcs.find(n => n.npcId === npcId);
    if (!npc) return;

    const ko = this.gameManager.language === 'ko';
    const name = ko ? npc.nameKo : npc.nameEn;

    // talkCount > 0 means endTalk was called at least once (full prior conversation completed).
    // phase === 'completed'/'idle' also covers NPCs that completed via Ink dialogue.
    // Note: startDialogue always calls beginTalk before showFallbackDialogue, so phase
    // will already be 'active' here — we do NOT call beginTalk again.
    const phase = this.npcStateManager.getPhase(npcId);
    const talkCount = this.npcStateManager.getTalkCount(npcId);
    const isReturning = (phase === 'completed' || phase === 'idle' || talkCount > 0);

    const langConv = FALLBACK_DIALOGUES[npcId];
    if (!langConv) {
      this.runConversation(npcId, name, { lines: [{ text: '...', emotion: 'neutral' }] });
      return;
    }

    const conv = ko ? langConv.ko : langConv.en;
    if (isReturning && conv.repeated && conv.repeated.length > 0) {
      // Strip all stat grants from repeated dialogue — one-time rewards only
      const idleConv: Conversation = { lines: conv.repeated.map(l => ({ ...l, stat: undefined, amount: undefined })) };
      this.runConversation(npcId, name, idleConv);
    } else if (!isReturning) {
      this.runConversation(npcId, name, conv);
    } else {
      // Completed NPC with no repeated lines — show a brief acknowledgment
      this.runConversation(npcId, name, { lines: [{ text: '...', emotion: 'neutral' }] });
    }
  }

  private runConversation(npcId: string, defaultSpeaker: string, conv: Conversation): void {
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
      this.npcStateManager.endTalk(npcId);
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
        if (!choicePhase) showNextOrEnd();
      } else {
        const choice = conv.choices?.[index];
        if (!choice) { end(); return; }
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

  // ── Dialogue vignette ────────────────────────────────────────────────────

  private showDialogueVignette(): void {
    if (this.vignetteOverlay) return;
    const g = this.add.graphics().setDepth(95).setScrollFactor(0).setAlpha(0);
    const W = GAME_WIDTH;
    const H = GAME_HEIGHT;
    const edgeW = Math.round(W * 0.22);
    const edgeH = Math.round(H * 0.22);
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
        this.tweens.add({
          targets: g, alpha: 1, duration: 600,
          onComplete: () => {
            if (this.faithVignette === g) {
              this.tweens.add({
                targets: g, alpha: 0.25, duration: 500,
                yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
              });
            }
          },
        });
      }
    } else if (this.faithVignette) {
      const g = this.faithVignette;
      this.faithVignette = null;
      this.tweens.add({ targets: g, alpha: 0, duration: 500, onComplete: () => g.destroy() });
    }
  }

  // ── Event handlers ───────────────────────────────────────────────────────

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

    // Phase 6A: track maxFaith highscore in localStorage
    if (payload.stat === 'faith' && isPositive) {
      const current = payload.newValue;
      const stored = parseInt(localStorage.getItem('pp_highscore_faith') ?? '0', 10);
      if (current > stored) {
        localStorage.setItem('pp_highscore_faith', String(current));
      }
    }

    // Phase 5B: faithGlow effect when faith increases
    if (payload.stat === 'faith' && isPositive && this.player) {
      this.particleManager.faithGlow(this.player.sprite.x, this.player.sprite.y);
    }
  };

  private spawnStatFloat(label: string, amount: number, color: number): void {
    if (!this.player) return;
    const sign = amount > 0 ? '+' : '';
    const px = this.player.sprite.x;
    const py = this.player.sprite.y - 14;
    const txt = this.add.text(px, py, `${sign}${amount} ${label}`, {
      fontFamily: DesignSystem.getFontFamily(),
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
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

    // Phase 5C: briefly flash NPC with golden tint then restore
    if (this.activeDialogueNpc) {
      const npcSprite = this.activeDialogueNpc.sprite;
      if (npcSprite) {
        npcSprite.setTint(0xffd080);
        this.time.delayedCall(220, () => npcSprite.clearTint());
      }
      // Resume NPC patrol
      this.activeDialogueNpc.resumePatrol();
      this.activeDialogueNpc = null;
    }

    // Persist Ink state after dialogue
    this.inkService.persistState();
    this.inkService.setCurrentNpc(null);

    // Auto-save after dialogue (catches stat changes from conversation)
    this.eventBus.emit(GameEvent.SAVE_GAME);
  };

  private onBattleEnd = () => {
    this.gameManager.changeState(GameState.GAME);
  };

  private onBurdenReleased = () => {
    this.playBurdenReleaseSequence();
  };

  private playBurdenReleaseSequence(): void {
    // 1. White flash
    this.cameras.main.flash(800, 255, 255, 255, false);

    // 2. Particle explosion
    this.time.delayedCall(200, () => {
      if (this.player) {
        this.particleManager.emit('holy_light', this.player.sprite.x, this.player.sprite.y, 30);
      }
    });

    // 3. Camera zoom out then back
    this.tweens.add({
      targets: this.cameras.main,
      zoom: CAMERA.ZOOM_WIDE,
      duration: 600,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 800,
    });

    // 4. Brighten scene via narrative director
    this.time.delayedCall(400, () => {
      this.narrativeDirector.setMood('grace', 1500);
    });

    // 5. Toast message
    const ko = this.gameManager.language === 'ko';
    this.eventBus.emit(GameEvent.TOAST_SHOW, {
      text: ko ? '✝ 짐이 떨어졌습니다!' : '✝ The burden is gone!',
      type: 'achievement',
      duration: 4000,
    });
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.NPC_INTERACT, this.onNpcInteract);
    this.eventBus.on('npc_interact', this.onNpcInteract);
    this.eventBus.on(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.on(GameEvent.BIBLE_CARD_COLLECTED, this.onBibleCard);
    this.eventBus.on(GameEvent.CHAPTER_ENTER, this.onChapterEnter);
    this.eventBus.on(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    this.eventBus.on(GameEvent.BATTLE_END, this.onBattleEnd);
    this.eventBus.on(GameEvent.BURDEN_RELEASED, this.onBurdenReleased);
    this.eventBus.on('cutscene:stat_change', this.onCutsceneStatChange);
    this.eventBus.on(GameEvent.AUTO_SAVE, this.onAutoSave);
  }

  private onAutoSave = () => { this.showSaveIndicator(); };

  private onCutsceneStatChange = (payload: { stat: string; amount: number } | undefined) => {
    if (!payload) return;
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const stat = payload.stat as import('../core/GameEvents').StatType;
    if (stat === 'burden' && payload.amount < 0) {
      sm.setBurdenZero();
    } else {
      sm.change(stat, payload.amount);
    }
  };

  private cleanupEvents(): void {
    this.eventBus.off(GameEvent.NPC_INTERACT, this.onNpcInteract);
    this.eventBus.off('npc_interact', this.onNpcInteract);
    this.eventBus.off(GameEvent.STAT_CHANGED, this.onStatChanged);
    this.eventBus.off(GameEvent.BIBLE_CARD_COLLECTED, this.onBibleCard);
    this.eventBus.off(GameEvent.CHAPTER_ENTER, this.onChapterEnter);
    this.eventBus.off(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    this.eventBus.off(GameEvent.BATTLE_END, this.onBattleEnd);
    this.eventBus.off(GameEvent.BURDEN_RELEASED, this.onBurdenReleased);
    this.eventBus.off('cutscene:stat_change', this.onCutsceneStatChange);
    this.eventBus.off(GameEvent.AUTO_SAVE, this.onAutoSave);
  }

  // ── Location title ───────────────────────────────────────────────────────

  private showLocationTitle(name: string): void {
    if (this.locationTitle) this.locationTitle.destroy(true);

    const ko = this.gameManager.language === 'ko';
    const chapter = this.gameManager.currentChapter;
    // Full i18n chapter string e.g. "제7장: 아름다운 궁전" → prefix is "제7장"
    const fullChapterTitle = this.gameManager.i18n.t(`chapter.${chapter}`);
    const chapterPrefix = fullChapterTitle.split(':')[0].trim();
    const verse = CHAPTER_VERSES[chapter];

    const container = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10)
      .setDepth(300).setScrollFactor(0).setAlpha(0);

    const panelW = GAME_WIDTH - 40;
    // Fixed heights with clear vertical zones: chap label + divider + title + verse + ref
    const panelH = verse ? (ko ? 86 : 72) : 36;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.82);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    bg.lineStyle(0.8, COLORS.UI.GOLD, 0.35);
    bg.strokeRect(-panelW / 2, -panelH / 2, panelW, panelH);

    // Decorative top / bottom rule lines (inset slightly)
    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.25);
    line.lineBetween(-panelW / 2 + 20, -panelH / 2 + 3, panelW / 2 - 20, -panelH / 2 + 3);
    line.lineBetween(-panelW / 2 + 20, panelH / 2 - 3, panelW / 2 - 20, panelH / 2 - 3);

    container.add([bg, line]);

    if (verse) {
      // Layout: [top=0] chap label (XS) → +13 divider → +6 title (BASE) → +20 verse (XS) → +14 ref (XS)
      const chapLabel = chapterPrefix;
      const chapText = this.add.text(0, -panelH / 2 + 8, chapLabel, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#a09070',
      }).setOrigin(0.5);

      // Thin divider under chap label
      const midLine = this.add.graphics();
      midLine.lineStyle(0.5, COLORS.UI.GOLD, 0.2);
      midLine.lineBetween(-60, -panelH / 2 + 16, 60, -panelH / 2 + 16);

      // Title — BASE size (not LG to prevent overlap)
      const titleFontSize = ko ? DesignSystem.FONT_SIZE.BASE : DesignSystem.FONT_SIZE.SM;
      const titleY = -panelH / 2 + (ko ? 28 : 26);
      const text = this.add.text(0, titleY, name,
        DesignSystem.goldTextStyle(titleFontSize),
      ).setOrigin(0.5);

      const verseText = ko ? verse.ko : verse.en;
      const refText = ko ? verse.refKo : verse.refEn;
      const verseFontSize = DesignSystem.FONT_SIZE.XS;
      const vt = this.add.text(0, titleY + (ko ? 18 : 16), `"${verseText}"`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${verseFontSize}px`,
        color: '#c8b898',
        wordWrap: { width: panelW - 60 },
        align: 'center',
      }).setOrigin(0.5);
      const rt = this.add.text(0, panelH / 2 - 9, `— ${refText}`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${verseFontSize}px`,
        color: '#888870',
      }).setOrigin(0.5);
      container.add([chapText, midLine, text, vt, rt]);
    } else {
      // No verse — just the location name centred
      const text = this.add.text(0, 0, name,
        DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.BASE),
      ).setOrigin(0.5);
      container.add(text);
    }

    this.locationTitle = container;

    this.tweens.add({
      targets: container, alpha: 1, duration: 700,
      hold: 3500, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => { container.destroy(true); this.locationTitle = null; },
    });
  }

  // ── Map events ───────────────────────────────────────────────────────────

  private checkMapEvents(): void {
    const config = this.chapterManager.getCurrentConfig();
    if (!config?.events) return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    config.events.forEach((event: MapEvent) => {
      // triggerOnce events: skip if already triggered
      if (event.triggerOnce && this.gamePlayState.isEventTriggered(event.id)) return;

      if (px >= event.x && px <= event.x + event.width &&
          py >= event.y && py <= event.y + event.height) {

        if (event.triggerOnce) {
          this.gamePlayState.markEventTriggered(event.id);
          // Persist immediately
          this.eventBus.emit(GameEvent.SAVE_GAME);
        }

        switch (event.type) {
          case 'battle':
            this.startBattle(event.data.enemyId as string);
            break;
          case 'dialogue':
            this.triggerDialogueEvent(event);
            break;
          case 'cutscene':
            this.playCutsceneEvent(event.data.cutsceneId as string);
            break;
        }
      }
    });
  }

  private triggerDialogueEvent(event: MapEvent): void {
    if (this.gameManager.isState(GameState.DIALOGUE)) return;

    const knotName = event.data.knotName as string | undefined;
    const npcId = event.data.npcId as string | undefined;

    if (knotName && npcId) {
      const npc = this.npcs.find(n => n.npcId === npcId);
      if (!npc) return;

      const storyKey = 'story_ink';
      const data = this.cache.json.get(storyKey);
      if (data) {
        try {
          this.inkService.loadStory(data as Record<string, never>, storyKey);
          this.inkService.setCurrentNpc(npcId);
          if (this.inkService.jumpToKnot(knotName)) {
            this.npcStateManager.beginTalk(npcId, this.gameManager.currentChapter);
            this.dialogueManager.start(npcId);
            return;
          }
        } catch { /* fallback */ }
      }

      // Fallback: exhibit label as generic line
      const ko = this.gameManager.language === 'ko';
      const label = (ko ? event.data.exhibitLabel : event.data.exhibitLabelEn) as string ?? knotName;
      const name = ko ? npc.nameKo : npc.nameEn;
      this.runConversation(npcId, name, {
        lines: [{ text: `[${label}] ...`, emotion: 'neutral' }],
      });
    }

    // Track exhibit activation in mapState
    if (event.data.exhibitLabel) {
      this.gamePlayState.setObjectState(event.id, { activated: true });
    }
  }

  // ── Cutscene events ──────────────────────────────────────────────────────

  private playCutsceneEvent(cutsceneId: string): void {
    if (this.cutsceneEngine.playing) return;
    if (this.gameManager.isState(GameState.CUTSCENE)) return;

    const def = CUTSCENE_REGISTRY[cutsceneId];
    if (!def) {
      // Unknown cutscene — emit generic event for extensibility
      this.eventBus.emit(GameEvent.MAP_EVENT, { cutsceneId });
      return;
    }

    this.gameManager.changeState(GameState.CUTSCENE);
    // Halt player during cutscene
    if (this.player.sprite.body instanceof Phaser.Physics.Arcade.Body) {
      this.player.sprite.body.setVelocity(0, 0);
    }

    void this.cutsceneEngine.play(def).then(() => {
      this.gameManager.changeState(GameState.GAME);

      // Special post-cutscene hooks
      if (cutsceneId === 'ch6_burden_released') {
        // Ch6 cross: burden stat is zeroed via cutscene step, trigger NPC state
        this.npcStateManager.setPhase('shining_ones', 'available');
      }
      if (cutsceneId === 'celestial_arrival') {
        // Game complete — transition to EndingScene
        this.time.delayedCall(3000, () => {
          void DesignSystem.fadeOut(this, 1500).then(() => {
            this.shutdown();
            this.scene.start(SCENE_KEYS.ENDING);
          });
        });
      }
    });
  }

  // ── Exit zone checking (ARCH-03) ─────────────────────────────────────────

  private checkExits(): void {
    if (this.exitHintCooldown > 0) return;
    const config = this.chapterManager.getCurrentConfig();
    if (!config?.exits) return;

    const px = this.player.sprite.x;
    const py = this.player.sprite.y;

    for (const exit of config.exits) {
      if (px >= exit.x && px <= exit.x + exit.width &&
          py >= exit.y && py <= exit.y + exit.height) {

        // Check completion requirements
        if (config.completionRequirements) {
          const blocked = this.checkCompletionRequirements(config);
          if (blocked) {
            this.showExitHint();
            return;
          }
        }

        void this.transitionToChapter(exit.targetChapter);
        return;
      }
    }
  }

  private checkCompletionRequirements(config: ChapterConfig): boolean {
    const req = config.completionRequirements;
    if (!req) return false;

    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    for (const npcId of req.requiredNpcs ?? []) {
      const phase = this.npcStateManager.getPhase(npcId);
      if (phase !== 'completed') return true;
    }

    for (const [stat, min] of Object.entries(req.minStats ?? {})) {
      if (sm.get(stat as import('../core/GameEvents').StatType) < (min ?? 0)) return true;
    }

    for (const eventId of req.requiredEvents ?? []) {
      if (!this.gamePlayState.isEventTriggered(eventId)) return true;
    }

    return false;
  }

  private showExitHint(): void {
    this.exitHintCooldown = 4000;
    const ko = this.gameManager.language === 'ko';
    const msg = ko ? '아직 할 일이 남은 것 같습니다...' : 'Something feels unfinished...';
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, msg, {
      fontFamily: DesignSystem.getFontFamily(),
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#a89b8c',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(400).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: txt, alpha: 0.85, duration: 400,
      hold: 2500, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Battle ───────────────────────────────────────────────────────────────

  private startBattle(enemyId: string): void {
    this.scene.pause();
    this.scene.setVisible(false);
    this.scene.launch(SCENE_KEYS.BATTLE, { enemyId });

    const battleEndHandler = () => {
      this.eventBus.off(GameEvent.BATTLE_END, battleEndHandler);
      this.scene.setVisible(true);
      this.scene.resume();
    };
    this.eventBus.on(GameEvent.BATTLE_END, battleEndHandler);
  }

  // ── Chapter transitions ──────────────────────────────────────────────────

  private showSaveIndicator(): void {
    const label = '✝ ' + this.gameManager.i18n.t('save.saved');
    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 16, label,
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

    // Destroy old scene objects
    this.npcs.forEach(n => n.destroy());
    this.npcs = [];
    this.itemSprites.forEach(s => s.destroy(true));
    this.itemSprites = [];
    Object.values(this.mapObjectSprites).forEach(s => s.destroy(true));
    this.mapObjectSprites = {};
    this.activeDialogueNpc = null;
    // Note: do NOT clear triggeredEvents — they persist globally

    const config = this.chapterManager.loadChapter(chapter);
    this.environmentAnimations.init(config);

    // Crossfade ambient soundscape to new chapter
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audioMgr = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audioMgr.ambient.crossfadeTo(chapter, 3000);
      this.time.delayedCall(1500, () => {
        audioMgr.ambient.playChapterStinger(chapter);
      });
    }

    const colliders = this.tileMapManager.getColliders();
    if (colliders) {
      this.physics.add.collider(this.player.sprite, colliders);
    }

    this.player.setPosition(config.spawn.x, config.spawn.y);

    this.initChapterNpcs(config);
    this.interactionZone.setNPCs(this.npcs);

    this.ambientData = [];
    this.createAmbientParticles(config);
    this.miniMap.setChapter(config);
    this.spawnChapterItems(chapter);
    this.spawnMapObjects(config);
    this.applyChapterModifiers(config);
    this.tutorialSystem.showForChapter(chapter);
    this.spawnChapterCompanion(chapter, config.spawn.x + 40, config.spawn.y);

    const locName = this.chapterManager.getLocationName?.()
      ?? config.locationName
      ?? `Chapter ${chapter}`;
    this.showLocationTitle(locName);
    DesignSystem.fadeIn(this, 600);
  }

  // ── Update loop ──────────────────────────────────────────────────────────

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

    // Apply chapter speed modifier (e.g. mud in Ch2)
    if (this.chapterSpeedMod !== 1.0) {
      input.x *= this.chapterSpeedMod;
      input.y *= this.chapterSpeedMod;
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
    const playerX = this.player.sprite.x;
    const playerY = this.player.sprite.y;
    this.npcs.forEach(npc => {
      const nx = npc.sprite.x;
      const ny = npc.sprite.y;
      if (nx >= camL && nx <= camR && ny >= camT && ny <= camB) {
        npc.sprite.setVisible(true);
        npc.update();
        // Phase 5C: shimmer effect when player walks within 50px of NPC
        const dist = Math.sqrt((nx - playerX) ** 2 + (ny - playerY) ** 2);
        if (dist < 50) {
          const t = this.time.now * 0.003;
          const shimmerAlpha = 0.3 + Math.sin(t + nx * 0.1) * 0.2;
          npc.sprite.setTint(Phaser.Display.Color.GetColor(
            Math.round(0xff + (0xd4 - 0xff) * shimmerAlpha),
            Math.round(0xff + (0xa8 - 0xff) * shimmerAlpha),
            0xff,
          ));
        } else {
          npc.sprite.clearTint();
        }
      } else {
        npc.sprite.setVisible(false);
      }
    });

    this.miniMap.update(this.player.sprite.x, this.player.sprite.y, this.npcs);
    this.particleManager.update(delta);
    this.lightingManager.update();
    this.environmentAnimations.update(delta);
    this.companion?.update(
      this.player.sprite.x, this.player.sprite.y,
      this.player.sprite.flipX, delta,
    );
    this.checkMapEvents();
    this.checkExits();
    this.tutorialSystem.checkStuck(this.player.sprite.x, this.player.sprite.y, delta);
    this.updateFaithVignette();

    // Decay exit hint cooldown
    if (this.exitHintCooldown > 0) this.exitHintCooldown -= delta;
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
    const chapter = this.gameManager.currentChapter;
    const fallsDown = chapter === 1; // Ash in city

    this.ambientData.forEach(p => {
      p.y += p.vy;
      p.x += Math.sin(p.y * 0.01) * 0.1;

      if (fallsDown) {
        // Falling ash wraps at bottom
        if (p.y > cam.scrollY + GAME_HEIGHT + 10) {
          p.y = cam.scrollY - 10;
          p.x = cam.scrollX + Math.random() * GAME_WIDTH;
        }
      } else {
        // Rising particles wrap at top
        if (p.y < cam.scrollY - 20) {
          p.y = cam.scrollY + GAME_HEIGHT + 10;
          p.x = cam.scrollX + Math.random() * GAME_WIDTH;
        }
      }

      if (p.x > cam.scrollX - 10 && p.x < cam.scrollX + GAME_WIDTH + 10 &&
          p.y > cam.scrollY - 10 && p.y < cam.scrollY + GAME_HEIGHT + 10) {
        this.ambientParticles!.fillStyle(p.color, p.a);
        this.ambientParticles!.fillCircle(p.x, p.y, p.s);
      }
    });
  }

  // ── Shutdown ─────────────────────────────────────────────────────────────

  shutdown(): void {
    this.pauseMenuCleanup?.();
    this.cleanupEvents();
    this.npcStateManager?.destroy();
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
    this.juiceEffects?.destroy();
    this.lightingManager?.destroy();
    this.transitionEffects?.destroy();
    this.debugPanel?.destroy();
    this.cutsceneEngine?.destroy();
    this.environmentAnimations?.destroy();
    this.companion?.destroy();
    this.companion = null;
    this.pauseBtn?.destroy(true);
    this.ambientParticles?.destroy();
    this.itemSprites.forEach(s => s.destroy(true));
    Object.values(this.mapObjectSprites).forEach(s => s.destroy(true));
    this.npcs.forEach(n => n.destroy());
    this.player?.destroy();
  }
}
