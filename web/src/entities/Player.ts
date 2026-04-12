import { Entity } from './Entity';
import { PlayerMotor } from './PlayerMotor';
import { PlayerAnimator } from './PlayerAnimator';
import { ActionAnimations } from './ActionAnimations';
import { StateMachine } from '../core/StateMachine';
import { PlayerState, GameEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { NPC } from './NPC';
import { CharacterSpriteFactory } from './CharacterSpriteFactory';

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
  private hurtFlashTimer = 0;
  private hurtFlashCount = 0;
  private lastMoveX = 0;
  private lastMoveY = 0;
  private idleVariantTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    let texKey: string;
    if (scene.textures.exists('christian_gen')) {
      texKey = 'christian_gen';
    } else if (scene.textures.exists('christian')) {
      texKey = 'christian';
    } else {
      texKey = CharacterSpriteFactory.generate(scene, 'christian');
    }
    super(scene, x, y, texKey, 0);
    this.baseY = y;
    this.setupEvents();

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
    EventBus.getInstance().on(GameEvent.PLAYER_DAMAGED, this.onDamaged);
  }

  override destroy(): void {
    EventBus.getInstance().off(GameEvent.PLAYER_DAMAGED, this.onDamaged);
    this.actionAnimations.destroy();
    super.destroy();
  }

  private enterHurt(): void {
    this.fsm.setState(PlayerState.HURT);
    this.sprite.setVelocity(0, 0);
    this.hurtTimer = 480;
    this.hurtFlashCount = 0;
    this.hurtFlashTimer = 0;
    // Squash — sharper compression than walk (weight of impact)
    this.squashProfile(0.75, 1.28, 100, 'Bounce.easeOut');
    // Knock-back micro-jitter based on last movement direction
    const jx = this.lastMoveX !== 0 ? -Math.sign(this.lastMoveX) * 8 : (Math.random() > 0.5 ? 6 : -6);
    const jy = this.lastMoveY !== 0 ? -Math.sign(this.lastMoveY) * 4 : -4;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + jx, y: this.sprite.y + jy,
      duration: 60, yoyo: true, ease: 'Quad.easeOut',
    });
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

    // ── Hurt state: white strobe flash (5 blinks, then clear) ───────────────
    if (state === PlayerState.HURT) {
      this.hurtTimer -= delta;
      this.hurtFlashTimer -= delta;
      if (this.hurtFlashTimer <= 0 && this.hurtFlashCount < 6) {
        this.hurtFlashTimer = 60;
        this.hurtFlashCount++;
        // Alternate white → tinted red (SANABI-style hit flash)
        if (this.hurtFlashCount % 2 === 1) {
          this.sprite.setTint(0xffffff);
        } else {
          this.sprite.setTint(0xff4444);
        }
      }
      if (this.hurtTimer <= 0) {
        this.sprite.clearTint();
        this.sprite.setScale(1, 1);
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
      this.lastMoveX = input.x;
      this.lastMoveY = input.y;
      this.idleVariantTimer = 0;
      if (!this.wasMoving) {
        // Walk start: anticipation lean (slightly wider, taller before stride)
        this.squashProfile(1.08, 0.92, 60, 'Sine.easeOut');
      }
      this.fsm.setState(PlayerState.WALK);
      this.motor.update(this.sprite, input.x, input.y, delta);
      this.baseY = this.sprite.y;
      this.spawnDustParticles(delta, input.x, input.y);
    } else {
      if (this.wasMoving) {
        // Walk stop: landing compression + rebound
        this.squashProfile(1.14, 0.86, 80, 'Bounce.easeOut');
        this.baseY = this.sprite.y;
      }
      this.fsm.setState(PlayerState.IDLE);
      this.sprite.setVelocity(0, 0);
      this.applyIdleBob(delta);
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

  /**
   * Squash-and-stretch with explicit ease and profile control.
   * sx/sy: target scale. duration: full cycle. ease: easing name.
   */
  private squashProfile(sx: number, sy: number, duration: number, ease: string): void {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: sx, scaleY: sy,
      duration: duration / 2,
      yoyo: true,
      ease,
      onComplete: () => {
        // Snap to 1,1 cleanly after yoyo
        this.sprite.setScale(1, 1);
      },
    });
  }

  private applyIdleBob(delta: number): void {
    const t = this.scene.time.now * 0.002;
    // Primary bob
    const bob = Math.sin(t) * 0.35;
    // Secondary sway (weight shift) — slower, half amplitude
    const sway = Math.sin(t * 0.55) * 0.18;
    this.sprite.y = this.baseY + bob;
    this.sprite.x = this.sprite.x + sway * 0.05;  // negligible x drift

    // Occasional idle "look around" scale pulse (every ~4s)
    this.idleVariantTimer += delta;
    if (this.idleVariantTimer > 4000) {
      this.idleVariantTimer = 0;
      // Subtle head-nod: micro squash
      this.scene.tweens.add({
        targets: this.sprite,
        scaleY: 0.97, scaleX: 1.02,
        duration: 120, yoyo: true,
        ease: 'Sine.easeInOut',
      });
    }
  }

  /**
   * Spawn directional dust particles on walk, synced by timer.
   * Particles trail behind movement direction with varied sizes.
   */
  private spawnDustParticles(delta: number, dx: number, dy: number): void {
    this.dustTimer += delta;
    // Threshold ~200ms — roughly 2 steps per second at normal speed
    if (this.dustTimer < 200) return;
    this.dustTimer = 0;

    const px = this.sprite.x;
    const py = this.sprite.y + 7;
    // Trail offset: dust spawns behind the player's movement direction
    const trailX = -dx * 3;
    const trailY = -dy * 2;

    const dustColors = [0x9a8870, 0x8a7860, 0xaa9880];
    const count = 2 + Math.floor(Math.random() * 2);  // 2–3 particles

    for (let i = 0; i < count; i++) {
      const baseColor = dustColors[Math.floor(Math.random() * dustColors.length)];
      const radius = 0.8 + Math.random() * 1.5;
      const dust = this.scene.add.circle(
        px + trailX + (Math.random() - 0.5) * 5,
        py + trailY + Math.random() * 2,
        radius,
        baseColor,
        0.28 + Math.random() * 0.12,
      ).setDepth(8);

      // First: expand outward briefly, then fade + settle
      this.scene.tweens.add({
        targets: dust,
        y: dust.y - 2 - Math.random() * 4,
        x: dust.x + (Math.random() - 0.5) * 4,
        alpha: { from: dust.alpha, to: 0 },
        scaleX: { from: 1, to: 0.2 + Math.random() * 0.3 },
        scaleY: { from: 1, to: 0.2 + Math.random() * 0.3 },
        duration: 280 + Math.random() * 200,
        ease: 'Sine.easeOut',
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
