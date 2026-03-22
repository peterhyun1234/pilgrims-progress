import { ItemRarity, ItemType, EquipSlot, StatType } from '../core/GameEvents';

export interface ItemDef {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  type: ItemType;
  rarity: ItemRarity;
  icon: string;
  iconColor: number;
  equipSlot?: EquipSlot;
  statBonus?: Partial<Record<StatType, number>>;
  onUseEffect?: {
    stat?: StatType;
    amount?: number;
    heal?: number;
    special?: string;
  };
  chapter?: number;
  stackable: boolean;
  maxStack: number;
}

export const ITEMS: Record<string, ItemDef> = {
  bread_of_life: {
    id: 'bread_of_life',
    nameKo: '생명의 빵',
    nameEn: 'Bread of Life',
    descKo: '영적 허기를 채워주는 거룩한 양식. 믿음을 회복시킨다.',
    descEn: 'Holy sustenance that fills spiritual hunger. Restores faith.',
    type: 'consumable',
    rarity: 'common',
    icon: '🍞',
    iconColor: 0xd4a853,
    onUseEffect: { stat: 'faith', amount: 15 },
    stackable: true,
    maxStack: 5,
  },
  living_water: {
    id: 'living_water',
    nameKo: '생수',
    nameEn: 'Living Water',
    descKo: '목마른 영혼을 적시는 생명의 물.',
    descEn: 'Water of life that quenches the thirsty soul.',
    type: 'consumable',
    rarity: 'uncommon',
    icon: '💧',
    iconColor: 0x4a90d9,
    onUseEffect: { stat: 'faith', amount: 10 },
    stackable: true,
    maxStack: 3,
  },
  courage_herb: {
    id: 'courage_herb',
    nameKo: '용기의 약초',
    nameEn: 'Herb of Valor',
    descKo: '두려움을 물리치는 힘을 주는 약초.',
    descEn: 'An herb that grants the strength to overcome fear.',
    type: 'consumable',
    rarity: 'common',
    icon: '🌿',
    iconColor: 0x4a7c59,
    onUseEffect: { stat: 'courage', amount: 12 },
    stackable: true,
    maxStack: 5,
  },
  wisdom_scroll: {
    id: 'wisdom_scroll',
    nameKo: '지혜의 두루마리',
    nameEn: 'Scroll of Wisdom',
    descKo: '고대의 지혜가 담긴 두루마리.',
    descEn: 'A scroll containing ancient wisdom.',
    type: 'consumable',
    rarity: 'uncommon',
    icon: '📜',
    iconColor: 0x9b59b6,
    onUseEffect: { stat: 'wisdom', amount: 12 },
    stackable: true,
    maxStack: 3,
  },
  burden_salve: {
    id: 'burden_salve',
    nameKo: '짐 경감 연고',
    nameEn: 'Burden Salve',
    descKo: '잠시나마 짐의 무게를 덜어주는 연고.',
    descEn: 'An ointment that temporarily lightens your burden.',
    type: 'consumable',
    rarity: 'uncommon',
    icon: '🏺',
    iconColor: 0x8b3a3a,
    onUseEffect: { stat: 'burden', amount: -15 },
    stackable: true,
    maxStack: 3,
  },

  evangelists_map: {
    id: 'evangelists_map',
    nameKo: '전도자의 지도',
    nameEn: "Evangelist's Map",
    descKo: '좁은 문으로 가는 길을 표시한 지도.',
    descEn: 'A map marking the path to the Wicket Gate.',
    type: 'key',
    rarity: 'rare',
    icon: '🗺',
    iconColor: 0xd4a853,
    chapter: 1,
    stackable: false,
    maxStack: 1,
  },
  interpreters_key: {
    id: 'interpreters_key',
    nameKo: '해석자의 열쇠',
    nameEn: "Interpreter's Key",
    descKo: '영적 진리의 방을 열 수 있는 열쇠.',
    descEn: 'A key that opens the rooms of spiritual truth.',
    type: 'key',
    rarity: 'rare',
    icon: '🔑',
    iconColor: 0xd4a853,
    chapter: 5,
    stackable: false,
    maxStack: 1,
  },

  psalm_23: {
    id: 'psalm_23',
    nameKo: '시편 23편',
    nameEn: 'Psalm 23',
    descKo: '"여호와는 나의 목자시니 내게 부족함이 없으리로다"',
    descEn: '"The Lord is my shepherd; I shall not want."',
    type: 'scripture',
    rarity: 'rare',
    icon: '✝',
    iconColor: 0xffd700,
    onUseEffect: { stat: 'faith', amount: 20 },
    stackable: false,
    maxStack: 1,
  },
  ephesians_6: {
    id: 'ephesians_6',
    nameKo: '에베소서 6장',
    nameEn: 'Ephesians 6',
    descKo: '"하나님의 전신갑주를 입으라"',
    descEn: '"Put on the full armor of God."',
    type: 'scripture',
    rarity: 'legendary',
    icon: '✝',
    iconColor: 0xffd700,
    onUseEffect: { special: 'armor_of_god' },
    stackable: false,
    maxStack: 1,
  },

  shield_of_faith: {
    id: 'shield_of_faith',
    nameKo: '믿음의 방패',
    nameEn: 'Shield of Faith',
    descKo: '모든 불화살을 막아내는 방패.',
    descEn: 'A shield that extinguishes all flaming arrows.',
    type: 'equipment',
    rarity: 'legendary',
    icon: '🛡',
    iconColor: 0xd4a853,
    equipSlot: 'weapon',
    statBonus: { faith: 10, courage: 5 },
    stackable: false,
    maxStack: 1,
  },
  sword_of_spirit: {
    id: 'sword_of_spirit',
    nameKo: '성령의 검',
    nameEn: 'Sword of the Spirit',
    descKo: '하나님의 말씀인 성령의 검.',
    descEn: 'The Sword of the Spirit, which is the Word of God.',
    type: 'equipment',
    rarity: 'legendary',
    icon: '⚔',
    iconColor: 0x4a90d9,
    equipSlot: 'weapon',
    statBonus: { wisdom: 10, courage: 8 },
    stackable: false,
    maxStack: 1,
  },
  helmet_of_salvation: {
    id: 'helmet_of_salvation',
    nameKo: '구원의 투구',
    nameEn: 'Helmet of Salvation',
    descKo: '구원의 확신을 주는 투구.',
    descEn: 'A helmet that grants the assurance of salvation.',
    type: 'equipment',
    rarity: 'rare',
    icon: '⛑',
    iconColor: 0xcccccc,
    equipSlot: 'armor',
    statBonus: { faith: 8, wisdom: 5 },
    stackable: false,
    maxStack: 1,
  },
  breastplate_of_righteousness: {
    id: 'breastplate_of_righteousness',
    nameKo: '의의 흉배',
    nameEn: 'Breastplate of Righteousness',
    descKo: '의로움으로 심장을 보호하는 흉배.',
    descEn: 'A breastplate that guards the heart with righteousness.',
    type: 'equipment',
    rarity: 'rare',
    icon: '🛡',
    iconColor: 0xccaa44,
    equipSlot: 'armor',
    statBonus: { courage: 10, faith: 5 },
    stackable: false,
    maxStack: 1,
  },
  pilgrims_ring: {
    id: 'pilgrims_ring',
    nameKo: '순례자의 반지',
    nameEn: "Pilgrim's Ring",
    descKo: '순례의 길에서 보호를 받는 반지.',
    descEn: 'A ring that protects those on the pilgrim path.',
    type: 'equipment',
    rarity: 'uncommon',
    icon: '💍',
    iconColor: 0xd4a853,
    equipSlot: 'accessory',
    statBonus: { faith: 3, courage: 3, wisdom: 3 },
    stackable: false,
    maxStack: 1,
  },
};

export const CHAPTER_ITEMS: Record<number, { itemId: string; x: number; y: number }[]> = {
  1: [
    { itemId: 'bread_of_life', x: 200, y: 200 },
    { itemId: 'evangelists_map', x: 350, y: 160 },
  ],
  2: [
    { itemId: 'courage_herb', x: 250, y: 180 },
    { itemId: 'living_water', x: 400, y: 200 },
  ],
  3: [
    { itemId: 'wisdom_scroll', x: 180, y: 200 },
    { itemId: 'burden_salve', x: 350, y: 250 },
  ],
  4: [
    { itemId: 'psalm_23', x: 250, y: 160 },
    { itemId: 'pilgrims_ring', x: 350, y: 200 },
  ],
  5: [
    { itemId: 'interpreters_key', x: 200, y: 250 },
    { itemId: 'wisdom_scroll', x: 300, y: 150 },
  ],
  6: [
    { itemId: 'ephesians_6', x: 240, y: 200 },
  ],
};
