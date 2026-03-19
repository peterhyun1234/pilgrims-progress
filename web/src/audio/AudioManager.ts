import { Howl, Howler } from 'howler';
import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';

export class AudioManager {
  private bgm: Map<string, Howl> = new Map();
  private sfx: Map<string, Howl> = new Map();
  private currentBGM: string | null = null;
  private eventBus: EventBus;

  private masterVolume = 1.0;
  private bgmVolume = 0.7;
  private sfxVolume = 0.8;

  constructor() {
    this.eventBus = EventBus.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.on(GameEvent.BGM_PLAY, (track: unknown) => {
      this.playBGM(track as string);
    });

    this.eventBus.on(GameEvent.BGM_STOP, () => {
      this.stopBGM();
    });

    this.eventBus.on(GameEvent.SFX_PLAY, (sound: unknown) => {
      this.playSFX(sound as string);
    });
  }

  loadBGM(key: string, src: string): void {
    const howl = new Howl({
      src: [src],
      loop: true,
      volume: this.bgmVolume * this.masterVolume,
    });
    this.bgm.set(key, howl);
  }

  loadSFX(key: string, src: string): void {
    const howl = new Howl({
      src: [src],
      volume: this.sfxVolume * this.masterVolume,
    });
    this.sfx.set(key, howl);
  }

  playBGM(key: string): void {
    if (this.currentBGM === key) return;

    this.stopBGM();
    const howl = this.bgm.get(key);
    if (howl) {
      howl.play();
      this.currentBGM = key;
    }
  }

  stopBGM(): void {
    if (this.currentBGM) {
      const howl = this.bgm.get(this.currentBGM);
      howl?.stop();
      this.currentBGM = null;
    }
  }

  playSFX(key: string): void {
    const howl = this.sfx.get(key);
    howl?.play();
  }

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
  }

  setBGMVolume(volume: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, volume));
    this.bgm.forEach((howl) => howl.volume(this.bgmVolume * this.masterVolume));
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.sfx.forEach((howl) => howl.volume(this.sfxVolume * this.masterVolume));
  }
}
