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
}

const THEMES: Record<number, ChapterTheme> = {
  1: {
    groundBase: 0x4a4035,
    groundVariant: 0x3d3528,
    wallColor: 0x2a2520,
    wallTop: 0x3a3530,
    decorColors: [0x555044, 0x605548, 0x4a4438],
    ambientParticleColor: 0x777766,
    ambientCount: 18,
    ambientDirection: 'down',  // Ash/dust falls in city of destruction
    fogColor: 0x333333,
    fogAlpha: 0.15,
    pathColor: 0x5a5040,
  },
  2: {
    groundBase: 0x2a3a28,
    groundVariant: 0x1e2e1c,
    wallColor: 0x1a2518,
    wallTop: 0x253020,
    decorColors: [0x334a30, 0x2a4028, 0x3a5035],
    ambientParticleColor: 0x4488aa,
    ambientCount: 25,
    fogColor: 0x1a2a1a,
    fogAlpha: 0.35,
    pathColor: 0x3a4a35,
    playerSpeedMod: 0.82,  // Mud slows player 18%
  },
  3: {
    groundBase: 0x4a5a3a,
    groundVariant: 0x556a44,
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
    groundBase: 0x555550,
    groundVariant: 0x4a4a45,
    wallColor: 0x3a3a35,
    wallTop: 0x4a4a48,
    decorColors: [0x666660, 0x5a5a55, 0x707068],
    ambientParticleColor: 0xd4a853,
    ambientCount: 15,
    fogColor: 0x222222,
    fogAlpha: 0.15,
    pathColor: 0x6a6a60,
  },
  5: {
    groundBase: 0x5a4a38,
    groundVariant: 0x6a5a48,
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
    groundBase: 0x5a6050,
    groundVariant: 0x4a5040,
    wallColor: 0x3a4030,
    wallTop: 0x4a5040,
    decorColors: [0x88aa66, 0xd4a853, 0xffeedd],
    ambientParticleColor: 0xffd700,
    ambientCount: 30,
    fogColor: 0xffeedd,
    fogAlpha: 0.08,
    pathColor: 0x6a7058,
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
        // Patrol slightly left-right to appear busy
        patrolPath: [{ x: 265, y: 160 }, { x: 295, y: 160 }],
        patrolSpeed: 12,
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
        id: 'worldly_wiseman',
        nameKo: '세속 현자',
        nameEn: 'Worldly Wiseman',
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
        data: { npcId: 'worldly_wiseman', knotName: 'worldly_wiseman_warning' },
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
      requiredNpcs: ['worldly_wiseman'],
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
];
