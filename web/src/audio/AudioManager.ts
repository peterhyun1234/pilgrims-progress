import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { ProceduralAudio } from './ProceduralAudio';
import { AmbientAudioEngine } from './AmbientAudioEngine';
import { ProceduralBGM } from './ProceduralBGM';

export class AudioManager {
  private eventBus: EventBus;
  private bgmVolume = 0.30;
  private sfxVolume = 0.30;
  private audioUnlocked = false;
  readonly procedural: ProceduralAudio;
  readonly ambient: AmbientAudioEngine;
  readonly bgm: ProceduralBGM;

  private onBgmPlay  = (data: { key: string; loop?: boolean } | string) => {
    const key = typeof data === 'string' ? data : data.key;
    // key format: 'ch1' … 'ch12' or legacy file keys — extract chapter number
    const match = key.match(/(\d+)/);
    const chapter = match ? parseInt(match[1], 10) : 1;
    this.bgm.play(chapter);
  };
  private onBgmStop       = () => this.bgm.stop();
  private onFadeOut       = (data: { duration: number }) => this.bgm.stop(data.duration);
  private onFadeToSilence = (data: { duration: number }) => this.bgm.stop(data.duration);

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.procedural = new ProceduralAudio();
    this.ambient    = new AmbientAudioEngine();
    this.bgm        = new ProceduralBGM();
    this.setupEvents();
    this.setupAutoplayUnlock();
  }

  private unlockHandler = () => {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;
    this.procedural.resume();
    this.ambient.resume();
    this.bgm.resume();
    document.removeEventListener('pointerdown', this.unlockHandler);
    document.removeEventListener('keydown',     this.unlockHandler);
  };

  private setupAutoplayUnlock(): void {
    document.addEventListener('pointerdown', this.unlockHandler);
    document.addEventListener('keydown',     this.unlockHandler);
  }

  private setupEvents(): void {
    this.eventBus.on(GameEvent.BGM_PLAY,           this.onBgmPlay);
    this.eventBus.on(GameEvent.BGM_STOP,           this.onBgmStop);
    this.eventBus.on(GameEvent.MUSIC_FADE_OUT,     this.onFadeOut);
    this.eventBus.on(GameEvent.MUSIC_FADE_TO_SILENCE, this.onFadeToSilence);
  }

  setVolume(bgmVol: number, sfxVol: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, bgmVol));
    this.sfxVolume = Math.max(0, Math.min(1, sfxVol));
    this.bgm.setVolume(bgmVol * 0.75);
    this.procedural.setVolume(sfxVol * 0.60);
    this.ambient.setVolume(bgmVol * 0.40);
  }

  getVolume(): { bgm: number; sfx: number } {
    return { bgm: this.bgmVolume, sfx: this.sfxVolume };
  }

  destroy(): void {
    this.eventBus.off(GameEvent.BGM_PLAY,              this.onBgmPlay);
    this.eventBus.off(GameEvent.BGM_STOP,              this.onBgmStop);
    this.eventBus.off(GameEvent.MUSIC_FADE_OUT,        this.onFadeOut);
    this.eventBus.off(GameEvent.MUSIC_FADE_TO_SILENCE, this.onFadeToSilence);
    document.removeEventListener('pointerdown', this.unlockHandler);
    document.removeEventListener('keydown',     this.unlockHandler);
    this.bgm.destroy();
    this.procedural.destroy();
    this.ambient.destroy();
  }
}
