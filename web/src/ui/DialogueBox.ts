import { GAME_WIDTH, GAME_HEIGHT, COLORS, DIALOGUE } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, DialogueLinePayload, DialogueChoicePayload, GameState, PortraitEmotion } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from './DesignSystem';
import { PortraitRenderer } from './PortraitRenderer';
import { PORTRAIT_CONFIGS } from '../narrative/data/portraitData';
import BBCodeText from 'phaser3-rex-plugins/plugins/bbcodetext.js';
import TextTyping from 'phaser3-rex-plugins/plugins/texttyping.js';
import { AudioManager } from '../audio/AudioManager';

type TextEffect = 'none' | 'shake' | 'wave' | 'glow';

export class DialogueBox {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private bg!: Phaser.GameObjects.Graphics;
  private speakerBg!: Phaser.GameObjects.Graphics;
  private speakerText!: Phaser.GameObjects.Text;
  private dialogueText!: BBCodeText;
  private textTyping!: TextTyping;
  private continuePrompt!: Phaser.GameObjects.Text;
  private portraitBg!: Phaser.GameObjects.Graphics;
  private portraitImage: Phaser.GameObjects.RenderTexture | null = null;
  private sceneBg!: Phaser.GameObjects.Graphics;

  private portraitRenderer: PortraitRenderer;
  private choiceContainers: Phaser.GameObjects.Container[] = [];
  private choiceHitZones: Phaser.GameObjects.Rectangle[] = [];
  private dimOverlay: Phaser.GameObjects.Rectangle | null = null;
  private choiceKeyHandlers: (() => void)[] = [];
  /** Prevents duplicate choice selection (spam-click guard) */
  private _choiceLocked = false;

  private eventBus: EventBus;
  private isVisible = false;
  private isTyping = false;
  private fullText = '';
  private typingSpeed: number = DIALOGUE.TYPING_SPEED_NORMAL;
  private currentTextEffect: TextEffect = 'none';
  private emotionState: PortraitEmotion = 'neutral';
  private currentSpeakerId = '';
  private previousState: GameState = GameState.GAME;
  private advanceHandler: (() => void) | null = null;

  private static readonly BOX_W = 430;
  private static readonly BOX_H = 96;
  private static readonly BOX_X = (GAME_WIDTH - 430) / 2;
  private static readonly BOX_Y = GAME_HEIGHT - 98;
  private static readonly PORTRAIT_S = 72;
  private static readonly TEXT_X = 88;

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
    // Dark parchment background
    this.bg.fillStyle(0x1a1208, 0.97);
    this.bg.fillRoundedRect(bx, by, bw, bh, 6);
    // Gold border
    this.bg.lineStyle(1.5, COLORS.UI.GOLD, 0.8);
    this.bg.strokeRoundedRect(bx, by, bw, bh, 6);
    // Inner subtle warm tint
    this.bg.fillStyle(0xd4a853, 0.04);
    this.bg.fillRoundedRect(bx + 1, by + 1, bw - 2, bh - 2, 5);
    // Inner border line
    this.bg.lineStyle(0.5, COLORS.UI.GOLD, 0.18);
    this.bg.strokeRoundedRect(bx + 3, by + 3, bw - 6, bh - 6, 4);
    // Decorative corner ornaments (gold marks at each corner)
    this.bg.fillStyle(COLORS.UI.GOLD, 0.7);
    // Top-left corner
    this.bg.fillRect(bx + 4, by + 2, 6, 1);
    this.bg.fillRect(bx + 2, by + 4, 1, 6);
    // Top-right corner
    this.bg.fillRect(bx + bw - 10, by + 2, 6, 1);
    this.bg.fillRect(bx + bw - 3, by + 4, 1, 6);
    // Bottom-left corner
    this.bg.fillRect(bx + 4, by + bh - 3, 6, 1);
    this.bg.fillRect(bx + 2, by + bh - 10, 1, 6);
    // Bottom-right corner
    this.bg.fillRect(bx + bw - 10, by + bh - 3, 6, 1);
    this.bg.fillRect(bx + bw - 3, by + bh - 10, 1, 6);

    this.portraitBg = this.scene.add.graphics();
    this.drawPortraitFrame(COLORS.UI.GOLD);

    this.speakerBg = this.scene.add.graphics();

