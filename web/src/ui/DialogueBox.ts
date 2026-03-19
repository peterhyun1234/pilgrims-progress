import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, DIALOGUE } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, DialogueLinePayload, DialogueChoicePayload } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { InkService } from '../narrative/InkService';
import { DialogueManager } from '../narrative/DialogueManager';

export class DialogueBox {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private speakerText: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text;
  private continuePrompt: Phaser.GameObjects.Text;
  private choiceTexts: Phaser.GameObjects.Text[] = [];
  private choiceBgs: Phaser.GameObjects.Rectangle[] = [];

  private isVisible = false;
  private isTyping = false;
  private fullText = '';
  private typingTimer?: Phaser.Time.TimerEvent;
  private dialogueManager: DialogueManager | null = null;

  private readonly BOX_HEIGHT = 50;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const boxY = GAME_HEIGHT - this.BOX_HEIGHT - 4;

    this.container = scene.add.container(0, 0).setDepth(200).setScrollFactor(0);

    this.background = scene.add.rectangle(
      GAME_WIDTH / 2, boxY + this.BOX_HEIGHT / 2,
      GAME_WIDTH - 8, this.BOX_HEIGHT,
      COLORS.UI.PANEL, 0.92,
    );

    this.border = scene.add.rectangle(
      GAME_WIDTH / 2, boxY + this.BOX_HEIGHT / 2,
      GAME_WIDTH - 8, this.BOX_HEIGHT,
    );
    this.border.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);
    this.border.setFillStyle(0x000000, 0);

    this.speakerText = scene.add.text(
      8, boxY + 4,
      '', { fontSize: '7px', color: '#E6C86E', fontStyle: 'bold' },
    );

    this.dialogueText = scene.add.text(
      8, boxY + 14,
      '', {
        fontSize: '7px',
        color: '#FFFFFF',
        wordWrap: { width: GAME_WIDTH - 20 },
        lineSpacing: 2,
      },
    );

    this.continuePrompt = scene.add.text(
      GAME_WIDTH - 12, boxY + this.BOX_HEIGHT - 8,
      '▼', { fontSize: '6px', color: '#E6C86E' },
    ).setOrigin(1, 1);

    this.container.add([
      this.background, this.border,
      this.speakerText, this.dialogueText, this.continuePrompt,
    ]);

    this.hide();
    this.setupEvents();
  }

  startDialogue(npcId: string): void {
    this.initDialogueManager();
    if (this.dialogueManager) {
      this.dialogueManager.startDialogue(`${npcId}_meeting`);
    }
  }

  private initDialogueManager(): void {
    if (this.dialogueManager) return;

    let inkService: InkService;
    if (ServiceLocator.has(SERVICE_KEYS.INK_SERVICE)) {
      inkService = ServiceLocator.get<InkService>(SERVICE_KEYS.INK_SERVICE);
    } else {
      inkService = new InkService();
      const jsonData = this.scene.cache.json.get('ink_ch01');
      if (jsonData) {
        inkService.loadStory(jsonData);
      }
      ServiceLocator.register(SERVICE_KEYS.INK_SERVICE, inkService);
    }

    this.dialogueManager = new DialogueManager(inkService);
    ServiceLocator.register(SERVICE_KEYS.DIALOGUE_MANAGER, this.dialogueManager);
  }

  private setupEvents(): void {
    const eventBus = EventBus.getInstance();

    eventBus.on<DialogueLinePayload>(GameEvent.DIALOGUE_LINE, (payload) => {
      const p = payload as DialogueLinePayload;
      this.showLine(p.speaker ?? '', p.text);
    });

    eventBus.on<DialogueChoicePayload>(GameEvent.DIALOGUE_CHOICE, (payload) => {
      const p = payload as DialogueChoicePayload;
      this.showChoices(p.choices);
    });

    eventBus.on(GameEvent.DIALOGUE_END, () => {
      this.hide();
    });

    this.scene.input.on('pointerdown', () => this.onInteract());
    this.scene.input.keyboard?.on('keydown-SPACE', () => this.onInteract());
    this.scene.input.keyboard?.on('keydown-E', () => this.onInteract());
  }

  private onInteract(): void {
    if (!this.isVisible) return;

    if (this.isTyping) {
      this.completeTyping();
    } else if (this.choiceTexts.length === 0) {
      this.dialogueManager?.advanceDialogue();
    }
  }

  private showLine(speaker: string, text: string): void {
    this.show();
    this.clearChoices();

    this.speakerText.setText(speaker);
    this.fullText = text;
    this.dialogueText.setText('');
    this.continuePrompt.setVisible(false);

    this.startTyping(text);
  }

  private startTyping(text: string): void {
    this.isTyping = true;
    let charIndex = 0;

    this.typingTimer?.destroy();
    this.typingTimer = this.scene.time.addEvent({
      delay: DIALOGUE.TYPING_SPEED,
      callback: () => {
        charIndex++;
        this.dialogueText.setText(text.substring(0, charIndex));
        if (charIndex >= text.length) {
          this.completeTyping();
        }
      },
      repeat: text.length - 1,
    });
  }

  private completeTyping(): void {
    this.typingTimer?.destroy();
    this.isTyping = false;
    this.dialogueText.setText(this.fullText);
    this.continuePrompt.setVisible(true);
  }

  private showChoices(choices: { text: string; index: number }[]): void {
    this.show();
    this.clearChoices();

    this.speakerText.setText('');
    this.dialogueText.setText('');
    this.continuePrompt.setVisible(false);

    const boxY = GAME_HEIGHT - this.BOX_HEIGHT - 4;
    const startY = boxY + 8;

    for (let i = 0; i < choices.length; i++) {
      const choiceY = startY + i * 14;

      const bg = this.scene.add.rectangle(
        GAME_WIDTH / 2, choiceY + 5,
        GAME_WIDTH - 20, 12,
        COLORS.UI.BUTTON_DEFAULT,
      ).setScrollFactor(0).setDepth(201);
      bg.setStrokeStyle(1, COLORS.UI.PANEL_BORDER);
      bg.setInteractive({ useHandCursor: true });

      const text = this.scene.add.text(
        GAME_WIDTH / 2, choiceY + 5,
        choices[i].text,
        { fontSize: '6px', color: '#FFFFFF' },
      ).setOrigin(0.5).setScrollFactor(0).setDepth(202);

      const choiceIndex = choices[i].index;

      bg.on('pointerover', () => {
        bg.setFillStyle(COLORS.UI.GOLD);
        text.setColor('#0A0814');
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(COLORS.UI.BUTTON_DEFAULT);
        text.setColor('#FFFFFF');
      });
      bg.on('pointerdown', () => {
        this.clearChoices();
        this.dialogueManager?.selectChoice(choiceIndex);
      });

      this.choiceBgs.push(bg);
      this.choiceTexts.push(text);
    }
  }

  private clearChoices(): void {
    for (const bg of this.choiceBgs) bg.destroy();
    for (const text of this.choiceTexts) text.destroy();
    this.choiceBgs = [];
    this.choiceTexts = [];
  }

  private show(): void {
    this.isVisible = true;
    this.container.setVisible(true);
  }

  private hide(): void {
    this.isVisible = false;
    this.container.setVisible(false);
    this.clearChoices();
  }
}
