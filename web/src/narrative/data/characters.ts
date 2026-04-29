export interface CharacterData {
  id: string;
  nameKo: string;
  nameEn: string;
  symbolKo: string;
  symbolEn: string;
  sprite: string;
  chapter: number[];
}

export const characters: CharacterData[] = [
  {
    id: 'christian',
    nameKo: '크리스천',
    nameEn: 'Christian',
    symbolKo: '주인공. 죄의 짐을 지고 순례하는 자',
    symbolEn: 'The protagonist. A pilgrim bearing the burden of sin.',
    sprite: 'christian',
    chapter: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'evangelist',
    nameKo: '전도자',
    nameEn: 'Evangelist',
    symbolKo: '복음 전파자. 올바른 길로 인도하는 목사',
    symbolEn: 'A gospel preacher who guides to the right path.',
    sprite: 'evangelist',
    chapter: [1, 3],
  },
  {
    id: 'obstinate',
    nameKo: '완고',
    nameEn: 'Obstinate',
    symbolKo: '세속에 집착하여 회심을 거부하는 자',
    symbolEn: 'One who clings to the world and refuses conversion.',
    sprite: 'obstinate',
    chapter: [1],
  },
  {
    id: 'pliable',
    nameKo: '유연',
    nameEn: 'Pliable',
    symbolKo: '쉽게 마음이 움직이나 시련 앞에서 돌아서는 자',
    symbolEn: 'Easily moved but turns back at the first trial.',
    sprite: 'pliable',
    chapter: [1, 2],
  },
  {
    id: 'help',
    nameKo: '도움',
    nameEn: 'Help',
    symbolKo: '절망 속에서 구원의 손길을 내미는 하나님의 은혜',
    symbolEn: "God's grace extending a helping hand in despair.",
    sprite: 'help',
    chapter: [2],
  },
  {
    // id matches PORTRAIT_CONFIGS / PreloadScene's underscore-form. Was
    // 'worldlywiseman' (no underscore) — typo, would have broken any future
    // metadata-driven lookup. characters.ts isn't imported anywhere yet but
    // consistent ids prevent silent breakage when it becomes load-bearing.
    id: 'worldly_wiseman',
    nameKo: '세상지혜씨',
    nameEn: 'Mr. Worldly Wiseman',
    symbolKo: '세속적 지혜로 신앙의 길에서 벗어나게 유혹하는 자',
    symbolEn: 'One who tempts with worldly wisdom.',
    sprite: 'worldly_wiseman',
    chapter: [3],
  },
  {
    id: 'goodwill',
    nameKo: '선의',
    nameEn: 'Good-will',
    symbolKo: '좁은 문의 문지기. 그리스도의 형상',
    symbolEn: 'The gatekeeper. A figure of Christ.',
    sprite: 'goodwill',
    chapter: [4],
  },
  {
    id: 'interpreter',
    nameKo: '해석자',
    nameEn: 'Interpreter',
    symbolKo: '성령. 영적 진리를 가르치는 분',
    symbolEn: 'The Holy Spirit. Teacher of spiritual truths.',
    sprite: 'interpreter',
    chapter: [5],
  },
  {
    id: 'shining_ones',
    nameKo: '빛나는 자들',
    nameEn: 'Shining Ones',
    symbolKo: '천사들. 죄 사함과 새 옷과 두루마리를 줌',
    symbolEn: 'Angels who grant forgiveness, new garments, and a scroll.',
    sprite: 'shining1',
    chapter: [6],
  },
];
