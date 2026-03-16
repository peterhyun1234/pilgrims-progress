# Game Design Document: 천로역정 — 순례자의 여정

> **Project**: The Pilgrim's Progress (천로역정)
> **Genre**: Top-down 2D Exploration RPG + Narrative Adventure
> **Engine**: Unity 6 LTS (6000.3.x) + Ink Narrative System
> **Developer**: Solo Developer
> **Art Style**: Pixel Art (16x16 tiles, 16x16 characters)
> **Source**: John Bunyan, *The Pilgrim's Progress* Part 1 (1678)
> **Target Audience**: All ages 12+, Christians and non-Christians
> **Languages**: Korean / English (simultaneous)
> **Platforms**: itch.io (WebGL) → Mobile → Steam
> **Scope**: Part 1 Complete (12 chapters, ~3-5 hours)
> **Last Updated**: 2026-03-16

---

## Table of Contents

1. [Game Vision](#1-game-vision)
2. [Gameplay Overview](#2-gameplay-overview)
3. [Onboarding Flow](#3-onboarding-flow)
4. [World Design](#4-world-design)
5. [Narrative Design](#5-narrative-design)
6. [Character Design](#6-character-design)
7. [Systems Design](#7-systems-design)
8. [UI/UX Design](#8-uiux-design)
9. [Art & Audio](#9-art--audio)
10. [Technical Design](#10-technical-design)
11. [Development Roadmap](#11-development-roadmap)
12. [Monetization & Distribution](#12-monetization--distribution)

---

## 1. Game Vision

### 1.1 Elevator Pitch

> 천로역정의 주인공이 되어, 멸망의 도시에서 천상의 도시까지 순례하라.
> 등에 진 무거운 짐(죄)의 무게를 느끼며, NPC를 만나고 선택하고 전투하며,
> 십자가에서 짐이 떨어지는 그 순간의 카타르시스를 직접 경험하라.

### 1.2 Why This Game?

**제작 동기**: 존 번연의 천로역정은 성경 다음으로 가장 많이 읽힌 기독교 문학이다. 350년 전 감옥에서 쓰인 이 이야기는 인간의 죄, 구원, 시련, 인내, 동행이라는 보편적 주제를 담고 있다. 하지만 현대인에게 이 책은 접근하기 어렵다. 게임이라는 매체를 통해 이 이야기를 **직접 체험**하게 만드는 것이 목표다.

**핵심 질문**: "만약 당신이 크리스천의 입장에서 직접 걸어야 한다면, 어떤 선택을 할 것인가?"

### 1.3 Core Values

| Value | Description | Implementation |
|-------|-------------|----------------|
| **체험** | 읽는 것이 아니라 경험하는 것 | 탑다운 탐험, 캐릭터 직접 조작, 짐의 물리적 무게감 |
| **은혜** | 게임에서 실패해도 끝나지 않는다 | 게임 오버 없음, 잘못된 선택도 여정의 일부 |
| **재미** | 교훈적이면서도 게임으로서 재미있어야 한다 | QTE 전투, 퍼즐, 선택의 긴장감, 수집 요소 |
| **보편성** | 크리스천이 아니어도 감동받을 수 있어야 한다 | 알레고리를 게임 메카닉으로 자연스럽게 번역 |

### 1.4 What Players Should Feel

| Chapter Range | Target Emotion | How |
|---------------|---------------|-----|
| Ch1-2 (출발) | 긴박함, 결단 | 도시가 멸망한다는 사실, 가족의 만류, 혼자 떠나는 용기 |
| Ch3-4 (시련) | 좌절과 희망 | 낙심의 늪에 빠졌다가 구출, 잘못된 조언에 속았다가 돌아옴 |
| Ch5-6 (은혜) | 경이로움, 카타르시스 | 해석자의 가르침, **십자가에서 짐이 떨어지는 순간** |
| Ch7-9 (전투) | 긴장, 승리감 | 아볼론과의 전투, 사망의 골짜기 통과 |
| Ch10-11 (인내) | 분노, 슬픔, 다시 일어남 | Faithful의 순교, 의심의 성에서의 절망과 탈출 |
| Ch12 (완성) | 감동, 평안 | 요단강을 건너고 천성에 입성하는 최종 장면 |

### 1.5 Competitor Analysis

| Game | Similarity | Our Difference |
|------|-----------|----------------|
| Undertale | 선택이 결과에 영향, 도트 그래픽 | 실화 기반 알레고리, 전투보다 내러티브 중심 |
| To the Moon | 감동적 스토리, 탑다운 RPG | 인터랙티브 선택지, 스탯 시스템 |
| Celeste | 어려운 여정의 은유, 인디 | 플랫포머가 아닌 탐험 RPG, 성경적 알레고리 |
| The Bible Game | 성경 기반 | 퀴즈가 아닌 내러티브 RPG, 현대적 게임 디자인 |

---

## 2. Gameplay Overview

### 2.1 Core Game Loop

```
탐험 (맵 이동, 환경 관찰)
  → 만남 (NPC 발견, 대화 시작)
    → 선택 (대화 선택지, 스탯 영향)
      → 도전 (QTE 전투, 퍼즐, 인내 챌린지)
        → 성장 (스탯 변화, 아이템 획득, 성경 카드 수집)
          → 이동 (다음 장소로 진행)
```

플레이어는 크리스천을 직접 조작하여 맵을 탐험하고, NPC와 상호작용하며, 선택을 통해 스토리를 진행한다. 모든 선택은 3개 스탯(믿음/용기/지혜)에 영향을 미치며, 짐(Burden) 수치가 이동 속도와 챌린지 난이도에 물리적으로 반영된다.

### 2.2 Session Flow

**한 챕터의 전형적 흐름 (15-30분):**

1. 새 장소 도착 → 장소명 표시 + BGM 변경
2. 맵 탐험 → 환경 오브젝트, 숨겨진 아이템 발견
3. 핵심 NPC 만남 → 대화 + 선택지
4. 챕터 이벤트 → 전투, 퍼즐, 또는 연출 시퀀스
5. 챕터 완료 → 자동 저장 + 다음 장소로 이동

### 2.3 Win/Fail Conditions

**게임 오버는 없다.** 이것은 설계 철학이다.

- 잘못된 선택 → 스탯 감소 + 추가 시련 (하지만 진행은 가능)
- QTE 실패 → 부분적 성공으로 처리 (더 많은 피해를 받지만 계속)
- 유혹에 넘어감 → 나중에 교정 기회가 주어짐 (전도자가 돌아옴)

**엔딩은 하나**: 천성 도착. 하지만 최종 스탯에 따라 엔딩 연출이 달라진다.

| Ending Variant | Condition | Description |
|---------------|-----------|-------------|
| 영광의 입성 | 모든 스탯 80+ | 나팔소리와 함께 화려한 환영 |
| 겸손한 도착 | 평균 스탯 50-79 | 조용하지만 따뜻한 환영 |
| 간신히 구원 | 평균 스탯 30-49 | 고생 끝에 가까스로 도착, 은혜 강조 |

### 2.4 Play Time

| Scope | Estimated Time |
|-------|---------------|
| 데모 (Ch1-6, 십자가까지) | 1-2시간 |
| 풀 게임 (Ch1-12, 천성까지) | 3-5시간 |
| 컴플리트 (모든 수집품) | 5-7시간 |

### 2.5 Three Pillars of Fun

1. **탐험의 재미**: 각 챕터마다 새로운 환경, 숨겨진 성경 카드, 비밀 대화
2. **선택의 긴장감**: 모든 선택이 스탯에 영향 → 나중 챌린지 난이도에 반영
3. **수집의 보람**: 52장 성경 카드, 40+ 캐릭터 도감, 여정 일지 완성

---

## 3. Onboarding Flow

### 3.1 First-Time User Experience (FTUE)

```
앱 실행
  → [1] 언어 선택 (한국어 / English)
    → [2] 닉네임 입력 (순례자의 이름 짓기)
      → [3] 캐릭터 커스터마이즈 (피부/머리/의상)
        → [4] 프롤로그 시퀀스 (게임 세계관 + 목표 설명)
          → [5] 튜토리얼 (이동, 상호작용, 대화 조작법)
            → [6] 챕터 1 시작
```

**[1] 언어 선택**: 화면 중앙에 두 버튼. 선택 즉시 `PlayerPrefs`에 저장.

**[2] 닉네임 입력**: "순례자의 이름을 지어주세요" / "Name your pilgrim"
- 기본값: "크리스천" / "Christian"
- 1-12자, 한글/영문/숫자 허용
- 이 이름이 게임 내 모든 대화에서 사용됨

**[3] 캐릭터 커스터마이즈**: 피부톤, 머리 스타일, 머리 색, 의상 색 선택. 실시간 16x16 프리뷰.

**[4] 프롤로그 시퀀스** (가장 중요):

```
[페이드 인: 어두운 화면]

"나는 꿈을 꾸었노라..."
"이 세상의 광야에서, 한 사람이 누더기를 입고 서 있었으니"
"그의 등에는 무거운 짐이 지워져 있었고"
"그의 손에는 한 권의 책이 들려 있었다."

[짧은 정적]

"당신은 멸망의 도시에 살고 있습니다."
"이 도시는 곧 심판의 불로 멸망할 것입니다."
"등에 진 짐은 당신의 죄의 무게입니다."
"이 짐은 오직 한 곳에서만 벗을 수 있습니다."

[황금빛 글씨]
"천상의 도시를 향해 순례하십시오."
"좁은 문을 찾고, 십자가를 향해 걸으십시오."
"그곳에서 당신의 짐이 떨어질 것입니다."

[게임 목표 UI]
🎯 목표: 멸망의 도시에서 천상의 도시까지 순례하라
⚖️ 짐을 지고 걸으며 믿음, 용기, 지혜를 키워라
✝️ 십자가에서 짐을 벗고, 끝까지 인내하라
```

**[5] 튜토리얼**: 챕터 1 시작 직후 최소한의 안내
- "방향키/WASD로 이동" (첫 이동 시 표시)
- "느낌표(!) NPC에게 다가가서 상호작용" (첫 NPC 접근 시)
- "선택지를 골라 대화를 진행하세요" (첫 선택지 등장 시)

### 3.2 Returning User Flow

```
앱 실행 (저장 데이터 있음)
  → 메인 메뉴 표시
    → [이어하기] → 마지막 저장 지점에서 계속
    → [새 게임] → 경고 팝업 → 닉네임/커스터마이즈 → 프롤로그 → Ch1
    → [컬렉션] → 수집한 성경 카드/캐릭터 도감 열람
    → [설정] → 언어, 볼륨, 텍스트 속도 변경
```

### 3.3 Settings Persistence

모든 사용자 설정은 `PlayerPrefs`에 저장되어 앱 재시작 후에도 유지:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `pp_language` | string | "ko" | 선택한 언어 |
| `pp_player_name` | string | "Christian" | 플레이어 닉네임 |
| `pp_first_run_done` | int | 0 | 최초 실행 완료 여부 |
| `pp_master_volume` | float | 1.0 | 마스터 볼륨 |
| `pp_bgm_volume` | float | 0.7 | BGM 볼륨 |
| `pp_sfx_volume` | float | 0.8 | SFX 볼륨 |
| `pp_text_speed` | int | 1 | 텍스트 속도 (0=느림, 1=보통, 2=빠름) |
| `SaveSlot_Auto` | string | "" | 자동 저장 JSON |

---

## 4. World Design

### 4.1 World Structure

게임 월드는 **선형 진행** 구조다. 천로역정의 원작이 일직선 여정이므로, 플레이어는 챕터 순서대로 새로운 지역을 방문한다. 각 지역은 독립된 맵이다.

```
Ch1: 멸망의 도시 ──→ Ch2: 들판 & 낙심의 늪 ──→ Ch3: 세상지혜씨 & 시내산
  ──→ Ch4: 좁은 문 ──→ Ch5: 해석자의 집 ──→ Ch6: 십자가 언덕
    ──→ Ch7: 어려움의 언덕 & 아름다운 궁전 ──→ Ch8: 굴욕의 골짜기 (아볼론)
      ──→ Ch9: 사망의 음침한 골짜기 ──→ Ch10: 허영의 시장
        ──→ Ch11: 의심의 성 & 기쁨의 산 ──→ Ch12: 마법의 땅 → 요단강 → 천성
```

### 4.2 Map Design Principles

1. **맵당 하나의 테마**: 각 맵은 고유한 타일셋, BGM, 색감을 가짐
2. **선형이되 탐험 가능**: 메인 경로는 명확하지만, 옆길에 숨겨진 보상
3. **NPC 순차 배치**: 스토리 순서대로 NPC를 만나도록 맵 내 동선 설계
4. **포탈 기반 이동**: 챕터 완료 시 맵 끝의 포탈/문/길로 다음 챕터 진입

### 4.3 Chapter Maps Overview

| Ch | Map Name (KR) | Map Name (EN) | Tile Theme | Size | Key Features |
|----|--------------|---------------|------------|------|-------------|
| 1 | 멸망의 도시 | City of Destruction | 황량한 도시, 어두운 톤 | 40x30 | 크리스천의 집, 이웃 NPC들, 도시 문 |
| 2 | 들판과 낙심의 늪 | Fields & Slough of Despond | 들판→진흙 늪지 | 50x25 | 늪 지형(이동 저하), 도움의 바위 |
| 3 | 마을과 시내산 | Village & Mount Sinai | 아늑한 마을→위협적 산 | 35x30 | 세상지혜씨의 집, 불타는 산 연출 |
| 4 | 좁은 문 | The Wicket Gate | 좁은 길, 문, 성벽 | 25x20 | 화살 이펙트(브엘세불), 문 개폐 연출 |
| 5 | 해석자의 집 | Interpreter's House | 실내, 여러 방 | 30x25 | 7개 방(각각 비유 장면), 방 이동 구조 |
| 6 | 십자가 언덕 | Hill of the Cross | 언덕 지형, 십자가 | 30x30 | 경사 타일, 십자가 오브젝트, 빛 이펙트 |
| 7 | 어려움의 언덕 | Hill Difficulty & Palace Beautiful | 가파른 언덕→아름다운 성 | 40x35 | 분기 길(2개 잘못된 길), 사자, 궁전 |
| 8 | 굴욕의 골짜기 | Valley of Humiliation | 어둡고 좁은 골짜기 | 35x20 | 아볼론 보스전 아레나, 전투 지형 |
| 9 | 사망의 골짜기 | Valley of Shadow of Death | 극도로 어두움, 절벽 | 50x15 | 좁은 길, 양쪽 절벽, 안개, 불꽃 |
| 10 | 허영의 시장 | Vanity Fair | 화려한 시장, 인파 | 40x30 | 상점들, 감옥, 재판장, NPC 군중 |
| 11 | 의심의 성 & 기쁨의 산 | Doubting Castle & Delectable Mts | 어두운 성→밝은 산 | 35x35 | 감옥 퍼즐, 열쇠 아이템, 산 정상 전경 |
| 12 | 마법의 땅→천성 | Enchanted Ground→Celestial City | 몽환→찬란한 빛 | 45x30 | 졸음 게이지, 요단강, 천성 입성 연출 |

---

## 5. Narrative Design

### 5.1 Story Philosophy

천로역정은 **알레고리(비유)**다. 모든 장소, 인물, 사건은 영적 의미를 가진다. 게임은 이 알레고리를 **게임 메카닉으로 번역**한다.

| Allegory | Game Mechanic |
|----------|--------------|
| 짐(죄) | Burden 스탯 → 이동 속도 저하, 챌린지 난이도 증가 |
| 십자가의 은혜 | Ch6에서 Burden이 0으로 → 이동 속도 회복, 스프라이트 변경 |
| 전도자의 인도 | 잘못된 선택 후 전도자가 나타나 교정 → 게임 오버 방지 |
| 낙심의 늪 | 이동 속도 극감 지형 → Help NPC가 구출 |
| 아볼론 전투 | QTE 보스전 → 성경 구절을 무기로 사용 |
| 의심의 성 감금 | 퍼즐 챌린지 → "약속의 열쇠" 아이템으로 탈출 |

### 5.2 Chapter Summary (Full Part 1)

#### Chapter 1: 멸망의 도시 (City of Destruction)

- **요약**: 크리스천이 책(성경)을 읽고 죄를 자각, 가족의 만류를 뿌리치고 출발
- **NPCs**: 가족, 전도자(Evangelist), 완고(Obstinate), 유연(Pliable)
- **핵심 선택**: 빛을 보았는가? / 완고를 설득할 것인가? / 유연과 함께 갈 것인가?
- **스탯 영향**: 믿음 +5~15, 용기 +5~10
- **성경 카드**: 마태 3:7 ("임박한 진노를 피하라")
- **교훈**: 구원의 첫 걸음은 현실을 직시하고 떠나는 결단

#### Chapter 2: 낙심의 늪 (Slough of Despond)

- **요약**: 유연과 함께 늪에 빠지고, 유연은 떠나고, 도움(Help)이 구출
- **NPCs**: 유연(Pliable), 도움(Help)
- **핵심 선택**: 늪에서 어떻게 버틸 것인가? (믿음 vs 지혜 선택)
- **스탯 영향**: 믿음 +5~10, 용기 +5
- **Challenge**: 인내 챌린지 (늪 지형에서 버틴 방향키 입력)
- **교훈**: 구원의 길에서 좌절은 불가피, 하지만 도움의 손길이 있다

#### Chapter 3: 세상지혜씨 (Mr. Worldly Wiseman)

- **요약**: 세상지혜씨의 유혹에 빠져 시내산으로 가다가, 전도자에게 꾸짖음을 받고 돌아옴
- **NPCs**: 세상지혜씨(Worldly Wiseman), 전도자(Evangelist)
- **핵심 선택**: 세상지혜씨의 조언을 따를 것인가? (유혹 거부/수락)
- **스탯 영향**: 유혹 수락 시 믿음 -10, 회개 후 회복
- **성경 카드**: 갈 3:10 ("율법의 행위로는...")
- **교훈**: 쉬운 길(율법/도덕주의)은 진정한 구원이 아니다

#### Chapter 4: 좁은 문 (The Wicket Gate)

- **요약**: 좁은 문에 도착, 브엘세불의 화살을 피하며 문을 두드리고, 선의(Good-will)에게 환영받음
- **NPCs**: 선의(Good-will/Gatekeeper)
- **핵심 선택**: 짐에 대해 물을 것인가? / 감사로 응답할 것인가?
- **스탯 영향**: 믿음 +10, 짐 -5
- **성경 카드**: 요 6:37 ("내게 오는 자를 내가 결코 내쫓지 아니하리라")
- **교훈**: 구원의 문은 누구에게나 열려 있다

#### Chapter 5: 해석자의 집 (Interpreter's House)

- **요약**: 해석자가 7개 방에서 영적 진리를 시각적으로 보여줌
- **NPCs**: 해석자(Interpreter)
- **방들**: 목사의 초상화, 인내 vs 욕심, 꺼지지 않는 불, 철장 속의 사람, 심판의 꿈, 벽돌의 교훈, 정원사
- **핵심 선택**: 각 방에서 깊이 묵상할 것인가? (믿음/지혜 보너스)
- **교훈**: 진리를 이해하는 것은 순례의 준비

#### Chapter 6: 십자가 (The Cross) — **핵심 챕터**

- **요약**: 언덕을 올라 십자가에 도달, **짐이 등에서 떨어져 무덤 속으로 굴러감**, 세 빛나는 자가 나타나 용서/새 옷/두루마리를 줌
- **NPCs**: 세 빛나는 자(Three Shining Ones)
- **핵심 이벤트**: Burden → 0. 스프라이트에서 짐 제거. 이동 속도 복원.
- **성경 카드**: 요 3:16 ("하나님이 세상을 이처럼 사랑하사...")
- **연출**: 화면이 점차 밝아짐, 금빛 이펙트, BGM 클라이맥스
- **교훈**: 죄의 짐은 인간의 노력이 아닌 십자가의 은혜로 벗겨진다

#### Chapter 7: 어려움의 언덕 & 아름다운 궁전

- **요약**: 가파른 언덕을 올라가며 게으름과 두려움의 유혹을 이기고, 사자를 지나 아름다운 궁전에서 휴식
- **NPCs**: 신중(Prudence), 경건(Piety), 사랑(Charity), 파수꾼
- **핵심 선택**: 쉬운 길(멸망)을 택할 것인가? / 사자 앞에서 어떻게 할 것인가?
- **스탯 영향**: 용기 +10~15
- **교훈**: 올바른 길은 언제나 어렵지만, 끝에 안식이 있다

#### Chapter 8: 굴욕의 골짜기 — 아볼론 전투

- **요약**: 아볼론(사탄)이 크리스천을 유혹하고 공격, 성경의 검으로 대항하여 승리
- **NPCs**: 아볼론(Apollyon)
- **핵심 이벤트**: **QTE 보스전**
- **Challenge**: 4단계 QTE (Mash → Timing → ArrowDodge → DialogueBattle)
- **성경 카드**: 엡 6:17 ("성령의 검 곧 하나님의 말씀을 가지라")
- **교훈**: 영적 전투는 말씀으로 싸운다

#### Chapter 9: 사망의 음침한 골짜기

- **요약**: 극도로 어두운 골짜기를 혼자 지나감. 양쪽은 절벽과 늪. 악마의 속삭임.
- **NPCs**: (없음 — 혼자 걸어야 하는 구간)
- **핵심 이벤트**: **인내 챌린지** (어둠 속 좁은 길 통과)
- **스탯 영향**: 용기 +15, 믿음 +10
- **연출**: 화면 극도로 어둡게, 소리만으로 길 찾기
- **교훈**: 가장 어두운 시간도 지나간다

#### Chapter 10: 허영의 시장 (Vanity Fair)

- **요약**: 세속적 유혹이 가득한 시장. 신실(Faithful)이 순교. 소망(Hopeful)이 새 동행자로 합류.
- **NPCs**: 신실(Faithful), 소망(Hopeful), 시장 상인들, 재판관
- **핵심 이벤트**: **대화 전투** (재판에서 변론), Faithful 순교 연출
- **핵심 선택**: 시장의 유혹에 어떻게 대응할 것인가?
- **성경 카드**: 딤전 6:10 ("돈을 사랑함이 일만 악의 뿌리")
- **교훈**: 세상의 유혹을 거부하는 대가, 그리고 동행자의 중요성

#### Chapter 11: 의심의 성 & 기쁨의 산

- **요약**: 샛길로 빠져 거인 절망에게 잡히고, 약속의 열쇠로 탈출, 기쁨의 산에서 목자들에게 배움
- **NPCs**: 거인 절망(Giant Despair), 소심부인, 목자 4인(지식, 경험, 파수, 진실)
- **핵심 이벤트**: **퍼즐 챌린지** (감옥 탈출)
- **핵심 선택**: 절망 속에서 자살 유혹 거부 / 약속의 열쇠 발견
- **성경 카드**: 히 13:5 ("내가 결코 너를 버리지 아니하리라")
- **교훈**: 의심과 절망은 하나님의 약속을 기억하면 극복된다

#### Chapter 12: 마법의 땅 → 요단강 → 천성

- **요약**: 졸음의 유혹(마법의 땅), 무지와의 논쟁, 요단강(죽음)을 건너, 천상의 도시에 입성
- **NPCs**: 무지(Ignorance), 소망(Hopeful), 빛나는 자들, 나팔 부는 자들
- **핵심 이벤트**: **인내 챌린지** (마법의 땅), **최종 이벤트** (천성 입성 CG)
- **핵심 선택**: 요단강에서 두려움을 이길 것인가?
- **성경 카드**: 계 21:4 ("모든 눈물을 그 눈에서 닦아 주시리니"), 사 43:2
- **연출**: 최종 CG, 풀 오케스트라 BGM, 빛의 폭발
- **교훈**: 죽음도 건너고 영원한 안식에 이르는 것이 순례의 완성

### 5.3 Choice Design Philosophy

1. **정답은 없되, 더 나은 선택이 있다**: 모든 선택지는 의미가 있음
2. **즉시 피드백**: 선택 직후 스탯 변화 표시
3. **장기적 결과**: 초반 선택이 후반 챌린지 난이도에 영향
4. **은혜의 장치**: 최악의 선택도 전도자가 교정 기회를 줌

### 5.4 Bible Verse Integration

성경 구절은 **자연스럽게** 게임에 노출된다:
- NPC 대화 속에 인용 (강제 암기가 아닌 맥락 속 등장)
- "성경 카드" 수집 시스템 (52장 — 포켓몬 카드처럼)
- 카드에는 구절 + 맥락 설명 + 아트워크
- 한국어: 새번역(쉬운 번역) / English: NIV

---

## 6. Character Design

### 6.1 Player Character

- **기본 이름**: 크리스천 / Christian (플레이어가 변경 가능)
- **커스터마이즈**: 피부톤(6), 머리 스타일(5), 머리 색(6), 의상 색(5)
- **스프라이트**: 16x16, 4방향 이동 애니메이션
- **짐 스프라이트**: Ch6까지 등에 짐을 짊어진 모습, Ch6 이후 짐 없이 밝은 옷
- **성장**: 스탯(믿음/용기/지혜)으로 표현, 레벨 시스템 없음

### 6.2 Major NPCs

| # | Name (KR/EN) | Role | Personality | Visual Concept | Appears In |
|---|-------------|------|------------|---------------|-----------|
| 1 | 전도자 / Evangelist | 안내자, 교정자 | 엄하지만 따뜻한 | 짙은 로브, 수염, 책 | Ch1,3 (반복) |
| 2 | 완고 / Obstinate | 반대자 | 고집스럽고 거친 | 붉은 로브, 성난 표정 | Ch1 |
| 3 | 유연 / Pliable | 동행→이탈자 | 우유부단, 호기심 | 초록 로브 | Ch1-2 |
| 4 | 도움 / Help | 구출자 | 강하고 친절 | 파란 로브, 방패 | Ch2 |
| 5 | 세상지혜씨 / Worldly Wiseman | 유혹자 | 부드럽고 교활 | 보라 로브, 회색 머리 | Ch3 |
| 6 | 선의 / Good-will | 문지기 | 따뜻하고 환영 | 금빛 로브, 후광 | Ch4 |
| 7 | 해석자 / Interpreter | 교사 | 학자적, 인내심 | 보라 로브, 수염, 책 | Ch5 |
| 8 | 세 빛나는 자 | 은혜의 사자 | 영적, 위엄 | 밝은 흰 로브, 빛남 | Ch6 |
| 9 | 신중 / Prudence | 조언자 | 사려깊은 | 연보라 로브 | Ch7 |
| 10 | 경건 / Piety | 조언자 | 경건한 | 진한 보라 로브 | Ch7 |
| 11 | 사랑 / Charity | 조언자 | 따뜻한 | 붉은 로브 | Ch7 |
| 12 | 아볼론 / Apollyon | 보스/적 | 위협적, 교활 | 붉은 피부, 뿔, 날개 | Ch8 |
| 13 | 신실 / Faithful | 동행자→순교자 | 용감하고 진실 | 금색 로브 | Ch10 |
| 14 | 소망 / Hopeful | 영구 동행자 | 밝고 낙관적 | 하늘색 로브 | Ch10-12 |
| 15 | 거인 절망 / Giant Despair | 적 | 거대하고 잔인 | 큰 체구, 어두운 톤 | Ch11 |
| 16 | 무지 / Ignorance | 경고 인물 | 자신만만, 무지 | 평범한 옷, 밝은 표정 | Ch12 |
| 17 | 목자 4인 | 교사들 | 지혜롭고 친절 | 목자 지팡이, 흰 로브 | Ch11 |
| 18 | 아첨꾼 / Flatterer | 유혹자 | 달콤하고 거짓 | 화려한 옷 | Ch12 |
| 19 | 무신론자 / Atheist | 논쟁자 | 조롱적, 냉소 | 현대적 복장 | Ch12 |
| 20 | 사리 / By-ends | 유혹자 | 타협적, 기회주의 | 화려한 상인 복장 | Ch10 |

### 6.3 Companion System

- Ch1-9: 크리스천은 대부분 **혼자** 여행 (간헐적 NPC 동행)
- Ch10: 신실(Faithful) 합류 → **허영의 시장에서 순교**
- Ch10-12: 소망(Hopeful) 합류 → **끝까지 동행**
- 동행자는 자동으로 따라다니며, 대화에 참여하고, 챌린지에서 도움을 줌

---

## 7. Systems Design

### 7.1 Stats System

| Stat | KR | Initial | Max | Role |
|------|-----|---------|-----|------|
| Faith | 믿음 | 30 | 100 | 신앙적 선택의 강도, 유혹 저항, QTE 기본 능력 |
| Courage | 용기 | 20 | 100 | 전투/위험 상황의 성과, 공포 저항 |
| Wisdom | 지혜 | 20 | 100 | 퍼즐 난이도, 대화 선택지 해금, 함정 회피 |
| Burden | 짐 | 80 | 100 | 이동 속도 감소, 스태미나 저하 (Ch6에서 0으로) |

**스탯 게이팅**: 특정 선택지는 스탯이 일정 이상이어야 등장
- 예: "아볼론에게 성경으로 반박" (믿음 >= 50일 때만 등장)
- 게이팅된 선택지 미달성 시 → 더 어려운 대안 경로

### 7.2 Burden System

짐은 게임의 핵심 메카닉이다.

**이동 속도 공식:**
```
baseSpeed = 5.0
burdenPenalty = burden / 100 * 0.5
actualSpeed = baseSpeed * (1.0 - burdenPenalty)
// burden 80 → speed 3.0 (40% 감소)
// burden 0 → speed 5.0 (제한 없음)
```

**짐의 시각적 표현:**
- burden > 60: 캐릭터 등에 큰 짐 스프라이트
- burden 30-60: 중간 크기 짐
- burden 1-29: 작은 짐
- burden 0: 짐 없음 + 밝은 옷

**짐 변동:**
- 잘못된 선택 → burden 증가 (최대 +10)
- 올바른 선택 → burden 소폭 감소 (-2~-5)
- **Ch6 십자가** → burden = 0 (일시에 전부 제거)
- Ch6 이후에는 burden이 다시 증가하지 않음

### 7.3 Combat/Challenge System

| Type | Chapters | Mechanic | Duration |
|------|---------|---------|---------|
| QTE 보스전 | Ch8 (아볼론) | Mash → Timing → Arrow Dodge → Dialogue Battle | 3-5분 |
| 인내 챌린지 | Ch2 (늪), Ch9 (골짜기), Ch12 (마법의 땅) | 방향키 입력, 졸음 저항 | 1-2분 |
| 대화 전투 | Ch10 (허영의 시장 재판) | 올바른 반론 선택 | 2-3분 |
| 퍼즐 | Ch11 (의심의 성 탈출) | 약속의 열쇠 찾기 + 사용 | 3-5분 |

### 7.4 Collection System

**성경 카드 (52장)**:
- 각 챕터마다 3-6장 획득 가능
- 카드 구성: 구절 텍스트 (KR/EN) + 맥락 설명 + 아트
- 숨겨진 카드: 맵 탐험으로만 발견 가능 (전체의 30%)

**캐릭터 도감 (40+ 엔트리)**:
- NPC와 대화하면 자동 등록
- 엔트리: 이름, 설명, 역할, 첫 등장 챕터
- 숨겨진 NPC도 존재 (탐험 보상)

**여정 일지**:
- 각 챕터 완료 시 자동 기록
- 선택한 내용 요약 + 스탯 변화 이력

### 7.5 Save System

- **자동 저장**: 챕터 시작/완료, NPC 대화 완료, 맵 이동 시
- **수동 저장**: 메뉴에서 3개 슬롯
- **저장 데이터**: JSON 형식, PlayerPrefs 또는 파일 시스템
- **저장 내용**: 현재 챕터, 스탯, 짐, Ink 스토리 상태, 수집품, 커스터마이즈 정보

---

## 8. UI/UX Design

### 8.1 Screen Flow

```
Launch → FTUE (Language → Name → Customize → Prologue) → Gameplay
                                                              ↓
Gameplay ← Main Menu (Continue / New Game / Collection / Settings / Quit)
   ↓
   ├── Exploration View (top-down map, HUD overlay)
   ├── Dialogue View (bottom panel, speaker plate, choices)
   ├── Challenge View (QTE overlay, timer, prompts)
   ├── Collection View (cards grid, character entries)
   ├── Map View (chapter progress, current location)
   └── Settings View (language, volume, text speed)
```

### 8.2 HUD Layout

```
┌──────────────────────────────────────────┐
│ [Faith ██████░░] [Location Name]  [⚖ 80]│  ← Top bar
│ [Courage ████░░░]                        │
│ [Wisdom ████░░░░]                        │
│                                          │
│                                          │
│              (Game World)                │
│                                          │
│                                          │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ [Speaker Name]                       │ │  ← Dialogue panel
│ │ "Dialogue text here..."              │ │
│ │                        [▼ Continue]  │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

### 8.3 Color Palette

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Primary Gold | 따뜻한 금 | #E6C86E | 제목, 강조, 라벨 |
| Dark BG | 깊은 남보라 | #0A0814 | 배경, 패널 |
| Panel Fill | 어두운 보라 | #14101E | UI 패널 내부 |
| Panel Border | 흐린 금 | #A68D50 | UI 테두리 |
| Text Primary | 흰색 | #FFFFFF | 본문 텍스트 |
| Text Muted | 회갈색 | #8C8070 | 보조 텍스트 |
| Button Green | 짙은 초록 | #2D6640 | 확인/시작 버튼 |
| Button Red | 짙은 적갈색 | #4A1E1E | 종료/취소 버튼 |
| Button Default | 짙은 남색 | #1E1830 | 일반 버튼 |

### 8.4 Font Strategy

- **제목**: Noto Sans KR Bold / Noto Sans Bold — 큰 사이즈, 금색
- **본문/대화**: Noto Sans KR Regular — 자연스러운 가독성
- **UI 라벨**: Noto Sans KR Medium — 중간 무게
- **성경 구절**: Italic 스타일 — 일반 텍스트와 구분

---

## 9. Art & Audio

### 9.1 Art Style

**픽셀 아트** (16x16 기본 단위)
- 캐릭터: 16x16 스프라이트, 4방향 아이들 + 워킹 애니메이션
- 타일: 16x16, 자연 노이즈로 단조로움 방지
- 환경 오브젝트: 16x16 ~ 32x32
- UI: 코드 생성 텍스처 (ProceduralAssets)

**톤 가이드:**
- Ch1-3: 어둡고 탁한 톤 (멸망/시련)
- Ch4-6: 점진적으로 밝아짐 (희망/은혜)
- Ch7-9: 긴장감 있는 대비 (전투/위험)
- Ch10-11: 극적 대비 (화려함 vs 어둠)
- Ch12: 최대 밝기, 금빛 (완성/천성)

### 9.2 BGM Guide

| Chapter | Mood | Instruments | Tempo |
|---------|------|------------|-------|
| Title/Menu | 장엄하고 희망적 | 오케스트라 + 합창 패드 | 중간 |
| Ch1 | 긴박하고 우울 | 첼로 솔로, 낮은 현악 | 느림 |
| Ch2 | 무겁고 절망적 → 구출 | 저음 베이스 → 오보에 | 느림→중간 |
| Ch3 | 달콤한 유혹 → 두려움 | 류트 → 불협화음 금관 | 중간→빠름 |
| Ch4-5 | 경건하고 따뜻 | 쳄발로, 목관 | 느림 |
| Ch6 | 카타르시스 | 풀 오케스트라 + 합창 | 느림→클라이맥스 |
| Ch7 | 활기차고 모험적 | 현악 + 호른 | 빠름 |
| Ch8 | 전투, 긴장 | 타격적 금관, 타악기 | 빠름 |
| Ch9 | 극도의 긴장, 고독 | 미니멀 앰비언트, 저음 | 매우 느림 |
| Ch10 | 혼란→슬픔→결의 | 시장 소음 → 장송곡 | 다양 |
| Ch11 | 절망→해방→평화 | 저음 드론 → 목가적 관악 | 느림→중간 |
| Ch12 | 졸음→각성→환희 | 몽환적 → 대편성 찬양 | 느림→장엄 |

### 9.3 SFX Checklist

**UI**: 버튼 클릭, 메뉴 열기/닫기, 선택지 선택, 텍스트 타이핑, 저장 완료
**환경**: 발걸음(잔디/돌/나무), 물 흐르는 소리, 바람, 새소리, 늪 버블링
**이벤트**: 짐 떨어짐(핵심!), 문 열림, 전투 충돌, 카드 획득, 챕터 클리어
**특수**: 아볼론 으르렁, 천성 나팔, 요단강 물소리

---

## 10. Technical Design

### 10.1 Unity Project Architecture

```
Assets/_Project/
├── Ink/                    # Ink 서사 파일 (.ink, .json)
│   ├── globals.ink
│   ├── main.ink
│   ├── prologue.ink
│   ├── epilogue.ink
│   └── chapters/ch01~ch12.ink
├── Scripts/
│   ├── Core/               # GameManager, ServiceLocator, Bootstrap
│   ├── Narrative/           # InkService, DialogueController, StatsManager
│   ├── Player/              # PlayerController, PlayerAnimator, Customization
│   ├── Interaction/         # NPCInteractable, ItemInteractable, PortalInteractable
│   ├── Scene/               # SceneLoader, TransitionController, TileGenerator
│   ├── UI/                  # MainMenuUI, DialogueUI, ExplorationHUD, etc.
│   ├── Save/                # SaveManager, SaveData
│   ├── Localization/        # LocalizationManager
│   ├── Audio/               # AudioManager
│   ├── Challenge/           # QTEManager, BaseChallenge
│   ├── Visuals/             # ProceduralAssets (tile/sprite/texture generation)
│   └── Auth/                # AuthManager (future)
├── Resources/               # Runtime-loadable assets
├── Fonts/                   # NotoSansKR
└── Scenes/                  # Bootstrap, MainMenu, Gameplay
```

### 10.2 Scene Structure

```
Bootstrap (entry point, always loaded first)
  → MainMenu (language select, main buttons, character creation)
    → Gameplay (dynamically loads chapter maps)
```

- **Bootstrap**: 모든 Manager 서비스 초기화, DontDestroyOnLoad
- **MainMenu**: 런타임 UI 생성 (MainMenuSceneSetup.cs)
- **Gameplay**: 런타임 맵/NPC/UI 생성 (GameplaySceneSetup.cs), 챕터에 따라 동적 변경

### 10.3 Data Flow

```
Ink Story (.ink compiled to .json)
  → InkService (loads story, manages state)
    → DialogueController (reads text + tags)
      → DialogueUI (displays text, choices)
      → StatsManager (updates faith/courage/wisdom/burden)
      → AudioManager (plays BGM/SFX based on tags)
      → PlayerController (movement speed based on burden)
```

### 10.4 Chapter Loading System

각 챕터 진입 시:
1. Ink 스토리에서 해당 챕터 knot으로 점프
2. `PlaceholderTileGenerator`가 챕터별 맵 생성
3. NPC를 챕터에 맞게 배치
4. BGM 변경
5. 위치 텍스트 표시

### 10.5 Build & Deploy

- **WebGL**: Unity WebGL build → itch.io (Butler CLI)
- **CI/CD**: GitHub Actions (manual trigger) → Build → Deploy
- **Testing**: NUnit EditMode tests (125+ tests)

---

## 11. Development Roadmap

### 11.1 Milestones

| Phase | Duration | Goal | Deliverable |
|-------|---------|------|-------------|
| **Alpha** | W1-8 | Ch1-6 완전 플레이 가능 | 데모 빌드 (십자가까지) |
| **Beta** | W9-16 | Ch7-12 추가, 전체 스토리 완성 | 풀 게임 빌드 |
| **Polish** | W17-20 | 아트/오디오 교체, 버그 수정, 밸런싱 | 릴리즈 후보 |
| **Launch** | W21-22 | itch.io 출시, 피드백 수집 | v1.0 |
| **Post** | W23+ | 모바일 포트, 2부(크리스티아나) 기획 | v1.x |

### 11.2 Priority Matrix

| Priority | Items |
|----------|-------|
| **Must** | 12 챕터 Ink 스토리, 온보딩 플로우, 짐 시스템, 기본 타일맵, NPC 대화, 저장/불러오기 |
| **Should** | QTE 전투, 성경 카드 수집, 캐릭터 커스터마이즈, BGM, 챕터별 맵 차별화 |
| **Could** | 캐릭터 도감, 여정 일지, 모바일 컨트롤, 접근성 옵션, 챕터 선택 화면 |
| **Won't (v1)** | 멀티플레이어, 2부 크리스티아나, 음성 대사, 3D 그래픽, 인앱 결제 |

---

## 12. Monetization & Distribution

### 12.1 Pricing

| Product | Price | Content |
|---------|-------|---------|
| 무료 데모 | $0 | Ch1-6 (십자가까지, ~1-2시간) |
| 정식판 | $4.99 | Ch1-12 (천성까지, ~3-5시간) |
| 모바일 | $2.99 | 동일 콘텐츠 |

**왜 유료인가**: 무료 + 광고 모델은 성경적 내러티브와 충돌. 합리적 가격의 프리미엄 모델이 게임의 진정성을 보존한다.

### 12.2 Distribution

| Platform | Format | Timeline |
|----------|--------|----------|
| itch.io | WebGL | Alpha 이후 즉시 |
| Steam | PC (Windows/Mac) | Beta 이후 |
| Google Play | Android | Launch 이후 |
| App Store | iOS | Launch 이후 |

### 12.3 Marketing Strategy

1. **Devlog**: itch.io/Steam에 개발 과정 공유
2. **Community**: 교회/성경 공부 그룹에 데모 배포
3. **SEO**: "Pilgrim's Progress game", "천로역정 게임" 검색 최적화
4. **Social**: 개발 스크린샷/GIF → Twitter/Reddit/인스타
5. **Cost**: $0 예산 (모든 마케팅은 오가닉)

---

## Appendix A: Emotion Palette

| Emotion | Color Tone | BGM Mood | Screen Effect | Used In |
|---------|-----------|---------|--------------|---------|
| 절망 | #1E2A3A | 장조 단조, 느린 첼로 | 비네팅 강화, 저채도 | Ch1, Ch2, Ch11 |
| 두려움 | #2D1B4E | 불협화음, 트레몰로 | 화면 흔들림, 어둡게 | Ch3, Ch9 |
| 희망 | #C8956C | 오보에 솔로, 상행 | 점진적 밝아짐 | Ch4, Ch11 후반 |
| 교제 | #F5E6D3 | 류트+현악 | 따뜻한 톤 | Ch7, Ch10 |
| 전투 | #4A1C1C | 금관, 빠른 템포 | 붉은 필터 | Ch8, Ch10 |
| 카타르시스 | #D4A853 | 오케스트라+합창 | 빛 폭발 | Ch6, Ch12 |
| 유혹 | #8B3A3A | 달콤한 멜로디 | 빛 번짐 | Ch3, Ch12 |
| 경건 | #7A5C3A | 쳄발로+합창패드 | 촛불 빛 | Ch5 |

---

## Appendix B: Ink Tag Reference

| Tag | Format | Example | Purpose |
|-----|--------|---------|---------|
| SPEAKER | `# SPEAKER: Name` | `# SPEAKER: Evangelist` | 화자 이름 표시 |
| EMOTION | `# EMOTION: type` | `# EMOTION: fear` | 화자 표정 변경 |
| LOCATION | `# LOCATION: name` | `# LOCATION: City of Destruction` | 장소 UI 표시 |
| BGM | `# BGM: track` | `# BGM: ch01_city` | 배경음악 변경 |
| SFX | `# SFX: sound` | `# SFX: door_open` | 효과음 재생 |
| STAT | `# STAT: stat +/-n` | `# STAT: faith +5` | 스탯 변경 |
| BIBLE_CARD | `# BIBLE_CARD: ref` | `# BIBLE_CARD: John 3:16` | 성경 카드 획득 |
| TRANSITION | `# TRANSITION: type` | `# TRANSITION: fade` | 화면 전환 |
| WAIT | `# WAIT: ms` | `# WAIT: 2000` | 대기 |
| SHAKE | `# SHAKE` | `# SHAKE` | 화면 흔들림 |
| CG | `# CG: name` | `# CG: cross_scene` | CG 이벤트 표시 |

---

*This document supersedes the previous GDD and serves as the single source of truth for all game design decisions. It should be updated whenever design changes are made.*

*Story data reference: `Assets/_Project/Ink/` directory.*
*Technical implementation: `Assets/_Project/Scripts/` directory.*
