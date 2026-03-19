import Phaser from 'phaser';
import { SCENE_KEYS, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';

export class OnboardingScene extends Phaser.Scene {
  private textIndex = 0;
  private prologueTexts: string[][] = [];
  private currentText?: Phaser.GameObjects.Text;


  constructor() {
    super(SCENE_KEYS.ONBOARDING);
  }

  create(): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    this.cameras.main.setBackgroundColor(0x000000);

    if (gm.language === 'ko') {
      this.prologueTexts = [
        ['나는 꿈을 꾸었노라...'],
        ['이 세상의 광야에서,', '한 사람이 누더기를 입고 서 있었으니'],
        ['그의 등에는 무거운 짐이 지워져 있었고,', '그의 손에는 한 권의 책이 들려 있었다.'],
        ['당신은 멸망의 도시에 살고 있습니다.', '이 도시는 곧 심판의 불로 멸망할 것입니다.'],
        ['등에 진 짐은 당신의 죄의 무게입니다.', '이 짐은 오직 한 곳에서만 벗을 수 있습니다.'],
        ['천상의 도시를 향해 순례하십시오.', '좁은 문을 찾고, 십자가를 향해 걸으십시오.'],
      ];
    } else {
      this.prologueTexts = [
        ['I dreamed a dream...'],
        ['In the wilderness of this world,', 'a man stood clothed in rags,'],
        ['with a great burden upon his back,', 'and a book in his hand.'],
        ['You live in the City of Destruction.', 'This city shall be burned with fire.'],
        ['The burden on your back is the weight of sin.', 'It can only be removed in one place.'],
        ['Journey to the Celestial City.', 'Find the Wicket Gate, walk toward the Cross.'],
      ];
    }

    this.textIndex = 0;
    this.showNextText();

    this.add
      .text(GAME_WIDTH - 8, GAME_HEIGHT - 8, gm.language === 'ko' ? '클릭하여 계속' : 'Click to continue', {
        fontSize: '6px',
        color: '#8C8070',
      })
      .setOrigin(1, 1);

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard?.on('keydown-SPACE', () => this.advance());
    this.input.keyboard?.on('keydown-ENTER', () => this.advance());
  }

  private showNextText(): void {
    if (this.textIndex >= this.prologueTexts.length) {
      this.scene.start(SCENE_KEYS.GAME);
      return;
    }

    this.currentText?.destroy();

    const lines = this.prologueTexts[this.textIndex];
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.currentText = this.add
      .text(cx, cy, lines.join('\n'), {
        fontSize: '8px',
        color: '#E6C86E',
        fontFamily: 'serif',
        align: 'center',
        lineSpacing: 6,
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: this.currentText,
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });
  }

  private advance(): void {
    this.textIndex++;
    if (this.currentText) {
      this.tweens.add({
        targets: this.currentText,
        alpha: 0,
        duration: 400,
        ease: 'Power2',
        onComplete: () => this.showNextText(),
      });
    } else {
      this.showNextText();
    }
  }
}
