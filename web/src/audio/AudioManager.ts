import { Howl, Howler } from 'howler';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class AudioManager {
  private eventBus: EventBus;
  private bgm: Howl | null = null;
  private sfxCache: Map<string, Howl> = new Map();
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;
  private audioUnlocked = false;

  private onBgmPlay = (key: string) => this.playBGM(key);
  private onBgmStop = () => this.stopBGM();
  private onSfxPlay = (key: string) => this.playSFX(key);
  private onFadeOut = (data: { duration: number }) => this.fadeBGM(0, data.duration);
  private onFadeToSilence = (data: { duration: number }) => this.fadeBGM(0, data.duration);

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEvents();
    this.setupAutoplayUnlock();
  }

  private unlockHandler = () => {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    Howler.ctx?.resume();
    document.removeEventListener('pointerdown', this.unlockHandler);
    document.removeEventListener('keydown', this.unlockHandler);
  };

  private setupAutoplayUnlock(): void {
    document.addEventListener('pointerdown', this.unlockHandler);
    document.addEventListener('keydown', this.unlockHandler);
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.BGM_PLAY, this.onBgmPlay);
    this.eventBus.on(GameEvent.BGM_STOP, this.onBgmStop);
    this.eventBus.on(GameEvent.SFX_PLAY, this.onSfxPlay);
    this.eventBus.on(GameEvent.MUSIC_FADE_OUT, this.onFadeOut);
    this.eventBus.on(GameEvent.MUSIC_FADE_TO_SILENCE, this.onFadeToSilence);
  }

  playBGM(key: string): void {
    if (this.bgm) {
      this.bgm.fade(this.bgmVolume, 0, 500);
      const oldBgm = this.bgm;
      setTimeout(() => oldBgm.stop(), 500);
    }

    this.bgm = new Howl({
      src: [`assets/audio/bgm/${key}.mp3`, `assets/audio/bgm/${key}.ogg`],
      loop: true,
      volume: 0,
    });

    this.bgm.play();
    this.bgm.fade(0, this.bgmVolume, 1000);
  }

  stopBGM(): void {
    if (this.bgm) {
      this.bgm.fade(this.bgmVolume, 0, 500);
      setTimeout(() => this.bgm?.stop(), 500);
    }
  }

  fadeBGM(targetVolume: number, duration: number): void {
    if (this.bgm) {
      this.bgm.fade(this.bgmVolume, targetVolume, duration);
    }
  }

  playSFX(key: string): void {
    let sfx = this.sfxCache.get(key);
    if (!sfx) {
      sfx = new Howl({
        src: [`assets/audio/sfx/${key}.mp3`, `assets/audio/sfx/${key}.ogg`],
        volume: this.sfxVolume,
      });
      this.sfxCache.set(key, sfx);
    }
    sfx.play();
  }

  setVolume(bgm: number, sfx: number): void {
    this.bgmVolume = Howler.ctx ? Math.max(0, Math.min(1, bgm)) : bgm;
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.bgm) this.bgm.volume(this.bgmVolume);
    this.sfxCache.forEach(s => s.volume(this.sfxVolume));
  }

  getVolume(): { bgm: number; sfx: number } {
    return { bgm: this.bgmVolume, sfx: this.sfxVolume };
  }

  destroy(): void {
    this.eventBus.off(GameEvent.BGM_PLAY, this.onBgmPlay);
    this.eventBus.off(GameEvent.BGM_STOP, this.onBgmStop);
    this.eventBus.off(GameEvent.SFX_PLAY, this.onSfxPlay);
    this.eventBus.off(GameEvent.MUSIC_FADE_OUT, this.onFadeOut);
    this.eventBus.off(GameEvent.MUSIC_FADE_TO_SILENCE, this.onFadeToSilence);
    document.removeEventListener('pointerdown', this.unlockHandler);
    document.removeEventListener('keydown', this.unlockHandler);
    this.bgm?.unload();
    this.sfxCache.forEach(s => s.unload());
    this.sfxCache.clear();
  }
}
