import { CutsceneDefinition } from '../../scenes/CutsceneEngine';
import { CAMERA } from '../../config';

/**
 * The four most emotionally resonant cutscenes in the game.
 * Each is designed to elicit a specific feeling:
 *   ch6_burden_released  — cathartic relief and joy
 *   apollyon_entrance    — dread escalating to resolve
 *   faithful_martyrdom   — grief and sacrificial love
 *   celestial_arrival    — transcendent joy and completion
 */

// ─── Ch6: The Burden Released ─────────────────────────────────────────────────
// Christian arrives at the Cross. After so long carrying his burden, it falls.
// The player should feel tears of joy. 30–45 seconds.
export const CH6_BURDEN_RELEASED: CutsceneDefinition = {
  id: 'ch6_burden_released',
  lockInput: true,
  steps: [
    // Slow approach — camera zooms in
    { type: 'camera', zoom: CAMERA.ZOOM_DIALOGUE, zoomDuration: 1200 },
    { type: 'wait', ms: 800 },

    // Music fades to near-silence as player approaches the cross
    { type: 'music', musicAction: 'fade_out', musicFadeDuration: 2000 },
    { type: 'wait', ms: 2000 },

    // The moment — barely a whisper
    {
      type: 'dialogue',
      text: '...짐이 움직인다.',
      duration: 2200,
    },
    { type: 'wait', ms: 400 },

    // Climax zoom
    { type: 'camera', zoom: CAMERA.ZOOM_CLIMAX, zoomDuration: 1000 },

    // Golden light floods in
    { type: 'mood', mood: 'awe', moodDuration: 2000, parallel: true },
    { type: 'particles', particleType: 'holy_light', particleX: 240, particleY: 200, particleCount: 30, parallel: true },
    { type: 'wait', ms: 600 },

    // The shedding
    {
      type: 'dialogue',
      text: '사슬이 풀려나갔다.',
      duration: 2500,
    },
    { type: 'wait', ms: 300 },

    // Dramatic white flash — the burden falls
    { type: 'flash', flashColor: 0xffffff, flashDuration: 800 },
    { type: 'stat', statKey: 'burden', statAmount: -100 },
    { type: 'wait', ms: 1200 },

    // The aftermath — light everywhere
    { type: 'particles', particleType: 'light', particleX: 240, particleY: 200, particleCount: 20, parallel: true },
    { type: 'mood', mood: 'grace', moodDuration: 3000, parallel: true },

    {
      type: 'dialogue',
      speaker: '크리스천 / Christian',
      text: '"내 짐이 없어졌다! 십자가가 내 짐을 가져갔다!"',
      duration: 3800,
    },
    { type: 'wait', ms: 600 },

    // Celebratory burst
    { type: 'particles', particleType: 'holy_light', particleX: 240, particleY: 200, particleCount: 40, parallel: true },
    { type: 'sound', sfxKey: 'bell_chime', parallel: true },

    {
      type: 'dialogue',
      text: '세 빛나는 자들이 그에게 나타났다.',
      duration: 2500,
    },
    { type: 'wait', ms: 400 },

    {
      type: 'dialogue',
      speaker: '빛나는 자 / Shining One',
      text: '"평안하라. 네 죄가 용서되었느니라."',
      duration: 3000,
    },
    { type: 'wait', ms: 600 },

    // Fade back to normal
    { type: 'mood', mood: 'joy', moodDuration: 2000, parallel: true },
    { type: 'camera', zoom: CAMERA.ZOOM_DEFAULT, zoomDuration: 1500 },
    { type: 'wait', ms: 1500 },

    {
      type: 'toast',
      toastText: '짐이 풀렸다! 믿음 +20, 용기 +10',
      toastType: 'stat-positive',
      toastIcon: '✨',
    },
    { type: 'stat', statKey: 'faith', statAmount: 20, parallel: true },
    { type: 'stat', statKey: 'courage', statAmount: 10 },
  ],
};

