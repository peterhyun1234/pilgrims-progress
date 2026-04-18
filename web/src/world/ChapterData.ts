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
  /** Sky gradient top color */
  skyTop: number;
  /** Sky gradient bottom color */
  skyBot: number;
  /** Highlight / accent color for glows and special details */
  accentColor: number;
  /** Shadow tint for cast shadows */
  shadowColor: number;
  /** Ambient light overlay color */
  ambientLight: number;
  /** Ambient light overlay alpha (0–1) */
  ambientAlpha: number;
  /** Tree style for this chapter */
  treeType: 'oak' | 'swamp' | 'meadow' | 'dead' | 'paradise' | 'celestial' | 'pine';
  /** Ground tile style for this chapter */
  groundType: 'cobble' | 'mud' | 'rock' | 'stone' | 'grass' | 'dark' | 'market' | 'dungeon' | 'meadow' | 'forest' | 'gold';
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
  // ─── Ch1: City of Destruction ─────────────────────────────────────────
  1: {
    groundBase:           0x5a5048,   // dark warm gray cobble
    groundVariant:        0x524840,   // slightly darker variant
    wallColor:            0x2e2820,
    wallTop:              0x3e3830,
    decorColors:          [0x706050, 0x7a6858, 0x605848],
    ambientParticleColor: 0xcc7722,   // falling ash/ember
    ambientCount:         22,
    ambientDirection:     'down',
    fogColor:             0x5a3322,   // sooty orange-brown haze
    fogAlpha:             0.16,
    pathColor:            0x8a7860,
    skyTop:               0x1a0e08,   // near-black soot sky
    skyBot:               0x3d1e08,   // deep ember orange at horizon
    accentColor:          0xff5500,   // fire orange
    shadowColor:          0x1a0a00,
    ambientLight:         0xff4400,
    ambientAlpha:         0.04,
    treeType:             'oak',
    groundType:           'cobble',
  },
  // ─── Ch2: Slough of Despond ───────────────────────────────────────────
  2: {
    groundBase:           0x3a4a36,   // murky olive mud
    groundVariant:        0x354438,   // darker mud
    wallColor:            0x1e2e1a,
    wallTop:              0x283820,
    decorColors:          [0x3e5c3c, 0x4a6848, 0x334433],
    ambientParticleColor: 0x6688aa,   // mist droplets
    ambientCount:         28,
    fogColor:             0x1e3028,   // deep green fog
    fogAlpha:             0.32,
    pathColor:            0x4a5a40,
    playerSpeedMod:       0.82,
    skyTop:               0x0c1418,   // near-black gray overcast
    skyBot:               0x182830,   // dark teal horizon
    accentColor:          0x4477aa,   // swamp water blue
    shadowColor:          0x0a1410,
    ambientLight:         0x225533,
    ambientAlpha:         0.05,
    treeType:             'swamp',
    groundType:           'mud',
  },
  // ─── Ch3: Hill Difficulty ─────────────────────────────────────────────
  3: {
    groundBase:           0x7a7060,   // gray stone and dust
    groundVariant:        0x706858,
    wallColor:            0x484038,
    wallTop:              0x585048,
    decorColors:          [0x908070, 0x847868, 0x9c8c7c],
    ambientParticleColor: 0xbbaa99,   // dust particles
    ambientCount:         10,
    fogColor:             0x3a3428,
    fogAlpha:             0.08,
    pathColor:            0x8a7a65,
    skyTop:               0x2a4060,   // pale morning blue
    skyBot:               0x5a8ab0,   // lighter blue near hills
    accentColor:          0xbbaa88,   // dusty beige
    shadowColor:          0x201c18,
    ambientLight:         0xaa9977,
    ambientAlpha:         0.03,
    treeType:             'oak',
    groundType:           'rock',
  },
  // ─── Ch4: Palace Beautiful ────────────────────────────────────────────
  4: {
    groundBase:           0xd4c8a8,   // warm cream flagstone
    groundVariant:        0xc8bc9c,   // slightly darker flag
    wallColor:            0x88785c,
    wallTop:              0xa09070,
    decorColors:          [0xd4a853, 0xcc9944, 0xe8c888],
    ambientParticleColor: 0xffd700,   // golden dust
    ambientCount:         18,
    fogColor:             0xffeedd,
    fogAlpha:             0.06,
    pathColor:            0xd4b882,
    skyTop:               0x1e2840,   // deep twilight blue
    skyBot:               0x8a4820,   // warm amber sunset
    accentColor:          0xd4a853,   // gold
    shadowColor:          0x2a1e10,
    ambientLight:         0xffd070,
    ambientAlpha:         0.05,
    treeType:             'oak',
    groundType:           'stone',
  },
  // ─── Ch5: Interpreter's House ─────────────────────────────────────────
  5: {
    groundBase:           0x5a4a38,   // warm dark interior floor
    groundVariant:        0x524430,
    wallColor:            0x3a2a1a,
    wallTop:              0x4a3a2a,
    decorColors:          [0xd4a853, 0xaa8844, 0x886633],
    ambientParticleColor: 0xffdd88,
    ambientCount:         12,
    fogColor:             0x2a2010,
    fogAlpha:             0.05,
    pathColor:            0x7a6a50,
    skyTop:               0x2e1a08,   // warm interior dusk
    skyBot:               0x7a3810,   // orange hearth glow
    accentColor:          0xff8800,
    shadowColor:          0x1a1008,
    ambientLight:         0xff9933,
    ambientAlpha:         0.04,
    treeType:             'oak',
    groundType:           'stone',
  },
  // ─── Ch6: The Cross ───────────────────────────────────────────────────
  6: {
    groundBase:           0x5a7840,   // lush valley grass
    groundVariant:        0x4e6c38,
    wallColor:            0x384e28,
    wallTop:              0x487038,
    decorColors:          [0x88bb55, 0xd4a853, 0xffd700],
    ambientParticleColor: 0xffd700,   // golden pollen
    ambientCount:         35,
    fogColor:             0xddeecc,   // bright haze
    fogAlpha:             0.05,
    pathColor:            0x7a9a50,
    skyTop:               0x1430a0,   // deep celestial blue
    skyBot:               0x4898d8,   // bright blue sky
    accentColor:          0xffd700,
    shadowColor:          0x182a08,
    ambientLight:         0xffffff,
    ambientAlpha:         0.06,
    treeType:             'meadow',
    groundType:           'grass',
  },
  // ─── Ch7: Beautiful Palace ────────────────────────────────────────────
  7: {
    groundBase:           0xb8a888,   // warm palace stone floor
    groundVariant:        0xaca090,
    wallColor:            0x786858,
    wallTop:              0x908070,
    decorColors:          [0xd4a853, 0xc8b880, 0xe8d8a8],
    ambientParticleColor: 0xffd700,   // golden motes
    ambientCount:         20,
    fogColor:             0xfff0cc,
    fogAlpha:             0.04,
    pathColor:            0xd4b882,
    playerSpeedMod:       0.95,
    skyTop:               0x1a2a50,   // evening palace sky
    skyBot:               0x9a5820,   // warm amber dusk
    accentColor:          0xffd700,
    shadowColor:          0x302010,
    ambientLight:         0xffcc44,
    ambientAlpha:         0.05,
    treeType:             'oak',
    groundType:           'stone',
  },
  // ─── Ch8: Valley of Humiliation ───────────────────────────────────────
  8: {
    groundBase:           0x282040,   // dark violet ground
    groundVariant:        0x221c38,
    wallColor:            0x140c20,
    wallTop:              0x201828,
    decorColors:          [0x3a2e50, 0x2e2240, 0x3a2848],
    ambientParticleColor: 0x550033,   // blood-red mist
    ambientCount:         8,
    ambientDirection:     'down',
    fogColor:             0x1e0030,
    fogAlpha:             0.30,
    pathColor:            0x382848,
    playerSpeedMod:       0.9,
    skyTop:               0x060410,   // near-black void
    skyBot:               0x12001c,   // very dark purple
    accentColor:          0x880033,   // dark blood red
    shadowColor:          0x060408,
    ambientLight:         0x6600aa,
    ambientAlpha:         0.04,
    treeType:             'dead',
    groundType:           'dark',
  },
  // ─── Ch9: Valley of the Shadow of Death ───────────────────────────────
  9: {
    groundBase:           0x14101a,   // near-black earth
    groundVariant:        0x100e16,
    wallColor:            0x080610,
    wallTop:              0x10080e,
    decorColors:          [0x1e1626, 0x18101e, 0x1c1222],
    ambientParticleColor: 0x2e1e40,   // dark purple wisps
    ambientCount:         6,
    ambientDirection:     'down',
    fogColor:             0x0c0810,
    fogAlpha:             0.45,
    pathColor:            0x1e1828,
    playerSpeedMod:       0.85,
    skyTop:               0x020108,   // absolute darkness
    skyBot:               0x0a0618,   // faintest purple void
    accentColor:          0x5500aa,   // sickly purple
    shadowColor:          0x040308,
    ambientLight:         0x330066,
    ambientAlpha:         0.04,
    treeType:             'dead',
    groundType:           'dark',
  },
  // ─── Ch10: Vanity Fair ────────────────────────────────────────────────
  10: {
    groundBase:           0x4a3860,   // dark purple-cobble market
    groundVariant:        0x3e2e54,
    wallColor:            0x1e1430,
    wallTop:              0x2e2440,
    decorColors:          [0x8844cc, 0xcc4488, 0xffaa22],
    ambientParticleColor: 0xff66bb,   // gaudy pink confetti
    ambientCount:         25,
    fogColor:             0x28203a,
    fogAlpha:             0.08,
    pathColor:            0x6044a0,
    skyTop:               0x100828,   // dark corrupted night
    skyBot:               0x3a1060,   // lurid purple sky
    accentColor:          0xff3388,   // garish pink
    shadowColor:          0x10081c,
    ambientLight:         0xcc44ff,
    ambientAlpha:         0.04,
    treeType:             'pine',
    groundType:           'market',
  },
  // ─── Ch11: Doubting Castle ────────────────────────────────────────────
  11: {
    groundBase:           0x2c2838,   // cold dungeon stone
    groundVariant:        0x282434,
    wallColor:            0x18141e,
    wallTop:              0x24202c,
    decorColors:          [0x34304a, 0x2c2840, 0x3a3450],
    ambientParticleColor: 0x3a3050,   // cold mist
    ambientCount:         6,
    ambientDirection:     'down',
    fogColor:             0x181420,
    fogAlpha:             0.38,
    pathColor:            0x342e44,
    playerSpeedMod:       0.8,
    skyTop:               0x050310,   // dungeon black
    skyBot:               0x0e0818,   // cold dark blue
    accentColor:          0x3366aa,   // cold blue iron gleam
    shadowColor:          0x040208,
    ambientLight:         0x2244aa,
    ambientAlpha:         0.04,
    treeType:             'pine',
    groundType:           'dungeon',
  },
  // ─── Ch12: Celestial City ─────────────────────────────────────────────
  12: {
    groundBase:           0xf0e8cc,   // white-gold marble
    groundVariant:        0xe4dcc0,   // pale gold variant
    wallColor:            0xb89860,
    wallTop:              0xd4b870,
    decorColors:          [0xffd700, 0xffffff, 0xffeedd],
    ambientParticleColor: 0xffd700,   // golden sparkles
    ambientCount:         40,
    fogColor:             0xfff8e0,   // warm radiant haze
    fogAlpha:             0.04,
    pathColor:            0xffd070,
    skyTop:               0xc8e8ff,   // radiant pearl sky
    skyBot:               0xfff8e0,   // golden light at horizon
    accentColor:          0xffd700,   // pure gold
    shadowColor:          0xaa8833,
    ambientLight:         0xffffff,
    ambientAlpha:         0.10,
    treeType:             'celestial',
    groundType:           'gold',
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
    bgmKey: 'ch1',
    events: [
      {
        id: 'ch1_battle_doubt',
        type: 'battle',
        x: 1150, y: 160, width: 50, height: 50,
        triggerOnce: true,
        data: { enemyId: 'doubt' },
      },
    ],
    terrainZones: [
      // Ruined building platforms with elevation (scattered through city)
      { id: 'ch1_ruin_1', type: 'elevated', x: 350, y: 80, width: 120, height: 60, elevation: 20, tint: 0x443830 },
      { id: 'ch1_ruin_2', type: 'elevated', x: 820, y: 95, width: 110, height: 55, elevation: 15, tint: 0x443830 },
      { id: 'ch1_ruin_3', type: 'elevated', x: 1220, y: 80, width: 140, height: 65, elevation: 25, tint: 0x443830 },
      { id: 'ch1_ruin_4', type: 'elevated', x: 1900, y: 90, width: 120, height: 60, elevation: 18, tint: 0x443830 },
      // Fire hazard pits (non-walkable craters)
      { id: 'ch1_fire_1', type: 'pit', x: 1130, y: 115, width: 55, height: 50, walkable: false },
      { id: 'ch1_fire_2', type: 'pit', x: 1660, y: 125, width: 45, height: 45, walkable: false },
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
    bgmKey: 'ch2',
    events: [
      {
        id: 'ch2_battle_despair',
        type: 'battle',
        x: 500, y: 250, width: 40, height: 40,
        triggerOnce: true,
        data: { enemyId: 'despair' },
      },
    ],
    terrainZones: [
      // Swamp bog zones (slows player significantly)
      { id: 'ch2_bog_1', type: 'water', x: 80, y: 80, width: 220, height: 200, slowFactor: 0.48, tint: 0x1a3a2a },
      { id: 'ch2_bog_2', type: 'water', x: 330, y: 110, width: 200, height: 170, slowFactor: 0.45, tint: 0x1a3a2a },
      { id: 'ch2_bog_3', type: 'water', x: 490, y: 80, width: 190, height: 220, slowFactor: 0.48, tint: 0x1a3a2a },
      // Stepping stone bridges cutting across the bogs
      { id: 'ch2_bridge_1', type: 'bridge', x: 100, y: 175, width: 110, height: 24 },
      { id: 'ch2_bridge_2', type: 'bridge', x: 345, y: 200, width: 90, height: 22 },
      { id: 'ch2_bridge_3', type: 'bridge', x: 510, y: 165, width: 100, height: 22 },
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
    bgmKey: 'ch3',
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
    terrainZones: [
      // Left meadow — the true narrow path (bright, slightly elevated)
      { id: 'ch3_meadow', type: 'elevated', x: 60, y: 75, width: 200, height: 250, elevation: 8, tint: 0x4a6838 },
      // Right rocky terrain — the false easy path (harder going)
      { id: 'ch3_rocky_path', type: 'elevated', x: 380, y: 90, width: 180, height: 220, elevation: 5, tint: 0x5a5848, slowFactor: 0.82 },
      // Hill Difficulty zone at far right (impassable warning area)
      { id: 'ch3_hill_difficulty', type: 'elevated', x: 520, y: 60, width: 80, height: 280, elevation: 30, tint: 0x3a3028, slowFactor: 0.7 },
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
    bgmKey: 'ch4',
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
    terrainZones: [
      // Moat surrounding the gate (dangerous water, forces careful approach)
      { id: 'ch4_moat', type: 'water', x: 280, y: 80, width: 80, height: 240, slowFactor: 0.38, tint: 0x1a2a4a },
      // Elevated gate approach platform
      { id: 'ch4_gate_platform', type: 'elevated', x: 340, y: 55, width: 140, height: 290, elevation: 18, tint: 0x524a40 },
      // Rocky approach path through dangerous terrain
      { id: 'ch4_rocky_climb', type: 'elevated', x: 120, y: 80, width: 160, height: 240, elevation: 12, tint: 0x606058, slowFactor: 0.88 },
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
    bgmKey: 'ch5',
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
    terrainZones: [
      // Five exhibit alcoves (interior floor zones — warm wood planks)
      { id: 'ch5_alcove_fire', type: 'interior', x: 40, y: 55, width: 100, height: 100, tint: 0x6a3010 },
      { id: 'ch5_alcove_water', type: 'interior', x: 175, y: 55, width: 100, height: 100, tint: 0x1a3a6a },
      { id: 'ch5_alcove_cage', type: 'interior', x: 310, y: 55, width: 100, height: 100, tint: 0x2a2830 },
      { id: 'ch5_alcove_armored', type: 'interior', x: 75, y: 175, width: 100, height: 100, tint: 0x4a3820 },
      { id: 'ch5_alcove_rake', type: 'interior', x: 275, y: 175, width: 100, height: 100, tint: 0x3a3010 },
      // Central hall (warm study interior)
      { id: 'ch5_main_hall', type: 'interior', x: 120, y: 300, width: 240, height: 120, tint: 0x7a5830 },
    ],
    completionRequirements: {
      requiredNpcs: ['interpreter'],
    },
  },
  // ─── Chapter 6: The Cross ─────────────────────────────────────────────────
  // Emotional arc: burden of sin → surrender at the cross → liberation
  // Player starts at bottom (y:500), walks uphill to the cross (y:80),
  // triggering the burden_released cutscene, then exits north to Ch7.
  {
    chapter: 6,
    locationName: '십자가',
    locationNameEn: 'The Cross',
    mapWidth: 480,
    mapHeight: 560,
    spawn: { x: 240, y: 500 },
    npcs: [],
    theme: THEMES[6],
    bgmKey: 'ch6',
    events: [
      {
        id: 'ch6_burden_released',
        type: 'cutscene',
        x: 190, y: 60,          // top-center — at the foot of the cross
        width: 100, height: 100,
        triggerOnce: true,
        data: { cutsceneId: 'ch6_burden_released' },
      },
    ],
    exits: [
      {
        x: 190, y: 0,            // north edge — only reachable after cutscene
        width: 100, height: 60,
        targetChapter: 7,
      },
    ],
    mapObjects: [
      {
        id: 'ch6_cross',
        type: 'sign',
        x: 220, y: 80,
        label: '✝',
        labelEn: '✝',
      },
    ],
    terrainZones: [
      // Hillside approaching the cross (elevated, gradual climb)
      { id: 'ch6_hillside_low', type: 'elevated', x: 80, y: 300, width: 320, height: 200, elevation: 10, tint: 0x6a7858 },
      { id: 'ch6_hillside_mid', type: 'elevated', x: 120, y: 160, width: 240, height: 140, elevation: 25, tint: 0x7a8868 },
      { id: 'ch6_hilltop', type: 'elevated', x: 160, y: 60, width: 160, height: 100, elevation: 40, tint: 0x8a9878 },
      // Sacred ground at the cross (holy ground glow)
      { id: 'ch6_sacred', type: 'elevated', x: 180, y: 40, width: 120, height: 80, elevation: 50, tint: 0xd4a853 },
    ],
    completionRequirements: {
      requiredEvents: ['ch6_burden_released'],
    },
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
    bgmKey: 'ch7',
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
        behavior: 'welcome',
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
        behavior: 'welcome',
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
    bgmKey: 'ch8',
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
      // Volcanic cave atmosphere (entire map)
      { id: 'ch8_descent', type: 'cave', x: 0, y: 0, width: 1200, height: 400, tint: 0x110022 },
      // Apollyon's battle arena pit (non-walkable abyss surrounding fight zone)
      { id: 'ch8_battle_pit', type: 'pit', x: 480, y: 300, width: 280, height: 100, walkable: false },
      // Lava flow channels flanking the path
      { id: 'ch8_lava_1', type: 'pit', x: 0, y: 280, width: 120, height: 120, walkable: false },
      { id: 'ch8_lava_2', type: 'pit', x: 900, y: 290, width: 100, height: 110, walkable: false },
      // Narrow elevated path through volcanic terrain
      { id: 'ch8_ash_path', type: 'elevated', x: 100, y: 140, width: 1000, height: 130, elevation: 10, tint: 0x1a0818, slowFactor: 0.92 },
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
    bgmKey: 'ch9',
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
    bgmKey: 'ch10',
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
        behavior: 'judge',
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
    bgmKey: 'ch11',
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
    bgmKey: 'ch12',
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
        behavior: 'angelic',
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
