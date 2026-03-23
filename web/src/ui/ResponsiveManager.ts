import { EventBus } from '../core/EventBus';
import { GameEvent, UIMode, UIModePayload } from '../core/GameEvents';
import { TOUCH } from '../config';

export class ResponsiveManager {
  private eventBus: EventBus;
  private _mode: UIMode = 'desktop';
  private _isTouchDevice = false;
  private _isPortrait = false;
  private _screenWidth = 0;
  private _screenHeight = 0;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this._isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.detect(true);

    window.addEventListener('resize', () => this.detect(false));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.detect(false), 100);
    });
  }

  private detect(initial = false): void {
    this._screenWidth = window.innerWidth;
    this._screenHeight = window.innerHeight;
    this._isPortrait = this._screenHeight > this._screenWidth;

    let newMode: UIMode;
    if (this._screenWidth <= 480 && this._isPortrait) {
      newMode = 'mobile-portrait';
    } else if (this._screenWidth <= 854 || (this._isTouchDevice && this._screenWidth <= 1024)) {
      newMode = 'mobile-landscape';
    } else if (this._screenWidth <= 1024) {
      newMode = 'tablet';
    } else {
      newMode = 'desktop';
    }

    if (initial || newMode !== this._mode) {
      this._mode = newMode;
      this.emit();
    }
  }

  private emit(): void {
    const payload: UIModePayload = {
      mode: this._mode,
      isTouchDevice: this._isTouchDevice,
      isPortrait: this._isPortrait,
      screenWidth: this._screenWidth,
      screenHeight: this._screenHeight,
    };
    this.eventBus.emit(GameEvent.UI_MODE_CHANGED, payload);
  }

  get mode(): UIMode { return this._mode; }
  get isTouchDevice(): boolean { return this._isTouchDevice; }
  get isPortrait(): boolean { return this._isPortrait; }
  get isMobile(): boolean { return this._mode.startsWith('mobile'); }

  getMinTouchTarget(): number {
    return TOUCH.MIN_TARGET_SIZE / this.getPixelScale();
  }

  getPixelScale(): number {
    const scaleX = Math.floor(this._screenWidth / 480);
    const scaleY = Math.floor(this._screenHeight / 270);
    return Math.max(1, Math.min(scaleX, scaleY));
  }
}
