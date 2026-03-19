import Phaser from 'phaser';
import { Entity } from './Entity';
import { PlayerMotor } from './PlayerMotor';
import { PlayerAnimator } from './PlayerAnimator';
import { StateMachine } from '../core/StateMachine';
import { PlayerState, Direction, GameEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { MovementInput } from '../input/InputManager';
import { NPC } from '../entities/NPC';
import { PLAYER } from '../config';

export class Player extends Entity {
  private motor: PlayerMotor;
  private animator: PlayerAnimator;
  private fsm: StateMachine<PlayerState>;
  private direction: Direction = Direction.DOWN;
  private nearbyNPC: NPC | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'christian');

    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);

    this.motor = new PlayerMotor();
    this.animator = new PlayerAnimator(this.sprite);

    this.fsm = new StateMachine<PlayerState>();
    this.fsm
      .addState({ id: PlayerState.IDLE })
      .addState({ id: PlayerState.WALK })
      .addState({
        id: PlayerState.INTERACT,
        onEnter: () => {
          this.sprite.setVelocity(0, 0);
        },
      })
      .addState({
        id: PlayerState.CUTSCENE,
        onEnter: () => {
          this.sprite.setVelocity(0, 0);
        },
      });
    this.fsm.setState(PlayerState.IDLE);

    this.setupEventListeners();
  }

  update(delta: number, input: MovementInput): void {
    if (this.fsm.isState(PlayerState.INTERACT) || this.fsm.isState(PlayerState.CUTSCENE)) {
      this.animator.playIdle(this.direction);
      return;
    }

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const speedMultiplier = gm.stats.getSpeedMultiplier();
    const velocity = this.motor.calculate(input.x, input.y, delta, speedMultiplier);

    this.sprite.setVelocity(velocity.x * PLAYER.BASE_SPEED, velocity.y * PLAYER.BASE_SPEED);

    if (input.x !== 0 || input.y !== 0) {
      this.direction = this.getDirection(input.x, input.y);
      this.fsm.setState(PlayerState.WALK);
      this.animator.playWalk(this.direction);
    } else {
      this.fsm.setState(PlayerState.IDLE);
      this.animator.playIdle(this.direction);
    }

    if (input.interact && this.nearbyNPC) {
      this.fsm.setState(PlayerState.INTERACT);
      EventBus.getInstance().emit(GameEvent.NPC_INTERACT, this.nearbyNPC.id);
    }
  }

  setNearbyNPC(npc: NPC | null): void {
    this.nearbyNPC = npc;
  }

  private getDirection(x: number, y: number): Direction {
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? Direction.RIGHT : Direction.LEFT;
    }
    return y > 0 ? Direction.DOWN : Direction.UP;
  }

  private setupEventListeners(): void {
    const eventBus = EventBus.getInstance();

    eventBus.on(GameEvent.DIALOGUE_START, () => {
      this.fsm.setState(PlayerState.INTERACT);
    });

    eventBus.on(GameEvent.DIALOGUE_END, () => {
      this.fsm.setState(PlayerState.IDLE);
    });
  }

  getBurdenSprite(): string {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const burden = gm.stats.get('burden');
    if (burden === 0) return 'christian_free';
    return 'christian';
  }
}
