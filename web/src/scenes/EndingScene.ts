import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, SCENE_KEYS, COLORS } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem, FONT_FAMILY } from '../ui/DesignSystem';

/**
 * EndingScene — displayed after the player completes Ch12 (Celestial City arrival).
 *
 * Sections:
 *  1. Fade from white → starfield
 *  2. Epilogue text scroll (journey summary, Revelation 21:4)
 *  3. Journey statistics (playtime, Bible cards, NPC meetings, battles)
 *  4. Thank-you message + Return to main menu button
 */
export class EndingScene extends Phaser.Scene {
  private gameManager!: GameManager;

  constructor() {
    super({ key: SCENE_KEYS.ENDING ?? 'EndingScene' });
  }

  create(): void {
    this.gameManager = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);

    this.cameras.main.setBackgroundColor(0x000000);
    this.createStarfield();
    this.runEpilogueSequence();
  }

  private createStarfield(): void {
    const bg = this.add.graphics().setDepth(0);
    // Deep space gradient
    const strips = 20;
    for (let i = 0; i < strips; i++) {
      const t = i / strips;
      const r = Math.round(0x00 + 0x08 * t);
      const g = Math.round(0x00 + 0x04 * t);
      const b = Math.round(0x08 + 0x18 * t);
      bg.fillStyle((r << 16) | (g << 8) | b, 1);
      bg.fillRect(0, Math.floor(t * GAME_HEIGHT), GAME_WIDTH, Math.ceil(GAME_HEIGHT / strips) + 1);
    }
    // Stars
    for (let i = 0; i < 80; i++) {
      const hash = (i * 137 * 31 + 7) & 0xffff;
      const sx = hash % GAME_WIDTH;
      const sy = (hash * 3) % GAME_HEIGHT;
      const brightness = 0.3 + (hash % 10) * 0.07;
      const size = 0.5 + (hash % 3) * 0.4;
      bg.fillStyle(0xffffff, brightness);
      bg.fillCircle(sx, sy, size);
    }
    // Holy light beam from top
    bg.fillStyle(0xffd700, 0.04);
    bg.fillTriangle(GAME_WIDTH / 2 - 60, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.7, GAME_WIDTH / 2 + 60, 0);
    bg.fillStyle(0xffeedd, 0.02);
    bg.fillTriangle(GAME_WIDTH / 2 - 30, 0, GAME_WIDTH / 2, GAME_HEIGHT * 0.5, GAME_WIDTH / 2 + 30, 0);
  }

  private runEpilogueSequence(): void {
    const ko = this.gameManager.language === 'ko';

    // Initial white flash fade
    const flash = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 1)
      .setDepth(100);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 2000,
      ease: 'Sine.easeIn',
      onComplete: () => {
        flash.destroy();
        this.showEpilogueText(ko);
      },
    });
  }

  private showEpilogueText(ko: boolean): void {
    const cx = GAME_WIDTH / 2;

    const epilogueLines = ko ? [
      { text: '순례의 끝', color: '#ffd700', size: 10 },
      { text: '', color: '#888888', size: 5 },
      { text: '크리스천은 마침내 천성에 도착했다.', color: '#e8e0d0', size: 5 },
      { text: '긴 여정, 수많은 시련, 그리고 믿음의 싸움 끝에', color: '#b0a898', size: 5 },
      { text: '그가 바라던 곳에 이른 것이다.', color: '#b0a898', size: 5 },
      { text: '', color: '#888888', size: 5 },
      { text: '"하나님이 그들의 눈에서 모든 눈물을 씻어 주실 것이요"', color: '#d4a853', size: 5 },
      { text: '"다시는 사망이 없고 애통하는 것이나"', color: '#d4a853', size: 5 },
      { text: '"곡하는 것이나 아픈 것이 다시 있지 아니하리니"', color: '#d4a853', size: 5 },
      { text: '"처음 것들이 다 지나갔음이러라."', color: '#d4a853', size: 5 },
      { text: '— 요한계시록 21:4', color: '#888888', size: 4 },
    ] : [
      { text: "The Pilgrim's Journey", color: '#ffd700', size: 10 },
      { text: '', color: '#888888', size: 5 },
      { text: 'Christian had arrived at last.', color: '#e8e0d0', size: 5 },
      { text: 'After every trial, every valley and mountain,', color: '#b0a898', size: 5 },
      { text: 'the gates of the Celestial City stood open.', color: '#b0a898', size: 5 },
      { text: '', color: '#888888', size: 5 },
      { text: '"God shall wipe away all tears from their eyes;"', color: '#d4a853', size: 5 },
      { text: '"and there shall be no more death,"', color: '#d4a853', size: 5 },
      { text: '"neither sorrow, nor crying,"', color: '#d4a853', size: 5 },
      { text: '"neither shall there be any more pain."', color: '#d4a853', size: 5 },
      { text: '— Revelation 21:4', color: '#888888', size: 4 },
    ];

    const totalHeight = epilogueLines.reduce((acc, l) => acc + (l.size + 6), 0);
    const startY = GAME_HEIGHT / 2 - totalHeight / 2;
    let delay = 0;

    epilogueLines.forEach((line, i) => {
      const y = startY + epilogueLines.slice(0, i).reduce((acc, l) => acc + l.size + 6, 0);
      const txt = this.add.text(cx, y + 20, line.text, {
        fontSize: `${line.size}px`,
        color: line.color,
        fontFamily: FONT_FAMILY,
        align: 'center',
      }).setOrigin(0.5).setAlpha(0).setDepth(10);

      this.time.delayedCall(delay, () => {
        this.tweens.add({ targets: txt, alpha: 1, duration: 800, ease: 'Sine.easeIn' });
      });
      delay += 600;
    });

    // After all lines shown, show stats then return button
    this.time.delayedCall(delay + 1000, () => this.showStats(ko));
  }

  private showStats(ko: boolean): void {
    const cx = GAME_WIDTH / 2;
    const statsY = GAME_HEIGHT - 80;

    // Divider
    const divider = this.add.graphics().setDepth(10);
    divider.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    divider.lineBetween(cx - 80, statsY - 20, cx + 80, statsY - 20);

    // Stats panel
    const save = ServiceLocator.has(SERVICE_KEYS.SAVE_MANAGER)
      ? ServiceLocator.get<import('../save/SaveManager').SaveManager>(SERVICE_KEYS.SAVE_MANAGER).getLastLoaded()
      : null;

    const statLines = ko ? [
      `믿음: ${save?.stats?.faith ?? '?'} / 용기: ${save?.stats?.courage ?? '?'} / 지혜: ${save?.stats?.wisdom ?? '?'}`,
      `은혜 회복: ${save?.hiddenStats?.graceCounter ?? 0}회 / 챕터: ${this.gameManager.currentChapter}/12`,
    ] : [
      `Faith: ${save?.stats?.faith ?? '?'} / Courage: ${save?.stats?.courage ?? '?'} / Wisdom: ${save?.stats?.wisdom ?? '?'}`,
      `Grace recovered: ${save?.hiddenStats?.graceCounter ?? 0}× / Chapters: ${this.gameManager.currentChapter}/12`,
    ];

    statLines.forEach((line, i) => {
      const statTxt = this.add.text(cx, statsY + i * 12, line, {
        fontSize: '4px',
        color: '#888877',
        fontFamily: FONT_FAMILY,
        align: 'center',
      }).setOrigin(0.5).setAlpha(0).setDepth(10);
      this.tweens.add({ targets: statTxt, alpha: 1, duration: 600 });
    });

    // Return to menu button
    this.time.delayedCall(1500, () => {
      const menuLabel = this.gameManager.i18n.t('ending.return');
      const btn = DesignSystem.createButton(
        this, cx, statsY + 30, 150, 22, menuLabel,
        () => {
          void DesignSystem.fadeOut(this, 800).then(() => {
            this.scene.start(SCENE_KEYS.MENU);
          });
        },
        { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: 0x2a1a06 },
      );
      btn.setAlpha(0);
      btn.setDepth(20);
      this.tweens.add({ targets: btn, alpha: 1, duration: 600 });
    });
  }
}