    this.speakerText = this.scene.add.text(bx + DialogueBox.TEXT_X + 4, by - 9, '',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
    );

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const dialogueFontSize = gm.language === 'ko' ? DesignSystem.FONT_SIZE.SM : DesignSystem.FONT_SIZE.BASE;
    const fontFamily = DesignSystem.getFontFamily();

    // Use Rex BBCodeText for rich inline formatting
    this.dialogueText = new BBCodeText(this.scene, bx + DialogueBox.TEXT_X, by + 18, '', {
      fontFamily,
      fontSize: `${dialogueFontSize}px`,
      color: '#e8e0d0',
      wrap: {
        mode: 'word',
        width: bw - DialogueBox.TEXT_X - 16,
      },
      lineSpacing: 4,
    });
    this.scene.add.existing(this.dialogueText);

    // Setup TextTyping behavior on the BBCodeText
    this.textTyping = new TextTyping(this.dialogueText, {
      speed: this.typingSpeed,
      setTextCallback: (text: string) => text,
    });
    this.textTyping.on('type', () => {
      const audio = ServiceLocator.get<AudioManager>(SERVICE_KEYS.AUDIO_MANAGER);
      audio?.procedural?.playTypingClick();
    });
    this.textTyping.on('complete', () => {
      this.isTyping = false;
      this.continuePrompt.setVisible(true);
    });

    this.continuePrompt = this.scene.add.text(bx + bw - 18, by + bh - 16, '▼',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.SM),
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
    // Shadow behind portrait
    this.portraitBg.fillStyle(0x000000, 0.4);
    this.portraitBg.fillRoundedRect(bx + 7, by + (bh - ps) / 2 + 2, ps, ps, 4);
    // Portrait background
    this.portraitBg.fillStyle(0x0e0c18, 0.85);
    this.portraitBg.fillRoundedRect(bx + 5, by + (bh - ps) / 2, ps, ps, 4);
    // Gold border
    this.portraitBg.lineStyle(1.5, borderColor, 0.75);
    this.portraitBg.strokeRoundedRect(bx + 5, by + (bh - ps) / 2, ps, ps, 4);
    // Inner vignette corners (dark gradient effect via corner fills)
    this.portraitBg.fillStyle(0x000000, 0.2);
    this.portraitBg.fillRoundedRect(bx + 5, by + (bh - ps) / 2, ps, ps, 4);
    // Bright inner border
    this.portraitBg.lineStyle(0.5, borderColor, 0.2);
    this.portraitBg.strokeRoundedRect(bx + 7, by + (bh - ps) / 2 + 2, ps - 4, ps - 4, 3);
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

  /**
   * Convert raw dialogue text into BBCode-enriched text.
   * Supports Ink-style inline tags embedded in the text:
   *   {color:red}text{/color}  → [color=red]text[/color]
   *   {b}text{/b}              → [b]text[/b]
   *   {i}text{/i}              → [i]text[/i]
   *   {gold}text{/gold}        → [color=#d4a853]text[/color]
   *   {scripture}text{/}       → [color=#c8b070][i]text[/i][/color]
   */
  private enrichText(raw: string): string {
    let text = raw;
    // Ink-style shorthand → BBCode
    text = text.replace(/\{color:(\w+)\}/g, '[color=$1]');
    text = text.replace(/\{\/color\}/g, '[/color]');
    text = text.replace(/\{b\}/g, '[b]');
    text = text.replace(/\{\/b\}/g, '[/b]');
    text = text.replace(/\{i\}/g, '[i]');
    text = text.replace(/\{\/i\}/g, '[/i]');
    text = text.replace(/\{gold\}([\s\S]*?)\{\/gold\}/g, '[color=#d4a853]$1[/color]');
    text = text.replace(/\{scripture\}([\s\S]*?)\{\/\}/g, '[color=#c8b070][i]$1[/i][/color]');

    // Emotion-based auto-coloring
    if (this.emotionState === 'angry') {
      // Bold key phrases by wrapping first "!" occurrence
    } else if (this.emotionState === 'fearful') {
      // Could add subtle effects for fearful text
    }

    return text;
  }

