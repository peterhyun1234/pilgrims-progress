import { NPCConfig } from '../entities/NPC';
import { StatType } from '../core/GameEvents';

export interface ChapterTheme {
  groundBase: number;
  groundVariant: number;
  wallColor: number;
  wallTop: number;
  decorColors: number[];
  ambientParticleColor: number;
  ambientCount: number;
  /** Direction: 'up' rises (default), 'down' falls (ash/dust for Ch1). */
  ambientDirection?: 'up' | 'down';
  fogColor: number;
  fogAlpha: number;
  pathColor: number;
  /** Applied to player movement speed as a multiplier (default 1.0). */
  playerSpeedMod?: number;
}

export interface MapEvent {
  id: string;
  type: 'battle' | 'item' | 'cutscene' | 'dialogue';
  x: number;
  y: number;
  width: number;
  height: number;
  triggerOnce: boolean;
  data: Record<string, string | number | boolean>;
}

export interface MapObject {
  id: string;
  type: 'gate' | 'sign' | 'exhibit' | 'dead_end';
  x: number;
  y: number;
  label?: string;
  labelEn?: string;
  /** Initial open/visible state. */
  open?: boolean;
  /** Gate opens when this NPC completes. */
  opensOnNpcComplete?: string;
}

export interface CompletionRequirements {
  /** NPC IDs that must be 'completed' before the exit is unlocked. */
  requiredNpcs?: string[];
  /** Minimum stat values required. */
  minStats?: Partial<Record<StatType, number>>;
  /** Map event IDs that must have been triggered. */
  requiredEvents?: string[];
}

export interface ChapterConfig {
  chapter: number;
  locationName: string;
  locationNameEn: string;
  mapWidth: number;
  mapHeight: number;
  spawn: { x: number; y: number };
  npcs: NPCConfig[];
  bgmKey?: string;
  exits?: { x: number; y: number; width: number; height: number; targetChapter: number }[];
  theme: ChapterTheme;
  events?: MapEvent[];
  mapObjects?: MapObject[];
  completionRequirements?: CompletionRequirements;
  terrainZones?: TerrainZone[];
}

export interface TerrainZone {
  id: string;
  type: 'elevated' | 'water' | 'cave' | 'interior' | 'bridge' | 'pit';
  x: number;
  y: number;
  width: number;
  height: number;
  /** Visual height offset for elevated terrain */
  elevation?: number;
  /** Tile tint override */
  tint?: number;
  /** If false, non-walkable (collision wall) */
  walkable?: boolean;
  /** Speed multiplier while inside zone */
  slowFactor?: number;
}

