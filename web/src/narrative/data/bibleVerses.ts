export interface BibleVerse {
  ko: string;
  en: string;
  refKo: string;
  refEn: string;
}

export const CHAPTER_VERSES: Record<number, BibleVerse> = {
  1: {
    ko: '도망하여 생명을 보존하라',
    en: 'Escape for your life',
    refKo: '창세기 19:17',
    refEn: 'Genesis 19:17',
  },
  2: {
    ko: '내가 깊은 수렁에 빠지며 설 곳이 없는 깊은 물에 들어가니',
    en: 'I sink in deep mire, where there is no standing',
    refKo: '시편 69:2',
    refEn: 'Psalm 69:2',
  },
  3: {
    ko: '어떤 길은 사람이 보기에 바르나 필경은 사망의 길이니라',
    en: 'There is a way that appears to be right, but in the end it leads to death',
    refKo: '잠언 14:12',
    refEn: 'Proverbs 14:12',
  },
  4: {
    ko: '좁은 문으로 들어가라',
    en: 'Enter through the narrow gate',
    refKo: '마태복음 7:13',
    refEn: 'Matthew 7:13',
  },
  5: {
    ko: '지혜를 얻는 것이 금을 얻는 것보다 얼마나 낫은고',
    en: 'How much better to get wisdom than gold',
    refKo: '잠언 16:16',
    refEn: 'Proverbs 16:16',
  },
  6: {
    ko: '그가 채찍에 맞음으로 우리는 나음을 받았도다',
    en: 'By his wounds we are healed',
    refKo: '이사야 53:5',
    refEn: 'Isaiah 53:5',
  },
};
