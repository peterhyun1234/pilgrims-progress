# 캐릭터 애니메이션 & 표현 설계서

> 천로역정: 순례자의 여정 — Web Reboot  
> 버전: 1.0 | 최종 수정: 2026-03-19

---

## 1. 설계 원칙

1. **16px에도 감정이 담긴다** — Undertale, Eastward처럼 제한된 해상도에서도 캐릭터의 감정과 성격이 전달되어야 한다
2. **동작이 서사를 전한다** — 캐릭터의 걸음걸이, 자세, 반응 하나하나가 이야기의 일부
3. **Burden은 시각적으로 느껴져야 한다** — 짐의 무게가 플레이어 경험에 물리적으로 체감
4. **NPC는 살아있어야 한다** — 가만히 서 있는 NPC는 없다. 각자의 성격이 idle 동작에 드러남
5. **이펙트는 피드백이다** — 모든 시각 이펙트는 게임 메카닉이나 서사적 변화의 즉각적 피드백

참조: Eastward(16px 풍부한 표현), Undertale(전투 스프라이트+이모트), Celeste(스쿼시&스트레치), Omori(감정 상태 시스템)

---

## 2. 스프라이트 시트 사양

### 2.1 기본 캐릭터 (16x16)

#### 프레임 구성

| 애니메이션 | 방향 | 프레임 수 | FPS | 총 프레임 | 비고 |
|-----------|------|----------|-----|----------|------|
| Idle | 4 (상하좌우) | 2 | 2 | 8 | 미세한 숨쉬기 동작 |
| Walk | 4 | 4 | 8 | 16 | 발 움직임 + 팔 스윙 |
| Run | 4 | 4 | 12 | 16 | Walk보다 큰 보폭 |
| Interact | 4 | 2 | 4 | 8 | 손 내밀기 / 고개 끄덕임 |
| Pickup | 1 (정면) | 3 | 6 | 3 | 숙임 → 줍기 → 들어올림 |
| Push | 4 | 3 | 6 | 12 | 무거운 물체 밀기 |
| Hurt | 1 (정면) | 2 | 4 | 2 | 뒤로 밀림 + 깜빡임 |
| Fall | 1 | 3 | 6 | 3 | 늪/구덩이에 빠짐 |
| Pray | 1 (정면) | 2 | 1 | 2 | 무릎 꿇고 기도 |
| Celebrate | 1 (정면) | 4 | 6 | 4 | 점프 + 팔 올림 |

**총 프레임 (기본 캐릭터):** 74프레임

#### 스프라이트 시트 레이아웃

```
Row 0:  idle_down(2f)   idle_up(2f)   idle_left(2f)   idle_right(2f)
Row 1:  walk_down(4f)   walk_up(4f)   walk_left(4f)   walk_right(4f)
Row 2:  run_down(4f)    run_up(4f)    run_left(4f)    run_right(4f)
Row 3:  interact_down(2f) interact_up(2f) interact_left(2f) interact_right(2f)
Row 4:  pickup(3f)  push_down(3f) push_up(3f) push_left(3f) push_right(3f)
Row 5:  hurt(2f)  fall(3f)  pray(2f)  celebrate(4f)
```

시트 크기: **256x96** (16열 x 6행)

### 2.2 전투 캐릭터 (크리스천 전용)

Ch8 아볼론 전투 및 향후 전투 장면용 확장 시트.

| 애니메이션 | 프레임 수 | FPS | 비고 |
|-----------|----------|-----|------|
| Battle Idle | 2 | 3 | 검을 든 대기 자세 |
| Attack (slash) | 4 | 12 | 검 휘두르기 |
| Block (shield) | 2 | — | 방패 들기 (hold) |
| Dodge | 3 | 10 | 옆으로 구르기 |
| Skill (scripture) | 4 | 8 | 두루마리 펼치기 → 빛 발사 |
| Battle Hurt | 2 | 4 | 전투 중 피격 |
| Victory | 4 | 4 | 검 들어올림 + 빛 |
| Defeat | 3 | 3 | 무릎 꿇음 → 쓰러짐 |