// ─── Ch8: Apollyon Entrance ────────────────────────────────────────────────────
// The most terrifying enemy Christian faces. Before the battle begins, the player
// must feel dread — but also the slow gathering of resolve.
export const APOLLYON_ENTRANCE: CutsceneDefinition = {
  id: 'apollyon_entrance',
  lockInput: true,
  steps: [
    // Stillness before the storm
    { type: 'mood', mood: 'tense', moodDuration: 1500 },
    { type: 'wait', ms: 1000 },

    // Ground shakes — something is coming
    { type: 'shake', shakeIntensity: 2, shakeDuration: 600 },
    { type: 'wait', ms: 800 },
    { type: 'shake', shakeIntensity: 4, shakeDuration: 700 },
    { type: 'wait', ms: 600 },
    { type: 'shake', shakeIntensity: 6, shakeDuration: 900 },
    { type: 'wait', ms: 400 },

    // Darkness floods
    { type: 'mood', mood: 'dread', moodDuration: 2000, parallel: true },
    { type: 'music', musicAction: 'fade_to_silence', musicFadeDuration: 1500, parallel: true },
    { type: 'wait', ms: 1800 },

    // Apollyon appears
    {
      type: 'dialogue',
      text: '날개 달린 거수가 골짜기에서 솟아올랐다...',
      duration: 3000,
    },
    { type: 'wait', ms: 500 },

    // Red flash — the monster
    { type: 'flash', flashColor: 0x440000, flashDuration: 600 },
    { type: 'camera', zoom: CAMERA.ZOOM_CLOSEUP, zoomDuration: 500, parallel: true },
    { type: 'wait', ms: 800 },

    {
      type: 'dialogue',
      speaker: '아폴리온 / Apollyon',
      text: '"나는 이 장소의 왕이다. 어디서 왔느냐?"',
      duration: 3200,
    },
    { type: 'wait', ms: 400 },

    {
      type: 'dialogue',
      speaker: '크리스천 / Christian',
      text: '"나는 멸망의 도시에서 왔으나, 지금은 시온을 향해 가고 있소."',
      duration: 3500,
    },
    { type: 'wait', ms: 400 },

    {
      type: 'dialogue',
      speaker: '아폴리온 / Apollyon',
      text: '"너는 내 신하다. 나에게 돌아오라 — 그렇지 않으면 죽으리라!"',
      duration: 3500,
    },
    { type: 'wait', ms: 600 },

    // The resolve builds
    { type: 'mood', mood: 'resolve', moodDuration: 1500 },
    { type: 'wait', ms: 500 },

    {
      type: 'dialogue',
      speaker: '크리스천 / Christian',
      text: '"나는 그 왕께 속하여 있소. 물러서라!"',
      duration: 3000,
    },
    { type: 'wait', ms: 400 },

    // Battle begins — dramatic zoom out
    { type: 'camera', zoom: CAMERA.ZOOM_DEFAULT, zoomDuration: 400 },
    { type: 'shake', shakeIntensity: 5, shakeDuration: 500, parallel: true },
    { type: 'wait', ms: 600 },

    {
      type: 'title',
      titleText: '아폴리온과의 대결',
      titleSubtext: 'Battle with Apollyon',
      titleDuration: 2000,
    },
  ],
};

// ─── Ch10: Faithful's Martyrdom ────────────────────────────────────────────────
// The most devastating moment in the game. Faithful is executed.
// This must be the scene players remember for years.
export const FAITHFUL_MARTYRDOM: CutsceneDefinition = {
  id: 'faithful_martyrdom',
  lockInput: true,
  steps: [
    // The trial begins — ominous calm
    { type: 'camera', zoom: CAMERA.ZOOM_DIALOGUE, zoomDuration: 1200 },
    { type: 'mood', mood: 'tense', moodDuration: 1500 },
    { type: 'wait', ms: 1200 },

    {
      type: 'dialogue',
      speaker: '증오선 / Lord Hate-good',
      text: '"충실자, 네가 우리 도시의 법과 왕자를 반역했으니 사형을 선고하노라."',
      duration: 4000,
    },
    { type: 'wait', ms: 600 },

    // The crowd
    {
      type: 'dialogue',
      text: '군중이 고함쳤다. 일부는 울었다.',
      duration: 2500,
    },
    { type: 'wait', ms: 400 },

    // Faithful's final words — this is the moment
    { type: 'camera', zoom: CAMERA.ZOOM_CLOSEUP, zoomDuration: 800 },
    { type: 'wait', ms: 600 },

    {
      type: 'dialogue',
      speaker: '충실자 / Faithful',
      text: '"죽기까지 충성하라. 그리하면 생명의 면류관을 네게 주리라."',
      duration: 5000,
    },
    { type: 'wait', ms: 800 },

    // THE MOMENT — complete silence
    { type: 'music', musicAction: 'fade_to_silence', musicFadeDuration: 1000 },
    { type: 'wait', ms: 1500 },

    // White flash — the execution
    { type: 'flash', flashColor: 0xffffff, flashDuration: 1200 },
    { type: 'wait', ms: 3000 }, // Full silence — let it land

    // The sorrow
    { type: 'mood', mood: 'sorrow', moodDuration: 3000 },
    { type: 'wait', ms: 1000 },

    {
      type: 'dialogue',
      text: '충실자가 순교했다.',
      duration: 4000,
    },
    { type: 'wait', ms: 800 },

    // Camera pulls back slowly
    { type: 'camera', zoom: CAMERA.ZOOM_DEFAULT, zoomDuration: 2000 },
    { type: 'wait', ms: 1000 },

    // Soft music returns — grief
    { type: 'music', musicAction: 'play', musicTrack: 'bgm_sorrow', parallel: true },

    {
      type: 'dialogue',
      text: '크리스천은 홀로 남았다. 그러나 그는 계속 걸었다.',
      duration: 4000,
    },
    { type: 'wait', ms: 600 },

    {
      type: 'toast',
      toastText: "충실자의 유서를 받았다",
      toastType: 'achievement',
      toastIcon: '📜',
    },
    { type: 'mood', mood: 'resolve', moodDuration: 2000 },
  ],
};

