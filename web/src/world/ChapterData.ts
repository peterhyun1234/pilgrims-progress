export interface NPCConfig {
  id: string;
  sprite: string;
  x: number;
  y: number;
  nameKo: string;
  nameEn: string;
  inkKnot?: string;
}

export interface BuildingConfig {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ChapterConfig {
  chapter: number;
  nameKo: string;
  nameEn: string;
  mapWidth: number;
  mapHeight: number;
  spawnX: number;
  spawnY: number;
  npcs: NPCConfig[];
  buildings?: BuildingConfig[];
}

export const chapterData: Record<number, ChapterConfig> = {
  1: {
    chapter: 1,
    nameKo: '멸망의 도시',
    nameEn: 'City of Destruction',
    mapWidth: 40,
    mapHeight: 30,
    spawnX: 10,
    spawnY: 15,
    npcs: [
      {
        id: 'evangelist',
        sprite: 'evangelist',
        x: 20,
        y: 10,
        nameKo: '전도자',
        nameEn: 'Evangelist',
        inkKnot: 'evangelist_meeting',
      },
      {
        id: 'obstinate',
        sprite: 'obstinate',
        x: 30,
        y: 15,
        nameKo: '완고',
        nameEn: 'Obstinate',
        inkKnot: 'obstinate_encounter',
      },
      {
        id: 'pliable',
        sprite: 'pliable',
        x: 32,
        y: 17,
        nameKo: '유연',
        nameEn: 'Pliable',
        inkKnot: 'pliable_encounter',
      },
    ],
    buildings: [
      { x: 5, y: 5, w: 6, h: 4 },
      { x: 15, y: 3, w: 4, h: 3 },
      { x: 25, y: 22, w: 5, h: 4 },
    ],
  },
  2: {
    chapter: 2,
    nameKo: '들판과 낙심의 늪',
    nameEn: 'Fields & Slough of Despond',
    mapWidth: 50,
    mapHeight: 25,
    spawnX: 5,
    spawnY: 12,
    npcs: [
      {
        id: 'help',
        sprite: 'help',
        x: 35,
        y: 12,
        nameKo: '도움',
        nameEn: 'Help',
        inkKnot: 'help_rescue',
      },
    ],
    buildings: [],
  },
  3: {
    chapter: 3,
    nameKo: '세상지혜씨와 시내산',
    nameEn: 'Mr. Worldly Wiseman & Mt. Sinai',
    mapWidth: 35,
    mapHeight: 30,
    spawnX: 5,
    spawnY: 15,
    npcs: [
      {
        id: 'worldlywiseman',
        sprite: 'worldlywiseman',
        x: 18,
        y: 15,
        nameKo: '세상지혜씨',
        nameEn: 'Mr. Worldly Wiseman',
        inkKnot: 'worldly_wiseman',
      },
    ],
    buildings: [{ x: 25, y: 5, w: 8, h: 10 }],
  },
  4: {
    chapter: 4,
    nameKo: '좁은 문',
    nameEn: 'The Wicket Gate',
    mapWidth: 25,
    mapHeight: 20,
    spawnX: 5,
    spawnY: 10,
    npcs: [
      {
        id: 'goodwill',
        sprite: 'goodwill',
        x: 20,
        y: 10,
        nameKo: '선의',
        nameEn: 'Good-will',
        inkKnot: 'goodwill_gate',
      },
    ],
    buildings: [{ x: 19, y: 3, w: 2, h: 14 }],
  },
  5: {
    chapter: 5,
    nameKo: '해석자의 집',
    nameEn: "Interpreter's House",
    mapWidth: 30,
    mapHeight: 25,
    spawnX: 15,
    spawnY: 20,
    npcs: [
      {
        id: 'interpreter',
        sprite: 'interpreter',
        x: 15,
        y: 10,
        nameKo: '해석자',
        nameEn: 'Interpreter',
        inkKnot: 'interpreter_house',
      },
    ],
    buildings: [
      { x: 5, y: 3, w: 20, h: 3 },
      { x: 5, y: 3, w: 3, h: 15 },
      { x: 22, y: 3, w: 3, h: 15 },
    ],
  },
  6: {
    chapter: 6,
    nameKo: '십자가 언덕',
    nameEn: 'Hill of the Cross',
    mapWidth: 30,
    mapHeight: 30,
    spawnX: 15,
    spawnY: 25,
    npcs: [
      {
        id: 'shining1',
        sprite: 'shining1',
        x: 13,
        y: 5,
        nameKo: '빛나는 자',
        nameEn: 'Shining One',
        inkKnot: 'cross_scene',
      },
      {
        id: 'shining2',
        sprite: 'shining2',
        x: 15,
        y: 5,
        nameKo: '빛나는 자',
        nameEn: 'Shining One',
      },
      {
        id: 'shining3',
        sprite: 'shining3',
        x: 17,
        y: 5,
        nameKo: '빛나는 자',
        nameEn: 'Shining One',
      },
    ],
    buildings: [],
  },
};
