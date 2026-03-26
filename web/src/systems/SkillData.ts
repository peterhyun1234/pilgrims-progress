import { StatType } from '../core/GameEvents';

export interface SkillDef {
  id: string;
  nameKo: string;
  nameEn: string;
  descKo: string;
  descEn: string;
  icon: string;
  requiredStat: StatType;
  requiredValue: number;
  power: number;
  cost: number;
  costStat: StatType;
  type: 'attack' | 'defend' | 'heal' | 'special';
  animation: 'slash' | 'shield' | 'light' | 'prayer' | 'fire' | 'wave';
}

export const SKILLS: Record<string, SkillDef> = {
  fervent_prayer: {
    id: 'fervent_prayer',
    nameKo: '간절한 기도',
    nameEn: 'Fervent Prayer',
    descKo: '간절한 기도로 영적 힘을 끌어낸다.',
    descEn: 'Draw spiritual power through fervent prayer.',
    icon: '🙏',
    requiredStat: 'faith',
    requiredValue: 0,
    power: 20,
    cost: 5,
    costStat: 'faith',
    type: 'attack',
    animation: 'prayer',
  },
  shield_of_faith: {
    id: 'shield_of_faith',
    nameKo: '믿음의 방패',
    nameEn: 'Shield of Faith',
    descKo: '불화살을 막아내는 영적 방패를 세운다.',
    descEn: 'Raise a spiritual shield to block flaming arrows.',
    icon: '🛡',
    requiredStat: 'faith',
    requiredValue: 40,
    power: 30,
    cost: 8,
    costStat: 'faith',
    type: 'defend',
    animation: 'shield',
  },
  stand_firm: {
    id: 'stand_firm',
    nameKo: '굳게 서다',
    nameEn: 'Stand Firm',
    descKo: '흔들리지 않는 용기로 적의 공격을 견딘다.',
    descEn: 'Endure the enemy attack with unwavering courage.',
    icon: '⚔',
    requiredStat: 'courage',
    requiredValue: 30,
    power: 25,
    cost: 8,
    costStat: 'courage',
    type: 'defend',
    animation: 'slash',
  },
  discernment: {
    id: 'discernment',
    nameKo: '분별력',
    nameEn: 'Discernment',
    descKo: '진리를 꿰뚫어 적의 약점을 드러낸다.',
    descEn: 'See through deception to expose the enemy weakness.',
    icon: '✦',
    requiredStat: 'wisdom',
    requiredValue: 35,
    power: 30,
    cost: 10,
    costStat: 'wisdom',
    type: 'special',
    animation: 'light',
  },
  psalm_of_comfort: {
    id: 'psalm_of_comfort',
    nameKo: '위로의 시편',
    nameEn: 'Psalm of Comfort',
    descKo: '시편 노래로 상처받은 영혼을 회복한다.',
    descEn: 'Heal the wounded soul through a psalm.',
    icon: '♪',
    requiredStat: 'faith',
    requiredValue: 50,
    power: 35,
    cost: 12,
    costStat: 'faith',
    type: 'heal',
    animation: 'wave',
  },
  word_of_truth: {
    id: 'word_of_truth',
    nameKo: '진리의 말씀',
    nameEn: 'Word of Truth',
    descKo: '하나님의 말씀으로 어둠을 물리친다.',
    descEn: 'Drive back darkness with the Word of God.',
    icon: '📖',
    requiredStat: 'wisdom',
    requiredValue: 60,
    power: 45,
    cost: 15,
    costStat: 'wisdom',
    type: 'attack',
    animation: 'fire',
  },
  armor_of_light: {
    id: 'armor_of_light',
    nameKo: '빛의 갑옷',
    nameEn: 'Armor of Light',
    descKo: '빛의 갑옷을 입어 모든 방어력을 크게 높인다.',
    descEn: 'Don the armor of light for greatly increased defense.',
    icon: '✨',
    requiredStat: 'faith',
    requiredValue: 70,
    power: 50,
    cost: 20,
    costStat: 'faith',
    type: 'defend',
    animation: 'light',
  },
};

export interface EnemyDef {
  id: string;
  nameKo: string;
  nameEn: string;
  hp: number;
  attack: number;
  defense: number;
  weakness: StatType;
  isBoss: boolean;
  chapter: number;
  iconColor: number;
  attackPatterns: { nameKo: string; nameEn: string; power: number; type: string }[];
}

