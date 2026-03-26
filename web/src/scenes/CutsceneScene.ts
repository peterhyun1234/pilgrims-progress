import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { DesignSystem } from '../ui/DesignSystem';

interface CutsceneStep {
  text: string;
  textEn?: string;
  duration?: number;
  style?: 'normal' | 'bold' | 'dim';
}

interface CutsceneData {
  id: string;
  steps: CutsceneStep[];
  bgColor?: number;
  returnScene?: string;
}

export class CutsceneScene extends Phaser.Scene {
  private currentStepIndex = 0;
  private steps: CutsceneStep[] = [];
  private textObject!: Phaser.GameObjects.Text;
  private returnScene: string = SCENE_KEYS.GAME;
  private eventBus!: EventBus;
  private autoTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super(SCENE_KEYS.CUTSCENE);
  }

  init(data?: CutsceneData): void {
    this.steps = data?.steps ?? [];
    this.returnScene = data?.returnScene ?? SCENE_KEYS.GAME;
    this.currentStepIndex = 0;
  }

  create(): void {
    this.eventBus = EventBus.getInstance();
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.CUTSCENE);

    this.cameras.main.setBackgroundColor(COLORS.UI.DARK_BG);
    DesignSystem.fadeIn(this, 600);

    this.textObject = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      ...DesignSystem.textStyle(DesignSystem.FONT_SIZE.LG, '#e8e0d0'),
      wordWrap: { width: GAME_WIDTH - 80 },
      align: 'center',
      lineSpacing: 10,
    }).setOrigin(0.5).setAlpha(0);

    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20,
      gm.i18n.t('cutscene.touchContinue'),
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: hint, alpha: 0.5, delay: 2000, duration: 500, ease: 'Sine.easeOut' });

    this.input.on('pointerdown', () => this.advanceStep());
    this.input.keyboard?.on('keydown-SPACE', () => this.advanceStep());
    this.input.keyboard?.on('keydown-ENTER', () => this.advanceStep());

    if (this.steps.length > 0) {
      this.showStep(0);
    } else {
      this.endCutscene();
    }
  }

  private showStep(index: number): void {
    if (index >= this.steps.length) {
      this.endCutscene();
      return;
    }

    this.currentStepIndex = index;
    const step = this.steps[index];

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const text = gm.language === 'ko' ? step.text : (step.textEn ?? step.text);

    const color = step.style === 'bold' ? '#d4a853'
                : step.style === 'dim' ? '#6b5b4f'
                : '#e8e0d0';
    this.textObject.setColor(color);

    this.textObject.setText(text);
    this.textObject.setAlpha(0).setScale(0.95);

    this.tweens.add({
      targets: this.textObject,
      alpha: 1, scaleX: 1, scaleY: 1,
      duration: 600, ease: 'Sine.easeOut',
    });

    if (step.duration) {
      this.autoTimer?.remove();
      this.autoTimer = this.time.delayedCall(step.duration, () => this.advanceStep());
    }
  }

  private advanceStep(): void {
    this.autoTimer?.remove();
    this.autoTimer = null;

    const next = this.currentStepIndex + 1;
    if (next >= this.steps.length) {
      this.endCutscene();
      return;
    }

    this.tweens.add({
      targets: this.textObject,
      alpha: 0, duration: 200, ease: 'Sine.easeIn',
      onComplete: () => this.showStep(next),
    });
  }

  private async endCutscene(): Promise<void> {
    await DesignSystem.fadeOut(this, 500);
    this.eventBus.emit(GameEvent.MAP_EVENT, { type: 'cutscene_end' });
    this.scene.start(this.returnScene);
  }
}