  private showLine(payload: DialogueLinePayload): void {
    this.show();
    this.clearChoices();

    const speaker = payload.speaker ?? '';
    this.speakerText.setText(speaker);

    const rawEmotion = payload.emotion ?? 'neutral';
    this.emotionState = this.mapEmotion(rawEmotion);

    // Resolve speaker first so we can use their personality for badge color
    this.resolveSpeakerId(speaker);
    const speakerBadgeColor = this.getSpeakerBadgeColor();

    const hasSpeaker = !!speaker;
    this.speakerBg.clear();
    if (hasSpeaker) {
      const { BOX_X: bx, BOX_Y: by, TEXT_X: tx } = DialogueBox;
      const sw = this.speakerText.width + 16;
      // Personality-tinted pill badge above the dialogue box
      this.speakerBg.fillStyle(0x0e0c18, 0.96);
      this.speakerBg.fillRoundedRect(bx + tx - 2, by - 13, sw, 19, 5);
      this.speakerBg.lineStyle(1.2, speakerBadgeColor, 0.85);
      this.speakerBg.strokeRoundedRect(bx + tx - 2, by - 13, sw, 19, 5);
      // Colour accent strip on the left edge of badge
      this.speakerBg.fillStyle(speakerBadgeColor, 0.55);
      this.speakerBg.fillRoundedRect(bx + tx - 2, by - 13, 3, 19, { tl: 5, bl: 5, tr: 0, br: 0 });
      // Inner glow
      this.speakerBg.fillStyle(speakerBadgeColor, 0.06);
      this.speakerBg.fillRoundedRect(bx + tx + 1, by - 12, sw - 5, 17, 4);
      // Update speaker text color to match badge accent
      this.speakerText.setStyle({ color: Phaser.Display.Color.IntegerToColor(speakerBadgeColor).rgba });
    } else {
      this.speakerText.setStyle({ color: '#d4a853' });
    }

    const emotionColors: Record<string, number> = {
      angry: 0xff4444, happy: 0xffd700, sad: 0x5577cc,
      fearful: 0x9944aa, neutral: COLORS.UI.GOLD, determined: 0x44aa44,
      surprised: 0xff8800,
    };
    this.drawPortraitFrame(emotionColors[this.emotionState] ?? COLORS.UI.GOLD);

    this.updatePortrait();
    this.updateSceneMood();

    // Reset typing speed and effects
    this.typingSpeed = DIALOGUE.TYPING_SPEED_NORMAL;
    this.currentTextEffect = 'none';

    for (const tag of payload.tags) {
      const t = tag.trim();
      if (t.startsWith('TYPING:')) {
        const sp = t.split(':')[1]?.trim();
        const speeds: Record<string, number> = {
          slow: DIALOGUE.TYPING_SPEED_SLOW,
          fast: DIALOGUE.TYPING_SPEED_FAST,
          dramatic: DIALOGUE.TYPING_SPEED_DRAMATIC,
          whisper: DIALOGUE.TYPING_SPEED_WHISPER,
          scripture: DIALOGUE.TYPING_SPEED_SCRIPTURE,
          instant: DIALOGUE.TYPING_SPEED_INSTANT,
        };
        this.typingSpeed = speeds[sp] ?? DIALOGUE.TYPING_SPEED_NORMAL;
      } else if (t.startsWith('TEXT_EFFECT:')) {
        this.currentTextEffect = (t.split(':')[1]?.trim() as TextEffect) || 'none';
      }
    }

    // Enrich text with BBCode formatting
    this.fullText = this.enrichText(payload.text);
    this.dialogueText.setText('');
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

  /** Returns a badge accent color based on the speaker's personality/role. */
  private getSpeakerBadgeColor(): number {
    const config = PORTRAIT_CONFIGS[this.currentSpeakerId];
    if (!config) return COLORS.UI.GOLD;
    const personalityColors: Record<string, number> = {
      noble:      0xffd700,   // bright gold — angels, goodwill
      wise:       0x88aadd,   // cool blue — evangelist, interpreter, prudence
      kind:       0x88cc88,   // warm green — help, piety, charity, faithful, hopeful
      timid:      0xaa9977,   // muted tan — pliable, timorous
      stern:      0x99aacc,   // steel blue — watchful, obstinate
      sly:        0xcc8855,   // amber-orange — worldly_wiseman, ignorance, diffidence
      aggressive: 0xcc4433,   // dark red — lord_hategood, apollyon
    };
    return personalityColors[config.personality ?? 'wise'] ?? COLORS.UI.GOLD;
  }

  private resolveSpeakerId(speaker: string): void {
    const nameMap: Record<string, string> = {
      // Ch1 — City of Destruction
      '전도자': 'evangelist',       'Evangelist': 'evangelist',
      '완고': 'obstinate',          'Obstinate': 'obstinate',
      '유연': 'pliable',            'Pliable': 'pliable',
      '도움': 'help',               'Help': 'help',
      '세속 현자': 'worldly_wiseman', 'Worldly Wiseman': 'worldly_wiseman',
      // Ch2 — Wicket Gate / Ch3 — Interpreter's House
      '선의': 'goodwill',           'Good-will': 'goodwill',
      '해석자': 'interpreter',      'Interpreter': 'interpreter',
      '크리스천': 'christian',      'Christian': 'christian',
      // Ch5–6 — Valley / Cross
      '신실': 'faithful',           'Faithful': 'faithful',
      // Ch7 — Beautiful Palace
      '겁쟁이': 'timorous',         'Timorous': 'timorous',
      '불신': 'mistrust',           'Mistrust': 'mistrust',
      '파수꾼': 'watchful',         'Watchful': 'watchful',
      '현숙': 'prudence',           'Prudence': 'prudence',
      '경건': 'piety',              'Piety': 'piety',
      '자선': 'charity',            'Charity': 'charity',
      // Ch8–9 — Companion
      '소망': 'hopeful',            'Hopeful': 'hopeful',
      // Ch9 — Valley of the Shadow
      '무지': 'ignorance',          'Ignorance': 'ignorance',
      '소신': 'little_faith',       'Little-faith': 'little_faith',
      // Ch10 — Vanity Fair
      '증오 판사': 'lord_hategood', 'Lord Hategood': 'lord_hategood',
      // Ch11 — Doubting Castle
      '소심': 'timorous',           // timorous also appears in Ch11
      '의심 부인': 'diffidence',    'Diffidence': 'diffidence',
      // Ch12 — Celestial City
      '빛나는 자들': 'shining_ones','Shining Ones': 'shining_ones',
    };
    // Fallback: normalise display names to snake_case portrait IDs
    this.currentSpeakerId = nameMap[speaker] ?? speaker.toLowerCase().replace(/[\s-]/g, '_');
  }

  private updatePortrait(): void {
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
      happy: { color: 0xffd700, alpha: 0.10 },
      angry: { color: 0xff0000, alpha: 0.10 },
      sad: { color: 0x2244aa, alpha: 0.10 },
      fearful: { color: 0x440066, alpha: 0.12 },
      surprised: { color: 0xff8800, alpha: 0.08 },
      determined: { color: 0x44aa44, alpha: 0.08 },
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
    // Use Rex TextTyping for smooth character-by-character reveal
    this.textTyping.setTypingSpeed(this.typingSpeed);
    this.textTyping.start(this.fullText, this.typingSpeed);
  }

  private completeTyping(): void {
    this.textTyping.stop(true); // true = show all text immediately
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
    const choiceH = 28;
    const gap = 5;
    const total = payload.choices.length * (choiceH + gap);
    const startY = by - total - 6;

    payload.choices.forEach((choice, i) => {
      const delay = isHeavy ? (i + 1) * 400 : i * 100;
      this.scene.time.delayedCall(delay, () => {
        const cy = startY + i * (choiceH + gap);
        const c = this.scene.add.container(bx + 10, cy + 4).setAlpha(0);
        const w = bw - 20;

        const isLocked = choice.requiredStat !== undefined
          && (ServiceLocator.get<import('../core/StatsManager').StatsManager>(SERVICE_KEYS.STATS_MANAGER)
            .get(choice.requiredStat as import('../core/GameEvents').StatType) < (choice.requiredValue ?? 0));

        const cbg = this.scene.add.graphics();
        const defaultColor = choice.isHidden ? 0x2a2040 : COLORS.UI.BUTTON_DEFAULT;
        const bdrClr = choice.isHidden ? COLORS.UI.GOLD : 0x554433;
        const drawDefault = () => {
          cbg.clear();
          cbg.fillStyle(defaultColor, 0.93);
          cbg.fillRoundedRect(0, 0, w, choiceH, 4);
          cbg.lineStyle(1, bdrClr, 0.6);
          cbg.strokeRoundedRect(0, 0, w, choiceH, 4);
        };
        const drawHover = () => {
          cbg.clear();
          cbg.fillStyle(COLORS.UI.BUTTON_HOVER, 0.95);
          cbg.fillRoundedRect(0, 0, w, choiceH, 4);
          cbg.lineStyle(1.5, COLORS.UI.GOLD, 0.9);
          cbg.strokeRoundedRect(0, 0, w, choiceH, 4);
          cbg.fillStyle(COLORS.UI.GOLD, 0.8);
          cbg.fillRoundedRect(0, 4, 3, choiceH - 8, 1);
        };
        drawDefault();

        const prefix = isLocked ? '🔒 ' : (choice.isHidden ? '★ ' : `${i + 1}. `);
        const textColor = isLocked ? '#aa9977' : (choice.isHidden ? '#d4a853' : '#d0c8b8');
        const txt = this.scene.add.text(w / 2, choiceH / 2, prefix + choice.text,
          DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, textColor),
        ).setOrigin(0.5).setAlpha(isLocked ? 0.5 : 1);

        c.add([cbg, txt]);

        // ── Scene-level hit zone (avoids scrollFactor=0 container hit offset bug) ──
        const hzX = bx + 10 + w / 2;   // screen-space center X
        const hzY = cy + choiceH / 2;   // screen-space center Y (final position)
        const hz = this.scene.add.rectangle(hzX, hzY, w, choiceH, 0x000000, 0)
          .setScrollFactor(0).setDepth(205).setInteractive({ useHandCursor: true });

        hz.on('pointerover', () => {
          if (!isLocked) {
            drawHover();
            txt.setText('▶ ' + txt.text.replace(/^▶ /, ''));
          }
        });
        hz.on('pointerout', () => {
          drawDefault();
          txt.setText(txt.text.replace(/^▶ /, ''));
        });
        hz.on('pointerdown', () => {
          if (this._choiceLocked || isLocked) return;
          this._choiceLocked = true;
          this.choiceContainers.forEach(cc => {
            cc.getAll().forEach(child => {
              if (child instanceof Phaser.GameObjects.Rectangle) child.disableInteractive();
            });
          });
          this.choiceHitZones.forEach(h => h.disableInteractive());
          this.scene.tweens.add({
            targets: c, scaleX: 1.02, scaleY: 1.02, duration: 50, yoyo: true,
            onComplete: () => {
              this.hideDimOverlay();
              this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, choice.index);
            },
          });
        });

        this.choiceHitZones.push(hz);

        this.scene.tweens.add({
          targets: c, alpha: 1, y: cy, duration: isHeavy ? 350 : 150,
          ease: 'Back.easeOut',
        });
        this.choiceContainers.push(c);
        this.container.add(c);

        const keyCode = `ONE TWO THREE FOUR FIVE`.split(' ')[i];
        if (keyCode) {
          const handler = () => {
            if (this.choiceContainers.length === 0) return;
            this.clearChoices();
            this.eventBus.emit(GameEvent.DIALOGUE_CHOICE_SELECTED, choice.index);
          };
          this.scene.input.keyboard?.on(`keydown-${keyCode}`, handler);
          this.choiceKeyHandlers.push(handler);
          (handler as unknown as Record<string, string>).__key = keyCode;
        }
      });
    });
  }

  private clearChoices(): void {
    this._choiceLocked = false;
    this.choiceContainers.forEach(c => c.destroy(true));
    this.choiceContainers = [];
    this.choiceHitZones.forEach(h => h.destroy());
    this.choiceHitZones = [];
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
      this.dialogueText.y = by + 20 +(Math.random() - 0.5) * 1.2;
    } else if (this.currentTextEffect === 'wave') {
      this.dialogueText.y = by + 20 +Math.sin(this.scene.time.now * 0.004) * 1.5;
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
    this.textTyping.destroy();
    this.clearChoices();
    this.portraitImage = null;
    this.portraitRenderer.destroy();
    this.container.destroy(true);
    this.dimOverlay?.destroy();
  }
}