**전투 시트:** 160x32 (10열 x 2행, 16x16 프레임)

### 2.3 보스/특수 캐릭터 (32x32)

대형 캐릭터는 32x32 스프라이트 사용.

| 캐릭터 | 애니메이션 | 프레임 수 |
|--------|-----------|----------|
| Apollyon (아볼론) | Idle(4f), Fly(4f), Attack_claw(4f), Attack_fire(4f), Roar(3f), Hurt(2f), Defeat(4f) | 25 |
| Giant Despair (거인 절망) | Idle(2f), Walk(4f), Slam(4f), Grab(3f), Hurt(2f) | 15 |
| Shining Ones (빛나는 자들) | Float(4f), Bless(4f), Ascend(4f) | 12 |

**보스 시트 크기:** 각 256x64 (8열 x 2행, 32x32 프레임)

### 2.4 NPC 기본 + 고유 동작

모든 NPC는 **기본 8프레임** (idle_4방향 x 2f)에 추가로 **고유 동작**을 가짐.

| NPC | 고유 동작 | 프레임 수 | 설명 |
|-----|----------|----------|------|
| Evangelist (전도자) | point(2f), scroll_hold(2f) | 4 | 방향 가리키기, 두루마리 펼침 |
| Obstinate (완고) | cross_arms(2f), turn_away(2f) | 4 | 팔짱, 돌아섬 |
| Pliable (유연) | excited(2f), scared(2f), flee(3f) | 7 | 흥분, 겁먹음, 도망 |
| Help (도움) | reach_hand(3f), pull(3f) | 6 | 손 내밀기, 끌어올리기 |
| Mr. Worldly Wiseman | gesture(3f), point_away(2f) | 5 | 유혹적 제스처, 다른 길 가리킴 |
| Good-will (선의) | open_door(4f), welcome(2f) | 6 | 문 열기, 환영 제스처 |
| Interpreter (해석자) | show(3f), teach(2f) | 5 | 방 보여주기, 가르치기 |
| Faithful (신실) | walk_together(4f), pray(2f), martyr(4f) | 10 | 동행, 기도, 순교 |
| Apollyon (아볼론) | 32x32 보스 시트 참조 | — | — |
| Hopeful (소망) | wave(2f), support(3f) | 5 | 인사, 지지 |
| Giant Despair | 32x32 보스 시트 참조 | — | — |

---

## 3. 이모트 버블 시스템

### 3.1 개요

캐릭터 머리 위에 표시되는 8x8 감정 아이콘. 대화 없이도 캐릭터의 감정 상태를 전달.

### 3.2 이모트 목록

| 이모트 | 아이콘 | 트리거 | 지속 시간 |
|--------|--------|--------|----------|
| Surprise | ! (느낌표) | NPC가 플레이어 발견, 충격적 대화 | 1.5초 |
| Question | ? (물음표) | 혼란, 조사 대상 | 2.0초 |
| Thinking | ... (말줄임) | 고민, 대기 | 상시 (NPC idle) |
| Joy | ♥ (하트/별) | 기쁨, 감동 | 2.0초 |
| Anger | 💢 (번개) | 분노, 적대 | 2.0초 |
| Sadness | 💧 (눈물) | 슬픔, 후회 | 2.5초 |
| Fear | !! (이중 느낌표) | 공포, 경고 | 1.5초 |
| Love | ♡ (빈 하트) | 우정, 감사 | 2.0초 |
| Frustration | 💫 (소용돌이) | 좌절, 혼란 | 2.0초 |
| Sleep | Zzz | 잠, 게으름 (나태 NPC) | 상시 |
| Shine | ✦ (빛) | 깨달음, 은혜 | 2.0초 |
| Cross | ✝ (십자가) | 신앙적 결단 | 2.0초 |

