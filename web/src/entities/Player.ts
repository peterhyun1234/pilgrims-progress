import { Entity } from './Entity';
import { PlayerMotor } from './PlayerMotor';
import { PlayerAnimator } from './PlayerAnimator';
import { ActionAnimations } from './ActionAnimations';
import { StateMachine } from '../core/StateMachine';
import { PlayerState, GameEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { NPC } from './NPC';

export interface PlayerInput {
  x: number;
  y: number;
  interact: boolean;
}

export class Player extends Entity {
  private motor: PlayerMotor;
  private animator: PlayerAnimator;
  private actionAnimations: ActionAnimations;
  private fsm: StateMachine<PlayerState>;
  public nearbyNPC: NPC | null = null;

  private wasMoving = false;
  private dustTimer = 0;
  private baseY = 0;
  private hurtTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Use generated 32×32 sprite if available, fallback to legacy
    const texKey = scene.textures.exists('christian_gen') ? 'christian_gen' : 'christian';
    super(scene, x, y, texKey, 0);
    this.baseY = y;
    this.setupEvents();

    // Hitbox sized for gameplay collision (smaller than visual)
    this.sprite.setSize(12, 12).setOffset(10, 18);
    this.sprite.setDepth(10);

    this.motor = new PlayerMotor();
    this.animator = new PlayerAnimator(this.sprite, texKey);
    this.actionAnimations = new ActionAnimations(scene, this.sprite);

    this.fsm = new StateMachine<PlayerState>();
    this.fsm
      .addState({ id: PlayerState.IDLE })
      .addState({ id: PlayerState.WALK })
      .addState({ id: PlayerState.RUN })
      .addState({ id: PlayerState.INTERACT })
      .addState({ id: PlayerState.CUTSCENE })
      .addState({ id: PlayerState.HURT })
      .addState({ id: PlayerState.PRAY })
      .addState({ id: PlayerState.CELEBRATE })
      .addState({ id: PlayerState.FALL });
    this.fsm.setState(PlayerState.IDLE);
  }

  private onDamaged = () => {
    if (!this.scene.scene.isActive()) return;
    this.enterHurt();
  };

  private setupEvents(): void {
    const eventBus = EventBus.getInstance();
    eventBus.on(GameEvent.PLAYER_DAMAGED, this.onDamaged);
  }

  override destroy(): void {
    EventBus.getInstance().off(GameEvent.PLAYER_DAMAGED, this.onDamaged);
    this.actionAnimations.destroy();
    super.destroy();
  }

  private enterHurt(): void {
    this.fsm.setState(PlayerState.HURT);
    this.sprite.setVelocity(0, 0);
    this.sprite.setTint(0xff4444);
    this.hurtTimer = 400;
    this.squash(0.8, 1.2, 150);
  }

  enterPray(): void {
    this.fsm.setState(PlayerState.PRAY);
    this.sprite.setVelocity(0, 0);
  }

  exitPray(): void {
    if (this.fsm.current === PlayerState.PRAY) {
      this.fsm.setState(PlayerState.IDLE);
    }
  }

  update(input: PlayerInput, delta: number): void {
    const state = this.fsm.current;

    if (state === PlayerState.HURT) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.sprite.clearTint();
        this.fsm.setState(PlayerState.IDLE);
      }
      return;
    }

    if (state === PlayerState.PRAY) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    if (state === PlayerState.CUTSCENE || state === PlayerState.INTERACT) {
      this.sprite.setVelocity(0, 0);
      return;
    }

    const isMoving = input.x !== 0 || input.y !== 0;

    if (isMoving) {
      if (!this.wasMoving) {
        this.squash(0.85, 1.15, 80);
      }
      this.fsm.setState(PlayerState.WALK);
      this.motor.update(this.sprite, input.x, input.y, delta);
      this.baseY = this.sprite.y;
      this.spawnDustParticles(delta);
    } else {
      if (this.wasMoving) {
        this.squash(1.1, 0.9, 100);
        this.baseY = this.sprite.y;
      }
      this.fsm.setState(PlayerState.IDLE);
      this.sprite.setVelocity(0, 0);
      this.applyIdleBob();
    }
    this.wasMoving = isMoving;

    if (input.interact && this.nearbyNPC) {
      this.fsm.setState(PlayerState.INTERACT);
      this.sprite.setVelocity(0, 0);
      this.nearbyNPC.interact();
    }

    this.animator.update(
      this.fsm.current!,
      this.sprite.body!.velocity.x,
      this.sprite.body!.velocity.y,
    );

    // Sync ActionAnimations overlay with player FSM state
    const stateMap: Partial<Record<PlayerState, import('./ActionAnimations').PlayerActionState>> = {
      [PlayerState.PRAY]:      'pray',
      [PlayerState.HURT]:      'hurt',
      [PlayerState.CELEBRATE]: 'celebrate',
      [PlayerState.INTERACT]:  'interact',
    };
    const actionState = stateMap[this.fsm.current!] ?? 'idle';
    this.actionAnimations.setState(actionState);
    this.actionAnimations.update(delta);
  }

  private squash(sx: number, sy: number, duration: number): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: sx, scaleY: sy,
      duration: duration / 2,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  }

  private applyIdleBob(): void {
    const t = this.scene.time.now * 0.002;
    const bob = Math.sin(t) * 0.3;
    this.sprite.y = this.baseY + bob;
  }

  private spawnDustParticles(delta: number): void {
    this.dustTimer += delta;
    if (this.dustTimer < 220) return;
    this.dustTimer = 0;

    const px = this.sprite.x;
    const py = this.sprite.y + 6;

    for (let i = 0; i < 2; i++) {
      const dust = this.scene.add.circle(
        px + (Math.random() - 0.5) * 6,
        py + Math.random() * 2,
        1 + Math.random() * 1.2,
        0x888877, 0.3,
      ).setDepth(8);

      this.scene.tweens.add({
        targets: dust,
        y: dust.y - 3 - Math.random() * 3,
        alpha: 0,
        scaleX: 0.3,
        scaleY: 0.3,
        duration: 350 + Math.random() * 200,
        onComplete: () => dust.destroy(),
      });
    }
  }

  override setPosition(x: number, y: number): void {
    super.setPosition(x, y);
    this.baseY = y;
  }

  getState(): PlayerState | null {
    return this.fsm.current;
  }

  enterCutscene(): void {
    this.fsm.setState(PlayerState.CUTSCENE);
    this.sprite.setVelocity(0, 0);
  }

  exitCutscene(): void {
    this.fsm.setState(PlayerState.IDLE);
  }

  exitInteract(): void {
    if (this.fsm.current === PlayerState.INTERACT) {
      this.fsm.setState(PlayerState.IDLE);
    }
  }
}
