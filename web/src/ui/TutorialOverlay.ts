import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { FONT_FAMILY } from './DesignSystem';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

interface TutorialStep {
  icon: string;
  textKo: string;
  textEn: string;
  key: string;
}

const STEPS: TutorialStep[] = [
  { icon: 'WASD', textKo: '방향키 / WASD로 이동', textEn: 'Arrow keys / WASD to move', key: 'move' },
  { icon: 'E', textKo: 'E키로 NPC와 대화', textEn: 'Press E to talk to NPCs', key: 'interact' },
  { icon: 'SPC', textKo: '스페이스바로 대화 진행', textEn: 'Space to advance dialogue', key: 'dialogue' },
  { icon: 'ESC', textKo: 'ESC로 일시정지', textEn: 'ESC to pause', key: 'pause' },
];

export class TutorialOverlay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private onComplete: () => void;

  constructor(scene: Phaser.Scene, onComplete: () => void) {
    this.scene = scene;
    this.onComplete = onComplete;
    this.container = scene.add.container(0, 0)
      .setDepth(500)
      .setScrollFactor(0);
    this.showStep(0);
  }

  private showStep(index: number): void {
    this.container.removeAll(true);
    if (index >= STEPS.length) {
      this.complete();
      return;
    }
    const step = STEPS[index];
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 + 20;

    // Dim overlay
    const dim = this.scene.add.graphics();
    dim.fillStyle(0x000000, 0.6);
    dim.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Panel
    const panelW = 200;
    const panelH = 80;
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0e0c1e, 0.95);
    panel.fillRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 6);
    panel.lineStyle(1, 0xd4a853, 0.6);
    panel.strokeRoundedRect(cx - panelW / 2, cy - panelH / 2, panelW, panelH, 6);

    // Step indicator
    const stepLabel = `${index + 1} / ${STEPS.length}`;
    const stepTxt = this.scene.add.text(cx + panelW / 2 - 6, cy - panelH / 2 + 6, stepLabel, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '6px',
      color: '#666655',
    }).setOrigin(1, 0);

    // Key icon (big)
    const iconBg = this.scene.add.graphics();
    iconBg.fillStyle(0x1a1830, 1);
    iconBg.fillRoundedRect(cx - panelW / 2 + 10, cy - 18, 36, 36, 4);
    iconBg.lineStyle(1, 0xd4a853, 0.5);
    iconBg.strokeRoundedRect(cx - panelW / 2 + 10, cy - 18, 36, 36, 4);

    const iconFontSize = step.icon.length > 2 ? '6px' : '8px';
    const iconTxt = this.scene.add.text(cx - panelW / 2 + 28, cy, step.icon, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: iconFontSize,
      color: '#d4a853',
    }).setOrigin(0.5);

    // Instruction text
    const label = ko ? step.textKo : step.textEn;
    const instrTxt = this.scene.add.text(
      cx - panelW / 2 + 56,
      cy,
      label,
      {
        fontFamily: ko ? FONT_FAMILY : "'Press Start 2P', monospace",
        fontSize: ko ? '11px' : '6px',
        color: '#e8e0d0',
        wordWrap: { width: panelW - 66 },
        lineSpacing: 3,
      },
    ).setOrigin(0, 0.5);

    // "Tap to continue" hint
    const hintText = ko ? '터치하여 계속...' : 'Tap to continue...';
    const hint = this.scene.add.text(cx, cy + panelH / 2 - 10, hintText, {
      fontFamily: ko ? FONT_FAMILY : "'Press Start 2P', monospace",
      fontSize: ko ? '9px' : '6px',
      color: '#6b5b4f',
    }).setOrigin(0.5);

    this.container.add([dim, panel, stepTxt, iconBg, iconTxt, instrTxt, hint]);
    this.container.setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 300 });

    // Advance on tap/key
    const advance = () => {
      this.scene.tweens.add({
        targets: this.container, alpha: 0, duration: 200,
        onComplete: () => this.showStep(index + 1),
      });
    };
    this.scene.time.delayedCall(400, () => {
      this.scene.input.once('pointerdown', advance);
      this.scene.input.keyboard?.once('keydown-SPACE', advance);
      this.scene.input.keyboard?.once('keydown-ENTER', advance);
      this.scene.input.keyboard?.once('keydown-E', advance);
    });
  }

  private complete(): void {
    this.container.destroy(true);
    this.onComplete();
  }

  destroy(): void {
    this.container.destroy(true);
  }
}