### 3.3 이모트 애니메이션

| 효과 | 설명 |
|------|------|
| Pop | 아래에서 올라오며 등장 (0.2초, easeOutBack) |
| Bounce | 등장 후 위아래로 2회 바운스 |
| Float | 위로 떠오르며 사라짐 (종료 시) |
| Shake | 좌우 흔들림 (분노, 공포) |
| Pulse | 크기 커졌다 작아짐 (기쁨, 빛) |

### 3.4 Ink 태그 연동

```ink
전도자가 두루마리를 펼치며 말했다.
# EMOTE: evangelist surprise
# ANIM: evangelist scroll_hold

"이 길을 따라가라."
# EMOTE: christian thinking
```

---

## 4. 포트레이트 시스템 (Portrait System)

### 4.1 개요

대화 박스에 표시되는 고해상도(상대적) 캐릭터 얼굴. 감정에 따라 동적으로 전환.

### 4.2 포트레이트 사양

| 속성 | 값 |
|------|-----|
| 원본 크기 | 32x32 |
| 표시 크기 | 64x64 (2x 확대, nearest-neighbor) |
| 감정 종류 | 캐릭터당 5–8종 |
| 포맷 | 단일 시트 또는 개별 파일 |

### 4.3 캐릭터별 감정 포트레이트

#### 크리스천 (Christian) — 8종

| 감정 | 표정 설명 | Ink 태그 |
|------|----------|---------|
| neutral | 기본 표정, 약간의 걱정 | `# EMOTION: neutral` |
| worried | 눈썹 내림, 입 꾹 다뭄 | `# EMOTION: worried` |
| determined | 눈빛 강해짐, 턱 올림 | `# EMOTION: determined` |
| scared | 눈 크게 뜸, 땀방울 | `# EMOTION: scared` |
| joyful | 눈 감기며 미소 | `# EMOTION: joyful` |
| crying | 눈물, 입 벌림 | `# EMOTION: crying` |
| angry | 눈썹 치켜올림, 이 악뭄 | `# EMOTION: angry` |
| relieved | 눈 감기며 안도의 한숨 | `# EMOTION: relieved` |

#### 전도자 (Evangelist) — 6종

| 감정 | 표정 설명 |
|------|----------|
| neutral | 온화한 미소 |
| serious | 엄숙한 표정, 눈빛 강렬 |
| compassionate | 눈가에 자비, 약간의 슬픔 |
| warning | 눈썹 올림, 손가락 들기 |
| encouraging | 밝은 미소, 고개 끄덕임 |
| sorrowful | 깊은 슬픔, 고개 숙임 |

#### 완고 (Obstinate) — 5종

| 감정 | 표정 설명 |
|------|----------|
| neutral | 불만스러운 기본 표정 |
| mocking | 비웃음, 코웃음 |
| angry | 분노, 눈 부릅뜸 |
| dismissive | 무시, 고개 돌림 |
| shouting | 외침, 입 크게 벌림 |

#### 유연 (Pliable) — 6종

| 감정 | 표정 설명 |
|------|----------|
| neutral | 호기심 어린 표정 |
| excited | 눈 반짝, 입 벌림 |
| interested | 약간 앞으로 기울임 |
| scared | 겁먹은 표정, 떨림 |
| angry | 실망과 분노 섞인 표정 |
| fleeing | 등을 보이며 도망 |

#### 기타 NPC — 기본 5종

모든 NPC는 최소 neutral, happy, sad, angry, surprised 5종을 가짐.

### 4.4 포트레이트 전환 연출

| 전환 유형 | 효과 | 지속 시간 |
|----------|------|----------|
| 기본 전환 | Crossfade | 0.15초 |
| 감정 급변 | 화면 미세 흔들림 + 즉시 전환 | 0.05초 |
| 등장 | 좌/우에서 슬라이드 인 | 0.2초 |
| 퇴장 | 좌/우로 슬라이드 아웃 | 0.2초 |
| 놀람 | 포트레이트 약간 확대 → 원래 크기 | 0.3초 |

