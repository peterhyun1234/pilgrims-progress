import { GAME_WIDTH, GAME_HEIGHT, COLORS, DIALOGUE } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, DialogueLinePayload, DialogueChoicePayload, GameState, PortraitEmotion } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from './DesignSystem';
import { PortraitRenderer } from './PortraitRenderer';
import { PORTRAIT_CONFIGS } from '../narrative/data/portraitData';

type TextEffect = 'none' | 'shake' | 'wave' | 'glow';

export class DialogueBox {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private speakerBg!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: Phaser.GameObjects.Text;
  private continuePrompt!: Phaser.GameObjects.Text;
  private portraitBg!: Phaser.GameObjects.Graphics;
  private portraitImage: Phaser.GameObjects.RenderTexture | null = null;
  private sceneBg!: Phaser.GameObjects.Graphics;

  private portraitRenderer: PortraitRenderer;
  private choiceContainers: Phaser.GameObjects.Container[] = [];
  private dimOverlay: Phaser.GameObjects.Rectangle | null = null;
  private choiceKeyHandlers: (() => void)[] = [];

  private eventBus: EventBus;
  private isVisible = false;
  private isTyping = false;
  private fullText = '';
  private typingTimer: Phaser.Time.TimerEvent | null = null;
  private currentCharIndex = 0;
  private typingSpeed: number = DIALOGUE.TYPING_SPEED_NORMAL;
  private currentTextEffect: TextEffect = 'none';
  private emotionState: PortraitEmotion = 'neutral';
  private currentSpeakerId = '';
  private previousState: GameState = GameState.GAME;
  private advanceHandler: (() => void) | null = null;

