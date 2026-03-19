# 웹 기반 리부트 — AI 프롬프트

> 아래 프롬프트를 새 Cursor 채팅 세션에 복사-붙여넣기 하여 실행하세요.
> `web/` 폴더에 새로 생성됩니다.

---

## 프롬프트

```
당신은 웹 기술로 상용 인디 게임을 출시해본 시니어 게임 개발자이자,
Undertale · Celeste · To the Moon 급 내러티브와 감성을 구현하는 전문가입니다.
지금부터 세계적 명작 문학을 원작으로 한 **브라우저 네이티브 상용 게임**을 처음부터 끝까지 만듭니다.

────────────────────────────────────────
1. 프로젝트 정의
────────────────────────────────────────

프로젝트명 : 천로역정 — 순례자의 여정 (The Pilgrim's Progress)
원작       : John Bunyan, The Pilgrim's Progress Part 1 (1678)
장르       : 탑다운 2D 픽셀 아트 내러티브 어드벤처 RPG
개발 체제  : 1인 개발 (AI 보조)
목표 퀄리티: itch.io Featured · Steam Very Positive 리뷰 · 유저가 돈 내고 사는 수준

배포 경로:
  1차 → itch.io (WebGL iframe, 무료 데모)
  2차 → PWA (모바일 홈화면 설치)
  3차 → Steam (Electron 래핑, 유료 정식판 $4.99)

언어: 한국어 / English 동시 지원 (첫 실행 시 선택)

────────────────────────────────────────
2. 게임 비전
────────────────────────────────────────

"300년간 2억 부 읽힌 존 번연의 천로역정을 직접 걸어가는 인터랙티브 어드벤처.
 모든 선택이 크리스천의 운명을 바꾸고, 모든 만남이 당신의 마음을 울립니다."

핵심 경험:
  • 체험 — 읽는 게 아니라 걷고, 선택하고, 결과를 경험한다
  • 은혜 — 게임 오버는 없다. 잘못된 선택도 여정의 일부다
  • 재미 — QTE 전투, 퍼즐, 선택의 긴장감, 수집 요소
  • 보편성 — 크리스천이 아니어도 감동받을 수 있는 보편적 서사

감정 아크:
  Ch1-2 (출발)  → 긴박함, 결단
  Ch3-4 (시련)  → 좌절과 희망
  Ch5-6 (은혜)  → 경이로움, 카타르시스 ★ 십자가에서 짐이 떨어지는 순간
  Ch7-9 (전투)  → 긴장, 승리감
  Ch10-11(인내) → 분노, 슬픔, 다시 일어남
  Ch12 (완성)   → 감동, 평안

────────────────────────────────────────
3. 코어 게임플레이
────────────────────────────────────────

3.1 코어 루프
  탐험(탑다운 맵 이동, 환경 관찰)
    → 만남(NPC 발견, 대화 시작)
      → 선택(분기, 스탯 영향)
        → 도전(QTE 전투, 퍼즐, 인내 챌린지)
          → 성장(스탯 변화, 성경 카드 수집, 도감)
            → 이동(다음 장소)

3.2 스탯 시스템
  • 믿음(Faith)  : 0-100, 초기 10 — 하나님에 대한 신뢰
  • 용기(Courage) : 0-100, 초기 10 — 시련 앞의 담대함
  • 지혜(Wisdom)  : 0-100, 초기 10 — 영적 분별력
  • 짐(Burden)    : 이동 속도·난이도에 물리적 반영, Ch6 십자가에서 해방 (→ 0)

3.3 수집
  • 성경 구절 카드 52장 (포켓몬 카드처럼 수집)
  • 캐릭터 도감 40+명
  • 여정 일지 (자동 기록)

3.4 승리/실패
  게임 오버 없음. 잘못된 선택 → 스탯 감소 + 추가 시련 (진행은 가능).
  유혹에 넘어감 → 전도자가 나타나 교정 기회.
  엔딩은 하나(천성 도착)이지만 최종 스탯에 따라 연출이 달라짐:
    • 영광의 입성 (모든 스탯 80+)
    • 겸손한 도착 (평균 50-79)
    • 간신히 구원 (평균 30-49)

3.5 온보딩 (FTUE)
  앱 실행
    → 언어 선택 (한국어 / English)
      → 닉네임 입력 (기본: 크리스천/Christian, 1-12자)
        → 프롤로그 시퀀스 (원작 도입부 연출)
          → 튜토리얼 (이동/상호작용/대화 — 컨텍스트 팝업)
            → Chapter 1 시작

3.6 챕터 구조 (12챕터, 풀 게임 3-5시간)
  Ch1  멸망의 도시 (City of Destruction) — 죄의 자각, 결단
  Ch2  들판 & 낙심의 늪 (Slough of Despond) — 좌절, 도움
  Ch3  세상지혜씨 & 시내산 (Mr. Worldly Wiseman) — 유혹, 교정
  Ch4  좁은 문 (Wicket Gate) — 구원의 문, 환영
  Ch5  해석자의 집 (Interpreter's House) — 7개 방, 영적 교훈
  Ch6  십자가 언덕 (The Cross) — ★ 짐 해방, 카타르시스
  Ch7  어려움의 언덕 & 아름다운 궁전 — 사자, 동료, 안식
  Ch8  굴욕의 골짜기 (Apollyon) — QTE 보스전
  Ch9  사망의 음침한 골짜기 — 어둠 속 인내 챌린지
  Ch10 허영의 시장 (Vanity Fair) — 유혹, 재판, Faithful 순교
  Ch11 의심의 성 & 기쁨의 산 — 감옥 퍼즐, 약속의 열쇠
  Ch12 마법의 땅 → 요단강 → 천성 — 최종 여정, 입성

  MVP/데모 범위: Ch1-Ch6 (멸망의 도시 → 십자가, 40-60분)

────────────────────────────────────────
4. 아트 & 오디오 디렉션
────────────────────────────────────────

4.1 픽셀 아트 사양
  • 캐릭터 기본: 16×16 (4방향 × idle/walk 2프레임 = 8프레임)
  • 보스/특수: 32×32
  • 타일: 16×16
  • 팔레트: 캐릭터당 4-6색 (레트로 감성)
  • 렌더링: nearest-neighbor 스케일링, 서브픽셀 보간 금지

4.2 컬러 팔레트
  빛의 팔레트 (구원, 교제, 희망):
    Primary #C8956C | Secondary #F5E6D3 | Accent #D4A853 | Text #3B2F2F
  어둠의 팔레트 (시련, 절망, 유혹):
    Primary #1E2A3A | Secondary #2D1B4E | Accent #8B3A3A | Text #E8E0D0
  전투/긴장 팔레트:
    Primary #4A1C1C | Accent #FF6B35

4.3 맵별 타일 테마
  Ch1  황량한 도시, 먹구름   (40×30 타일)
  Ch2  들판 → 진흙 늪지      (50×25)
  Ch3  마을 → 불타는 산       (35×30)
  Ch4  좁은 길, 문, 성벽     (25×20)
  Ch5  실내, 7개 방           (30×25)
  Ch6  언덕, 십자가, 빛      (30×30)
  Ch7  가파른 언덕 → 궁전    (40×35)
  Ch8  어둡고 좁은 골짜기    (35×20)
  Ch9  극도로 어두움, 절벽   (50×15)
  Ch10 화려한 시장, 인파     (40×30)
  Ch11 어두운 성 → 밝은 산   (35×35)
  Ch12 몽환 → 찬란한 빛      (45×30)

4.4 UI 톤
  양피지/고서적 질감. 클래식하되 깔끔. 
  대화 박스는 반투명 양피지 배경 + 세리프 폰트 느낌의 픽셀 폰트.
  HUD는 최소한으로 — 스탯 바 3개 + 짐 게이지만 상시 표시.

4.5 오디오
  • BGM: 챕터별 고유 트랙 (14곡). 빛의 장소=현악+피아노, 어둠=저음 현악+앰비언트
  • SFX: 30+ (발걸음, UI클릭, 대화타이핑, 전투, 환경음)
  • 앰비언트: 바람, 새소리, 늪 거품, 시장 인파 등

────────────────────────────────────────
5. 내러티브 시스템
────────────────────────────────────────

5.1 Ink 기반 스토리
  • inkjs (Ink 런타임 JS 포트) 사용
  • 선택지 → 스탯 변화 즉시 피드백
  • 스탯에 따라 대화 옵션/결과 분기
  • 전도자 교정 장치: 최악의 선택에도 복귀 경로 보장

5.2 알레고리 → 게임 메카닉 번역
  짐(죄)           → Burden 스탯, 이동 속도 저하
  십자가의 은혜     → Ch6에서 Burden=0, 스프라이트 변경, 속도 회복
  전도자의 인도     → 잘못된 선택 후 자동 등장, 게임 오버 방지
  낙심의 늪         → 이동 속도 극감 지형 + Help NPC 구출
  아볼론 전투       → 4단계 QTE (Mash→Timing→Dodge→DialogueBattle)
  의심의 성 감금    → 퍼즐 챌린지, "약속의 열쇠" 아이템으로 탈출
  사망의 골짜기     → 화면 극도로 어둡게, 소리만으로 길 찾기
  허영의 시장       → 대화 전투 (재판 변론)

5.3 성경 구절 통합
  NPC 대화 속 자연스러운 인용 (강제 암기 X)
  성경 카드 수집 52장 (구절 + 맥락 설명 + 아트워크)
  한국어: 새번역 / English: NIV

────────────────────────────────────────
6. 캐릭터 (주요 14명 + 알레고리)
────────────────────────────────────────

  크리스천(Christian)      — 주인공. 죄의 짐을 지고 순례하는 자
  전도자(Evangelist)       — 복음 전파자. 길 안내, 교정
  완고(Obstinate)          — 회심 거부. 고집
  유연(Pliable)            — 얕은 신앙. 시련에 이탈
  도움(Help)               — 하나님의 은혜. 늪에서 구출
  세상지혜씨(Mr. Worldly Wiseman) — 세속적 유혹
  선의(Good-will)          — 좁은 문 문지기. 그리스도의 은혜
  해석자(Interpreter)      — 성령. 영적 진리 교사
  빛나는 자들(Shining Ones)  — 천사 3인
  신실(Faithful)           — 충실한 동행자 → 순교자
  아볼론(Apollyon)         — 사탄. 보스
  소망(Hopeful)            — 새 동행자
  거인 절망(Giant Despair)   — 절망
  무지(Ignorance)          — 자기 의로움

  ※ 전체 인물 목록과 한영 명명 규칙: docs/story-data/index-and-glossary.md 참조

────────────────────────────────────────
7. 기존 자산 (반드시 참조할 것)
────────────────────────────────────────

이 프로젝트에는 이미 완성된 게임 디자인 문서와 스토리 데이터가 있습니다.
새 웹 프로젝트의 시스템 설계, 캐릭터 명명, 챕터 구성에 반드시 참조하세요.

게임 디자인 (docs/game-design-unity/):
  • game-concept-and-vision.md   — 비전, 핵심 경험, 아트 디렉션, 타겟 유저
  • game-design-document.md      — GDD 전체 (온보딩, 월드, 내러티브, 캐릭터, 시스템, UI/UX)
  • mvp-specification.md         — MVP 상세 (Ch1-6 장소별 NPC, 대화, 연출, 스탯 변화)
  • asset-preparation-guide.md   — 스프라이트 사양, 캐릭터 목록, 에셋 제작 가이드
  • development-roadmap.md       — 단계별 로드맵
  • marketing-and-launch.md      — 마케팅/출시 전략

스토리 데이터 (docs/story-data/):
  • index-and-glossary.md        — 인물 용어집, 한영 명명 규칙, 알레고리 설명
  • city-of-destruction-to-wicket-gate.md ~ enchanted-ground-to-celestial-city.md
    — 원작 전체 8개 파일 (대화, 장면, 감정, 성경 구절 포함)

기존 스프라이트 (재사용 가능):
  • pilgrims-progress-unity/Assets/_Project/Resources/Sprites/
  • pilgrims-progress-unity/Assets/_Project/Sprites/Characters/

────────────────────────────────────────
8. 기술 스택 & 아키텍처
────────────────────────────────────────

8.1 기술 스택

  렌더링    : Phaser 3 (WebGL + Canvas fallback)
  언어      : TypeScript (strict mode)
  빌드      : Vite (HMR, 빌드 최적화)
  패키지    : pnpm
  내러티브  : inkjs
  오디오    : Howler.js
  상태 저장 : IndexedDB (localforage) + localStorage fallback
  린팅      : ESLint (flat config) + Prettier
  테스트    : Vitest
  배포      : GitHub Actions → GitHub Pages / Netlify / itch.io

8.2 아키텍처 원칙

  • 모듈성 — 각 시스템은 인터페이스 기반, 독립적으로 교체 가능
  • 이벤트 드리븐 — 타입 안전 EventBus로 느슨한 결합
  • FSM 패턴 — 게임 상태, 플레이어 상태 모두 제네릭 StateMachine
  • ECS 지향 — 엔티티는 컴포넌트 조합으로 구성, 상속 최소화
  • 픽셀 퍼펙트 — 내부 해상도 고정 (예: 256×144 또는 320×180), 정수 스케일링
  • 고정 시간 스텝 — 물리/로직은 고정 dt, 렌더는 보간
  • 오프라인 퍼스트 — Service Worker + 캐싱
  • 접근성 — 키보드 완전 지원, 색약 모드, 스크린 리더 고려

8.3 프로젝트 구조

web/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── public/
│   ├── manifest.json                  # PWA
│   ├── sw.js                          # Service Worker
│   └── assets/
│       ├── sprites/                   # 스프라이트시트
│       │   ├── characters/
│       │   ├── tilesets/
│       │   ├── ui/
│       │   └── effects/
│       ├── audio/
│       │   ├── bgm/
│       │   └── sfx/
│       ├── fonts/
│       ├── ink/                       # 컴파일된 .ink.json
│       └── maps/                      # Tiled JSON 맵 데이터
├── src/
│   ├── main.ts                        # 진입점
│   ├── config.ts                      # 게임 설정 상수
│   │
│   ├── core/                          # 프레임워크 레이어
│   │   ├── EventBus.ts                # 타입 안전 이벤트 (제네릭)
│   │   ├── StateMachine.ts            # 제네릭 FSM
│   │   ├── ServiceLocator.ts          # DI 컨테이너
│   │   ├── GameManager.ts             # 게임 상태 총괄 (FSM)
│   │   └── GameEvents.ts              # 이벤트/열거형 정의
│   │
│   ├── scenes/                        # Phaser Scene
│   │   ├── BootScene.ts               # 에셋 프리로드
│   │   ├── PreloadScene.ts            # 로딩 화면 (프로그레스 바)
│   │   ├── MenuScene.ts               # 메인 메뉴
│   │   ├── LanguageScene.ts           # 언어 선택
│   │   ├── OnboardingScene.ts         # 닉네임/프롤로그
│   │   ├── GameScene.ts               # 인게임 (월드)
│   │   ├── BattleScene.ts             # QTE 전투
│   │   └── CutsceneScene.ts           # 컷씬/연출
│   │
│   ├── entities/                      # 게임 엔티티
│   │   ├── Player.ts                  # 플레이어 (컴포지션)
│   │   ├── PlayerMotor.ts             # 이동 물리 (가속/감속/코요테)
│   │   ├── PlayerAnimator.ts          # 스프라이트 애니메이션
│   │   ├── PlayerStateMachine.ts      # 플레이어 FSM
│   │   ├── NPC.ts                     # NPC 엔티티
│   │   ├── InteractionZone.ts         # 상호작용 트리거
│   │   └── Entity.ts                  # 기본 엔티티
│   │
│   ├── world/                         # 월드 시스템
│   │   ├── TileMapManager.ts          # Tiled JSON 파싱/렌더
│   │   ├── ChapterManager.ts          # 챕터 전환 관리
│   │   ├── CollisionSystem.ts         # 충돌 처리
│   │   ├── EnvironmentFX.ts           # 환경 이펙트 (비, 안개, 빛)
│   │   └── Camera.ts                  # 픽셀 퍼펙트 카메라
│   │
│   ├── narrative/                     # 내러티브 시스템
│   │   ├── InkService.ts              # inkjs 래퍼
│   │   ├── DialogueManager.ts         # 대화 흐름 관리
│   │   ├── ChoiceSystem.ts            # 선택지 → 스탯 반영
│   │   ├── QuestSystem.ts             # 퀘스트/진행 관리
│   │   └── data/
│   │       ├── characters.ts          # 캐릭터 데이터
│   │       └── quests.ts              # 퀘스트 데이터
│   │
│   ├── combat/                        # 전투 시스템
│   │   ├── QTEEngine.ts               # QTE 엔진 (Mash/Timing/Dodge/Dialogue)
│   │   ├── BattleManager.ts           # 전투 흐름 관리
│   │   └── PuzzleEngine.ts            # 퍼즐 챌린지
│   │
│   ├── ui/                            # UI (DOM 오버레이 + Phaser UI)
│   │   ├── UIManager.ts               # UI 레이어 총괄
│   │   ├── DialogueBox.ts             # 대화 박스 (타이핑 이펙트)
│   │   ├── ChoicePanel.ts             # 선택지 패널
│   │   ├── HUD.ts                     # 스탯 바, 짐 게이지
│   │   ├── MainMenu.ts                # 메인 메뉴
│   │   ├── PauseMenu.ts               # 일시 정지
│   │   ├── SettingsPanel.ts           # 설정 (볼륨, 텍스트 속도, 언어)
│   │   ├── CollectionUI.ts            # 성경 카드/도감 뷰어
│   │   ├── MapUI.ts                   # 월드맵 (진행도 표시)
│   │   ├── MobileControls.ts          # 가상 조이스틱 + 버튼
│   │   ├── TransitionOverlay.ts       # 장면 전환 이펙트
│   │   └── Toast.ts                   # 알림 토스트
│   │
│   ├── audio/                         # 오디오
│   │   └── AudioManager.ts            # BGM/SFX/앰비언트 (Howler)
│   │
│   ├── fx/                            # 게임 필 & 이펙트
│   │   ├── ScreenShake.ts             # 화면 흔들림
│   │   ├── Hitstop.ts                 # 히트스탑
│   │   ├── ParticleManager.ts         # 파티클 (빛, 먼지, 불꽃)
│   │   └── ScreenEffects.ts           # 페이드/플래시/비네트
│   │
│   ├── save/                          # 저장
│   │   ├── SaveManager.ts             # 세이브/로드 (IndexedDB)
│   │   ├── SaveData.ts                # 세이브 데이터 구조 (타입)
│   │   └── AutoSave.ts                # 자동 저장 (챕터 전환 시)
│   │
│   ├── i18n/                          # 로컬라이제이션
│   │   ├── I18n.ts                    # i18n 매니저
│   │   ├── ko.json                    # 한국어 UI 텍스트
│   │   └── en.json                    # 영어 UI 텍스트
│   │
│   ├── input/                         # 입력
│   │   └── InputManager.ts            # 키보드/터치/게임패드 통합
│   │
│   └── utils/                         # 유틸
│       ├── PixelSnap.ts               # 픽셀 스냅 헬퍼
│       ├── Easing.ts                  # 이징 함수
│       ├── Pool.ts                    # 오브젝트 풀링
│       └── Debug.ts                   # 디버그 오버레이
│
├── tests/                             # Vitest 테스트
│   ├── core/
│   ├── narrative/
│   └── combat/
│
└── .github/
    └── workflows/
        └── deploy.yml                 # CI/CD

────────────────────────────────────────
9. Vertical Slice (즉시 구현)
────────────────────────────────────────

Phase 0과 Phase 1을 한 번에 실행하여,
`pnpm dev`로 즉시 플레이 가능한 데모를 만들어주세요.

9.1 코어 인프라
  □ Vite + TypeScript + Phaser 3 프로젝트 초기화 (pnpm)
  □ ESLint flat config + Prettier 설정
  □ EventBus (제네릭, 타입 안전)
  □ StateMachine (제네릭 FSM)
  □ ServiceLocator (DI 컨테이너)
  □ GameManager (게임 상태 FSM: Boot → Menu → Game → Pause → Battle)

9.2 렌더링 & 카메라
  □ Phaser config: 내부 해상도 320×180, 픽셀 퍼펙트 (roundPixels, antialias off)
  □ 정수 배율 자동 스케일링 (FIT mode, pixelArt: true)
  □ 카메라: 플레이어 추적, 데드존, 맵 바운드 클램핑
  □ 스크린셰이크, 줌 이펙트

9.3 플레이어
  □ 16×16 스프라이트 (4방향 idle/walk 애니메이션)
  □ 부드러운 이동 (가속/감속 곡선, 코요테 타임 120ms)
  □ 짐 스프라이트 (Burden > 0일 때 등에 표시, 이동 속도 저하)
  □ 플레이어 FSM (Idle, Walk, Interact, Cutscene)

9.4 월드
  □ Tiled JSON 호환 타일맵 로더 (또는 코드 생성 테스트 맵)
  □ "멸망의 도시" 테스트 맵: 집, NPC 3명, 도시 문, 숨겨진 성경 카드
  □ 충돌 레이어 (벽, 물, 이벤트 트리거)
  □ 챕터 전환 포탈

9.5 NPC & 상호작용
  □ NPC 엔티티 (idle 애니메이션, 느낌표 프롬프트)
  □ 상호작용 거리 감지 → 프롬프트 표시
  □ 상호작용 시 대화 시작 (inkjs 연동)
  □ 최소 3명 NPC: 전도자, 완고, 유연 (각각 고유 대화)

9.6 대화 시스템
  □ inkjs 초기화 + .ink.json 로드
  □ 대화 박스 UI (타이핑 이펙트, 캐릭터 이름, 초상화 영역)
  □ 선택지 표시 → 클릭/키보드 선택
  □ 선택 결과 → 스탯 변화 즉시 반영 + 토스트 알림
  □ 간단한 테스트 Ink 스토리 (전도자와의 첫 대화, 3개 선택지)

9.7 HUD
  □ 스탯 바 3개 (믿음/용기/지혜) — 픽셀 스타일
  □ 짐 게이지 — 등에 진 짐의 무게
  □ 상호작용 프롬프트 (E키 / 탭)
  □ 장소명 표시 (챕터 진입 시 페이드 인/아웃)

9.8 메뉴 & 온보딩
  □ 언어 선택 화면 (한국어 / English)
  □ 메인 메뉴 (새 게임 / 이어하기 / 설정)
  □ 설정 패널 (볼륨, 텍스트 속도, 언어 변경)
  □ 닉네임 입력 (순례자 이름 짓기)
  □ 프롤로그 시퀀스 ("나는 꿈을 꾸었노라..." 텍스트 연출)

9.9 저장/불러오기
  □ SaveData 타입 정의 (챕터, 위치, 스탯, 수집품, 설정)
  □ IndexedDB 기반 저장 (localforage)
  □ 자동 저장 (챕터 전환 시)
  □ 이어하기 → 마지막 저장 복원

9.10 입력
  □ 키보드 (WASD/방향키, E/Space 상호작용, Esc 메뉴)
  □ 터치 가상 조이스틱 + 상호작용 버튼 (모바일)
  □ 게임패드 지원 (Gamepad API)
  □ 디바이스 자동 감지 → 컨트롤 스킴 전환

9.11 오디오
  □ AudioManager (Howler.js)
  □ BGM 1곡 (메뉴), BGM 1곡 (Ch1 멸망의 도시)
  □ SFX: 발걸음, UI 클릭, 대화 타이핑 효과음, 상호작용
  □ 볼륨 컨트롤 (마스터/BGM/SFX 분리)

9.12 이펙트 & 게임 필
  □ 장면 전환 페이드 인/아웃
  □ 대화 시 약간의 화면 디밍
  □ 스탯 변화 시 수치 팝업 (+5 Faith!)
  □ 파티클: 먼지, 빛 입자 (선택적)

9.13 i18n
  □ ko.json / en.json (UI 텍스트 전체)
  □ I18n 매니저 (키 기반 조회, 폴백)
  □ 한국어: Noto Sans KR 또는 DungGeunMo (픽셀 폰트)
  □ 폰트 깨짐 없이 렌더링 확인

9.14 반응형 & 모바일
  □ 모바일/데스크탑 자동 감지
  □ 터치 시 가상 조이스틱 자동 표시
  □ 세이프 에리어 대응 (노치)
  □ 가로/세로 모드 대응 (가로 권장 + 세로 경고)

────────────────────────────────────────
10. 품질 기준
────────────────────────────────────────

  • `pnpm dev`로 3초 내 브라우저에서 실행
  • TypeScript strict mode, any 사용 금지
  • 60fps 유지 (모바일 저사양 포함)
  • Chrome / Safari / Firefox 호환
  • Lighthouse PWA 점수 90+
  • 한국어 폰트 완벽 렌더링
  • 저사양 모바일에서도 플레이 가능 (에셋 경량화)
  • 코드 컨벤션: 파일당 하나의 export, 명확한 네이밍

────────────────────────────────────────
11. 작업 방식
────────────────────────────────────────

  1. 먼저 docs/game-design-unity/game-design-document.md와
     docs/game-design-unity/mvp-specification.md를 읽고
     게임 시스템 전체를 이해하세요.
  2. docs/story-data/index-and-glossary.md에서 캐릭터 한영 명명 규칙을 확인하세요.
  3. web/ 폴더에 프로젝트를 초기화하세요.
  4. 섹션 9의 체크리스트를 순서대로 구현하세요.
  5. 각 시스템 구현 후 반드시 컴파일 확인하세요.
  6. 최종적으로 pnpm dev로 실행하여 플레이 가능 상태를 확인하세요.
  7. 기존 스프라이트(16×16)가 없으면, 플레이스홀더로 컬러 사각형을 사용하되
     실제 스프라이트 교체가 쉽도록 에셋 로딩을 추상화하세요.
```

---

## 사용법

1. 새 Cursor 채팅 세션 열기
2. 위 프롬프트 코드블록 내용 전체를 복사-붙여넣기
3. 실행하면 `web/` 폴더에 프로젝트가 생성됨
4. `cd web && pnpm install && pnpm dev`로 즉시 확인