---

## 5. Burden 비주얼 시스템

### 5.1 등짐 스프라이트 단계

크리스천의 등에 겹쳐 그려지는 오버레이 스프라이트.

| Burden 범위 | 짐 크기 | 스프라이트 | 추가 효과 |
|------------|--------|-----------|----------|
| 81–100 | 거대 | `burden_huge.png` (10x12) | 걸을 때 짐 흔들림, 땀 파티클, 숨소리 SFX |
| 61–80 | 큰 | `burden_large.png` (8x10) | 약간 구부러진 자세, 걸을 때 짐 약간 흔들림 |
| 31–60 | 중간 | `burden_medium.png` (6x8) | 기본 자세, 미세한 흔들림 |
| 1–30 | 작은 | `burden_small.png` (4x5) | 거의 표시만 |
| 0 | 없음 | — | 밝은 옷 스프라이트 전환, 빛 오라 파티클 |

### 5.2 Burden 변화 애니메이션

#### 증가 시 (잘못된 선택)

```
1. 크리스천 무릎 약간 구부림 (0.3초)
2. 짐 스프라이트 크기 단계 전환 (0.5초, easeInOut)
3. "쿵" 효과음 + 먼지 파티클
4. 크리스천 다시 일어남 (0.3초)
```

#### 감소 시 (올바른 선택)

```
1. 짐에서 미세한 빛 파티클 (0.3초)
2. 짐 스프라이트 크기 단계 전환 (0.5초, easeOutBack)
3. 크리스천 자세 약간 펴짐
4. 가벼운 "휴" 효과음
```

#### 해방 시 (Ch6 십자가 — 특별 시퀀스)

```
1. 크리스천 십자가 앞에서 멈춤
2. 카메라 줌인 (1.5초)
3. 짐이 등에서 천천히 미끄러짐 (1.0초, 슬로모션)
4. 짐이 무덤 입구로 굴러감 (1.5초)
5. "쿵!" — 짐 사라짐 + 먼지 폭발 파티클
6. 0.5초 정적
7. 크리스천 스프라이트 → christian_free 스왑 (밝은 옷)
8. 빛 파티클 폭발 (360도, 2초간)
9. 크리스천 celebrate 애니메이션 (3회 점프)
10. BGM 전환 → 빛의 테마
11. 카메라 줌아웃 (1.5초)
```

### 5.3 보행 애니메이션 Burden 영향

| Burden 범위 | Walk FPS | Run 가능 | 보행 스타일 |
|------------|---------|---------|-----------|
| 81–100 | 4 (느림) | 불가 | 무거운 발걸음, 프레임 간 간격 김 |
| 61–80 | 6 | 불가 | 약간 느린 발걸음 |
| 31–60 | 8 (표준) | 가능 (느림) | 표준 보행 |
| 1–30 | 8 | 가능 | 표준 보행 |
| 0 | 10 (빠름) | 가능 (빠름) | 경쾌한 보행, 약간의 바운스 |

---

## 6. 이펙트 스프라이트 시스템

### 6.1 전투 이펙트 (16x16 또는 32x32)

| 이펙트 | 크기 | 프레임 수 | FPS | 용도 |
|--------|------|----------|-----|------|
| Slash | 32x32 | 4 | 15 | 검 휘두르기 |
| Shield Flash | 16x16 | 3 | 10 | 방어 성공 |
| Scripture Light | 32x32 | 6 | 10 | 성경 구절 스킬 |
| Heal Glow | 16x16 | 4 | 8 | 회복 |
| Fire Breath | 48x16 | 6 | 12 | 아볼론 화염 |
| Claw Mark | 24x24 | 3 | 15 | 아볼론 할퀴기 |
| Arrow Rain | 32x48 | 4 | 10 | 아볼론 화살 비 |
| Holy Barrier | 32x32 | 4 | 6 | 전원의 갑옷 |