// ─── Ch12: Celestial Arrival ────────────────────────────────────────────────
// The journey's end. After everything — the city gates open.
// Pure, overwhelming, holy joy. The player should feel they have arrived.
export const CELESTIAL_ARRIVAL: CutsceneDefinition = {
  id: 'celestial_arrival',
  lockInput: true,
  steps: [
    // On the other shore — breath held
    { type: 'mood', mood: 'awe', moodDuration: 3000 },
    { type: 'camera', zoom: CAMERA.ZOOM_WIDE, zoomDuration: 2000 },
    { type: 'wait', ms: 2000 },

    {
      type: 'dialogue',
      text: '성벽이 보인다. 빛이 그 너머에서 흘러나온다.',
      duration: 3500,
    },
    { type: 'wait', ms: 600 },

    // Shining Ones descend
    { type: 'particles', particleType: 'holy_light', particleX: 240, particleY: 120, particleCount: 25, parallel: true },
    { type: 'sound', sfxKey: 'angel_choir', parallel: true },

    {
      type: 'dialogue',
      speaker: '빛나는 자들 / Shining Ones',
      text: '"오라! 들어오라! 이는 주께서 너를 위해 예비하신 곳이니라."',
      duration: 4000,
    },
    { type: 'wait', ms: 800 },

    // Gate opens — escalating light
    { type: 'flash', flashColor: 0xffd700, flashDuration: 600, parallel: true },
    { type: 'camera', zoom: CAMERA.ZOOM_DIALOGUE, zoomDuration: 1200 },
    { type: 'wait', ms: 1200 },

    // Trumpets (SFX)
    { type: 'sound', sfxKey: 'trumpet_fanfare', parallel: true },
    { type: 'particles', particleType: 'holy_light', particleX: 240, particleY: 160, particleCount: 50, parallel: true },
    { type: 'mood', mood: 'grace', moodDuration: 5000, parallel: true },
    { type: 'wait', ms: 600 },

    {
      type: 'dialogue',
      speaker: '크리스천 / Christian',
      text: '"내가 왔습니다! 마침내, 내가 왔습니다!"',
      duration: 3500,
    },
    { type: 'wait', ms: 1000 },

    // The final flash — enter the city
    { type: 'flash', flashColor: 0xffffff, flashDuration: 2000 },
    { type: 'wait', ms: 2000 },

    // Fade up through white to ending
    {
      type: 'title',
      titleText: '순례의 끝',
      titleSubtext: "The End of the Pilgrim's Journey",
      titleDuration: 4000,
    },
    { type: 'wait', ms: 1000 },

    // Final blessing
    {
      type: 'dialogue',
      text: '"하나님이 그들의 눈에서 모든 눈물을 씻어 주실 것이요..."',
      duration: 4000,
    },
    { type: 'wait', ms: 400 },

    {
      type: 'dialogue',
      text: '"다시는 사망이 없고 애통하는 것이나 곡하는 것이나 아픈 것이 다시 있지 아니하리니..."',
      duration: 5000,
    },
    { type: 'wait', ms: 400 },

    {
      type: 'dialogue',
      text: '"처음 것들이 다 지나갔음이러라." — 요한계시록 21:4',
      duration: 5000,
    },
    { type: 'wait', ms: 1500 },

    {
      type: 'toast',
      toastText: '순례 완료 — 천성에 도착하였다',
      toastType: 'achievement',
      toastIcon: '🌟',
    },
  ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const CUTSCENE_REGISTRY: Record<string, CutsceneDefinition> = {
  ch6_burden_released: CH6_BURDEN_RELEASED,
  apollyon_entrance:    APOLLYON_ENTRANCE,
  faithful_martyrdom:   FAITHFUL_MARTYRDOM,
  celestial_arrival:    CELESTIAL_ARRIVAL,
};
