import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { GameState, GameEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { InteractionZone } from '../entities/InteractionZone';
import { InputManager } from '../input/InputManager';
import { HUD } from '../ui/HUD';
import { DialogueBox } from '../ui/DialogueBox';
import { Toast } from '../ui/Toast';
import { TileMapManager } from '../world/TileMapManager';
import { ChapterManager } from '../world/ChapterManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private interactionZone!: InteractionZone;
  private inputManager!: InputManager;
  private hud!: HUD;
  private dialogueBox!: DialogueBox;
  private toast!: Toast;
  private tileMapManager!: TileMapManager;
  private chapterManager!: ChapterManager;

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  create(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.GAME);

    this.inputManager = new InputManager(this);
    ServiceLocator.register(SERVICE_KEYS.INPUT_MANAGER, this.inputManager);

    this.tileMapManager = new TileMapManager(this);
    this.chapterManager = new ChapterManager(this, this.tileMapManager);

    this.chapterManager.loadChapter(gm.currentChapter);

    const spawnPoint = this.chapterManager.getSpawnPoint();
    this.player = new Player(this, spawnPoint.x, spawnPoint.y);

    this.npcs = this.chapterManager.createNPCs();
    this.interactionZone = new InteractionZone(this, this.player, this.npcs);

    const collisionGroup = this.tileMapManager.getCollisionGroup();
    if (collisionGroup) {
      this.physics.add.collider(this.player.sprite, collisionGroup);
    }

    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(40, 30);

    const mapBounds = this.tileMapManager.getBounds();
    this.cameras.main.setBounds(0, 0, mapBounds.width, mapBounds.height);

    this.hud = new HUD(this);
    this.dialogueBox = new DialogueBox(this);
    this.toast = new Toast(this);

    this.setupEventListeners();
    this.showLocationName();
  }

  update(_time: number, delta: number): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);

    if (gm.isState(GameState.GAME)) {
      const input = this.inputManager.getMovement();
      this.player.update(delta, input);

      for (const npc of this.npcs) {
        npc.update(this.player.sprite.x, this.player.sprite.y);
      }

      this.interactionZone.update();
    }

    this.hud.update();
  }

  private setupEventListeners(): void {
    const eventBus = EventBus.getInstance();

    eventBus.on(GameEvent.NPC_INTERACT, (npcId: unknown) => {
      this.dialogueBox.startDialogue(npcId as string);
    });

    eventBus.on(GameEvent.STAT_CHANGED, (payload: unknown) => {
      const p = payload as { stat: string; amount: number };
      const sign = p.amount > 0 ? '+' : '';
      const statName = p.stat.charAt(0).toUpperCase() + p.stat.slice(1);
      this.toast.show(`${sign}${p.amount} ${statName}!`, 'stat');
    });

    eventBus.on(GameEvent.BIBLE_CARD_COLLECTED, (cardId: unknown) => {
      this.toast.show(`Bible Card collected: ${cardId}`, 'card');
    });
  }

  private showLocationName(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const name = this.chapterManager.getLocationName(gm.language);
    const cx = GAME_WIDTH / 2;

    const locationText = this.add
      .text(cx, 20, name, {
        fontSize: '10px',
        color: '#E6C86E',
        fontFamily: 'serif',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0);

    this.tweens.add({
      targets: locationText,
      alpha: 1,
      duration: 1000,
      hold: 2000,
      yoyo: true,
      onComplete: () => locationText.destroy(),
    });
  }
}