### 6.2 환경 이펙트

| 이펙트 | 구현 방식 | 용도 |
|--------|----------|------|
| Dust (먼지) | 파티클 시스템, 2x2 px | 걸을 때, 착지, 충돌 |
| Water Splash (물보라) | 파티클 시스템, 2x3 px | 늪, 요단강 |
| Light Particles (빛 입자) | 파티클 시스템, 1x1~2x2 px | 십자가, 빛나는 자들, 천성 |
| Fire (불꽃) | 스프라이트 8x16, 4f | 시내산, 해석자 R4 |
| Smoke (연기) | 파티클 시스템, 3x3 px | 시내산, 전투 |
| Rain (비) | 파티클 시스템, 1x4 px | 야외 악천후 |
| Snow (눈) | 파티클 시스템, 1x1~2x2 px | 겨울 장면 |
| Fog (안개) | 반투명 오버레이 레이어 | 사망의 골짜기, 마법의 땅 |
| Swamp Bubble (늪 거품) | 스프라이트 4x4, 3f | 절망의 늪 |
| Darkness Vignette | 화면 가장자리 검은 오버레이 | 어둠의 장소 |

### 6.3 UI 이펙트

| 이펙트 | 구현 | 트리거 |
|--------|------|--------|
| Stat Popup | 텍스트 + 아이콘, 위로 떠오르며 사라짐 | 스탯 변화 |
| Card Collect | 카드 이미지 → 회전 → 컬렉션으로 흡수 | 성경 카드 획득 |
| Level Up Glow | 캐릭터 주변 원형 빛 확산 | 주요 임계값 도달 |
| Save Icon | 화면 우하단 빙글빙글 아이콘 | 자동 저장 |
| Chapter Title | 중앙 텍스트, 페이드인 → 홀드 → 페이드아웃 | 챕터 전환 |
| Toast | 상단 슬라이드인, 홀드, 슬라이드아웃 | 알림 |

### 6.4 파티클 사양 상세

| 파티클 | 크기 | 색상 | 속도 | 수명 | 중력 | 최대 수 |
|--------|------|------|------|------|------|--------|
| Dust | 1-2px | `#C8956C` 변형 | 10-20 px/s | 0.3-0.6s | -5 | 10 |
| Light | 1-2px | `#FFD700`, `#FFFACD` | 5-15 px/s | 1.0-2.0s | -10 | 30 |
| Water | 1-3px | `#4A90D9`, `#7BC8F6` | 20-40 px/s | 0.5-1.0s | 30 | 20 |
| Fire Spark | 1px | `#FF6B35`, `#FFD700` | 30-50 px/s | 0.2-0.4s | -20 | 15 |
| Sweat | 2px | `#7BC8F6` | 10 px/s | 0.5s | 20 | 3 |
| Holy Light | 1-3px | `#FFD700`, `#FFFFFF` | 5-10 px/s | 2.0-3.0s | -15 | 50 |

---

## 7. 애니메이션 상태 머신

### 7.1 플레이어 (크리스천) FSM

```
                ┌─────────┐
         ┌──────│  Idle   │──────┐
         │      └────┬────┘      │
    [interact]       │        [hurt]
         │       [move]          │
         ▼           ▼          ▼
   ┌──────────┐ ┌────────┐ ┌────────┐
   │ Interact │ │  Walk  │ │  Hurt  │
   └────┬─────┘ └───┬────┘ └───┬────┘
        │            │          │
     [done]      [stop/run]  [recover]
        │            │          │
        ▼            ▼          ▼
   ┌──────────┐ ┌────────┐    Idle
   │  Idle    │ │  Run   │
   └──────────┘ └───┬────┘
                     │
                  [stop]
                     │
                     ▼
                   Idle

  ──── 특별 상태 ────
  
  [pray_trigger] → Pray → [done] → Idle
  [celebrate_trigger] → Celebrate → [done] → Idle
  [fall_trigger] → Fall → [rescue] → Idle
  [cutscene_enter] → Cutscene → [cutscene_exit] → Idle
  [battle_enter] → BattleIdle ↔ Attack / Block / Dodge / Skill / BattleHurt
  [battle_exit] → Victory / Defeat → Idle
```

