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
  /** Guard: prevents startBattle() from being called while a battle is already running. */
  private _battleActive = false;
  /** NPC currently in dialogue (used to resume patrol after end). */
  private activeDialogueNpc: NPC | null = null;
  /** Map object containers by objectId. */
  private mapObjectSprites: Record<string, Phaser.GameObjects.Container> = {};
  /** Exit-hint cooldown guard. */
  private exitHintCooldown = 0;
  /** Animated exit arrow overlay (only drawn when chapter is complete). */
  private exitArrowGfx: Phaser.GameObjects.Graphics | null = null;
  /** True once we've confirmed chapter requirements are met this chapter. */
  private chapterComplete = false;
  /** Incremented each update(); used for frame-throttled draw calls. */
  private _frameTick = 0;
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
    let _savedForRestore: ReturnType<SaveManager['getLastLoaded']> = null;
    if (ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)) {
      const saveManager = ServiceLocator.get<SaveManager>(SERVICE_KEYS.SAVE_MANAGER);
      const saved = saveManager.getLastLoaded();
      _savedForRestore = saved;
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

    // Start chapter-specific ambient soundscape + unlock Web Audio on first gesture
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audioMgr = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audioMgr.ambient.init(this.gameManager.currentChapter);
      audioMgr.ambient.playChapterStinger(this.gameManager.currentChapter);
      // Browsers block Web Audio until first user gesture — resume on any input
      const unlockAudio = () => {
        audioMgr.ambient.resume();
        this.input.off('pointerdown', unlockAudio);
        this.input.keyboard?.off('keydown', unlockAudio);
      };
      this.input.on('pointerdown', unlockAudio);
      this.input.keyboard?.on('keydown', unlockAudio);
    }

    this.player = new Player(this, chapterConfig.spawn.x, chapterConfig.spawn.y);
    // Restore mid-chapter position if saved in the same chapter (preserve progress)
    if (_savedForRestore?.playerX !== undefined && _savedForRestore.playerY !== undefined &&
        _savedForRestore.playerX > 0 && _savedForRestore.playerY > 0) {
      this.player.setPosition(_savedForRestore.playerX, _savedForRestore.playerY);
    }
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.06);
    this.cameras.main.setZoom(CAMERA.ZOOM_DEFAULT);
    // Vertical lerp (0.06) is gentler than horizontal (0.08) to reduce camera
    // bobbing, which makes the fixed parallax backdrop feel more stable.

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
        DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM),
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
    // Button: 26×20 box, 6px from right/top edge.
    const BW = 26, BH = 20, MARGIN = 6;
    const bx = GAME_WIDTH - MARGIN - BW;  // left  = 448
    const by = MARGIN;                     // top   =   6
    const cx = bx + BW / 2;               // centre x = 461
    const cy = by + BH / 2;               // centre y =  16

    // Visual container (non-interactive, scrollFactor=0 is fine for graphics)
    const c = this.add.container(bx, by).setDepth(200).setScrollFactor(0);

    const bg = this.add.graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0x2a2040 : 0x1a1428, hover ? 0.85 : 0.65);
      bg.fillRoundedRect(0, 0, BW, BH, 4);
      bg.lineStyle(0.8, 0xd4a853, hover ? 0.6 : 0.35);
      bg.strokeRoundedRect(0, 0, BW, BH, 4);
    };
    drawBg(false);

    const bars = this.add.graphics();
    bars.fillStyle(0xb0a080, 0.85);
    bars.fillRect(BW / 2 - 5, BH / 2 - 4, 4, 8);
    bars.fillRect(BW / 2 + 1, BH / 2 - 4, 4, 8);

    c.add([bg, bars]);

    // ⚠ Interactive objects inside scrollFactor=0 containers get wrong hit coords
    // because Phaser's input system applies the camera offset.
    // Solution: place the hit zone directly on the scene with setScrollFactor(0).
    const hit = this.add.rectangle(cx, cy, BW, BH, 0, 0)
      .setScrollFactor(0)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover',  () => drawBg(true));
    hit.on('pointerout',   () => drawBg(false));
    hit.on('pointerdown',  () => this.openPauseMenu());

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

    const cx = GAME_WIDTH / 2;   // 240
    const cy = GAME_HEIGHT / 2;  // 135

    const overlay = this.add.rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0)
      .setDepth(500).setScrollFactor(0);
    this.tweens.add({ targets: overlay, alpha: 0.55, duration: 200, ease: 'Sine.easeOut' });

    // Detect platform for help text
    let isMobile = false;
    try {
      const rm = ServiceLocator.get<ResponsiveManager>(SERVICE_KEYS.RESPONSIVE_MANAGER);
      isMobile = rm.isTouchDevice;
    } catch { /* ignore */ }

    const ko = this.gameManager.language === 'ko';

    // ── Visual panel (non-interactive container) ──────────────────────────
    // Panel: 220×230, spans relY -100 to +130
    const panel = this.add.container(cx, cy).setDepth(501).setScrollFactor(0);
    const panelBg = DesignSystem.createPanel(this, -110, -100, 220, 230);

    const title = this.add.text(0, -78, ko ? '일시정지' : 'Paused',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    line.lineBetween(-60, -60, 60, -60);

    // Shortcut hint at bottom of panel (relY +100, world y=235)
    const shortcutHint = isMobile
      ? (ko ? '❕ NPC 대화  ❚❚ 일시정지' : '❕ Talk  ❚❚ Pause')
      : (ko ? 'E 대화  I 소지품  M 지도  ESC 일시정지' : 'E Talk  I Inventory  M Map  ESC Pause');
    const hintText = this.add.text(0, 100, shortcutHint,
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5);

    panel.add([panelBg, title, line, hintText]);

    // ── Button layout ─────────────────────────────────────────────────────
    // Buttons placed at: relY -42, -10, +22, +56  (world y: 93, 125, 157, 191)
    const BW = 170, BH = 28;
    const btnRelYs = [-42, -10, 22, 56];
    const btnLabels = [
      ko ? '계속하기' : 'Resume',
      ko ? '설정' : 'Settings',
      ko ? '전체화면' : 'Fullscreen',
      ko ? '메인메뉴' : 'Quit to Menu',
    ];
    const btnBgColors  = [0x2a4a2a, COLORS.UI.BUTTON_DEFAULT, COLORS.UI.BUTTON_DEFAULT, 0x3a1a1a];
    const btnHovColors = [0x3a6a3a, COLORS.UI.BUTTON_HOVER,   COLORS.UI.BUTTON_HOVER,   0x5a2a2a];

    // Collect hit zones so we can destroy them on cleanup
    const hitZones: Phaser.GameObjects.Rectangle[] = [];

    // Draw button visuals inside the panel container (pure graphics, no interaction)
    const btnGfx = this.add.graphics();
    panel.add(btnGfx);
    const drawButtons = (hoverIdx: number) => {
      btnGfx.clear();
      btnRelYs.forEach((relY, i) => {
        const bg   = i === hoverIdx ? btnHovColors[i] : btnBgColors[i];
        const brd  = i === hoverIdx ? COLORS.UI.GOLD : COLORS.UI.PANEL_BORDER;
        btnGfx.fillStyle(bg, 0.95);
        btnGfx.fillRoundedRect(-BW / 2, relY - BH / 2, BW, BH, 4);
        btnGfx.lineStyle(1.5, brd, 0.7);
        btnGfx.strokeRoundedRect(-BW / 2, relY - BH / 2, BW, BH, 4);
      });
    };
    drawButtons(-1);

    // Button labels drawn as Text inside panel (no interaction)
    const textStyle = DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#ffffff');
    btnRelYs.forEach((relY, i) => {
      const t = this.add.text(0, relY, btnLabels[i], textStyle).setOrigin(0.5);
      panel.add(t);
    });

    const cleanup = () => {
      overlay.destroy();
      panel.destroy();
      hitZones.forEach(h => h.destroy());
      this.pauseMenuCleanup = null;
    };
    this.pauseMenuCleanup = cleanup;

    // ── Scene-level hit zones (no container = correct scrollFactor(0) coords) ──
    const callbacks = [
      () => { cleanup(); this.gameManager.changeState(GameState.GAME); },
      () => { cleanup(); this.scene.pause(); this.scene.launch('SettingsScene', { from: 'GameScene' }); },
      () => { MenuScene.toggleFullscreen(); },
      async () => { cleanup(); await DesignSystem.fadeOut(this, 400); this.shutdown(); this.scene.start(SCENE_KEYS.MENU); },
    ];

    btnRelYs.forEach((relY, i) => {
      const hit = this.add.rectangle(cx, cy + relY, BW, BH, 0x000000, 0)
        .setScrollFactor(0).setDepth(503).setInteractive({ useHandCursor: true });

      hit.on('pointerover', () => {
        drawButtons(i);
        this.tweens.add({ targets: panel, scaleX: 1, scaleY: 1, duration: 0 }); // no-op, keep scale
      });
      hit.on('pointerout',  () => drawButtons(-1));
      hit.on('pointerdown', () => {
        this.tweens.add({
          targets: panel, scaleX: 0.98, scaleY: 0.98, duration: 50,
          yoyo: true, ease: 'Sine.easeInOut', onComplete: callbacks[i],
        });
      });

      hitZones.push(hit);
    });
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
      fontFamily: DesignSystem.getFontFamily(),
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
    /** Guard: prevents the same dialogue-choice event from being processed twice */
    let choiceHandled = false;
    /** True once a choice has been selected — prevents re-showing choices after response lines */
    let choicesConsumed = false;

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
      } else if (!choicePhase && !choicesConsumed && conv.choices && conv.choices.length > 0) {
        // Show choices exactly once — after initial lines, before they're consumed
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
        if (choiceHandled) return;   // ← double-fire guard
        choiceHandled = true;
        choicesConsumed = true;      // ← mark choices as used (no re-show after response lines)
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
    // Reset player FSM to IDLE — prevents freeze if player was left in any
    // non-moveable state (CUTSCENE / INTERACT / HURT) when battle started.
    this.player?.exitCutscene();
    // Re-enable physics body in case it was halted by a cutscene or event
    const body = this.player?.sprite?.body;
    if (body instanceof Phaser.Physics.Arcade.Body) body.setEnable(true);
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

  /**
   * Draws animated gold arrows over exit zones when chapter requirements are met.
   * Throttled to every other frame — animation is slow enough to be imperceptible.
   */
  private updateExitArrows(): void {
    if (this._frameTick % 2 !== 0) return; // half-rate redraw
    const config = this.chapterManager.getCurrentConfig();
    if (!config?.exits?.length) return;

    // Check completion once per chapter (avoid re-checking every frame after confirmed)
    if (!this.chapterComplete) {
      if (!config.completionRequirements || this.collectUnmetRequirements(config).length === 0) {
        this.chapterComplete = true;
        if (!this.exitArrowGfx) {
          this.exitArrowGfx = this.add.graphics().setDepth(15);
        }
      }
    }

    if (!this.exitArrowGfx || !this.chapterComplete) return;

    const t = this.time.now * 0.003;
    const pulse = 0.55 + Math.sin(t * 1.8) * 0.45;         // 0.1 – 1.0
    const bounce = Math.sin(t * 2.2) * 4;                    // ±4px vertical bob
    const ringPulse = 0.18 + Math.sin(t * 1.4) * 0.12;      // 0.06 – 0.30

    this.exitArrowGfx.clear();

    config.exits.forEach(exit => {
      const cx = exit.x + exit.width / 2;
      const cy = exit.y + exit.height / 2;

      // Expanding glow rings
      for (let i = 0; i < 3; i++) {
        const r = 18 + i * 10;
        const a = ringPulse * (1 - i * 0.3);
        this.exitArrowGfx!.lineStyle(1.2, 0xd4a853, a);
        this.exitArrowGfx!.strokeEllipse(cx, cy, r * 2, r * 1.2);
      }

      // Pulsing fill ellipse
      this.exitArrowGfx!.fillStyle(0xd4a853, pulse * 0.12);
      this.exitArrowGfx!.fillEllipse(cx, cy, exit.width + 16, exit.height + 10);

      // Bouncing chevron arrows (two stacked)
      const arrowY = cy - 20 + bounce;
      for (let i = 0; i < 2; i++) {
        const ay = arrowY - i * 8;
        const alpha = pulse * (1 - i * 0.35);
        this.exitArrowGfx!.fillStyle(0xffd080, alpha);
        this.exitArrowGfx!.fillTriangle(
          cx, ay - 7,
          cx - 6, ay,
          cx + 6, ay,
        );
      }

      // Sparkle pixels at arrow tip
      if (Math.sin(t * 4 + 0.5) > 0.6) {
        this.exitArrowGfx!.fillStyle(0xffffff, 0.8);
        this.exitArrowGfx!.fillRect(cx - 1, arrowY - 9, 2, 2);
      }
    });
  }

  // ── Location title ───────────────────────────────────────────────────────

  private showLocationTitle(name: string): void {
    if (this.locationTitle) this.locationTitle.destroy(true);

    const ko = this.gameManager.language === 'ko';
    const chapter = this.gameManager.currentChapter;
    const chapterConfig = this.chapterManager.getCurrentConfig();

    // Chapter label prefix (e.g. "제7장" or "Chapter 7")
    const fullChapterTitle = this.gameManager.i18n.t(`chapter.${chapter}`);
    const chapterPrefix = fullChapterTitle.split(':')[0].trim();
    const verse = CHAPTER_VERSES[chapter];

    // Theme-based accent color from chapter config
    const themeAccent = chapterConfig?.theme?.pathColor ?? COLORS.UI.GOLD;

    // Full-width cinematic panel — slides down from top
    const panelW = GAME_WIDTH;
    const panelH = verse ? (ko ? 92 : 80) : 48;
    const targetY = GAME_HEIGHT / 2;
    const startY = targetY - panelH - 20; // slides in from just above center

    const container = this.add.container(GAME_WIDTH / 2, startY)
      .setDepth(300).setScrollFactor(0).setAlpha(0);

    // Dark gradient overlay (2-pass)
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.88);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);
    // Subtle theme-color tint strip at top
    bg.fillStyle(themeAccent, 0.06);
    bg.fillRect(-panelW / 2, -panelH / 2, panelW, 4);
    // Gold border top + bottom
    bg.lineStyle(0.8, COLORS.UI.GOLD, 0.45);
    bg.lineBetween(-panelW / 2, -panelH / 2, panelW / 2, -panelH / 2);
    bg.lineBetween(-panelW / 2, panelH / 2, panelW / 2, panelH / 2);

    // Decorative inner rule lines
    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.2);
    line.lineBetween(-80, -panelH / 2 + 4, 80, -panelH / 2 + 4);
    line.lineBetween(-80, panelH / 2 - 4, 80, panelH / 2 - 4);
    // Small corner diamonds
    [[-panelW / 2 + 8, -panelH / 2 + 8], [panelW / 2 - 8, -panelH / 2 + 8],
     [-panelW / 2 + 8, panelH / 2 - 8], [panelW / 2 - 8, panelH / 2 - 8]].forEach(([dx, dy]) => {
      line.fillStyle(COLORS.UI.GOLD, 0.25);
      line.fillRect(dx - 1, dy - 1, 2, 2);
    });

    container.add([bg, line]);

    if (verse) {
      const chapText = this.add.text(0, -panelH / 2 + 9, chapterPrefix, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: DesignSystem.hex(themeAccent),
      }).setOrigin(0.5).setAlpha(0.85);

      const midLine = this.add.graphics();
      midLine.lineStyle(0.5, COLORS.UI.GOLD, 0.22);
      midLine.lineBetween(-70, -panelH / 2 + 18, 70, -panelH / 2 + 18);

      const titleFontSize = ko ? DesignSystem.FONT_SIZE.BASE : DesignSystem.FONT_SIZE.SM;
      const titleY = -panelH / 2 + (ko ? 30 : 28);
      const text = this.add.text(0, titleY, name,
        DesignSystem.goldTextStyle(titleFontSize),
      ).setOrigin(0.5);

      const verseText = ko ? verse.ko : verse.en;
      const refText = ko ? verse.refKo : verse.refEn;
      const vt = this.add.text(0, titleY + (ko ? 20 : 18), `"${verseText}"`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#c8b898',
        wordWrap: { width: panelW - 80 },
        align: 'center',
      }).setOrigin(0.5);
      const rt = this.add.text(0, panelH / 2 - 8, `— ${refText}`, {
        fontFamily: DesignSystem.getFontFamily(),
        fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
        color: '#888870',
      }).setOrigin(0.5);
      container.add([chapText, midLine, text, vt, rt]);
    } else {
      const text = this.add.text(0, 0, name,
        DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.BASE),
      ).setOrigin(0.5);
      container.add(text);
    }

    this.locationTitle = container;

    // Slide in from above + fade, hold, then fade + slide down out
    this.tweens.add({
      targets: container,
      alpha: 1,
      y: targetY,
      duration: 500,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(3200, () => {
          this.tweens.add({
            targets: container,
            alpha: 0,
            y: targetY + panelH / 2 + 10,
            duration: 450,
            ease: 'Quad.easeIn',
            onComplete: () => { container.destroy(true); this.locationTitle = null; },
          });
        });
      },
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
          const unmet = this.collectUnmetRequirements(config);
          if (unmet.length > 0) {
            this.showExitHint(unmet[0]);
            return;
          }
        }

        void this.transitionToChapter(exit.targetChapter);
        return;
      }
    }
  }

  /**
   * Returns a list of human-readable unmet requirement messages in the current language.
   * Empty array means all requirements are met.
   */
  private collectUnmetRequirements(config: ChapterConfig): string[] {
    const req = config.completionRequirements;
    if (!req) return [];

    const ko = this.gameManager.language === 'ko';
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const unmet: string[] = [];

    // Required NPC conversations
    for (const npcId of req.requiredNpcs ?? []) {
      if (this.npcStateManager.getPhase(npcId) !== 'completed') {
        // Find the NPC's display name from the chapter config
        const npcConfig = config.npcs.find(n => n.id === npcId);
        const name = ko
          ? (npcConfig?.nameKo ?? npcId)
          : (npcConfig?.nameEn ?? npcId);
        unmet.push(ko
          ? `아직 ${name}와(과) 대화하지 않았습니다`
          : `You have not yet spoken with ${name}`);
      }
    }

    // Required stat minimums
    const statLabels: Record<string, { ko: string; en: string }> = {
      faith:   { ko: '믿음', en: 'Faith' },
      courage: { ko: '용기', en: 'Courage' },
      wisdom:  { ko: '지혜', en: 'Wisdom' },
      burden:  { ko: '짐',   en: 'Burden' },
    };
    for (const [stat, min] of Object.entries(req.minStats ?? {})) {
      if (sm.get(stat as import('../core/GameEvents').StatType) < (min ?? 0)) {
        const label = statLabels[stat] ?? { ko: stat, en: stat };
        unmet.push(ko
          ? `${label.ko}이(가) 부족합니다 (최소 ${min} 필요)`
          : `${label.en} is too low (need at least ${min})`);
      }
    }

    // Required map events
    for (const eventId of req.requiredEvents ?? []) {
      if (!this.gamePlayState.isEventTriggered(eventId)) {
        // Build a friendly label from the event ID (e.g. 'ch6_burden_released' → 'burden released')
        const readable = eventId.replace(/^ch\d+_/, '').replace(/_/g, ' ');
        unmet.push(ko
          ? `아직 이 장소에서 할 일이 남아 있습니다 (${readable})`
          : `There is still something to do here (${readable})`);
      }
    }

    return unmet;
  }

  private showExitHint(message?: string): void {
    this.exitHintCooldown = 4000;
    const ko = this.gameManager.language === 'ko';
    const msg = message ?? (ko ? '아직 할 일이 남은 것 같습니다...' : 'Something feels unfinished...');

    const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, msg, {
      fontFamily: DesignSystem.getFontFamily(),
      fontSize: `${DesignSystem.FONT_SIZE.XS}px`,
      color: '#c8b8a0',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: GAME_WIDTH - 24, useAdvancedWrap: true },
      align: 'center',
    }).setOrigin(0.5).setDepth(400).setScrollFactor(0).setAlpha(0);

    this.tweens.add({
      targets: txt, alpha: 0.9, duration: 400,
      hold: 2800, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Battle ───────────────────────────────────────────────────────────────

  private startBattle(enemyId: string): void {
    if (this._battleActive) return; // prevent double-launch in same frame
    this._battleActive = true;
    this.scene.pause();
    this.scene.setVisible(false);
    this.scene.launch(SCENE_KEYS.BATTLE, { enemyId });

    const battleEndHandler = () => {
      this._battleActive = false;
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
    // Reset chapter-completion state for new chapter
    this.chapterComplete = false;
    this.exitArrowGfx?.destroy();
    this.exitArrowGfx = null;
    // Note: do NOT clear triggeredEvents — they persist globally

    const config = this.chapterManager.loadChapter(chapter);
    this.environmentAnimations.init(config);

    // Crossfade ambient soundscape to new chapter
    if (ServiceLocator.has(SERVICE_KEYS.AUDIO_MANAGER)) {
      const audioMgr = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audioMgr.ambient.resume();          // ensure AudioContext is not suspended
      audioMgr.ambient.crossfadeTo(chapter, 3000);
      this.time.delayedCall(1500, () => {
        audioMgr.ambient.playChapterStinger(chapter);
      });
      // Wire bgmKey: if chapter has a specific BGM track, emit after crossfade settles
      if (config.bgmKey) {
        this.time.delayedCall(1200, () => {
          this.eventBus.emit(GameEvent.BGM_PLAY, { key: config.bgmKey, loop: true });
        });
      }
    }

    const colliders = this.tileMapManager.getColliders();
    if (colliders) {
      this.physics.add.collider(this.player.sprite, colliders);
    }

    // Reset saved position to 0 so that if the player saves immediately at spawn
    // and reloads, they don't get placed at the old chapter's exit zone.
    this.gameManager.playerX = 0;
    this.gameManager.playerY = 0;
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

    this._frameTick++;
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
        this.mobileControls.setActionEnabled(true);
      } else {
        this.mobileControls.setActionLabel('·');
        this.mobileControls.setActionEnabled(false);
      }
    }

    // Apply chapter speed modifier (e.g. mud in Ch2)
    if (this.chapterSpeedMod !== 1.0) {
      input.x *= this.chapterSpeedMod;
      input.y *= this.chapterSpeedMod;
    }

    this.player.update(input, delta);
    // Keep GameManager position in sync (read by SaveManager on every SAVE_GAME)
    this.gameManager.playerX = this.player.sprite.x;
    this.gameManager.playerY = this.player.sprite.y;
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
        // Use squared distance to avoid per-NPC sqrt each frame.
        const distSq = (nx - playerX) ** 2 + (ny - playerY) ** 2;
        if (distSq < 2500 /* 50² */) {
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
    this.updateExitArrows();
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
