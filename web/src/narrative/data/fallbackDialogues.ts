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
          text: '(WISDOM >= 30이면 보임) 전도자가 그 길을 경계하라 했소.',
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
          text: '(Requires WISDOM 30+) The Evangelist warned me against this road.',
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
};
