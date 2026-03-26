import Phaser from 'phaser';

/**
 * Procedural action overlays for the player sprite.
 * These augment the existing idle/walk animation with state-specific
 * visual effects using tweens and graphics — no extra spritesheet frames needed.
 */
export type PlayerActionState =
  | 'idle'
  | 'walk'
  | 'pray'
  | 'hurt'
  | 'celebrate'
  | 'interact'
  | 'attack';

export class ActionAnimations {
  private scene: Phaser.Scene;
  private sprite: Phaser.Physics.Arcade.Sprite;
  private overlay: Phaser.GameObjects.Graphics;
  private currentState: PlayerActionState = 'idle';
  private stateTimer = 0;
  private returnTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, sprite: Phaser.Physics.Arcade.Sprite) {
    this.scene = scene;
    this.sprite = sprite;
    this.overlay = scene.add.graphics().setDepth(12);
  }

  setState(state: PlayerActionState): void {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateTimer = 0;
    this.returnTween?.destroy();
    this.returnTween = null;

    // Reset sprite transform
    this.sprite.setScale(1, 1);
    this.sprite.clearTint();

    switch (state) {
      case 'pray':   this.startPray(); break;
      case 'hurt':   this.startHurt(); break;
      case 'celebrate': this.startCelebrate(); break;
      case 'interact': this.startInteract(); break;
      case 'attack':  this.startAttack(); break;
    }
  }

  getState(): PlayerActionState { return this.currentState; }

  update(delta: number): void {
    this.stateTimer += delta;
    this.overlay.clear();
    this.drawStateOverlay();
  }

  private drawStateOverlay(): void {
    const sx = this.sprite.x;
    const sy = this.sprite.y;
    const t = this.stateTimer * 0.001;

    switch (this.currentState) {
      case 'pray': {
        // Golden aura that pulses
        const pulse = Math.sin(t * 2) * 0.5 + 0.5;
        this.overlay.fillStyle(0xffd700, 0.06 + pulse * 0.06);
        this.overlay.fillCircle(sx, sy, 16 + pulse * 4);
        // Ascending motes
        for (let i = 0; i < 3; i++) {
          const moteT = (t * 0.7 + i * 0.33) % 1;
          const mx = sx + Math.sin(moteT * Math.PI * 2 + i * 2) * 8;
          const my = sy - moteT * 20;
          const ma = moteT < 0.7 ? moteT / 0.7 : (1 - moteT) / 0.3;
          this.overlay.fillStyle(0xffd700, ma * 0.5);
          this.overlay.fillCircle(mx, my, 1.5);
        }
        break;
      }

      case 'hurt': {
        // Red flash vignette around sprite
        const hurtDecay = Math.max(0, 1 - this.stateTimer / 400);
        if (hurtDecay > 0) {
          this.overlay.fillStyle(0xff2200, hurtDecay * 0.3);
          this.overlay.fillCircle(sx, sy, 18);
        } else {
          this.setState('idle');
        }
        break;
      }

      case 'celebrate': {
        // Sparkle ring expanding outward
        const celebPhase = (t * 1.2) % 1;
        const ringR = 5 + celebPhase * 25;
        const ringAlpha = (1 - celebPhase) * 0.4;
        this.overlay.lineStyle(1.5, 0xffd700, ringAlpha);
        this.overlay.strokeCircle(sx, sy, ringR);
        // Stars bursting outward
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + t * 2;
          const starR = 4 + celebPhase * 20;
          const starAlpha = (1 - celebPhase) * 0.6;
          this.overlay.fillStyle(0xffee44, starAlpha);
          this.overlay.fillCircle(
            sx + Math.cos(angle) * starR,
            sy + Math.sin(angle) * starR * 0.6,
            1.5,
          );
        }
        if (this.stateTimer > 1200) this.setState('idle');
        break;
      }

      case 'interact': {
        // Brief directional lean indicator
        const leanDecay = Math.max(0, 1 - this.stateTimer / 300);
        if (leanDecay <= 0) this.setState('idle');
        // Speech bubble dot
        this.overlay.fillStyle(0xd4a853, leanDecay * 0.6);
        this.overlay.fillCircle(sx + 8, sy - 18, 2.5);
        this.overlay.fillStyle(0xd4a853, leanDecay * 0.3);
        this.overlay.fillCircle(sx + 12, sy - 14, 1.5);
        break;
      }

      case 'attack': {
        // Slash arc
        const attackPhase = Math.min(1, this.stateTimer / 200);
        const arc = attackPhase * Math.PI * 0.8;
        const slashAlpha = attackPhase < 0.5 ? attackPhase / 0.5 : (1 - attackPhase) / 0.5;
        this.overlay.lineStyle(2, 0xffd700, slashAlpha * 0.7);
        const startA = -Math.PI * 0.5;
        this.overlay.beginPath();
        this.overlay.arc(sx + (this.sprite.flipX ? -12 : 12), sy, 12, startA, startA + arc);
        this.overlay.strokePath();
        if (this.stateTimer > 300) this.setState('idle');
        break;
      }
    }
  }

  // ── State initiators ──────────────────────────────────────────────────────

  private startPray(): void {
    // Kneel effect: compress Y slightly
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: 0.85,
      scaleX: 1.1,
      duration: 200,
      ease: 'Sine.easeOut',
      yoyo: true,
      repeat: -1,
      repeatDelay: 1800,
    });
  }

  private startHurt(): void {
    // Red flash + knockback squash
    this.sprite.setTint(0xff4444);
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.3,
      scaleY: 0.7,
      duration: 80,
      ease: 'Back.easeOut',
      yoyo: true,
      onComplete: () => {
        this.sprite.clearTint();
        this.sprite.setScale(1, 1);
      },
    });
  }

  private startCelebrate(): void {
    // Jump sequence
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 10,
      duration: 150,
      ease: 'Sine.easeOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => { this.sprite.setScale(1, 1); },
    });
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.15,
      scaleY: 0.9,
      duration: 100,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: 2,
    });
  }

  private startInteract(): void {
    // Lean toward NPC
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + (this.sprite.flipX ? -3 : 3),
      duration: 100,
      ease: 'Sine.easeOut',
      yoyo: true,
    });
  }

  private startAttack(): void {
    // Lunge forward
    const lungeX = this.sprite.flipX ? -8 : 8;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + lungeX,
      duration: 80,
      ease: 'Back.easeOut',
      yoyo: true,
    });
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: 1.2,
      duration: 60,
      yoyo: true,
    });
  }

  destroy(): void {
    this.returnTween?.destroy();
    this.overlay.destroy();
    if (this.scene?.tweens) {
      this.scene.tweens.killTweensOf(this.sprite);
    }
  }
}