### 7.2 NPC 기본 FSM

```
  ┌────────────┐
  │  Idle      │ ← 기본 상태 (고유 idle 포함)
  └─────┬──────┘
        │
   [player_near]
        │
        ▼
  ┌────────────┐
  │  Alert     │ ← 이모트 표시, 플레이어 쳐다보기
  └─────┬──────┘
        │
   [interact]
        │
        ▼
  ┌────────────┐
  │  Talk      │ ← 대화 애니메이션, 포트레이트 전환
  └─────┬──────┘
        │
   [dialogue_end]
        │
        ▼
  ┌────────────┐
  │  Custom    │ ← NPC별 고유 반응 (떠남, 동행 시작 등)
  └─────┬──────┘
        │
   [done]
        │
        ▼
     Idle
```

### 7.3 상태 전환 규칙

| 전환 | 조건 | 우선순위 |
|------|------|---------|
| Any → Cutscene | 컷씬 이벤트 발생 | 최고 |
| Any → Hurt | 피격 | 높음 |
| Walk/Run → Idle | 입력 없음 + 속도 0 | 보통 |
| Idle → Walk | 이동 입력 | 보통 |
| Walk → Run | 이동 입력 + B(달리기) 홀드 + Burden < 60 | 보통 |
| Idle → Interact | 상호작용 입력 + 대상 있음 | 보통 |
| Interact → Idle | 상호작용 완료 | 보통 |

---

## 8. 스쿼시 & 스트레치 (Game Feel)

### 8.1 적용 대상

16px 스프라이트에서 스쿼시&스트레치는 **전체 스프라이트 스케일**로 구현한다.

| 동작 | 스쿼시 (수평 확대, 수직 축소) | 스트레치 (수직 확대, 수평 축소) | 지속 시간 |
|------|------|------|------|
| 점프/셀레브레이트 시작 | scaleX 1.2, scaleY 0.8 | — | 0.1초 |
| 점프/셀레브레이트 정점 | — | scaleX 0.85, scaleY 1.15 | 0.1초 |
| 착지 | scaleX 1.15, scaleY 0.85 | — | 0.08초 |
| 피격 | scaleX 1.1, scaleY 0.9 | — | 0.05초 |
| 아이템 줍기 | scaleX 0.9, scaleY 1.1 | — | 0.1초 |
| 대화 시작 (NPC 반응) | scaleX 1.05, scaleY 0.95 | — | 0.08초 |

### 8.2 히트스탑 (Hitstop)

| 상황 | 정지 시간 | 효과 |
|------|----------|------|
| 일반 공격 적중 | 50ms | 미세 정지 + 화면 흔들림 (1px, 2회) |
| 강공격/스킬 적중 | 100ms | 정지 + 흰색 플래시(1f) + 화면 흔들림 (2px, 3회) |
| 보스 공격 피격 | 80ms | 정지 + 붉은 플래시(1f) + 화면 흔들림 (3px, 4회) |
| 십자가 짐 해방 | 300ms | 시간 정지 + 흰색 화면 + 무음 |

---

## 9. NPC 생동감 시스템

### 9.1 Idle 행동 패턴

NPC가 플레이어와 상호작용하지 않을 때도 살아있는 느낌을 주는 자동 행동.