  private static readonly BOX_W = 430;
  private static readonly BOX_H = 80;
  private static readonly BOX_X = (GAME_WIDTH - 430) / 2;
  private static readonly BOX_Y = GAME_HEIGHT - 92;
  private static readonly PORTRAIT_S = 56;
  private static readonly TEXT_X = 68;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.eventBus = EventBus.getInstance();
    this.portraitRenderer = new PortraitRenderer(scene);
    this.container = scene.add.container(0, 0).setDepth(200).setScrollFactor(0).setVisible(false);
    this.buildUI();
    this.setupEvents();
    this.setupInput();
  }

  private buildUI(): void {
    const { BOX_X: bx, BOX_Y: by, BOX_W: bw, BOX_H: bh } = DialogueBox;

    this.sceneBg = this.scene.add.graphics();
    this.container.add(this.sceneBg);

    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x12101e, 0.97);
    this.bg.fillRoundedRect(bx, by, bw, bh, 6);
    this.bg.lineStyle(1.5, COLORS.UI.PANEL_BORDER, 0.5);
    this.bg.strokeRoundedRect(bx, by, bw, bh, 6);
    this.bg.fillStyle(COLORS.UI.GOLD, 0.04);
    this.bg.fillRoundedRect(bx + 1, by + 1, bw - 2, bh - 2, 5);
    this.bg.lineStyle(0.5, COLORS.UI.GOLD, 0.12);
    this.bg.strokeRoundedRect(bx + 3, by + 3, bw - 6, bh - 6, 4);

    this.portraitBg = this.scene.add.graphics();
    this.drawPortraitFrame(COLORS.UI.GOLD);

    this.speakerBg = this.scene.add.graphics();

    this.speakerText = this.scene.add.text(bx + DialogueBox.TEXT_X + 4, by + 6, '',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    );

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const dialogueFontSize = gm.language === 'ko' ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.BASE;
    this.dialogueText = this.scene.add.text(bx + DialogueBox.TEXT_X, by + 24, '', {
      ...DesignSystem.textStyle(dialogueFontSize, '#e8e0d0'),
      wordWrap: { width: bw - DialogueBox.TEXT_X - 16 },
      lineSpacing: 4,
    });

    this.continuePrompt = this.scene.add.text(bx + bw - 16, by + bh - 14, '▼',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5).setVisible(false);
    this.scene.tweens.add({
      targets: this.continuePrompt, y: this.continuePrompt.y + 3,
      duration: 500, yoyo: true, repeat: -1,
    });

    this.container.add([
      this.bg, this.portraitBg, this.speakerBg,
      this.speakerText, this.dialogueText, this.continuePrompt,
    ]);
  }

  private drawPortraitFrame(borderColor: number): void {
    const { BOX_X: bx, BOX_Y: by, BOX_H: bh, PORTRAIT_S: ps } = DialogueBox;
    this.portraitBg.clear();
    this.portraitBg.fillStyle(0x0e0c18, 0.8);
    this.portraitBg.fillRoundedRect(bx + 5, by + (bh - ps) / 2, ps, ps, 4);
    this.portraitBg.lineStyle(1.5, borderColor, 0.6);
    this.portraitBg.strokeRoundedRect(bx + 5, by + (bh - ps) / 2, ps, ps, 4);
  }

  private onDialogueLine = (p: DialogueLinePayload | undefined) => { if (p) this.showLine(p); };
  private onDialogueChoice = (p: DialogueChoicePayload | undefined) => { if (p) this.showChoices(p); };
  private onDialogueEnd = () => this.hide();

  private setupEvents(): void {
    this.eventBus.on(GameEvent.DIALOGUE_LINE, this.onDialogueLine);
    this.eventBus.on(GameEvent.DIALOGUE_CHOICE, this.onDialogueChoice);
    this.eventBus.on(GameEvent.DIALOGUE_END, this.onDialogueEnd);
  }

  private setupInput(): void {
    this.advanceHandler = () => {
      if (!this.isVisible) return;
      if (this.isTyping) this.completeTyping();
      else if (this.choiceContainers.length === 0)
        this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, -1);
    };
    this.scene.input.on('pointerdown', this.advanceHandler);
    this.scene.input.keyboard?.on('keydown-SPACE', this.advanceHandler);
    this.scene.input.keyboard?.on('keydown-ENTER', this.advanceHandler);
  }

  private showLine(payload: DialogueLinePayload): void {
    this.show();
    this.clearChoices();

    const speaker = payload.speaker ?? '';
    this.speakerText.setText(speaker);

    const hasSpeaker = !!speaker;
    this.speakerBg.clear();
    if (hasSpeaker) {
      const { BOX_X: bx, BOX_Y: by, TEXT_X: tx } = DialogueBox;
      const sw = this.speakerText.width + 12;
      this.speakerBg.fillStyle(COLORS.UI.GOLD, 0.12);
      this.speakerBg.fillRoundedRect(bx + tx, by + 2, sw, 18, 3);
    }

    const rawEmotion = payload.emotion ?? 'neutral';
    this.emotionState = this.mapEmotion(rawEmotion);

    const emotionColors: Record<string, number> = {
      angry: 0xff4444, happy: 0xffd700, sad: 0x5577cc,
      fearful: 0x9944aa, neutral: COLORS.UI.GOLD, determined: 0x44aa44,
      surprised: 0xff8800,
    };
    this.drawPortraitFrame(emotionColors[this.emotionState] ?? COLORS.UI.GOLD);

    this.resolveSpeakerId(speaker);
    this.updatePortrait();
    this.updateSceneMood();

    for (const tag of payload.tags) {
      const t = tag.trim();
      if (t.startsWith('TYPING:')) {
        const sp = t.split(':')[1]?.trim();
        const speeds: Record<string, number> = { slow: 80, fast: 20, dramatic: 200, instant: 0 };
        this.typingSpeed = speeds[sp] ?? DIALOGUE.TYPING_SPEED_NORMAL;
      } else if (t.startsWith('TEXT_EFFECT:')) {
        this.currentTextEffect = (t.split(':')[1]?.trim() as TextEffect) || 'none';
      }
    }

    this.fullText = payload.text;
    this.dialogueText.setText('');
    this.currentCharIndex = 0;
    this.isTyping = true;
    this.continuePrompt.setVisible(false);
    this.startTyping();
  }

  private mapEmotion(raw: string): PortraitEmotion {
    const map: Record<string, PortraitEmotion> = {
      neutral: 'neutral', happy: 'happy', joyful: 'happy', joy: 'happy',
      angry: 'angry', anger: 'angry', mad: 'angry',
      sad: 'sad', sorrow: 'sad', melancholy: 'sad',
      fearful: 'fearful', fear: 'fearful', scared: 'fearful', afraid: 'fearful',
      surprised: 'surprised', shock: 'surprised',
      determined: 'determined', resolve: 'determined', brave: 'determined',
    };
    return map[raw] ?? 'neutral';
  }

  private resolveSpeakerId(speaker: string): void {
    const nameMap: Record<string, string> = {
      '전도자': 'evangelist', 'Evangelist': 'evangelist',
      '완고': 'obstinate', 'Obstinate': 'obstinate',
      '유연': 'pliable', 'Pliable': 'pliable',
      '도움': 'help', 'Help': 'help',
      '세속 현자': 'worldly_wiseman', 'Worldly Wiseman': 'worldly_wiseman',
      '선의': 'goodwill', 'Good-will': 'goodwill',
      '해석자': 'interpreter', 'Interpreter': 'interpreter',
      '크리스천': 'christian', 'Christian': 'christian',
    };
    this.currentSpeakerId = nameMap[speaker] ?? '';
  }

  private updatePortrait(): void {
    // Remove previous portrait from container WITHOUT destroying it
    // (PortraitRenderer owns the cached RenderTextures)
    if (this.portraitImage) {
      this.container.remove(this.portraitImage, false);
      this.portraitImage = null;
    }

    if (!this.currentSpeakerId || !PORTRAIT_CONFIGS[this.currentSpeakerId]) {
      if (this.currentSpeakerId && this.scene.textures.exists(this.currentSpeakerId)) {
        const { BOX_X: bx, BOX_Y: by, BOX_H: bh, PORTRAIT_S: ps } = DialogueBox;
        const sprite = this.scene.add.sprite(
          bx + 5 + ps / 2, by + bh / 2, this.currentSpeakerId, 0,
        ).setScale(2.5).setDepth(201);
        this.container.add(sprite);
        this.portraitImage = sprite as unknown as Phaser.GameObjects.RenderTexture;
      }
      return;
    }

    const rt = this.portraitRenderer.getPortrait(this.currentSpeakerId, this.emotionState);
    if (rt) {
      const { BOX_X: bx, BOX_Y: by, BOX_H: bh, PORTRAIT_S: ps } = DialogueBox;
      rt.setPosition(bx + 5, by + (bh - ps) / 2);
      rt.setOrigin(0, 0).setScrollFactor(0);
      rt.setVisible(true).setDepth(201);
      this.container.add(rt);
      this.portraitImage = rt;
    }
  }

  private updateSceneMood(): void {
    this.sceneBg.clear();

    const moodColors: Record<PortraitEmotion, { color: number; alpha: number }> = {
      neutral: { color: 0x1a1428, alpha: 0 },
      happy: { color: 0xffd700, alpha: 0.03 },
      angry: { color: 0xff0000, alpha: 0.04 },
      sad: { color: 0x2244aa, alpha: 0.04 },
      fearful: { color: 0x440066, alpha: 0.05 },
      surprised: { color: 0xff8800, alpha: 0.03 },
      determined: { color: 0x44aa44, alpha: 0.03 },
    };

    const mood = moodColors[this.emotionState];
    if (mood.alpha > 0) {
      const { BOX_X: bx, BOX_Y: by, BOX_W: bw, BOX_H: bh } = DialogueBox;
      this.sceneBg.fillStyle(mood.color, mood.alpha);
      this.sceneBg.fillRoundedRect(bx, by - 8, bw, bh + 8, 8);
    }
  }

  private startTyping(): void {
    if (this.typingSpeed === 0) {
      this.dialogueText.setText(this.fullText);
      this.isTyping = false;
      this.continuePrompt.setVisible(true);
      return;
    }
    this.typeNextChar();
  }

  private typeNextChar(): void {
    if (this.currentCharIndex >= this.fullText.length) {
      this.isTyping = false;
      this.continuePrompt.setVisible(true);
      this.typingTimer?.remove();
      this.typingTimer = null;
      return;
    }
    const char = this.fullText[this.currentCharIndex];
    this.currentCharIndex++;
    this.dialogueText.setText(this.fullText.substring(0, this.currentCharIndex));

    let delay = this.typingSpeed;
    if (char === '.' || char === '!' || char === '?') delay = this.typingSpeed * 5;
    else if (char === ',') delay = this.typingSpeed * 2.5;
    else if (char === ' ') delay = this.typingSpeed * 0.5;

    this.typingTimer?.remove();
    this.typingTimer = this.scene.time.delayedCall(delay, () => this.typeNextChar());
  }

  private completeTyping(): void {
    this.typingTimer?.remove();
    this.typingTimer = null;
    this.dialogueText.setText(this.fullText);
    this.isTyping = false;
    this.continuePrompt.setVisible(true);
  }

  private showChoices(payload: DialogueChoicePayload): void {
    this.clearChoices();
    this.continuePrompt.setVisible(false);
    const isHeavy = payload.weight === 'heavy' || payload.weight === 'critical';
    if (isHeavy) this.showDimOverlay();

    const { BOX_X: bx, BOX_Y: by, BOX_W: bw } = DialogueBox;
    const choiceH = 22;
    const gap = 5;
    const total = payload.choices.length * (choiceH + gap);
    const startY = by - total - 6;

    payload.choices.forEach((choice, i) => {
      const delay = isHeavy ? (i + 1) * 400 : i * 100;
      this.scene.time.delayedCall(delay, () => {
        const cy = startY + i * (choiceH + gap);
        const c = this.scene.add.container(bx + 10, cy + 4).setAlpha(0);
        const w = bw - 20;

        const cbg = this.scene.add.graphics();
        const defaultColor = choice.isHidden ? 0x2a2040 : COLORS.UI.BUTTON_DEFAULT;
        const bdrClr = choice.isHidden ? COLORS.UI.GOLD : 0x444444;
        cbg.fillStyle(defaultColor, 0.92);
        cbg.fillRoundedRect(0, 0, w, choiceH, 4);
        cbg.lineStyle(1, bdrClr, 0.5);
        cbg.strokeRoundedRect(0, 0, w, choiceH, 4);

        const isLocked = choice.requiredStat !== undefined
          && (ServiceLocator.get<import('../core/StatsManager').StatsManager>(SERVICE_KEYS.STATS_MANAGER)
            .get(choice.requiredStat as import('../core/GameEvents').StatType) < (choice.requiredValue ?? 0));
        const prefix = isLocked ? '🔒 ' : (choice.isHidden ? '★ ' : `${i + 1}. `);
        const textColor = isLocked ? '#555555' : (choice.isHidden ? '#d4a853' : '#d0c8b8');
        const txt = this.scene.add.text(w / 2, choiceH / 2, prefix + choice.text,
          DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, textColor),
        ).setOrigin(0.5).setAlpha(isLocked ? 0.5 : 1);

        c.add([cbg, txt]);

        const hz = this.scene.add.rectangle(w / 2, choiceH / 2, w, choiceH, 0, 0)
          .setInteractive({ useHandCursor: true });
        hz.on('pointerover', () => {
          cbg.clear();
          cbg.fillStyle(COLORS.UI.BUTTON_HOVER, 0.95);
          cbg.fillRoundedRect(0, 0, w, choiceH, 4);
          cbg.lineStyle(1.5, COLORS.UI.GOLD, 0.8);
          cbg.strokeRoundedRect(0, 0, w, choiceH, 4);
        });
        hz.on('pointerout', () => {
          cbg.clear();
          cbg.fillStyle(defaultColor, 0.92);
          cbg.fillRoundedRect(0, 0, w, choiceH, 4);
          cbg.lineStyle(1, bdrClr, 0.5);
          cbg.strokeRoundedRect(0, 0, w, choiceH, 4);
        });
        hz.on('pointerdown', () => {
          this.scene.tweens.add({
            targets: c, scaleX: 1.02, scaleY: 1.02, duration: 50, yoyo: true,
            onComplete: () => {
              this.hideDimOverlay();
              this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, choice.index);
            },
          });
        });
        c.add(hz);

        this.scene.tweens.add({
          targets: c, alpha: 1, y: cy, duration: isHeavy ? 350 : 150,
          ease: 'Back.easeOut',
        });
        this.choiceContainers.push(c);
        this.container.add(c);

        // Keyboard shortcut: press number key to select
        const keyCode = `ONE TWO THREE FOUR FIVE`.split(' ')[i];
        if (keyCode) {
          const handler = () => {
            if (this.choiceContainers.length === 0) return;
            this.clearChoices();
            this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, choice.index);
          };
          this.scene.input.keyboard?.on(`keydown-${keyCode}`, handler);
          this.choiceKeyHandlers.push(handler);
          // Store key name for cleanup
          (handler as unknown as Record<string, string>).__key = keyCode;
        }
      });
    });
  }

  private clearChoices(): void {
    this.choiceContainers.forEach(c => c.destroy(true));
    this.choiceContainers = [];
    this.hideDimOverlay();
    const keys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
    this.choiceKeyHandlers.forEach((h, i) => {
      this.scene.input.keyboard?.off(`keydown-${keys[i]}`, h);
    });
    this.choiceKeyHandlers = [];
  }

  private showDimOverlay(): void {
    if (this.dimOverlay) return;
    this.dimOverlay = this.scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0,
    ).setDepth(199).setScrollFactor(0);
    this.scene.tweens.add({ targets: this.dimOverlay, alpha: 0.4, duration: 400 });
  }

  private hideDimOverlay(): void {
    if (!this.dimOverlay) return;
    this.scene.tweens.add({
      targets: this.dimOverlay, alpha: 0, duration: 200,
      onComplete: () => { this.dimOverlay?.destroy(); this.dimOverlay = null; },
    });
  }

  show(): void {
    if (this.isVisible) return;
    this.isVisible = true;
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    this.previousState = gm.state ?? GameState.GAME;
    this.container.setVisible(true).setAlpha(0);
    this.container.y = 10;
    this.scene.tweens.add({
      targets: this.container, alpha: 1, y: 0,
      duration: 200, ease: 'Back.easeOut',
    });
    gm.changeState(GameState.DIALOGUE);
  }

  hide(): void {
    if (!this.isVisible) return;
    this.clearChoices();
    const restoreState = this.previousState === GameState.DIALOGUE
      ? GameState.GAME
      : this.previousState;
    this.scene.tweens.add({
      targets: this.container, alpha: 0, y: 10, duration: 150,
      onComplete: () => {
        this.isVisible = false;
        this.container.setVisible(false);
        this.speakerText.setText('');
        this.dialogueText.setText('');
        if (this.portraitImage) {
          this.container.remove(this.portraitImage, false);
          this.portraitImage = null;
        }
        this.sceneBg.clear();
        ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER).changeState(restoreState);
      },
    });
  }

  update(): void {
    if (!this.isVisible) return;
    const { BOX_X: bx, TEXT_X: tx, BOX_Y: by } = DialogueBox;
    if (this.currentTextEffect === 'shake') {
      this.dialogueText.x = bx + tx + (Math.random() - 0.5) * 1.2;
      this.dialogueText.y = by + 24 + (Math.random() - 0.5) * 1.2;
    } else if (this.currentTextEffect === 'wave') {
      this.dialogueText.y = by + 24 + Math.sin(this.scene.time.now * 0.004) * 1.5;
    }
  }

  destroy(): void {
    this.eventBus.off(GameEvent.DIALOGUE_LINE, this.onDialogueLine);
    this.eventBus.off(GameEvent.DIALOGUE_CHOICE, this.onDialogueChoice);
    this.eventBus.off(GameEvent.DIALOGUE_END, this.onDialogueEnd);
    if (this.advanceHandler) {
      this.scene.input.off('pointerdown', this.advanceHandler);
      this.scene.input.keyboard?.off('keydown-SPACE', this.advanceHandler);
      this.scene.input.keyboard?.off('keydown-ENTER', this.advanceHandler);
      this.advanceHandler = null;
    }
    this.typingTimer?.remove();
    this.clearChoices();
    this.portraitImage = null;
    this.portraitRenderer.destroy();
    this.container.destroy(true);
    this.dimOverlay?.destroy();
  }
}
