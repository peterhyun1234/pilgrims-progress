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
import { MiniMap } from '../ui/MiniMap';
import { ItemSystem } from '../systems/ItemSystem';
import { CHAPTER_ITEMS } from '../systems/ItemData';
import { MapEvent } from '../world/ChapterData';

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

  private locationTitle: Phaser.GameObjects.Container | null = null;
  private fallbackDialogueIndex: Record<string, number> = {};
  private ambientParticles: Phaser.GameObjects.Graphics | null = null;
  private ambientData: { x: number; y: number; vy: number; a: number; s: number; color: number }[] = [];
  private triggeredEvents = new Set<string>();
  private itemSprites: Phaser.GameObjects.Container[] = [];

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
    ServiceLocator.register('ItemSystem', this.itemSystem);

    this.tileMapManager = new TileMapManager(this);
    this.chapterManager = new ChapterManager(this, this.tileMapManager);

    this.inkService = new InkService(this);
    ServiceLocator.register(SERVICE_KEYS.INK_SERVICE, this.inkService);

    this.dialogueManager = new DialogueManager(this.inkService, this.eventBus);
    ServiceLocator.register(SERVICE_KEYS.DIALOGUE_MANAGER, this.dialogueManager);

    this.narrativeDirector = new NarrativeDirector(this);

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

    const responsive = ServiceLocator.get<ResponsiveManager>('ResponsiveManager');
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
    const bg = DesignSystem.createPanel(this, -110, -80, 220, 160);

    const ko = this.gameManager.language === 'ko';
    const title = this.add.text(0, -58, ko ? '일시정지' : 'Paused',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);

    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    line.lineBetween(-60, -42, 60, -42);

    panel.add([bg, title, line]);

    const cleanup = () => {
      overlay.destroy(); panel.destroy();
      resume.destroy(); settings.destroy(); quit.destroy();
    };

    const resume = DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 18, 170, 28,
      ko ? '계속하기' : 'Resume', () => {
        cleanup();
        this.gameManager.changeState(GameState.GAME);
      }, { fontSize: DesignSystem.FONT_SIZE.SM, bgColor: 0x2a4a2a, hoverColor: 0x3a6a3a },
    ).setDepth(502).setScrollFactor(0);

    const settings = DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 16, 170, 28,
      ko ? '설정' : 'Settings', () => {
        cleanup();
        this.scene.pause();
        this.scene.launch('SettingsScene', { from: 'GameScene' });
      }, { fontSize: DesignSystem.FONT_SIZE.SM },
    ).setDepth(502).setScrollFactor(0);

    const quit = DesignSystem.createButton(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, 170, 28,
      ko ? '메뉴로 돌아가기' : 'Quit to Menu', async () => {
        cleanup();
        await DesignSystem.fadeOut(this, 400);
        this.scene.start(SCENE_KEYS.MENU);
      }, { fontSize: DesignSystem.FONT_SIZE.SM, bgColor: 0x3a1a1a, hoverColor: 0x5a2a2a },
    ).setDepth(502).setScrollFactor(0);
  }

  private setupEvents(): void {
    this.eventBus.on('npc_interact', (npcId: string) => {
      this.startDialogue(npcId);
    });

    this.eventBus.on<StatChangePayload>(GameEvent.STAT_CHANGED, (payload) => {
      if (!payload) return;
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
    });

    this.eventBus.on(GameEvent.BIBLE_CARD_COLLECTED, (cardId: string) => {
      this.eventBus.emit(GameEvent.TOAST_SHOW, {
        text: `✝ ${cardId}`, type: 'card', duration: 3000,
      });
    });

    this.eventBus.on(GameEvent.CHAPTER_ENTER, (chapter: number) => {
      this.transitionToChapter(chapter);
    });

    this.eventBus.on(GameEvent.DIALOGUE_END, () => {
      this.player?.exitInteract();
    });

    this.eventBus.on(GameEvent.BATTLE_END, () => {
      this.gameManager.changeState(GameState.GAME);
    });
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

    interface FallbackLine {
      text: string; emotion?: string;
      stat?: string; amount?: number;
    }

    const dialogues: Record<string, { ko: FallbackLine[]; en: FallbackLine[] }> = {
      evangelist: {
        ko: [
          { text: '순례자여, 이 도시를 떠나야 합니다.', emotion: 'neutral' },
          { text: '이 도시는 곧 하늘에서 내리는 불과 유황으로 멸망할 것입니다.', emotion: 'fearful' },
          { text: '저 빛이 보이십니까? 좁은 문을 향해 달려가시오!', emotion: 'happy', stat: 'faith', amount: 5 },
          { text: '포기하지 마시오. 그 짐은 십자가 앞에서 풀려날 것이오.', emotion: 'determined', stat: 'courage', amount: 3 },
        ],
        en: [
          { text: 'Pilgrim, you must leave this city.', emotion: 'neutral' },
          { text: 'This city will be destroyed by fire and brimstone from above.', emotion: 'fearful' },
          { text: 'Do you see yonder light? Run to the Wicket Gate!', emotion: 'happy', stat: 'faith', amount: 5 },
          { text: 'Do not give up. Your burden will be loosened at the Cross.', emotion: 'determined', stat: 'courage', amount: 3 },
        ],
      },
      obstinate: {
        ko: [
          { text: '돌아와! 이 미친 짓을 당장 그만둬!', emotion: 'angry' },
          { text: '네가 찾는 그 세계 같은 건 없어. 현실을 봐!', emotion: 'angry' },
          { text: '너까지 이 광기에 빠져들다니... 실망이야.', emotion: 'sad' },
        ],
        en: [
          { text: 'Come back! Stop this madness at once!', emotion: 'angry' },
          { text: 'The world you seek does not exist. Face reality!', emotion: 'angry' },
          { text: "Even you falling into this madness... I'm disappointed.", emotion: 'sad' },
        ],
      },
      pliable: {
        ko: [
          { text: '그 세계에 정말 좋은 것들이 있다면...', emotion: 'neutral' },
          { text: '나도 가보고 싶소. 함께 갑시다!', emotion: 'happy', stat: 'courage', amount: 3 },
          { text: '하지만... 길이 너무 험하지 않소?', emotion: 'fearful' },
        ],
        en: [
          { text: 'If there truly are good things in that world...', emotion: 'neutral' },
          { text: 'I want to go too. Let us journey together!', emotion: 'happy', stat: 'courage', amount: 3 },
          { text: 'But... is the road not too dangerous?', emotion: 'fearful' },
        ],
      },
      help: {
        ko: [
          { text: '이곳은 낙심의 늪이라 하오.', emotion: 'neutral' },
          { text: '많은 순례자들이 이곳에서 빠져 허우적거렸지.', emotion: 'sad' },
          { text: '손을 잡으시오! 내가 끌어올려 주리다.', emotion: 'happy', stat: 'faith', amount: 5 },
        ],
        en: [
          { text: 'This place is called the Slough of Despond.', emotion: 'neutral' },
          { text: 'Many pilgrims have sunk and struggled here.', emotion: 'sad' },
          { text: 'Take my hand! I will pull you out.', emotion: 'happy', stat: 'faith', amount: 5 },
        ],
      },
      worldly_wiseman: {
        ko: [
          { text: '왜 그렇게 힘든 길을 가시오?', emotion: 'neutral' },
          { text: '도덕 마을에 가면 훨씬 편하게 짐을 내릴 수 있소.', emotion: 'neutral' },
          { text: '좁은 문 같은 건 잊으시오. 더 현명한 방법이 있소.', emotion: 'neutral', stat: 'wisdom', amount: -3 },
        ],
        en: [
          { text: 'Why take such a hard road?', emotion: 'neutral' },
          { text: 'In the town of Morality, you can lay down your burden easily.', emotion: 'neutral' },
          { text: 'Forget the Wicket Gate. There is a wiser way.', emotion: 'neutral', stat: 'wisdom', amount: -3 },
        ],
      },
      goodwill: {
        ko: [
          { text: '문을 두드리라, 그리하면 열릴 것이니.', emotion: 'happy', stat: 'faith', amount: 5 },
          { text: '이 문은 영원한 생명으로 향하는 입구라네.', emotion: 'neutral' },
        ],
        en: [
          { text: 'Knock and it shall be opened unto you.', emotion: 'happy', stat: 'faith', amount: 5 },
          { text: 'This gate is the entrance to eternal life.', emotion: 'neutral' },
        ],
      },
      interpreter: {
        ko: [
          { text: '이곳에서 보여주는 것들을 잘 보시오.', emotion: 'neutral' },
          { text: '영적 진리는 눈이 아닌 마음으로 보는 것이오.', emotion: 'determined', stat: 'wisdom', amount: 5 },
        ],
        en: [
          { text: 'Look carefully at what I will show you here.', emotion: 'neutral' },
          { text: 'Spiritual truth is seen not with eyes, but with the heart.', emotion: 'determined', stat: 'wisdom', amount: 5 },
        ],
      },
    };

    const d = dialogues[npcId];
    if (!d) {
      this.gameManager.changeState(GameState.DIALOGUE);
      this.eventBus.emit(GameEvent.DIALOGUE_LINE, {
        text: '...', speaker: name, emotion: 'neutral', tags: [],
      });
      const endListen = () => {
        this.eventBus.off(GameEvent.DIALOGUE_CHOICE_SELECTED, endListen);
        this.eventBus.emit(GameEvent.DIALOGUE_END);
      };
      this.eventBus.on(GameEvent.DIALOGUE_CHOICE_SELECTED, endListen);
      return;
    }

    const lines = ko ? d.ko : d.en;
    const idx = this.fallbackDialogueIndex[npcId] ?? 0;
    const line = lines[idx % lines.length];
    this.fallbackDialogueIndex[npcId] = (idx + 1) % lines.length;

    this.gameManager.changeState(GameState.DIALOGUE);
    this.eventBus.emit(GameEvent.DIALOGUE_LINE, {
      text: line.text, speaker: name, emotion: line.emotion ?? 'neutral', tags: [],
    });

    if (line.stat && line.amount) {
      const sm = ServiceLocator.get<import('../core/StatsManager').StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      sm.change(line.stat as import('../core/GameEvents').StatType, line.amount);
    }

    const endListener = () => {
      this.eventBus.off(GameEvent.DIALOGUE_CHOICE_SELECTED, endListener);
      this.eventBus.emit(GameEvent.DIALOGUE_END);
    };
    this.eventBus.on(GameEvent.DIALOGUE_CHOICE_SELECTED, endListener);
  }

  private showLocationTitle(name: string): void {
    if (this.locationTitle) this.locationTitle.destroy(true);

    const container = this.add.container(GAME_WIDTH / 2, 24).setDepth(300).setScrollFactor(0).setAlpha(0);

    const bg = this.add.graphics();
    const tw = name.length * 10 + 40;
    bg.fillStyle(0x0a0814, 0.6);
    bg.fillRoundedRect(-tw / 2, -12, tw, 24, 4);

    const text = this.add.text(0, 0, name,
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);

    const lw = text.width + 30;
    const line = this.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.4);
    line.lineBetween(-lw / 2, -10, lw / 2, -10);
    line.lineBetween(-lw / 2, 12, lw / 2, 12);

    container.add([bg, line, text]);
    this.locationTitle = container;

    this.tweens.add({
      targets: container, alpha: 1, duration: 800,
      hold: 3000, yoyo: true, ease: 'Sine.easeInOut',
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

  private async transitionToChapter(chapter: number): Promise<void> {
    await DesignSystem.fadeOut(this, 500);
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
      if (vi.interact) input.interact = true;

      if (this.player.nearbyNPC) {
        this.mobileControls.setActionLabel('!');
      } else {
        this.mobileControls.setActionLabel('A');
      }
    }

    this.player.update(input, delta);
    this.interactionZone.update();
    this.hud.update();
    this.dialogueBox.update();
    this.npcs.forEach(npc => npc.update());
    this.miniMap.update(this.player.sprite.x, this.player.sprite.y, this.npcs);
    this.checkMapEvents();
    this.tutorialSystem.checkStuck(this.player.sprite.x, this.player.sprite.y, delta);
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
    this.hud?.destroy();
    this.dialogueBox?.destroy();
    this.toast?.destroy();
    this.transitionOverlay?.destroy();
    this.mobileControls?.destroy();
    this.narrativeDirector?.destroy();
    this.inventoryPanel?.destroy();
    this.tutorialSystem?.destroy();
    this.miniMap?.destroy();
    this.pauseBtn?.destroy(true);
    this.ambientParticles?.destroy();
    this.itemSprites.forEach(s => s.destroy(true));
    this.npcs.forEach(n => n.destroy());
  }
}
