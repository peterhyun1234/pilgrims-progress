import { StatType } from '../../core/GameEvents';

export interface ConvLine {
  text: string;
  speaker?: string;
  emotion?: string;
  stat?: StatType;
  amount?: number;
}

export interface ConvChoice {
  text: string;
  stat?: StatType;
  amount?: number;
  lines?: ConvLine[];
  requires?: { stat: StatType; min: number };
}

export interface Conversation {
  lines: ConvLine[];
  choices?: ConvChoice[];
  /** Lines shown on 2nd+ interaction */
  repeated?: ConvLine[];
}

export type LangConv = { ko: Conversation; en: Conversation };

export const FALLBACK_DIALOGUES: Record<string, LangConv> = {

  // ─────────────────────────────────────────────────────────────────────────
  // 전도자 / Evangelist — 첫 만남, 핵심 안내자
  // ─────────────────────────────────────────────────────────────────────────
  evangelist: {
    ko: {
      lines: [
        { text: '...멈추시오, 순례자여.', emotion: 'neutral' },
        {
          text: '그대는 지금 등에 무거운 짐을 지고 있소. 그 짐의 이름이 무엇인지 아시오?',
          emotion: 'neutral',
        },
        {
          text: '그것은 죄의 무게요. 하늘의 심판이 이 도시 위에 내려오기 전에, 그대는 이곳을 떠나야 합니다.',
          emotion: 'fearful',
        },
        {
          text: '저 빛이 보이십니까?',
          emotion: 'determined',
        },
        {
          text: '저 쪽으로 달려가시오. 좁은 문이 있소. 두드리면 열릴 것이오.',
          emotion: 'happy',
          stat: 'faith',
          amount: 8,
        },
      ],
      choices: [
        {
          text: '그 문으로 어떻게 가야 합니까?',
          lines: [
            {
              text: '이 길을 따라 동쪽으로 걸어가시오. 해석자를 만나면 그가 더 가르쳐 줄 것이오.',
              emotion: 'neutral',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: '흔들리지 마시오. 세속 현자가 다른 길을 가르쳐 주더라도 속지 마시오.',
              emotion: 'determined',
              stat: 'courage',
              amount: 5,
            },
          ],
        },
        {
          text: '하지만 저는 두렵습니다. 이 짐을 지고 갈 수 있을지...',
          lines: [
            {
              text: '두려움은 정직한 감정이오. 하지만 두려움이 발걸음을 멈추게 해서는 안 됩니다.',
              emotion: 'neutral',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: '그 짐은 반드시 풀릴 것이오. 십자가 앞에서. 포기하지 마시오, 순례자여.',
              emotion: 'happy',
              stat: 'faith',
              amount: 10,
            },
          ],
        },
        {
          text: '[믿음] 천성에 대해 알려주시오.',
          requires: { stat: 'faith', min: 35 },
          lines: [
            {
              text: '오, 당신의 마음이 이미 그곳을 향하고 있군요! 슬픔도 밤도 없는 도성이오.',
              emotion: 'happy',
              stat: 'faith',
              amount: 8,
            },
            {
              text: '그 곳에서는 모든 짐이 영원히 기억되지 않을 것이오. 그곳이 당신의 목적지요, 순례자여.',
              emotion: 'happy',
              stat: 'courage',
              amount: 8,
            },
          ],
        },
      ],
      repeated: [
        {
          text: '아직 이곳에 있소? 서두르시오, 순례자여. 동쪽 길을 기억하시오.',
          emotion: 'neutral',
        },
        {
          text: '그 짐은 십자가 앞에서 풀릴 것이오. 믿으시오.',
          emotion: 'determined',
          stat: 'faith',
          amount: 3,
        },
      ],
    },
    en: {
      lines: [
        { text: '...Stop, Pilgrim.', emotion: 'neutral' },
        {
          text: 'You carry a great burden on your back. Do you know its name?',
          emotion: 'neutral',
        },
        {
          text: "It is the weight of sin. Before judgment falls upon this city, you must flee.",
          emotion: 'fearful',
        },
        { text: 'Do you see yonder light?', emotion: 'determined' },
        {
          text: 'Run thither! There stands the Wicket Gate. Knock, and it shall be opened.',
          emotion: 'happy',
          stat: 'faith',
          amount: 8,
        },
      ],
      choices: [
        {
          text: 'How shall I find the way?',
          lines: [
            {
              text: 'Follow this road eastward. Seek the Interpreter — he will instruct you further.',
              emotion: 'neutral',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: 'Be not turned aside by Worldly Wiseman. He will offer easier roads — refuse them.',
              emotion: 'determined',
              stat: 'courage',
              amount: 5,
            },
          ],
        },
        {
          text: "I am afraid. Can I carry this burden all the way?",
          lines: [
            {
              text: 'Fear is honest. But let it not stop your feet.',
              emotion: 'neutral',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: 'Your burden shall fall at the Cross. Believe this and press on.',
              emotion: 'happy',
              stat: 'faith',
              amount: 10,
            },
          ],
        },
        {
          text: "[Faith] Tell me of the Celestial City.",
          requires: { stat: 'faith', min: 35 },
          lines: [
            {
              text: 'Ah — your heart already leans toward it! A city without sorrow, without night.',
              emotion: 'happy',
              stat: 'faith',
              amount: 8,
            },
            {
              text: 'There, every burden is remembered no more. That is your destination, Pilgrim.',
              emotion: 'happy',
              stat: 'courage',
              amount: 8,
            },
          ],
        },
      ],
      repeated: [
        { text: 'Still here? Hasten, Pilgrim. Remember — the road east.', emotion: 'neutral' },
        {
          text: 'Your burden will be loosed at the Cross. Trust and go.',
          emotion: 'determined',
          stat: 'faith',
          amount: 3,
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 완고 / Obstinate — 적대적, COURAGE 소비
  // ─────────────────────────────────────────────────────────────────────────
  obstinate: {
    ko: {
      lines: [
        { text: '야! 어디 가는 거야!', emotion: 'angry' },
        {
          text: '이 미친 짓 당장 그만둬. 짐 지고 도망가는 놈을 누가 믿겠어?',
          emotion: 'angry',
        },
        {
          text: '네가 찾는 그 "천국" 같은 건 없어. 죽으면 끝이야. 이 현실을 봐.',
          emotion: 'angry',
        },
      ],
      choices: [
        {
          text: '(...무시하고 길을 계속 간다)',
          stat: 'courage',
          amount: 5,
          lines: [
            {
              text: '...',
              emotion: 'neutral',
              speaker: '완고',
            },
            {
              text: '흥. 후회할 거야. 언젠가 다시 여기 기어 돌아올 테니까.',
              emotion: 'angry',
              speaker: '완고',
            },
          ],
        },
        {
          text: '저도 불확실합니다. 하지만 이 짐을 지고는 살 수가 없어요.',
          stat: 'burden',
          amount: -5,
          lines: [
            {
              text: "그래도 이 짐을 지고 사는 게 현실이야. 도망쳐봤자 짐은 그대로야.",
              emotion: 'angry',
              speaker: '완고',
            },
            {
              text: '...하지만 그대의 눈빛을 보니... 진심이구만. 행운을 빌어.',
              emotion: 'sad',
              speaker: '완고',
              stat: 'faith',
              amount: 3,
            },
          ],
        },
      ],
      repeated: [
        { text: '아직도 안 갔어? 꼭 후회할 거야.', emotion: 'angry' },
      ],
    },
    en: {
      lines: [
        { text: 'Hey! Where do you think you\'re going?', emotion: 'angry' },
        {
          text: "Stop this madness at once. Who follows a man running away with a burden?",
          emotion: 'angry',
        },
        {
          text: "There is no 'heaven'. When you die, it's over. Face reality.",
          emotion: 'angry',
        },
      ],
      choices: [
        {
          text: '(...ignore him and keep walking)',
          stat: 'courage',
          amount: 5,
          lines: [
            { text: '...', emotion: 'neutral', speaker: 'Obstinate' },
            {
              text: "Fine. You'll regret this. You'll come crawling back.",
              emotion: 'angry',
              speaker: 'Obstinate',
            },
          ],
        },
        {
          text: "I don't know if I'll make it. But I can't live with this burden anymore.",
          stat: 'burden',
          amount: -5,
          lines: [
            {
              text: "The burden stays whether you run or not. That's reality.",
              emotion: 'angry',
              speaker: 'Obstinate',
            },
            {
              text: "...But I see the truth in your eyes. Alright. Go then. Good luck.",
              emotion: 'sad',
              speaker: 'Obstinate',
              stat: 'faith',
              amount: 3,
            },
          ],
        },
      ],
      repeated: [{ text: "Still here? You'll regret it.", emotion: 'angry' }],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 유연 / Pliable — 동행 제안
  // ─────────────────────────────────────────────────────────────────────────
  pliable: {
    ko: {
      lines: [
        { text: '크리스천, 잠깐만요!', emotion: 'happy' },
        {
          text: '전도자에게 들었습니다. 그 세계에 정말 좋은 것들이 있다면...',
          emotion: 'neutral',
        },
        {
          text: '나도 함께 가고 싶소! 그 짐 없는 세계, 저도 가보고 싶어요.',
          emotion: 'happy',
          stat: 'courage',
          amount: 5,
        },
      ],
      choices: [
        {
          text: '같이 갑시다! 함께라면 힘이 될 거요.',
          lines: [
            {
              text: '정말요? 고맙소! 당신이 있으면 길이 훨씬 덜 두려울 것 같소.',
              emotion: 'happy',
              speaker: '유연',
              stat: 'courage',
              amount: 8,
            },
            {
              text: '...하지만 솔직히, 길이 너무 험하면 저는 돌아올지도 모르오. 미리 말해두는 것이오.',
              emotion: 'fearful',
              speaker: '유연',
            },
          ],
        },
        {
          text: '이 길은 험합니다. 각자 가는 것이 나을 것 같소.',
          lines: [
            {
              text: '그... 그런가요. 알겠소. 그럼 멀리서나마 응원하겠소.',
              emotion: 'sad',
              speaker: '유연',
              stat: 'wisdom',
              amount: 3,
            },
          ],
        },
      ],
      repeated: [
        {
          text: '길이 험하더라도... 그대는 계속 가고 있군요. 대단합니다.',
          emotion: 'neutral',
          stat: 'courage',
          amount: 3,
        },
      ],
    },
    en: {
      lines: [
        { text: 'Christian, wait!', emotion: 'happy' },
        {
          text: "I heard what the Evangelist said. If that world truly has such things...",
          emotion: 'neutral',
        },
        {
          text: "I want to come with you! A world free of this burden — I want to see it.",
          emotion: 'happy',
          stat: 'courage',
          amount: 5,
        },
      ],
      choices: [
        {
          text: 'Come then! Together the road will be less frightening.',
          lines: [
            {
              text: "Truly? Thank you! With you beside me, I feel braver already.",
              emotion: 'happy',
              speaker: 'Pliable',
              stat: 'courage',
              amount: 8,
            },
            {
              text: "...Though honestly — if the road gets too hard, I may turn back. I tell you this now.",
              emotion: 'fearful',
              speaker: 'Pliable',
            },
          ],
        },
        {
          text: "This road is dangerous. We may be better going our separate ways.",
          lines: [
            {
              text: "Oh... I see. Very well. I will cheer for you from afar.",
              emotion: 'sad',
              speaker: 'Pliable',
              stat: 'wisdom',
              amount: 3,
            },
          ],
        },
      ],
      repeated: [
        {
          text: "Despite the hard road, you press on. I admire that.",
          emotion: 'neutral',
          stat: 'courage',
          amount: 3,
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 해석자 / Interpreter — 영적 진리 교사, WISDOM 성장
  // ─────────────────────────────────────────────────────────────────────────
  interpreter: {
    ko: {
      lines: [
        { text: '어서 오시오, 순례자여.', emotion: 'neutral' },
        {
          text: '나는 해석자요. 성령께서 보내신 자요. 이곳에서 그대에게 영적 진리를 보여드리겠소.',
          emotion: 'determined',
        },
        {
          text: '첫 번째 장면 — 벽에 촛불이 타오르고 있소. 이것은 믿음이오. 믿음은 작아 보여도 길을 밝힌다오.',
          emotion: 'neutral',
          stat: 'wisdom',
          amount: 5,
        },
        {
          text: '두 번째 장면 — 한 남자가 더러운 옷을 입고 땅만 보고 있소. 그는 세상의 것들을 사랑하여 위를 보지 못하는 자요.',
          emotion: 'sad',
          stat: 'wisdom',
          amount: 5,
        },
        {
          text: '세 번째 장면 — 불길 앞에 서 있는 사람. 어떤 이가 물을 붓는데 불이 꺼지지 않소. 뒤에서 다른 이가 기름을 붓기 때문이오. 그 기름이 바로 은혜라오.',
          emotion: 'awe',
          stat: 'faith',
          amount: 10,
        },
      ],
      choices: [
        {
          text: '이 모든 것들이 제게 무슨 의미입니까?',
          lines: [
            {
              text: "의미는 마음으로 보는 것이오, 눈으로 보는 것이 아니오.",
              emotion: 'determined',
              speaker: '해석자',
              stat: 'wisdom',
              amount: 8,
            },
            {
              text: '짐을 진 자에게 이 진리들은 빛이 될 것이오. 가서 실천하시오.',
              emotion: 'happy',
              speaker: '해석자',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
        {
          text: '더 보여주실 것이 있습니까?',
          lines: [
            {
              text: '마지막 장면 — 두 아이가 있소. 하나는 인내라 하고 하나는 열정이라 하오.',
              emotion: 'neutral',
              speaker: '해석자',
            },
            {
              text: '열정은 지금 좋은 것을 받으려 하고, 인내는 훗날을 기다리오. 순례자여, 인내를 배우시오.',
              emotion: 'determined',
              speaker: '해석자',
              stat: 'wisdom',
              amount: 10,
            },
          ],
        },
      ],
      repeated: [
        {
          text: '진리는 깊소. 언제든 다시 오시오.',
          emotion: 'neutral',
          stat: 'wisdom',
          amount: 3,
        },
      ],
    },
    en: {
      lines: [
        { text: 'Welcome, Pilgrim.', emotion: 'neutral' },
        {
          text: "I am the Interpreter, sent by the Holy Spirit. Let me show you things profitable for your journey.",
          emotion: 'determined',
        },
        {
          text: "First — a candle burns on a wall. This is faith. Small as it seems, it lights the whole room.",
          emotion: 'neutral',
          stat: 'wisdom',
          amount: 5,
        },
        {
          text: "Second — a man in filthy clothes, eyes on the ground, raking straw. He loves the world and cannot look up.",
          emotion: 'sad',
          stat: 'wisdom',
          amount: 5,
        },
        {
          text: "Third — a fire burns before a wall. One pours water, yet the fire grows. Behind the wall, another pours oil — the oil of grace.",
          emotion: 'awe',
          stat: 'faith',
          amount: 10,
        },
      ],
      choices: [
        {
          text: 'What do all these things mean for me?',
          lines: [
            {
              text: "Meaning is seen with the heart, not the eye.",
              emotion: 'determined',
              speaker: 'Interpreter',
              stat: 'wisdom',
              amount: 8,
            },
            {
              text: "For one who bears a burden, these truths are a lamp. Go and live them.",
              emotion: 'happy',
              speaker: 'Interpreter',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
        {
          text: 'Is there more you can show me?',
          lines: [
            {
              text: "One more — two children: Patience and Passion.",
              emotion: 'neutral',
              speaker: 'Interpreter',
            },
            {
              text: "Passion wants his good things now. Patience waits for what is better. Pilgrim — learn to wait.",
              emotion: 'determined',
              speaker: 'Interpreter',
              stat: 'wisdom',
              amount: 10,
            },
          ],
        },
      ],
      repeated: [
        {
          text: 'Truth runs deep. Return any time.',
          emotion: 'neutral',
          stat: 'wisdom',
          amount: 3,
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 선의 / Good-will — 좁은 문 문지기, 챕터 전환
  // ─────────────────────────────────────────────────────────────────────────
  goodwill: {
    ko: {
      lines: [
        { text: '두드리는 자에게 열릴 것이니...', emotion: 'neutral' },
        {
          text: '어서 오시오, 순례자여. 이 문은 그대를 위해 열려 있소.',
          emotion: 'happy',
          stat: 'faith',
          amount: 10,
        },
        {
          text: '이 문은 영원한 생명으로 향하는 좁은 입구라오. 많은 이들이 이 앞에서 돌아갔소.',
          emotion: 'neutral',
        },
        {
          text: '하지만 그대는 여기까지 왔소. 그 자체가 믿음이오.',
          emotion: 'determined',
          stat: 'courage',
          amount: 8,
        },
      ],
      choices: [
        {
          text: '이 문을 통과하면 무엇이 있습니까?',
          lines: [
            {
              text: '십자가가 있소. 그곳에서 그대의 짐이 풀릴 것이오.',
              emotion: 'happy',
              speaker: '선의',
              stat: 'faith',
              amount: 8,
            },
            {
              text: '준비가 되셨소? 문은 활짝 열려 있소.',
              emotion: 'determined',
              speaker: '선의',
            },
          ],
        },
        {
          text: '저는 아직 준비가 안 된 것 같습니다.',
          lines: [
            {
              text: '준비가 된 자는 없소. 발걸음을 내딛는 것이 준비요.',
              emotion: 'determined',
              speaker: '선의',
              stat: 'courage',
              amount: 10,
            },
            {
              text: '가시오. 이 문은 그대를 위해 열려 있소.',
              emotion: 'happy',
              speaker: '선의',
            },
          ],
        },
      ],
      repeated: [
        {
          text: '문은 항상 열려 있소. 두려워하지 마시오.',
          emotion: 'happy',
          stat: 'faith',
          amount: 3,
        },
      ],
    },
    en: {
      lines: [
        { text: 'To him that knocketh, it shall be opened...', emotion: 'neutral' },
        {
          text: "Welcome, Pilgrim. This gate stands open for you.",
          emotion: 'happy',
          stat: 'faith',
          amount: 10,
        },
        {
          text: "This is the narrow entrance to eternal life. Many have turned back at this very threshold.",
          emotion: 'neutral',
        },
        {
          text: "But you have come this far. That itself is faith.",
          emotion: 'determined',
          stat: 'courage',
          amount: 8,
        },
      ],
      choices: [
        {
          text: "What lies beyond this gate?",
          lines: [
            {
              text: "The Cross. There your burden will fall.",
              emotion: 'happy',
              speaker: 'Good-will',
              stat: 'faith',
              amount: 8,
            },
            {
              text: "Are you ready? The gate stands wide open.",
              emotion: 'determined',
              speaker: 'Good-will',
            },
          ],
        },
        {
          text: "I do not feel ready.",
          lines: [
            {
              text: "No one ever does. Taking the step — that is the readiness.",
              emotion: 'determined',
              speaker: 'Good-will',
              stat: 'courage',
              amount: 10,
            },
            {
              text: "Go now. This gate was made for you.",
              emotion: 'happy',
              speaker: 'Good-will',
            },
          ],
        },
      ],
      repeated: [
        {
          text: "The gate is always open. Do not be afraid.",
          emotion: 'happy',
          stat: 'faith',
          amount: 3,
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 도움 / Help — 낙심의 늪에서 구원
  // ─────────────────────────────────────────────────────────────────────────
  help: {
    ko: {
      lines: [
        { text: '여기가 낙심의 늪이오.', emotion: 'neutral' },
        {
          text: '많은 순례자들이 이 늪에 빠져 허우적거렸소. 그들은 죄의 무게와 두려움에 눌려 빠져나오지 못했소.',
          emotion: 'sad',
        },
        {
          text: '손을 내미시오! 내가 끌어올려 드리겠소.',
          emotion: 'happy',
          stat: 'faith',
          amount: 8,
        },
        {
          text: '이 늪은 인간의 마음에서 나오는 것이오. 하지만 그것이 전부가 아니오. 빠져나갈 수 있소.',
          emotion: 'determined',
          stat: 'courage',
          amount: 5,
        },
      ],
      choices: [
        {
          text: '감사합니다. 왜 이 늪이 여기 있는 겁니까?',
          lines: [
            {
              text: '낙심은 순례길의 일부라오. 없애려 해도 없어지지 않소.',
              emotion: 'neutral',
              speaker: '도움',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: '하지만 통과할 수 있소. 그대가 방금 했듯이.',
              emotion: 'happy',
              speaker: '도움',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
      ],
      repeated: [
        {
          text: '다시 이곳을 지나게 된다면 기억하시오 — 이 늪은 통과할 수 있소.',
          emotion: 'neutral',
          stat: 'courage',
          amount: 3,
        },
      ],
    },
    en: {
      lines: [
        { text: "This is the Slough of Despond.", emotion: 'neutral' },
        {
          text: "Many pilgrims have sunk here, weighed down by guilt and fear, unable to rise.",
          emotion: 'sad',
        },
        {
          text: "Give me your hand! I will pull you out.",
          emotion: 'happy',
          stat: 'faith',
          amount: 8,
        },
        {
          text: "This slough rises from the heart of man. But it need not hold you. You can pass through.",
          emotion: 'determined',
          stat: 'courage',
          amount: 5,
        },
      ],
      choices: [
        {
          text: "Thank you. Why does this slough exist here?",
          lines: [
            {
              text: "Despond is part of the pilgrim road. It cannot be drained away.",
              emotion: 'neutral',
              speaker: 'Help',
              stat: 'wisdom',
              amount: 5,
            },
            {
              text: "But it can be crossed. As you just showed.",
              emotion: 'happy',
              speaker: 'Help',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
      ],
      repeated: [
        {
          text: "If you find yourself here again — remember, the slough can be crossed.",
          emotion: 'neutral',
          stat: 'courage',
          amount: 3,
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 세속 현자 / Worldly Wiseman — 유혹, WISDOM 테스트
  // ─────────────────────────────────────────────────────────────────────────
  worldly_wiseman: {
    ko: {
      lines: [
        { text: '여보게, 잠깐만!', emotion: 'neutral' },
        {
          text: '어디 가는 게요? 그 무거운 짐을 지고? 얼마나 힘들겠소.',
          emotion: 'neutral',
        },
        {
          text: '나는 세속 현자라 하오. 그 짐을 훨씬 쉽게 내릴 방법을 알고 있소.',
          emotion: 'happy',
        },
        {
          text: '도덕 마을로 가시오. 거기 율법선생이 있는데 그가 그대의 짐을 내려줄 것이오.',
          emotion: 'neutral',
        },
      ],
      choices: [
        {
          text: '전도자가 그 길을 경계하라 했소.',
          requires: { stat: 'wisdom' as StatType, min: 30 },
          stat: 'wisdom',
          amount: 8,
          lines: [
            {
              text: '...허! 전도자? 그는 그대를 위험한 길로 보낸 게요.',
              emotion: 'angry',
              speaker: '세속 현자',
            },
            {
              text: '...하지만 그대 눈이 맑구먼. 가시오. 좁은 문이 그대를 기다리고 있겠지.',
              emotion: 'sad',
              speaker: '세속 현자',
            },
          ],
        },
        {
          text: '도덕 마을로 가면 정말 짐을 내릴 수 있습니까?',
          stat: 'wisdom',
          amount: -5,
          lines: [
            {
              text: '물론이오! 그곳에서 도덕적으로 살면 짐이 가벼워질 것이오.',
              emotion: 'happy',
              speaker: '세속 현자',
            },
            {
              text: '..하지만 그 길에는 거대한 언덕이 있다는 것, 그리고 그 위에서 내리치는 천둥을...',
              emotion: 'fearful',
              speaker: '세속 현자',
            },
          ],
        },
        {
          text: '됐소. 나는 좁은 문으로 가겠소.',
          stat: 'courage',
          amount: 8,
          lines: [
            {
              text: '..그래. 그 미친 길을 가겠다면 말리지 않겠소.',
              emotion: 'angry',
              speaker: '세속 현자',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
      ],
      repeated: [
        {
          text: '아직 생각해보고 있소? 도덕 마을 쪽이 훨씬 편안하오.',
          emotion: 'neutral',
        },
      ],
    },
    en: {
      lines: [
        { text: "Ho there, good man!", emotion: 'neutral' },
        {
          text: "Where are you going, carrying such a burden? You look miserable.",
          emotion: 'neutral',
        },
        {
          text: "I am Mr. Worldly Wiseman. I know a far easier way to be rid of that load.",
          emotion: 'happy',
        },
        {
          text: "Go to the village of Morality. There is a gentleman named Legality — he can ease your burden.",
          emotion: 'neutral',
        },
      ],
      choices: [
        {
          text: 'The Evangelist warned me against this road.',
          requires: { stat: 'wisdom' as StatType, min: 30 },
          stat: 'wisdom',
          amount: 8,
          lines: [
            {
              text: "The Evangelist? He sent you on a dangerous path!",
              emotion: 'angry',
              speaker: 'Mr. Worldly Wiseman',
            },
            {
              text: "...But your eyes are clear. Go then. The Wicket Gate awaits you.",
              emotion: 'sad',
              speaker: 'Mr. Worldly Wiseman',
            },
          ],
        },
        {
          text: "Can Morality truly remove this burden?",
          stat: 'wisdom',
          amount: -5,
          lines: [
            {
              text: "Of course! Live morally and the burden lightens.",
              emotion: 'happy',
              speaker: 'Mr. Worldly Wiseman',
            },
            {
              text: "...Though there is a great hill on that road. And the thunder that strikes from it...",
              emotion: 'fearful',
              speaker: 'Mr. Worldly Wiseman',
            },
          ],
        },
        {
          text: "No. I go to the Wicket Gate.",
          stat: 'courage',
          amount: 8,
          lines: [
            {
              text: "Suit yourself. If you insist on that mad path, I won't stop you.",
              emotion: 'angry',
              speaker: 'Mr. Worldly Wiseman',
              stat: 'faith',
              amount: 5,
            },
          ],
        },
      ],
      repeated: [
        {
          text: "Still considering? Morality is far more comfortable, I assure you.",
          emotion: 'neutral',
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Ch3 재등장 세속 현자 (Ch1과 분리된 ID)
  // ─────────────────────────────────────────────────────────────────────────
  worldly_wiseman_ch3: {
    ko: {
      lines: [
        { text: '다시 만났군요, 순례자여.', emotion: 'neutral' },
        { text: '그래도 아직 그 험한 길을 고집하는 것이오?', emotion: 'neutral' },
        { text: '도덕 마을에 가면 훨씬 평안한 삶이 있소. 그 짐을 내려놓고 평범하게 사는 것이 지혜가 아니겠소?', emotion: 'happy' },
      ],
      choices: [
        {
          text: '전도자가 경고했소. 나는 좁은 문으로 갑니다.',
          requires: { stat: 'wisdom' as StatType, min: 30 },
          stat: 'courage',
          amount: 8,
          lines: [
            { text: '...끝내 그 길을 택하는군. 후회하지 마시오.', emotion: 'sad', speaker: '세속 현자' },
          ],
        },
        {
          text: '됐소. 더 이상 이야기할 것이 없소.',
          stat: 'courage',
          amount: 5,
          lines: [
            { text: '고집 센 사람이군. 무사하길 바라오.', emotion: 'angry', speaker: '세속 현자' },
          ],
        },
      ],
      repeated: [
        { text: '아직도 이 길이오? 도덕 마을 제안은 언제든 유효하오.', emotion: 'neutral' },
      ],
    },
    en: {
      lines: [
        { text: 'We meet again, Pilgrim.', emotion: 'neutral' },
        { text: 'Still insisting on that perilous road?', emotion: 'neutral' },
        { text: 'The village of Morality offers peace and comfort. Is it not wiser to set down that burden and live quietly?', emotion: 'happy' },
      ],
      choices: [
        {
          text: 'The Evangelist warned me of this. I go to the Wicket Gate.',
          requires: { stat: 'wisdom' as StatType, min: 30 },
          stat: 'courage',
          amount: 8,
          lines: [
            { text: "...So you choose that road after all. Do not say I didn't warn you.", emotion: 'sad', speaker: 'Mr. Worldly Wiseman' },
          ],
        },
        {
          text: 'I have heard enough. Good day.',
          stat: 'courage',
          amount: 5,
          lines: [
            { text: 'Stubborn fellow. I hope you fare well, at least.', emotion: 'angry', speaker: 'Mr. Worldly Wiseman' },
          ],
        },
      ],
      repeated: [
        { text: "Still on this road? My offer of Morality stands, whenever you tire of it.", emotion: 'neutral' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 소심 / Timorous — 겁쟁이, 돌아가라 경고 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  timorous: {
    ko: {
      lines: [
        { text: '멈추시오! 앞으로 가지 마시오!', emotion: 'fearful' },
        { text: '저 앞에 아볼루온이라는 괴물이 있소. 우리는 보고 도망쳤소.', emotion: 'fearful' },
        { text: '돌아가시오. 목숨이 아깝거든 지금 당장 돌아가시오!', emotion: 'fearful', stat: 'courage', amount: -3 },
      ],
      choices: [
        {
          text: '두렵지만 나는 계속 가겠소.',
          stat: 'courage',
          amount: 8,
          lines: [
            { text: '...미쳤구만. 당신의 용기에 경의를 표하오. 하지만 나는 여기까지요.', emotion: 'sad', speaker: '소심' },
          ],
        },
        {
          text: '정말 그렇게 위험합니까?',
          lines: [
            { text: '내 말을 믿으시오! 그 계곡은 공포 그 자체요. 제발 돌아가시오.', emotion: 'fearful', speaker: '소심', stat: 'burden', amount: 5 },
          ],
        },
      ],
      repeated: [
        { text: '제발 돌아가시오. 아직 늦지 않았소.', emotion: 'fearful' },
      ],
    },
    en: {
      lines: [
        { text: 'Stop! Do not go any further!', emotion: 'fearful' },
        { text: 'There is a monster ahead called Apollyon. We saw him and fled.', emotion: 'fearful' },
        { text: 'Turn back! If you value your life, turn back now!', emotion: 'fearful', stat: 'courage', amount: -3 },
      ],
      choices: [
        {
          text: 'I am afraid — but I will press on.',
          stat: 'courage',
          amount: 8,
          lines: [
            { text: '...You are mad. I salute your courage. But I go no further.', emotion: 'sad', speaker: 'Timorous' },
          ],
        },
        {
          text: 'Is it truly so dangerous?',
          lines: [
            { text: 'Believe me! That valley is terror itself. Please, turn back.', emotion: 'fearful', speaker: 'Timorous', stat: 'burden', amount: 5 },
          ],
        },
      ],
      repeated: [
        { text: 'Please, go back. It is not too late.', emotion: 'fearful' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 불신 / Mistrust — 소심의 동행, 같이 도망 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  mistrust: {
    ko: {
      lines: [
        { text: '당신도 그 계곡에 가려는 것이오?', emotion: 'fearful' },
        { text: '우리는 사자들과 괴물들을 보았소. 살아 돌아온 것이 기적이오.', emotion: 'fearful' },
        { text: '이 길은 죽음의 길이오. 믿음만으로는 부족하오.', emotion: 'sad', stat: 'faith', amount: -3 },
      ],
      choices: [
        {
          text: '나는 믿음으로 갑니다.',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: '...그런 믿음이라면 혹시 모르겠소. 조심하시오.', emotion: 'neutral', speaker: '불신' },
          ],
        },
      ],
      repeated: [
        { text: '아직 살아있군. 대단하오.', emotion: 'neutral', stat: 'courage', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'You mean to go into that valley?', emotion: 'fearful' },
        { text: 'We saw lions and monsters there. It is a miracle we escaped alive.', emotion: 'fearful' },
        { text: 'This road is death. Faith alone is not enough.', emotion: 'sad', stat: 'faith', amount: -3 },
      ],
      choices: [
        {
          text: 'I go by faith.',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: '...With such faith, perhaps there is hope for you. Be careful.', emotion: 'neutral', speaker: 'Mistrust' },
          ],
        },
      ],
      repeated: [
        { text: "You're still alive. Remarkable.", emotion: 'neutral', stat: 'courage', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 파수꾼 / Watchful — 아름다운 궁전 문지기 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  watchful: {
    ko: {
      lines: [
        { text: '누가 오는고?', emotion: 'neutral' },
        { text: '멀리서 오셨군요. 순례자이십니까?', emotion: 'neutral' },
        { text: '이 궁전은 순례자들을 위해 세워진 것이오. 어서 들어오시오. 여기서는 안전하오.', emotion: 'happy', stat: 'faith', amount: 5 },
      ],
      choices: [
        {
          text: '감사합니다. 이 궁전은 무엇입니까?',
          lines: [
            { text: '아름다운 궁전이라 하오. 순례자들에게 쉼과 가르침을 주기 위해 세워진 곳이오.', emotion: 'neutral', speaker: '파수꾼', stat: 'wisdom', amount: 5 },
            { text: '현숙, 경건, 자선이 그대를 맞이할 것이오. 잘 쉬어 가시오.', emotion: 'happy', speaker: '파수꾼' },
          ],
        },
      ],
      repeated: [
        { text: '다시 오셨군요. 이 문은 항상 열려 있소.', emotion: 'happy', stat: 'faith', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'Who goes there?', emotion: 'neutral' },
        { text: 'You have come far. Are you a pilgrim?', emotion: 'neutral' },
        { text: 'This palace was built for such as you. Come in — you are safe here.', emotion: 'happy', stat: 'faith', amount: 5 },
      ],
      choices: [
        {
          text: 'Thank you. What is this place?',
          lines: [
            { text: 'It is called the Palace Beautiful. Built to give pilgrims rest and instruction.', emotion: 'neutral', speaker: 'Watchful', stat: 'wisdom', amount: 5 },
            { text: 'Prudence, Piety, and Charity will receive you. Rest well.', emotion: 'happy', speaker: 'Watchful' },
          ],
        },
      ],
      repeated: [
        { text: 'Welcome back. This gate is always open to you.', emotion: 'happy', stat: 'faith', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 현숙 / Prudence — 영적 성숙 질문 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  prudence: {
    ko: {
      lines: [
        { text: '어서 오세요, 순례자여.', emotion: 'neutral' },
        { text: '저는 현숙이라 합니다. 그대에게 몇 가지 여쭤봐도 될까요?', emotion: 'neutral' },
        { text: '그대는 아직도 고향 땅을 생각하나요?', emotion: 'neutral' },
      ],
      choices: [
        {
          text: '때때로 생각이 나지만, 더 나은 곳을 바라봅니다.',
          stat: 'wisdom',
          amount: 8,
          lines: [
            { text: '그것이 믿음이오. 보이지 않는 것을 바라보는 것이 지혜의 시작이오.', emotion: 'happy', speaker: '현숙', stat: 'faith', amount: 5 },
          ],
        },
        {
          text: '솔직히 말하면 아직 그리운 것들이 있습니다.',
          lines: [
            { text: '정직하군요. 그 그리움을 인정하는 것도 여정의 일부라오.', emotion: 'neutral', speaker: '현숙', stat: 'wisdom', amount: 5 },
            { text: '하지만 앞을 향해 가시오. 더 좋은 것이 기다리고 있소.', emotion: 'happy', speaker: '현숙' },
          ],
        },
      ],
      repeated: [
        { text: '믿음의 길을 계속 가고 있군요. 훌륭하오.', emotion: 'happy', stat: 'wisdom', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'Welcome, Pilgrim.', emotion: 'neutral' },
        { text: 'I am Prudence. May I ask you a few questions?', emotion: 'neutral' },
        { text: 'Do you still think of your former country?', emotion: 'neutral' },
      ],
      choices: [
        {
          text: 'Sometimes — but I look toward a better place.',
          stat: 'wisdom',
          amount: 8,
          lines: [
            { text: 'That is faith. To see what is unseen — that is the beginning of wisdom.', emotion: 'happy', speaker: 'Prudence', stat: 'faith', amount: 5 },
          ],
        },
        {
          text: 'Honestly, I still miss some things.',
          lines: [
            { text: 'You are honest. Acknowledging that longing is part of the journey.', emotion: 'neutral', speaker: 'Prudence', stat: 'wisdom', amount: 5 },
            { text: 'But keep looking forward. Better things await.', emotion: 'happy', speaker: 'Prudence' },
          ],
        },
      ],
      repeated: [
        { text: 'You continue the road of faith. Well done.', emotion: 'happy', stat: 'wisdom', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 경건 / Piety — 신앙 격려 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  piety: {
    ko: {
      lines: [
        { text: '순례자여, 저는 경건이라 합니다.', emotion: 'neutral' },
        { text: '이 여정에서 무엇이 가장 힘드셨나요?', emotion: 'neutral' },
        { text: '천성에 대한 생각이 힘든 순간에 위로가 되었나요?', emotion: 'neutral' },
      ],
      choices: [
        {
          text: '그렇습니다. 천성을 생각할 때마다 힘을 얻었습니다.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: '그것이 순례자의 힘이오. 보이지 않는 것을 바라보는 것이오.', emotion: 'happy', speaker: '경건', stat: 'courage', amount: 5 },
          ],
        },
        {
          text: '솔직히 쉽지 않았습니다.',
          lines: [
            { text: '그렇소. 이 길은 쉽지 않소. 하지만 당신은 여기까지 왔소.', emotion: 'determined', speaker: '경건', stat: 'courage', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: '기도가 당신의 방패가 될 것이오.', emotion: 'determined', stat: 'faith', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'Pilgrim, I am Piety.', emotion: 'neutral' },
        { text: 'What has been the hardest part of your journey?', emotion: 'neutral' },
        { text: 'Did thoughts of the Celestial City comfort you in dark moments?', emotion: 'neutral' },
      ],
      choices: [
        {
          text: 'Yes — thinking of the City gave me strength every time.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: "That is the pilgrim's power — to see what is not yet seen.", emotion: 'happy', speaker: 'Piety', stat: 'courage', amount: 5 },
          ],
        },
        {
          text: 'Honestly, it has not been easy.',
          lines: [
            { text: "No, it is not. But here you stand, Pilgrim. That says everything.", emotion: 'determined', speaker: 'Piety', stat: 'courage', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: 'Prayer will be your shield on the road ahead.', emotion: 'determined', stat: 'faith', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 자선 / Charity — 사랑과 가족에 대해 (Ch7)
  // ─────────────────────────────────────────────────────────────────────────
  charity: {
    ko: {
      lines: [
        { text: '순례자여, 저는 자선이라 합니다.', emotion: 'happy' },
        { text: '가족은 함께 오지 않았나요?', emotion: 'sad' },
        { text: '사랑하는 사람들을 뒤에 두고 오셨군요. 그 아픔을 압니다.', emotion: 'sad', stat: 'burden', amount: -5 },
      ],
      choices: [
        {
          text: '그들도 언젠가 이 길을 오기를 바랍니다.',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: '그 소망 자체가 사랑이오. 계속 기도하시오. 씨앗이 자랄 것이오.', emotion: 'happy', speaker: '자선', stat: 'wisdom', amount: 5 },
          ],
        },
        {
          text: '남겨두고 온 것이 지금도 괴롭습니다.',
          lines: [
            { text: '그 마음이 자비롭소. 하지만 당신이 이 길을 걷는 것이 그들을 위한 것일 수 있소.', emotion: 'determined', speaker: '자선', stat: 'courage', amount: 5 },
          ],
        },
      ],
      repeated: [
        { text: '사랑은 이 여정에서도 당신과 함께하오.', emotion: 'happy', stat: 'faith', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'Pilgrim, I am Charity.', emotion: 'happy' },
        { text: 'Did your family not come with you?', emotion: 'sad' },
        { text: 'You left those you love behind. I understand that grief.', emotion: 'sad', stat: 'burden', amount: -5 },
      ],
      choices: [
        {
          text: 'I hope they will follow someday.',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: 'That hope is itself love. Keep praying. Seeds take time to grow.', emotion: 'happy', speaker: 'Charity', stat: 'wisdom', amount: 5 },
          ],
        },
        {
          text: 'Leaving them behind still troubles me.',
          lines: [
            { text: 'Your grief is tender. But know — your walking this road may yet be for them.', emotion: 'determined', speaker: 'Charity', stat: 'courage', amount: 5 },
          ],
        },
      ],
      repeated: [
        { text: 'Love walks with you on this road.', emotion: 'happy', stat: 'faith', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 충실 / Faithful — 동행자, 순교 전 (Ch9/10)
  // ─────────────────────────────────────────────────────────────────────────
  faithful: {
    ko: {
      lines: [
        { text: '크리스천! 반갑소!', emotion: 'happy' },
        { text: '나도 멸망의 도시에서 왔소. 당신이 떠난 후 나도 이 길을 걷기 시작했소.', emotion: 'neutral' },
        { text: '함께 가면 어떻겠소? 이 길은 혼자 가기엔 너무 험하오.', emotion: 'happy', stat: 'courage', amount: 8 },
      ],
      choices: [
        {
          text: '물론이오! 함께 갑시다.',
          stat: 'faith',
          amount: 5,
          lines: [
            { text: '좋소! 서로에게 힘이 될 것이오. 함께라면 이 어둠의 계곡도 통과할 수 있소.', emotion: 'happy', speaker: '충실' },
          ],
        },
        {
          text: '당신도 허영의 시장을 통과해야 합니까?',
          lines: [
            { text: '그렇소. 그 시장은 피할 수 없는 것 같소. 하지만 진리를 팔 수는 없소.', emotion: 'determined', speaker: '충실', stat: 'courage', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: '함께 있으니 마음이 든든하오.', emotion: 'happy', stat: 'courage', amount: 3 },
      ],
    },
    en: {
      lines: [
        { text: 'Christian! Well met!', emotion: 'happy' },
        { text: 'I too am from the City of Destruction. After you left, I took to the road.', emotion: 'neutral' },
        { text: "Shall we travel together? This road is too hard to walk alone.", emotion: 'happy', stat: 'courage', amount: 8 },
      ],
      choices: [
        {
          text: 'Gladly! Let us go together.',
          stat: 'faith',
          amount: 5,
          lines: [
            { text: 'Excellent! We will strengthen each other. Even the dark valley is less fearful with a companion.', emotion: 'happy', speaker: 'Faithful' },
          ],
        },
        {
          text: 'Must you also pass through Vanity Fair?',
          lines: [
            { text: "It seems unavoidable. But I will not sell the truth there — not for any price.", emotion: 'determined', speaker: 'Faithful', stat: 'courage', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: 'Walking together makes the road lighter.', emotion: 'happy', stat: 'courage', amount: 3 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 증오선 재판장 / Lord Hategood — 허영의 시장 재판 (Ch10)
  // ─────────────────────────────────────────────────────────────────────────
  lord_hategood: {
    ko: {
      lines: [
        { text: '여기 이단자들이 섰도다!', emotion: 'angry' },
        { text: '그대들은 우리의 왕과 상품을 거부하였소. 이것은 반역이오.', emotion: 'angry' },
        { text: '이 시장의 모든 것을 받아들이겠소, 아니면 재판을 받겠소?', emotion: 'angry', stat: 'burden', amount: 10 },
      ],
      choices: [
        {
          text: '나는 오직 진리만을 섬기오.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: '...배짱 하나는 있군. 하지만 그 용기는 이곳에서 너를 구하지 못하리라.', emotion: 'angry', speaker: '증오선 재판장' },
          ],
        },
        {
          text: '(...침묵으로 맞선다)',
          stat: 'courage',
          amount: 8,
          lines: [
            { text: '침묵? 죄를 인정하는 것이로구나. 판결을 내리겠다!', emotion: 'angry', speaker: '증오선 재판장' },
          ],
        },
      ],
      repeated: [
        { text: '이 법정은 진리의 적들로 가득하다.', emotion: 'angry' },
      ],
    },
    en: {
      lines: [
        { text: 'Here stand the heretics!', emotion: 'angry' },
        { text: 'You have refused our prince and our wares. This is treason.', emotion: 'angry' },
        { text: 'Will you accept all that this fair offers — or face judgment?', emotion: 'angry', stat: 'burden', amount: 10 },
      ],
      choices: [
        {
          text: 'I serve truth alone.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: '...Bold words. But your courage will not save you here.', emotion: 'angry', speaker: 'Lord Hategood' },
          ],
        },
        {
          text: '(...stand in silence)',
          stat: 'courage',
          amount: 8,
          lines: [
            { text: 'Silence! You admit your guilt. I will pass sentence!', emotion: 'angry', speaker: 'Lord Hategood' },
          ],
        },
      ],
      repeated: [
        { text: 'This court has no patience for enemies of the fair.', emotion: 'angry' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 소망 / Hopeful — 충실의 뒤를 이은 동행자 (Ch11/12)
  // ─────────────────────────────────────────────────────────────────────────
  hopeful: {
    ko: {
      lines: [
        { text: '크리스천, 저는 소망이오.', emotion: 'happy' },
        { text: '충실의 죽음을 보았소. 그것이 나를 이 길로 이끌었소.', emotion: 'sad' },
        { text: '그의 용기가 씨앗이 되었소. 이제 함께 가도 되겠소?', emotion: 'determined', stat: 'faith', amount: 8 },
      ],
      choices: [
        {
          text: '충실의 뒤를 잇는 것이오. 함께 갑시다.',
          stat: 'courage',
          amount: 8,
          lines: [
            { text: '감사하오. 천성까지 함께 갑시다. 포기하지 맙시다.', emotion: 'happy', speaker: '소망', stat: 'faith', amount: 5 },
          ],
        },
        {
          text: '의심의 성 앞에서도 포기하지 않겠소?',
          lines: [
            { text: '소망이 있는 한 포기는 없소. 약속의 열쇠를 기억하시오.', emotion: 'determined', speaker: '소망', stat: 'wisdom', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: '포기하지 마시오. 천성이 코앞이오.', emotion: 'happy', stat: 'faith', amount: 5 },
      ],
    },
    en: {
      lines: [
        { text: 'Christian, I am Hopeful.', emotion: 'happy' },
        { text: "I witnessed Faithful's death. It brought me to this road.", emotion: 'sad' },
        { text: 'His courage became a seed. May I travel with you?', emotion: 'determined', stat: 'faith', amount: 8 },
      ],
      choices: [
        {
          text: "You carry on Faithful's legacy. Let us go together.",
          stat: 'courage',
          amount: 8,
          lines: [
            { text: 'Thank you. Together to the Celestial City — we will not give up.', emotion: 'happy', speaker: 'Hopeful', stat: 'faith', amount: 5 },
          ],
        },
        {
          text: 'Will you not falter before Doubting Castle?',
          lines: [
            { text: 'Where there is hope, there is no surrender. Remember the key of promise.', emotion: 'determined', speaker: 'Hopeful', stat: 'wisdom', amount: 8 },
          ],
        },
      ],
      repeated: [
        { text: 'Do not give up. The City is close now.', emotion: 'happy', stat: 'faith', amount: 5 },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 불신감 / Diffidence — 거인 절망의 아내 (Ch11)
  // ─────────────────────────────────────────────────────────────────────────
  diffidence: {
    ko: {
      lines: [
        { text: '당신들은 어차피 살아나가지 못할 것이오.', emotion: 'sad' },
        { text: '우리 성에 갇힌 자들은 모두 절망 속에 죽었소.', emotion: 'sad' },
        { text: '빨리 포기하는 것이 덜 고통스럽소.', emotion: 'sad', stat: 'burden', amount: 10 },
      ],
      choices: [
        {
          text: '나에게는 소망이 있소.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: '...소망? 여기서도 그것을 붙드는 자가 있다는 것이 신기하군.', emotion: 'neutral', speaker: '불신감' },
          ],
        },
        {
          text: '(...기도한다)',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: '...기도라니. 이 어둠 속에서.', emotion: 'sad', speaker: '불신감', stat: 'burden', amount: -5 },
          ],
        },
      ],
      repeated: [
        { text: '아직도 포기하지 않았소?', emotion: 'sad' },
      ],
    },
    en: {
      lines: [
        { text: 'You will not escape from here.', emotion: 'sad' },
        { text: 'All who are imprisoned in this castle die in despair.', emotion: 'sad' },
        { text: 'Surrender sooner — the suffering will be less.', emotion: 'sad', stat: 'burden', amount: 10 },
      ],
      choices: [
        {
          text: 'I have hope.',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: "...Hope? Strange — to find one who still holds it here.", emotion: 'neutral', speaker: 'Diffidence' },
          ],
        },
        {
          text: '(...pray)',
          stat: 'faith',
          amount: 8,
          lines: [
            { text: '...Prayer. In this darkness.', emotion: 'sad', speaker: 'Diffidence', stat: 'burden', amount: -5 },
          ],
        },
      ],
      repeated: [
        { text: 'You still have not given up?', emotion: 'sad' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 무지 / Ignorance — 천성 문 앞에서 거절당하는 자 (Ch12)
  // ─────────────────────────────────────────────────────────────────────────
  ignorance: {
    ko: {
      lines: [
        { text: '나도 천성에 들어갈 것이오.', emotion: 'neutral' },
        { text: '나는 착하게 살았소. 하나님이 나를 받아줄 것이오.', emotion: 'neutral' },
        { text: '왕의 도장이 없어도 괜찮을 것이오.', emotion: 'neutral' },
      ],
      choices: [
        {
          text: '그 확신은 어디서 오는 것이오?',
          stat: 'wisdom',
          amount: 5,
          lines: [
            { text: '내 마음이 그렇게 말하오. 내 마음이 선하니 충분하오.', emotion: 'neutral', speaker: '무지' },
            { text: '...하지만 왕은 그렇게 말씀하지 않으셨소. 문서가 필요하오.', emotion: 'sad', speaker: '무지', stat: 'wisdom', amount: 5 },
          ],
        },
        {
          text: '믿음의 근거는 자신의 선함이 아니라 은혜라오.',
          requires: { stat: 'wisdom' as StatType, min: 50 },
          stat: 'wisdom',
          amount: 8,
          lines: [
            { text: "...그 말이 무슨 뜻인지 아직 잘 모르겠소. 하지만 한번 생각해보겠소.", emotion: 'neutral', speaker: '무지' },
          ],
        },
      ],
      repeated: [
        { text: '나는 나의 방식대로 갈 것이오.', emotion: 'neutral' },
      ],
    },
    en: {
      lines: [
        { text: 'I too shall enter the Celestial City.', emotion: 'neutral' },
        { text: "I have lived a good life. God will accept me.", emotion: 'neutral' },
        { text: "I think I will be fine without the King's certificate.", emotion: 'neutral' },
      ],
      choices: [
        {
          text: 'Where does that certainty come from?',
          stat: 'wisdom',
          amount: 5,
          lines: [
            { text: "My heart tells me so. My heart is good — that is enough.", emotion: 'neutral', speaker: 'Ignorance' },
            { text: "...But the King did not say that. A scroll is required.", emotion: 'sad', speaker: 'Ignorance', stat: 'wisdom', amount: 5 },
          ],
        },
        {
          text: "Faith's ground is not your goodness but grace alone.",
          requires: { stat: 'wisdom' as StatType, min: 50 },
          stat: 'wisdom',
          amount: 8,
          lines: [
            { text: "...I don't quite understand that. But I will think on it.", emotion: 'neutral', speaker: 'Ignorance' },
          ],
        },
      ],
      repeated: [
        { text: 'I will go my own way.', emotion: 'neutral' },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 빛나는 자들 / Shining Ones — 천성 문의 천사 (Ch12)
  // ─────────────────────────────────────────────────────────────────────────
  shining_ones: {
    ko: {
      lines: [
        { text: '순례자여, 그대가 왔구나.', emotion: 'awe' },
        { text: '왕께서 그대를 기다리고 계셨소. 이 긴 여정 동안 단 한 번도 눈을 떼지 않으셨소.', emotion: 'happy', stat: 'faith', amount: 15 },
        { text: '이제 짐은 영원히 없어졌소. 눈물도 없고, 죽음도 없소. 어서 들어오시오.', emotion: 'awe', stat: 'burden', amount: -100 },
      ],
      choices: [
        {
          text: '...정말 제가 여기 있는 것이 맞습니까?',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: '맞소. 그대는 처음부터 이곳을 위해 부름 받았소.', emotion: 'awe', speaker: '빛나는 자들', stat: 'courage', amount: 10 },
            { text: '자, 어서 들어가시오. 왕이 기다리십니다.', emotion: 'happy', speaker: '빛나는 자들' },
          ],
        },
      ],
      repeated: [
        { text: '천성에 오신 것을 환영하오, 순례자여.', emotion: 'awe', stat: 'faith', amount: 5 },
      ],
    },
    en: {
      lines: [
        { text: 'Pilgrim — you have come.', emotion: 'awe' },
        { text: "The King has been waiting. Through every step of your long journey, His eyes never left you.", emotion: 'happy', stat: 'faith', amount: 15 },
        { text: 'The burden is gone forever. No sorrow, no death. Come in.', emotion: 'awe', stat: 'burden', amount: -100 },
      ],
      choices: [
        {
          text: '...Is it truly right that I am here?',
          stat: 'faith',
          amount: 10,
          lines: [
            { text: 'It is. You were called for this from the very beginning.', emotion: 'awe', speaker: 'Shining Ones', stat: 'courage', amount: 10 },
            { text: 'Now come in. The King awaits.', emotion: 'happy', speaker: 'Shining Ones' },
          ],
        },
      ],
      repeated: [
        { text: 'Welcome to the Celestial City, Pilgrim.', emotion: 'awe', stat: 'faith', amount: 5 },
      ],
    },
  },
};