export const ENEMIES: Record<string, EnemyDef> = {
  doubt: {
    id: 'doubt',
    nameKo: '의심',
    nameEn: 'Doubt',
    hp: 60,
    attack: 10,
    defense: 5,
    weakness: 'faith',
    isBoss: false,
    chapter: 1,
    iconColor: 0x555555,
    attackPatterns: [
      { nameKo: '의혹의 속삭임', nameEn: 'Whisper of Doubt', power: 12, type: 'faith' },
      { nameKo: '불신의 그림자', nameEn: 'Shadow of Disbelief', power: 8, type: 'courage' },
    ],
  },
  despair: {
    id: 'despair',
    nameKo: '절망',
    nameEn: 'Despair',
    hp: 80,
    attack: 15,
    defense: 8,
    weakness: 'courage',
    isBoss: false,
    chapter: 2,
    iconColor: 0x334455,
    attackPatterns: [
      { nameKo: '절망의 늪', nameEn: 'Mire of Despair', power: 15, type: 'faith' },
      { nameKo: '무력감', nameEn: 'Helplessness', power: 10, type: 'courage' },
    ],
  },
  temptation: {
    id: 'temptation',
    nameKo: '유혹',
    nameEn: 'Temptation',
    hp: 70,
    attack: 12,
    defense: 10,
    weakness: 'wisdom',
    isBoss: false,
    chapter: 3,
    iconColor: 0x664488,
    attackPatterns: [
      { nameKo: '달콤한 유혹', nameEn: 'Sweet Temptation', power: 14, type: 'wisdom' },
      { nameKo: '거짓 약속', nameEn: 'False Promise', power: 10, type: 'faith' },
    ],
  },
  apollyon: {
    id: 'apollyon',
    nameKo: '아폴리온',
    nameEn: 'Apollyon',
    hp: 200,
    attack: 25,
    defense: 15,
    weakness: 'faith',
    isBoss: true,
    chapter: 8,
    iconColor: 0x880000,
    attackPatterns: [
      { nameKo: '불화살', nameEn: 'Flaming Arrow', power: 25, type: 'faith' },
      { nameKo: '압도적인 포효', nameEn: 'Overwhelming Roar', power: 20, type: 'courage' },
      { nameKo: '거짓의 사슬', nameEn: 'Chains of Lies', power: 18, type: 'wisdom' },
      { nameKo: '어둠의 날개', nameEn: 'Wings of Darkness', power: 30, type: 'faith' },
    ],
  },
  giant_despair: {
    id: 'giant_despair',
    nameKo: '절망의 거인',
    nameEn: 'Giant Despair',
    hp: 150,
    attack: 20,
    defense: 12,
    weakness: 'faith',
    isBoss: true,
    chapter: 11,
    iconColor: 0x334466,
    attackPatterns: [
      { nameKo: '투옥', nameEn: 'Imprisonment', power: 20, type: 'courage' },
      { nameKo: '굴욕', nameEn: 'Humiliation', power: 15, type: 'faith' },
      { nameKo: '자기혐오 유도', nameEn: 'Counsel of Despair', power: 18, type: 'wisdom' },
      { nameKo: '철장의 격노', nameEn: 'Iron Cage Rage', power: 25, type: 'courage' },
    ],
  },

  // ─── Ch7-12 new enemies ──────────────────────────────────────────────────
  lion_fear: {
    id: 'lion_fear',
    nameKo: '두려움의 사자',
    nameEn: 'Lion of Fear',
    hp: 50,
    attack: 12,
    defense: 6,
    weakness: 'courage',
    isBoss: false,
    chapter: 7,
    iconColor: 0xaa8833,
    attackPatterns: [
      { nameKo: '위협적 포효', nameEn: 'Threatening Roar', power: 14, type: 'courage' },
      { nameKo: '발톱 공격', nameEn: 'Claw Strike', power: 10, type: 'faith' },
    ],
  },
  specter: {
    id: 'specter',
    nameKo: '공포의 유령',
    nameEn: 'Specter',
    hp: 40,
    attack: 10,
    defense: 3,
    weakness: 'faith',
    isBoss: false,
    chapter: 9,
    iconColor: 0x334455,
    attackPatterns: [
      { nameKo: '공포의 속삭임', nameEn: 'Whisper of Fear', power: 12, type: 'faith' },
      { nameKo: '그림자 손길', nameEn: 'Shadow Grasp', power: 8, type: 'courage' },
    ],
  },
  vanity: {
    id: 'vanity',
    nameKo: '허영의 유혹',
    nameEn: 'Vanity',
    hp: 60,
    attack: 13,
    defense: 8,
    weakness: 'wisdom',
    isBoss: false,
    chapter: 10,
    iconColor: 0x885599,
    attackPatterns: [
      { nameKo: '화려한 유혹', nameEn: 'Glittering Lure', power: 14, type: 'wisdom' },
      { nameKo: '거짓 영광', nameEn: 'False Glory', power: 12, type: 'faith' },
    ],
  },
  diffidence_enemy: {
    id: 'diffidence_enemy',
    nameKo: '소심',
    nameEn: 'Diffidence',
    hp: 80,
    attack: 16,
    defense: 10,
    weakness: 'wisdom',
    isBoss: false,
    chapter: 11,
    iconColor: 0x554466,
    attackPatterns: [
      { nameKo: '독설', nameEn: 'Venomous Word', power: 18, type: 'courage' },
      { nameKo: '절망 조언', nameEn: 'Despairing Counsel', power: 14, type: 'faith' },
    ],
  },
};
