import Phaser from 'phaser';
import { FONT_FAMILY } from '../ui/DesignSystem';

/**
 * Companion — an NPC that follows the player during specific chapters.
 * Faithful joins Ch9, Hopeful joins Ch11.
 * Displays contextual encouragement lines and emotional reactions.
 */

export interface CompanionConfig {
  id: string;
  nameKo: string;
  nameEn: string;
  spriteKey: string;
  followDistance?: number;   // px behind player (default 40)
  encouragements?: string[]; // Encouragement lines (Korean)
}

const FAITHFUL_ENCOURAGEMENTS = [
  '"두려워하지 말라, 내가 너와 함께하리라."',
  '"한 걸음씩, 그분이 인도하신다."',
  '"고통은 잠깐이나 영광은 영원하리라."',
  '"포기하지 말라. 시온이 앞에 있다."',
];

const HOPEFUL_ENCOURAGEMENTS = [
  '"조금만 더! 문이 보인다."',
  '"당신의 믿음이 우리를 여기까지 이끌었소."',
  '"강이 깊어도, 바닥은 있을 것이오."',
  '"약속을 붙들라. 약속은 결코 실패하지 않소."',
];

export class Companion {
  private scene: Phaser.Scene;
  private config: CompanionConfig;
  sprite: Phaser.Physics.Arcade.Sprite;

  private speechBubble: Phaser.GameObjects.Container | null = null;
  private emoteGraphics: Phaser.GameObjects.Graphics;
  private bobPhase: number;
  private followDistance: number;
  private visible = true;
  private lastSpeechTime = 0;
  private speechInterval: number;
  private encouragements: string[];

  constructor(scene: Phaser.Scene, config: CompanionConfig, x: number, y: number) {
    this.scene = scene;
    this.config = config;
    this.followDistance = config.followDistance ?? 40;
    this.bobPhase = Math.random() * Math.PI * 2;
    this.encouragements = config.encouragements ?? FAITHFUL_ENCOURAGEMENTS;
    // Speech every 18–30 seconds
    this.speechInterval = 18000 + Math.random() * 12000;

    const genKey = `${config.id}_gen`;
    const texKey = scene.textures.exists(genKey) ? genKey : config.spriteKey;
    this.sprite = scene.physics.add.sprite(x, y, texKey, 0).setDepth(8);

    const animKey = `${texKey}_walk_down`;
    if (scene.anims.exists(animKey)) this.sprite.play(animKey, true);

    this.emoteGraphics = scene.add.graphics().setDepth(13);
  }

  setVisible(v: boolean): void {
    this.visible = v;
    this.sprite.setVisible(v);
    this.emoteGraphics.setVisible(v);
    if (!v) this.clearSpeech();
  }

  /**
   * Called each frame in GameScene.update() with the player's position.
   */
  update(playerX: number, playerY: number, playerFacingLeft: boolean, delta: number): void {
    if (!this.visible) return;

    const t = this.scene.time.now * 0.001;

    // Follow target: behind the player
    const targetX = playerX + (playerFacingLeft ? this.followDistance : -this.followDistance);
    const targetY = playerY;
    const dx = targetX - this.sprite.x;
    const dy = targetY - this.sprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      const speed = Math.min(dist * 3, 80); // px/s
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      this.sprite.setVelocity(vx, vy);
      this.sprite.setFlipX(dx < 0);

      // Walk anim
      const texKey = this.sprite.texture.key;
      const walkAnim = `${texKey}_walk_down`;
      if (this.scene.anims.exists(walkAnim) && !this.sprite.anims.isPlaying) {
        this.sprite.play(walkAnim, true);
      }
    } else {
      this.sprite.setVelocity(0, 0);
      // Idle bob
      const bob = Math.sin(t * 1.4 + this.bobPhase) * 0.5;
      this.sprite.y = targetY + bob;
    }

    // Emote graphics
    this.emoteGraphics.clear();
    this.drawCompanionAura(t);