| NPC | Idle 패턴 | 주기 |
|-----|----------|------|
| Evangelist | 두루마리 읽기 (2초) → 하늘 올려보기 (1초) → 기본 (3초) | 6초 루프 |
| Obstinate | 팔짱 (3초) → 발 구르기 (1초) → 주변 둘러보기 (2초) | 6초 루프 |
| Pliable | 좌우 두리번 (2초) → 기본 (2초) → 손 비비기 (1초) | 5초 루프 |
| Help | 기본 (3초) → 손 내밀기 제스처 (1초) → 기본 (2초) | 6초 루프 |
| Worldly Wiseman | 걷는 척 (2초) → 멈추기 → 손짓 (1초) → 기본 (3초) | 6초 루프 |
| Good-will | 문 앞 대기 (3초) → 문 두드리는 소리 확인 (1초) → 기본 (2초) | 6초 루프 |
| Interpreter | 책 읽기 (3초) → 생각 (2초) → 기본 (2초) | 7초 루프 |
| Shining Ones | 부유 (상하 1px 진동, 연속) + 빛 파티클 (연속) | 연속 |

### 9.2 플레이어 감지 반응

| 거리 | NPC 반응 |
|------|---------|
| 48px+ (먼 거리) | Idle 패턴 유지 |
| 24–48px (인지 거리) | 플레이어 방향으로 고개 돌림 (direction 전환) |
| 16–24px (상호작용 거리) | Idle 중단, 이모트 버블 (!) 표시, 플레이어 응시 |
| 상호작용 | 대화 애니메이션 전환 |

---

## 10. 구현 참고사항

### 10.1 스프라이트 시트 로딩

```typescript
interface CharacterSpriteConfig {
  key: string;
  path: string;
  frameWidth: number;   // 16 or 32
  frameHeight: number;  // 16 or 32
  animations: AnimationConfig[];
  portraits?: PortraitConfig;
  emotes?: string[];
  burdenOverlays?: string[];  // 크리스천 전용
}

interface AnimationConfig {
  key: string;          // e.g. "walk_down"
  startFrame: number;
  endFrame: number;
  frameRate: number;
  repeat: number;       // -1 for loop
}

interface PortraitConfig {
  path: string;
  frameWidth: 32;
  frameHeight: 32;
  emotions: Record<string, number>;  // emotion name → frame index
}
```

### 10.2 이모트 시스템

```typescript
interface EmoteConfig {
  type: string;           // 'surprise' | 'question' | etc.
  icon: string;           // sprite frame key
  duration: number;       // ms
  animation: 'pop' | 'bounce' | 'float' | 'shake' | 'pulse';
  offsetY: number;        // NPC 머리 위 오프셋 (px)
}
```

### 10.3 Ink 태그 규약 (애니메이션 관련)

```
# ANIM: christian pray          // 캐릭터 애니메이션 변경
# EMOTE: evangelist surprise    // 이모트 버블 표시
# EMOTION: christian scared     // 포트레이트 감정 변경
# BURDEN_VISUAL: decrease       // Burden 시각 효과
# PARTICLE: light 32 180 50     // 파티클 (타입, x, y, 개수)
# EFFECT: slash 64 90           // 전투 이펙트 (타입, x, y)
# SQUASH: christian 0.1         // 스쿼시 (대상, 지속시간)
# HITSTOP: 100                  // 히트스탑 (ms)
```

### 10.4 에셋 제작 가이드라인

| 항목 | 규칙 |
|------|------|
| 캐릭터 팔레트 | 캐릭터당 4–6색, 아웃라인 포함 |
| 아웃라인 | 1px 검은색 (또는 진한 색) 아웃라인 필수 |
| 하이라이트 | 캐릭터 머리/어깨에 1px 밝은 색 |
| 그림자 | 발 아래 2x1 px 반투명 타원 |
| 파일 포맷 | PNG (투명 배경), 4bit/8bit 색상 |
| 네이밍 | `{character}_{size}_{action}.png` (e.g. `christian_16_walk.png`) |
| 도구 | Aseprite 권장, 내보내기: PNG spritesheet + JSON atlas |