const THEMES: Record<number, ChapterTheme> = {
  1: {
    groundBase: 0x6a5e4e,
    groundVariant: 0x625949,   // ±6-7 diff — subtle scatter, no checkerboard
    wallColor: 0x3a3028,
    wallTop: 0x4a4038,
    decorColors: [0x756a5a, 0x806e5c, 0x6a6050],
    ambientParticleColor: 0x998880,
    ambientCount: 18,
    ambientDirection: 'down',  // Ash/dust falls in city of destruction
    fogColor: 0x554444,
    fogAlpha: 0.12,
    pathColor: 0x8a7a65,
  },
  2: {
    groundBase: 0x4a5a46,
    groundVariant: 0x455542,
    wallColor: 0x2a3528,
    wallTop: 0x354030,
    decorColors: [0x4a6848, 0x3e5c3c, 0x5a7055],
    ambientParticleColor: 0x5599bb,
    ambientCount: 25,
    fogColor: 0x2a3a2a,
    fogAlpha: 0.28,
    pathColor: 0x5a6a55,
    playerSpeedMod: 0.82,  // Mud slows player 18%
  },
  3: {
    groundBase: 0x607848,
    groundVariant: 0x708858,
    wallColor: 0x3a4830,
    wallTop: 0x4a5840,
    decorColors: [0x88aa66, 0x77996a, 0x99bb77],
    ambientParticleColor: 0xaabb88,
    ambientCount: 12,
    fogColor: 0x334422,
    fogAlpha: 0.08,
    pathColor: 0x667a55,
  },
  4: {
    groundBase: 0x6e6e68,
    groundVariant: 0x686864,
    wallColor: 0x484844,
    wallTop: 0x585858,
    decorColors: [0x7a7a74, 0x6e6e68, 0x848480],
    ambientParticleColor: 0xd4a853,
    ambientCount: 15,
    fogColor: 0x333330,
    fogAlpha: 0.10,
    pathColor: 0x807a70,
  },
  5: {
    groundBase: 0x705e48,
    groundVariant: 0x806e58,
    wallColor: 0x3a2a1a,
    wallTop: 0x4a3a2a,
    decorColors: [0xd4a853, 0xaa8844, 0x886633],
    ambientParticleColor: 0xffdd88,
    ambientCount: 10,
    fogColor: 0x2a2010,
    fogAlpha: 0.05,
    pathColor: 0x7a6a55,
  },
  6: {
    groundBase: 0x728068,
    groundVariant: 0x6c7a63,
    wallColor: 0x485840,
    wallTop: 0x5a6850,
    decorColors: [0x99bb77, 0xd4a853, 0xffeedd],
    ambientParticleColor: 0xffd700,
    ambientCount: 30,
    fogColor: 0xffeedd,
    fogAlpha: 0.06,
    pathColor: 0x828c70,
  },

  // ─── Ch7: Beautiful Palace ─────────────────────────────────────────────
  7: {
    groundBase: 0x625878,
    groundVariant: 0x5c5373,
    wallColor: 0x3c2e50,
    wallTop: 0x4c3e60,
    decorColors: [0x7a6a8a, 0x8a7898, 0x685878],
    ambientParticleColor: 0xaa99cc,
    ambientCount: 15,
    fogColor: 0x4a4060,
    fogAlpha: 0.10,
    pathColor: 0x6e6080,
    playerSpeedMod: 0.95,
  },

  // ─── Ch8: Valley of Humiliation ───────────────────────────────────────
  8: {
    groundBase: 0x2e2838,
    groundVariant: 0x2a2534,
    wallColor: 0x181220,
    wallTop: 0x241c2e,
    decorColors: [0x3a2e44, 0x2e2438, 0x3a2a3c],
    ambientParticleColor: 0x660033,
    ambientCount: 8,
    ambientDirection: 'down',
    fogColor: 0x220038,
    fogAlpha: 0.30,
    pathColor: 0x3c2e48,
    playerSpeedMod: 0.9,
  },

  // ─── Ch9: Valley of Death's Shadow ────────────────────────────────────
  9: {
    groundBase: 0x1e1a22,
    groundVariant: 0x1b171f,
    wallColor: 0x100c14,
    wallTop: 0x1a161e,
    decorColors: [0x28202e, 0x201826, 0x24182c],
    ambientParticleColor: 0x332844,
    ambientCount: 5,
    ambientDirection: 'down',
    fogColor: 0x100c18,
    fogAlpha: 0.40,
    pathColor: 0x261e30,
    playerSpeedMod: 0.85,
  },

  // ─── Ch10: Vanity Fair ────────────────────────────────────────────────
  10: {
    groundBase: 0x3a3850,
    groundVariant: 0x35334c,
    wallColor: 0x222030,
    wallTop: 0x302e42,
    decorColors: [0x6655aa, 0x8855bb, 0xbb77aa],
    ambientParticleColor: 0xdd99bb,
    ambientCount: 20,
    fogColor: 0x2a2838,
    fogAlpha: 0.08,
    pathColor: 0x4a3a58,
  },

  // ─── Ch11: Doubting Castle ────────────────────────────────────────────
  11: {
    groundBase: 0x282434,
    groundVariant: 0x232030,
    wallColor: 0x181420,
    wallTop: 0x262230,
    decorColors: [0x30304a, 0x282838, 0x382e44],
    ambientParticleColor: 0x332844,
    ambientCount: 6,
    ambientDirection: 'down',
    fogColor: 0x181620,
    fogAlpha: 0.35,
    pathColor: 0x30283c,
    playerSpeedMod: 0.8,
  },

  // ─── Ch12: Celestial City ─────────────────────────────────────────────
  12: {
    groundBase: 0x524278,
    groundVariant: 0x594880,
    wallColor: 0x3c2c5a,
    wallTop: 0x4e3c6e,
    decorColors: [0xd4a853, 0xffd700, 0xffeedd],
    ambientParticleColor: 0xffd700,
    ambientCount: 35,
    fogColor: 0xffeedd,
    fogAlpha: 0.05,
    pathColor: 0x6e5e8a,
  },
};

