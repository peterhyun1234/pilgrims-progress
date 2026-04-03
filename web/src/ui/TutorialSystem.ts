import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from './DesignSystem';
import { ResponsiveManager } from './ResponsiveManager';

interface TutorialStep {
  id: string;
  textKo: string;
  textEn: string;
  icon: string;
  chapter?: number;
  condition?: string;
}

const TUTORIALS: TutorialStep[] = [
  {
    id: 'movement',
    textKo: '방향키 또는 WASD로 이동하세요',
    textEn: 'Use Arrow keys or WASD to move',
    icon: '🎮',
    chapter: 1,
  },
  {
    id: 'movement_mobile',
    textKo: '화면 왼쪽을 드래그하여 이동하세요',
    textEn: 'Drag the left side of the screen to move',
    icon: '👆',
    chapter: 1,
    condition: 'mobile',
  },
  {
    id: 'interact',
    textKo: 'NPC 근처에서 E키를 눌러 대화하세요',
    textEn: 'Press E near an NPC to talk',
    icon: '💬',
    chapter: 1,
  },
  {
    id: 'interact_mobile',
    textKo: 'NPC 근처에서 ! 버튼을 눌러 대화하세요',
    textEn: 'Tap the ! button near an NPC to talk',
    icon: '💬',
    chapter: 1,
    condition: 'mobile',
  },
  {
    id: 'inventory',
    textKo: 'I키를 눌러 소지품을 확인하세요',
    textEn: 'Press I to open your inventory',
    icon: '📦',
  },
  {
    id: 'item_pickup',
    textKo: '빛나는 아이템을 만져 획득하세요',
    textEn: 'Touch glowing items to pick them up',
    icon: '✨',
  },
  {
    id: 'combat',
    textKo: '기도, 방어, 스킬로 영적 전투에 임하세요',
    textEn: 'Use prayer, defense, and skills in spiritual combat',
    icon: '⚔',
    condition: 'first_battle',
  },
  {
    id: 'stats',
    textKo: '선택에 따라 믿음, 용기, 지혜가 변합니다',
    textEn: 'Your choices affect Faith, Courage, and Wisdom',
    icon: '📊',
  },
];

export class TutorialSystem {
  private scene: Phaser.Scene;
  private shownTutorials = new Set<string>();
  private currentHint: Phaser.GameObjects.Container | null = null;
  private stuckTimer = 0;
  private lastPlayerPos = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadShown();
  }

  showForChapter(chapter: number): void {
    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    const ko = gm.language === 'ko';

    let isMobile = false;
    try {
      const rm = ServiceLocator.get<ResponsiveManager>(SERVICE_KEYS.RESPONSIVE_MANAGER);
      isMobile = rm.isTouchDevice;
    } catch { /* ignore */ }

    const tutorials = TUTORIALS.filter(t => {
      if (t.chapter !== undefined && t.chapter !== chapter) return false;
      if (this.shownTutorials.has(t.id)) return false;
      if (t.condition === 'mobile' && !isMobile) return false;
      if (t.condition === 'mobile' && isMobile) return true;
      if (t.condition && t.condition !== 'mobile') return false;
      if (!t.condition && isMobile && t.id.endsWith('_mobile') === false) {
        const mobileVersion = TUTORIALS.find(mt => mt.id === t.id + '_mobile');
        if (mobileVersion) return false;
      }
      return true;
    });

    let delay = 2000;
    tutorials.slice(0, 3).forEach(tutorial => {
      this.scene.time.delayedCall(delay, () => {
        this.showHint(tutorial, ko);
        this.shownTutorials.add(tutorial.id);
        this.saveShown();
      });
      delay += 4000;
    });
  }

  showById(tutorialId: string): void {
    if (this.shownTutorials.has(tutorialId)) return;
    const tutorial = TUTORIALS.find(t => t.id === tutorialId);
    if (!tutorial) return;

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    this.showHint(tutorial, gm.language === 'ko');
    this.shownTutorials.add(tutorialId);
    this.saveShown();
  }

  private showHint(tutorial: TutorialStep, ko: boolean): void {
    this.currentHint?.destroy(true);

    const text = ko ? tutorial.textKo : tutorial.textEn;
    const container = this.scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 24)
      .setDepth(250).setScrollFactor(0).setAlpha(0);

    const displayText = `${tutorial.icon} ${text}`;
    const txt = this.scene.add.text(0, 0, displayText,
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, '#e8e0d0'),
    ).setOrigin(0.5);

    const pw = txt.width + 32;
    const ph = 20;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0a0814, 0.8);
    bg.fillRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);
    bg.lineStyle(0.5, 0xd4a853, 0.3);
    bg.strokeRoundedRect(-pw / 2, -ph / 2, pw, ph, 4);

    container.add([bg, txt]);
    this.currentHint = container;

    this.scene.tweens.add({
      targets: container, alpha: 1, duration: 500,
      hold: 4000, yoyo: true, ease: 'Sine.easeInOut',
      onComplete: () => {
        container.destroy(true);
        if (this.currentHint === container) this.currentHint = null;
      },
    });
  }

  checkStuck(playerX: number, playerY: number, delta: number): void {
    const dx = Math.abs(playerX - this.lastPlayerPos.x);
    const dy = Math.abs(playerY - this.lastPlayerPos.y);

    if (dx < 2 && dy < 2) {
      this.stuckTimer += delta;
      if (this.stuckTimer > 30000 && !this.shownTutorials.has('stuck_hint')) {
        this.stuckTimer = 0;
        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        const ko = gm.language === 'ko';
        this.showHint({
          id: 'stuck_hint',
          textKo: 'NPC에게 다가가 대화하거나, 출구를 찾아보세요!',
          textEn: 'Talk to NPCs or look for exits to progress!',
          icon: '💡',
        }, ko);
        this.shownTutorials.add('stuck_hint');
      }
    } else {
      this.stuckTimer = 0;
    }

    this.lastPlayerPos.x = playerX;
    this.lastPlayerPos.y = playerY;
  }

  private loadShown(): void {
    try {
      const saved = localStorage.getItem('pilgrims_tutorials');
      if (saved) {
        const arr = JSON.parse(saved) as string[];
        arr.forEach(id => this.shownTutorials.add(id));
      }
    } catch { /* ignore */ }
  }

  private saveShown(): void {
    try {
      localStorage.setItem('pilgrims_tutorials', JSON.stringify([...this.shownTutorials]));
    } catch { /* ignore */ }
  }

  reset(): void {
    this.shownTutorials.clear();
    try { localStorage.removeItem('pilgrims_tutorials'); } catch { /* ignore */ }
  }

  destroy(): void {
    this.currentHint?.destroy(true);
  }
}