    // Periodic encouragement speech
    const now = this.scene.time.now;
    if (now - this.lastSpeechTime > this.speechInterval) {
      this.lastSpeechTime = now;
      this.speechInterval = 18000 + Math.random() * 12000;
      this.showEncouragement();
    }

    // Update speech bubble position
    if (this.speechBubble) {
      this.speechBubble.x = this.sprite.x;
      this.speechBubble.y = this.sprite.y - 28;
    }

    // Suppress unused delta warning
    void delta;
  }

  private drawCompanionAura(t: number): void {
    if (!this.visible) return;
    const auraAlpha = 0.03 + Math.sin(t * 1.5) * 0.015;
    const auraColor = this.config.id === 'faithful' ? 0x4466bb : 0x44aa66;
    this.emoteGraphics.fillStyle(auraColor, Math.max(0, auraAlpha));
    this.emoteGraphics.fillCircle(this.sprite.x, this.sprite.y, 12);
  }

  showFearEmote(): void {
    this.showEmoteIcon('!', 0xff4444);
  }

  showJoyEmote(): void {
    this.showEmoteIcon('★', 0xffd700);
  }

  private showEmoteIcon(icon: string, color: number): void {
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const emote = this.scene.add.text(
      this.sprite.x, this.sprite.y - 22, icon, {
        fontSize: '6px', color: hex, fontFamily: FONT_FAMILY, fontStyle: 'bold',
      },
    ).setOrigin(0.5).setDepth(14);

    this.scene.tweens.add({
      targets: emote,
      y: emote.y - 8,
      alpha: 0,
      duration: 800,
      ease: 'Sine.easeOut',
      onComplete: () => emote.destroy(),
    });
  }

  private showEncouragement(): void {
    this.clearSpeech();
    const line = this.encouragements[Math.floor(Math.random() * this.encouragements.length)];
    const container = this.scene.add.container(this.sprite.x, this.sprite.y - 28).setDepth(15);

    const maxW = 120;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0814, 0.88);
    bg.fillRoundedRect(-maxW / 2 - 4, -18, maxW + 8, 22, 5);
    bg.lineStyle(1, 0xd4a853, 0.4);
    bg.strokeRoundedRect(-maxW / 2 - 4, -18, maxW + 8, 22, 5);

    const textObj = this.scene.add.text(0, -8, line, {
      fontSize: '4px',
      color: '#e8e0d0',
      fontFamily: FONT_FAMILY,
      align: 'center',
      wordWrap: { width: maxW },
    }).setOrigin(0.5);

    container.add([bg, textObj]);
    container.setAlpha(0);
    this.speechBubble = container;

    this.scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.scene.time.delayedCall(3500, () => {
          this.scene.tweens.add({
            targets: container,
            alpha: 0,
            duration: 400,
            onComplete: () => {
              container.destroy(true);
              if (this.speechBubble === container) this.speechBubble = null;
            },
          });
        });
      },
    });
  }

  private clearSpeech(): void {
    this.speechBubble?.destroy(true);
    this.speechBubble = null;
  }

  destroy(): void {
    this.clearSpeech();
    this.emoteGraphics.destroy();
    if (this.scene?.tweens) this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.destroy();
  }

  // ── Static factories ──────────────────────────────────────────────────────

  static createFaithful(scene: Phaser.Scene, x: number, y: number): Companion {
    return new Companion(scene, {
      id: 'faithful',
      nameKo: '충실자',
      nameEn: 'Faithful',
      spriteKey: 'faithful',
      followDistance: 36,
      encouragements: FAITHFUL_ENCOURAGEMENTS,
    }, x, y);
  }

  static createHopeful(scene: Phaser.Scene, x: number, y: number): Companion {
    return new Companion(scene, {
      id: 'hopeful',
      nameKo: '소망',
      nameEn: 'Hopeful',
      spriteKey: 'hopeful',
      followDistance: 36,
      encouragements: HOPEFUL_ENCOURAGEMENTS,
    }, x, y);
  }
}