export const CHAPTER_CONFIGS: ChapterConfig[] = [
  {
    chapter: 1,
    locationName: '멸망의 도시',
    locationNameEn: 'City of Destruction',
    mapWidth: 2400,
    mapHeight: 400,
    spawn: { x: 80, y: 200 },
    npcs: [
      {
        id: 'evangelist',
        nameKo: '전도자',
        nameEn: 'Evangelist',
        sprite: 'evangelist',
        x: 280, y: 160,
        chapter: 1,
        patrolPath: [{ x: 265, y: 160 }, { x: 295, y: 160 }],
        patrolSpeed: 12,
        behavior: 'gesture',
      },
      {
        id: 'obstinate',
        nameKo: '완고',
        nameEn: 'Obstinate',
        sprite: 'obstinate',
        x: 640, y: 200,
        chapter: 1,
        unlockedAt: 'evangelist',
      },
      {
        id: 'pliable',
        nameKo: '유연',
        nameEn: 'Pliable',
        sprite: 'pliable',
        x: 900, y: 170,
        chapter: 1,
        unlockedAt: 'evangelist',
      },
      {
        id: 'worldly_wiseman',
        nameKo: '세속 현자',
        nameEn: 'Mr. Worldly Wiseman',
        sprite: 'worldlywiseman',
        x: 1440, y: 150,
        chapter: 1,
        unlockedAt: 'pliable',
      },
      {
        id: 'interpreter',
        nameKo: '해석자',
        nameEn: 'Interpreter',
        sprite: 'interpreter',
        x: 1850, y: 160,
        chapter: 1,
      },
      {
        id: 'goodwill',
        nameKo: '선의',
        nameEn: 'Good-will',
        sprite: 'goodwill',
        x: 2280, y: 140,
        chapter: 1,
      },
    ],
    exits: [
      { x: 2340, y: 80, width: 60, height: 240, targetChapter: 2 },
    ],
    theme: THEMES[1],
    events: [
      {
        id: 'ch1_battle_doubt',
        type: 'battle',
        x: 1150, y: 160, width: 50, height: 50,
        triggerOnce: true,
        data: { enemyId: 'doubt' },
      },
    ],
    completionRequirements: {
      requiredNpcs: ['evangelist'],
      requiredEvents: ['ch1_battle_doubt'],
    },
  },
  {
    chapter: 2,
    locationName: '낙심의 늪',
    locationNameEn: 'Slough of Despond',
    mapWidth: 720,
    mapHeight: 400,
    spawn: { x: 80, y: 200 },
    npcs: [
      {
        id: 'help',
        nameKo: '도움',
        nameEn: 'Help',
        sprite: 'help',
        x: 360, y: 180,
        chapter: 2,
      },
    ],
    exits: [
      { x: 660, y: 120, width: 60, height: 80, targetChapter: 3 },
    ],
    theme: THEMES[2],
    events: [
      {
        id: 'ch2_battle_despair',
        type: 'battle',
        x: 500, y: 250, width: 40, height: 40,
        triggerOnce: true,
        data: { enemyId: 'despair' },
      },
    ],
    completionRequirements: {
      requiredNpcs: ['help'],
      requiredEvents: ['ch2_battle_despair'],
    },
  },
  {
    chapter: 3,
    locationName: '세속 현자의 길',
    locationNameEn: "Worldly Wiseman's Path",
    mapWidth: 600,
    mapHeight: 400,
    spawn: { x: 80, y: 280 },
    npcs: [
      {
        id: 'worldly_wiseman_ch3',
        nameKo: '세속 현자',
        nameEn: 'Mr. Worldly Wiseman',
        sprite: 'worldly_wiseman',
        x: 300, y: 200,
        chapter: 3,
      },
    ],
    exits: [
      { x: 540, y: 140, width: 60, height: 80, targetChapter: 4 },
    ],
    theme: THEMES[3],
    events: [
      {
        id: 'ch3_battle_tempt',
        type: 'battle',
        x: 420, y: 300, width: 40, height: 40,
        triggerOnce: true,
        data: { enemyId: 'temptation' },
      },
      // False sign dead-end dialogue (triggers if player walks to far right)
      {
        id: 'ch3_dead_end_warning',
        type: 'dialogue',
        x: 500, y: 200, width: 40, height: 100,
        triggerOnce: false,
        data: { npcId: 'worldly_wiseman_ch3', knotName: 'worldly_wiseman_warning' },
      },
    ],
    mapObjects: [
      {
        id: 'ch3_easy_road_sign',
        type: 'sign',
        x: 470, y: 220,
        label: '→ 편한 길',
        labelEn: '→ Easy Road',
      },
    ],
    completionRequirements: {
      requiredNpcs: ['worldly_wiseman_ch3'],
    },
  },
  {
    chapter: 4,
    locationName: '좁은 문',
    locationNameEn: 'The Wicket Gate',
    mapWidth: 480,
    mapHeight: 400,
    spawn: { x: 80, y: 200 },
    npcs: [
      {
        id: 'goodwill',
        nameKo: '선의',
        nameEn: 'Good-will',
        sprite: 'goodwill',
        x: 360, y: 180,
        chapter: 4,
        // Locked until wisdom >= 40 (handled by NpcStateManager.checkStatUnlocks)
        unlockedAt: undefined,
        minStatUnlock: { stat: 'wisdom', value: 40 },
      },
    ],
    exits: [
      { x: 420, y: 80, width: 60, height: 80, targetChapter: 5 },
    ],
    theme: THEMES[4],
    events: [
      {
        id: 'ch4_boss_giant_despair',
        type: 'battle',
        x: 200, y: 140, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'giant_despair' },
      },
    ],
    mapObjects: [
      {
        id: 'ch4_wicket_gate',
        type: 'gate',
        x: 410, y: 100,
        open: false,
        opensOnNpcComplete: 'goodwill',
      },
    ],
    completionRequirements: {
      requiredNpcs: ['goodwill'],
      requiredEvents: ['ch4_boss_giant_despair'],
    },
  },
  {
    chapter: 5,
    locationName: '해석자의 집',
    locationNameEn: "Interpreter's House",
    mapWidth: 480,
    mapHeight: 480,
    spawn: { x: 240, y: 420 },
    npcs: [
      {
        id: 'interpreter',
        nameKo: '해석자',
        nameEn: 'Interpreter',
        sprite: 'interpreter',
        x: 240, y: 200,
        chapter: 5,
        behavior: 'pray',
      },
    ],
    exits: [
      { x: 420, y: 60, width: 60, height: 80, targetChapter: 6 },
    ],
    theme: THEMES[5],
    events: [
      // 5 exhibit zones — each triggers a distinct Ink knot (type:'dialogue', triggerOnce:false so revisitable)
      {
        id: 'ch5_exhibit_fire',
        type: 'dialogue',
        x: 60, y: 80, width: 50, height: 50,
        triggerOnce: false,
        data: { npcId: 'interpreter', knotName: 'exhibit_fire', exhibitLabel: '불꽃', exhibitLabelEn: 'Fire' },
      },
      {
        id: 'ch5_exhibit_water',
        type: 'dialogue',
        x: 200, y: 80, width: 50, height: 50,
        triggerOnce: false,
        data: { npcId: 'interpreter', knotName: 'exhibit_water', exhibitLabel: '물', exhibitLabelEn: 'Water' },
      },
      {
        id: 'ch5_exhibit_cage',
        type: 'dialogue',
        x: 340, y: 80, width: 50, height: 50,
        triggerOnce: false,
        data: { npcId: 'interpreter', knotName: 'exhibit_cage', exhibitLabel: '새장', exhibitLabelEn: 'Cage' },
      },
      {
        id: 'ch5_exhibit_armored',
        type: 'dialogue',
        x: 100, y: 200, width: 50, height: 50,
        triggerOnce: false,
        data: { npcId: 'interpreter', knotName: 'exhibit_armored', exhibitLabel: '갑옷', exhibitLabelEn: 'Armor' },
      },
      {
        id: 'ch5_exhibit_rake',
        type: 'dialogue',
        x: 300, y: 200, width: 50, height: 50,
        triggerOnce: false,
        data: { npcId: 'interpreter', knotName: 'exhibit_rake', exhibitLabel: '갈퀴', exhibitLabelEn: 'Rake' },
      },
    ],
    completionRequirements: {
      requiredNpcs: ['interpreter'],
    },
  },
  {
    chapter: 6,
    locationName: '십자가',
    locationNameEn: 'The Cross',
    mapWidth: 480,
    mapHeight: 560,
    spawn: { x: 240, y: 500 },
    npcs: [],
    theme: THEMES[6],
  },

  // ─── Chapter 7: Beautiful Palace ──────────────────────────────────────────
  // Emotional arc: weight of choice → wrong path frustration → palace relief
  {
    chapter: 7,
    locationName: '아름다운 궁전',
    locationNameEn: 'Beautiful Palace',
    mapWidth: 2400,
    mapHeight: 600,
    spawn: { x: 80, y: 300 },
    theme: THEMES[7],
    bgmKey: 'bgm_palace',
    npcs: [
      {
        id: 'timorous',
        nameKo: '겁쟁이',
        nameEn: 'Timorous',
        sprite: 'timorous',
        x: 320, y: 320,
        chapter: 7,
        patrolPath: [{ x: 260, y: 320 }, { x: 350, y: 310 }],
        patrolSpeed: 30,
        behavior: 'pace',
      },
      {
        id: 'mistrust',
        nameKo: '불신',
        nameEn: 'Mistrust',
        sprite: 'mistrust',
        x: 480, y: 290,
        chapter: 7,
        patrolPath: [{ x: 440, y: 300 }, { x: 520, y: 280 }],
        patrolSpeed: 28,
        behavior: 'pace',
      },
      {
        id: 'watchful',
        nameKo: '경비원',
        nameEn: 'Watchful',
        sprite: 'watchful',
        x: 1500, y: 300,
        chapter: 7,
        behavior: 'guard',
      },
      {
        id: 'prudence',
        nameKo: '분별',
        nameEn: 'Prudence',
        sprite: 'prudence',
        x: 1800, y: 280,
        chapter: 7,
        unlockedAt: 'watchful',
        behavior: 'read',
      },
      {
        id: 'piety',
        nameKo: '경건',
        nameEn: 'Piety',
        sprite: 'piety',
        x: 2000, y: 310,
        chapter: 7,
        unlockedAt: 'watchful',
        behavior: 'pray',
      },
      {
        id: 'charity',
        nameKo: '사랑',
        nameEn: 'Charity',
        sprite: 'charity',
        x: 2200, y: 290,
        chapter: 7,
        unlockedAt: 'watchful',
      },
    ],
    exits: [
      { x: 2340, y: 150, width: 60, height: 300, targetChapter: 8 },
    ],
    events: [
      {
        id: 'ch7_lion_gate',
        type: 'battle',
        x: 1320, y: 260, width: 60, height: 80,
        triggerOnce: true,
        data: { enemyId: 'lion_fear' },
      },
      {
        id: 'ch7_wrong_path_dead_end',
        type: 'dialogue',
        x: 680, y: 500, width: 80, height: 60,
        triggerOnce: false,
        data: { npcId: 'timorous', knotName: 'timorous_warning' },
      },
    ],
    mapObjects: [
      {
        id: 'ch7_easy_road_sign',
        type: 'sign',
        x: 620, y: 480,
        label: '↓ 쉬운 길',
        labelEn: '↓ Easy Way',
      },
      {
        id: 'ch7_palace_gate',
        type: 'gate',
        x: 1460, y: 200,
        open: false,
        opensOnNpcComplete: 'watchful',
      },
    ],
    terrainZones: [
      { id: 'ch7_steep_path', type: 'elevated', x: 700, y: 180, width: 500, height: 120, elevation: 30, tint: 0x554466 },
      { id: 'ch7_palace_interior', type: 'interior', x: 1600, y: 200, width: 700, height: 300, tint: 0x7a6050 },
    ],
    completionRequirements: {
      requiredNpcs: ['watchful'],
      requiredEvents: ['ch7_lion_gate'],
    },
  },

  // ─── Chapter 8: Valley of Humiliation ─────────────────────────────────────
  // Emotional arc: solitary dread → overwhelming Apollyon → hard-won victory
  {
    chapter: 8,
    locationName: '겸손의 골짜기',
    locationNameEn: 'Valley of Humiliation',
    mapWidth: 1200,
    mapHeight: 400,
    spawn: { x: 80, y: 200 },
    theme: THEMES[8],
    bgmKey: 'bgm_valley',
    npcs: [],
    exits: [
      { x: 1140, y: 80, width: 60, height: 240, targetChapter: 9 },
    ],
    events: [
      {
        id: 'ch8_boss_apollyon',
        type: 'battle',
        x: 580, y: 160, width: 80, height: 80,
        triggerOnce: true,
        data: { enemyId: 'apollyon', isBoss: true, cutsceneBefore: 'apollyon_entrance' },
      },
    ],
    terrainZones: [
      { id: 'ch8_descent', type: 'cave', x: 0, y: 0, width: 1200, height: 400, tint: 0x110022 },
      { id: 'ch8_battle_pit', type: 'pit', x: 480, y: 300, width: 280, height: 100, walkable: false },
    ],
    completionRequirements: {
      requiredEvents: ['ch8_boss_apollyon'],
    },
  },

  // ─── Chapter 9: Valley of Death's Shadow ──────────────────────────────────
  // Emotional arc: extreme darkness → whispers of fear → Faithful's companionship
  {
    chapter: 9,
    locationName: '사망의 음침한 골짜기',
    locationNameEn: "Valley of the Shadow of Death",
    mapWidth: 2400,
    mapHeight: 400,
    spawn: { x: 80, y: 200 },
    theme: THEMES[9],
    bgmKey: 'bgm_shadow',
    npcs: [
      {
        id: 'faithful',
        nameKo: '충실자',
        nameEn: 'Faithful',
        sprite: 'faithful',
        x: 1960, y: 200,
        chapter: 9,
      },
    ],
    exits: [
      { x: 2340, y: 80, width: 60, height: 240, targetChapter: 10 },
    ],
    events: [
      {
        id: 'ch9_specter_1',
        type: 'battle',
        x: 480, y: 180, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'specter' },
      },
      {
        id: 'ch9_specter_2',
        type: 'battle',
        x: 1100, y: 180, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'specter' },
      },
      {
        id: 'ch9_specter_3',
        type: 'battle',
        x: 1680, y: 180, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'specter' },
      },
      {
        id: 'ch9_whisper_zone_1',
        type: 'dialogue',
        x: 700, y: 100, width: 100, height: 200,
        triggerOnce: false,
        data: { npcId: 'faithful', knotName: 'valley_whisper_1' },
      },
      {
        id: 'ch9_whisper_zone_2',
        type: 'dialogue',
        x: 1300, y: 100, width: 100, height: 200,
        triggerOnce: false,
        data: { npcId: 'faithful', knotName: 'valley_whisper_2' },
      },
      {
        id: 'ch9_faithful_joins',
        type: 'cutscene',
        x: 1900, y: 160, width: 100, height: 80,
        triggerOnce: true,
        data: { cutsceneId: 'faithful_joins' },
      },
    ],
    terrainZones: [
      { id: 'ch9_pit_left', type: 'pit', x: 0, y: 0, width: 60, height: 400, walkable: false },
      { id: 'ch9_pit_right', type: 'pit', x: 2340, y: 0, width: 60, height: 400, walkable: false },
      { id: 'ch9_narrow_path', type: 'cave', x: 60, y: 140, width: 2280, height: 120, tint: 0x0a0408, slowFactor: 0.85 },
    ],
    completionRequirements: {
      requiredNpcs: ['faithful'],
      requiredEvents: ['ch9_specter_1', 'ch9_specter_2', 'ch9_specter_3'],
    },
  },

  // ─── Chapter 10: Vanity Fair ───────────────────────────────────────────────
  // Emotional arc: temptation glamour → Faithful's trial → the most painful farewell
  {
    chapter: 10,
    locationName: '허영의 시장',
    locationNameEn: 'Vanity Fair',
    mapWidth: 2400,
    mapHeight: 600,
    spawn: { x: 80, y: 300 },
    theme: THEMES[10],
    bgmKey: 'bgm_fair',
    npcs: [
      {
        id: 'faithful',
        nameKo: '충실자',
        nameEn: 'Faithful',
        sprite: 'faithful',
        x: 200, y: 300,
        chapter: 10,
      },
      {
        id: 'lord_hategood',
        nameKo: '증오선 재판관',
        nameEn: 'Lord Hate-good',
        sprite: 'lord_hategood',
        x: 1500, y: 280,
        chapter: 10,
        unlockedAt: 'faithful',
      },
    ],
    exits: [
      { x: 2340, y: 150, width: 60, height: 300, targetChapter: 11 },
    ],
    events: [
      {
        id: 'ch10_market_temptation_1',
        type: 'battle',
        x: 500, y: 280, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'vanity' },
      },
      {
        id: 'ch10_market_temptation_2',
        type: 'battle',
        x: 900, y: 280, width: 60, height: 60,
        triggerOnce: true,
        data: { enemyId: 'vanity' },
      },
      {
        id: 'ch10_faithful_trial',
        type: 'cutscene',
        x: 1460, y: 240, width: 100, height: 80,
        triggerOnce: true,
        data: { cutsceneId: 'faithful_martyrdom' },
      },
    ],
    mapObjects: [
      { id: 'ch10_stall_1', type: 'exhibit', x: 360, y: 260, label: '부귀', labelEn: 'Riches' },
      { id: 'ch10_stall_2', type: 'exhibit', x: 680, y: 260, label: '쾌락', labelEn: 'Pleasures' },
      { id: 'ch10_stall_3', type: 'exhibit', x: 1000, y: 260, label: '명예', labelEn: 'Honour' },
      { id: 'ch10_judgment_stage', type: 'sign', x: 1500, y: 220, label: '재판대', labelEn: 'Judgment Stage' },
    ],
    terrainZones: [
      { id: 'ch10_market_zone', type: 'interior', x: 300, y: 180, width: 1200, height: 240, tint: 0x2a1828 },
    ],
    completionRequirements: {
      requiredNpcs: ['lord_hategood'],
      requiredEvents: ['ch10_faithful_trial'],
    },
  },

  // ─── Chapter 11: Doubting Castle ──────────────────────────────────────────
  // Emotional arc: imprisonment in despair → promise key revelation → freedom
  {
    chapter: 11,
    locationName: '의심의 성',
    locationNameEn: 'Doubting Castle',
    mapWidth: 800,
    mapHeight: 800,
    spawn: { x: 400, y: 720 },
    theme: THEMES[11],
    bgmKey: 'bgm_dungeon',
    npcs: [
      {
        id: 'hopeful',
        nameKo: '소망',
        nameEn: 'Hopeful',
        sprite: 'hopeful',
        x: 400, y: 680,
        chapter: 11,
      },
      {
        id: 'diffidence',
        nameKo: '소심',
        nameEn: 'Diffidence',
        sprite: 'diffidence',
        x: 400, y: 400,
        chapter: 11,
        unlockedAt: 'hopeful',
      },
    ],
    exits: [
      { x: 340, y: 60, width: 120, height: 60, targetChapter: 12 },
    ],
    events: [
      {
        id: 'ch11_diffidence_battle',
        type: 'battle',
        x: 350, y: 360, width: 100, height: 80,
        triggerOnce: true,
        data: { enemyId: 'diffidence_enemy' },
      },
      {
        id: 'ch11_boss_giant_despair',
        type: 'battle',
        x: 340, y: 200, width: 120, height: 120,
        triggerOnce: true,
        data: { enemyId: 'giant_despair', isBoss: true, cutsceneBefore: 'giant_despair_entrance' },
      },
      {
        id: 'ch11_key_of_promise',
        type: 'cutscene',
        x: 360, y: 580, width: 80, height: 80,
        triggerOnce: true,
        data: { cutsceneId: 'key_of_promise' },
      },
    ],
    mapObjects: [
      { id: 'ch11_prison_bars', type: 'gate', x: 340, y: 500, open: false, opensOnNpcComplete: 'hopeful' },
      { id: 'ch11_castle_gate', type: 'gate', x: 340, y: 100, open: false, opensOnNpcComplete: 'hopeful' },
    ],
    terrainZones: [
      { id: 'ch11_dungeon', type: 'cave', x: 0, y: 0, width: 800, height: 800, tint: 0x101018 },
      { id: 'ch11_cell', type: 'interior', x: 200, y: 480, width: 400, height: 200, tint: 0x0e0c14, slowFactor: 0.7 },
    ],
    completionRequirements: {
      requiredNpcs: ['hopeful'],
      requiredEvents: ['ch11_boss_giant_despair', 'ch11_key_of_promise'],
    },
  },

  // ─── Chapter 12: Celestial City ───────────────────────────────────────────
  // Emotional arc: final trial → river crossing → transcendent joy at the gates
  {
    chapter: 12,
    locationName: '천성',
    locationNameEn: 'Celestial City',
    mapWidth: 3000,
    mapHeight: 600,
    spawn: { x: 80, y: 300 },
    theme: THEMES[12],
    bgmKey: 'bgm_celestial',
    npcs: [
      {
        id: 'hopeful',
        nameKo: '소망',
        nameEn: 'Hopeful',
        sprite: 'hopeful',
        x: 200, y: 300,
        chapter: 12,
      },
      {
        id: 'ignorance',
        nameKo: '무지',
        nameEn: 'Ignorance',
        sprite: 'ignorance',
        x: 600, y: 320,
        chapter: 12,
      },
      {
        id: 'shining_ones',
        nameKo: '빛나는 자들',
        nameEn: 'Shining Ones',
        sprite: 'shining_ones',
        x: 2100, y: 280,
        chapter: 12,
      },
    ],
    exits: [],
    events: [
      {
        id: 'ch12_enchanted_ground_warning',
        type: 'dialogue',
        x: 800, y: 250, width: 100, height: 100,
        triggerOnce: false,
        data: { npcId: 'hopeful', knotName: 'enchanted_ground_warning' },
      },
      {
        id: 'ch12_river_crossing',
        type: 'cutscene',
        x: 1020, y: 200, width: 100, height: 200,
        triggerOnce: true,
        data: { cutsceneId: 'river_crossing' },
      },
      {
        id: 'ch12_ignorance_warning',
        type: 'cutscene',
        x: 2800, y: 220, width: 80, height: 160,
        triggerOnce: true,
        data: { cutsceneId: 'ignorance_turned_away' },
      },
      {
        id: 'ch12_celestial_arrival',
        type: 'cutscene',
        x: 2900, y: 200, width: 100, height: 200,
        triggerOnce: true,
        data: { cutsceneId: 'celestial_arrival', isEnding: true },
      },
    ],
    mapObjects: [
      { id: 'ch12_celestial_gate', type: 'gate', x: 2900, y: 140, open: true, label: '천성 문', labelEn: 'Celestial Gate' },
    ],
    terrainZones: [
      // Zone 1: Enchanted Ground (sleepy flowers)
      { id: 'ch12_enchanted_ground', type: 'elevated', x: 100, y: 180, width: 900, height: 240, slowFactor: 0.75, tint: 0x3a2855 },
      // Zone 2: River of Death (water crossing)
      { id: 'ch12_river', type: 'water', x: 1000, y: 180, width: 1000, height: 240, slowFactor: 0.4, tint: 0x1a2a4a },
      // Bridge through river
      { id: 'ch12_river_bridge', type: 'bridge', x: 1200, y: 260, width: 600, height: 80, slowFactor: 0.9 },
      // Zone 3: Celestial shore
      { id: 'ch12_celestial_shore', type: 'elevated', x: 2000, y: 160, width: 1000, height: 280, elevation: 20, tint: 0x5a4870 },
    ],
    completionRequirements: {
      requiredNpcs: ['shining_ones'],
      requiredEvents: ['ch12_river_crossing', 'ch12_celestial_arrival'],
    },
  },
];
