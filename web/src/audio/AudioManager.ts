import { Howl, Howler } from 'howler';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class AudioManager {
  private eventBus: EventBus;
  private bgm: Howl | null = null;
  private sfxCache: Map<string, Howl> = new Map();
  private bgmVolume = 0.5;
  private sfxVolume = 0.7;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEvents();
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.BGM_PLAY, (key: string) => {
      this.playBGM(key);
    });

    this.eventBus.on(GameEvent.BGM_STOP, () => {
      this.stopBGM();
    });

    this.eventBus.on(GameEvent.SFX_PLAY, (key: string) => {
      this.playSFX(key);
    });

    this.eventBus.on(GameEvent.MUSIC_FADE_OUT, (data: { duration: number }) => {
      this.fadeBGM(0, data.duration);
    });

    this.eventBus.on(GameEvent.MUSIC_FADE_TO_SILENCE, (data: { duration: number }) => {
      this.fadeBGM(0, data.duration);
    });
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
    this.bgmVolume = bgm;
    this.sfxVolume = sfx;
    if (this.bgm) this.bgm.volume(bgm);
    Howler.volume(sfx);
  }

  destroy(): void {
    this.bgm?.stop();
    this.sfxCache.forEach(s => s.stop());
    this.sfxCache.clear();
  }
}
