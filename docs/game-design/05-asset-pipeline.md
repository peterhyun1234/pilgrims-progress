# 05. 에셋 파이프라인 가이드 (Asset Pipeline Guide)

> **프로젝트**: 천로역정 — 순례자의 여정 (The Pilgrim's Progress)
> **목적**: 1인 개발자가 AI 도구와 무료/저비용 리소스로 모든 게임 에셋을 효율적으로 제작하는 워크플로우
> **엔진**: Unity 6 + Ink + C#
> **최종 수정**: 2026-03-15

---

## 목차

1. [아트 에셋 파이프라인](#1-아트-에셋-파이프라인)
2. [오디오 에셋 파이프라인](#2-오디오-에셋-파이프라인)
3. [내러티브 에셋 파이프라인](#3-내러티브-에셋-파이프라인)
4. [AI 도구 종합 가이드](#4-ai-도구-종합-가이드)
5. [에셋 관리](#5-에셋-관리)

---

## 1. 아트 에셋 파이프라인

### 1.1 아트 스타일 요약

본 프로젝트의 아트 스타일은 **따뜻한 수채화/동화책 (Storybook Watercolor)** 입니다. 모든 아트 에셋은 이 방향성에 맞춰 제작되어야 합니다.

| 속성 | 기준 |
|------|------|
| **톤** | 따뜻한 수채화풍, 빛과 어둠의 극적 대비 |
| **배경** | 넓은 붓 터치, 부드러운 그라데이션, 동화책 일러스트 느낌 |
| **캐릭터** | 반 실사 일러스트, 표정 풍부한 상반신 초상화 |
| **UI** | 양피지/고서적 질감, 클래식하되 깔끔한 타이포그래피 |

### 1.2 캐릭터 초상화 워크플로우

#### Step 1: 캐릭터 디자인 시트 작성

캐릭터별로 아래 정보를 먼저 정리합니다:

| 캐릭터 | 연령대 | 복장 특징 | 감정 변형 수 | 비고 |
|--------|--------|----------|-------------|------|
| 크리스천 | 30대 | 여행자 의복, 등에 짐 | 8개 (기본/슬픔/결의/두려움/기쁨/분노/놀람/평화) | 주인공 — 가장 많은 변형 필요 |
| 전도자 | 50대 | 긴 로브, 두루마리 | 3개 (기본/진지/미소) | NPC |
| 완고 | 40대 | 튼튼한 일상복 | 3개 (기본/화남/비웃음) | NPC |
| 유연 | 20대 | 가벼운 옷 | 4개 (기본/흥미/두려움/도망) | NPC |
| 해석자 | 60대 | 학자풍 로브, 안경 | 3개 (기본/가르침/미소) | NPC |
| 빛나는 자 | - | 빛나는 갑옷 | 2개 (기본/축복) | 천사형 NPC |

#### Step 2: AI 이미지 생성 (Midjourney / Stable Diffusion)

**Midjourney v7 프롬프트 예시 — 크리스천 초상화:**

```
A portrait of a weary young pilgrim in medieval traveler's clothes,
carrying a heavy burden on his back, storybook watercolor illustration style,
warm ochre and burnt sienna tones, soft brush strokes, parchment paper texture,
gentle dramatic lighting from above, upper body portrait, expressive sorrowful eyes,
John Bunyan Pilgrim's Progress inspired --ar 3:4 --style raw --v 7
--sref [스타일 참조 이미지 URL]
```

**Midjourney v7 프롬프트 예시 — 전도자 초상화:**

```
A wise elderly evangelist in flowing dark robes holding a scroll,
kind weathered face with knowing eyes, storybook watercolor illustration,
warm golden light, soft brush textures, children's book art style,
classical religious painting influence, upper body portrait --ar 3:4
--style raw --v 7 --sref [스타일 참조 이미지 URL]
```

**Stable Diffusion 3.5 프롬프트 예시 — 크리스천 초상화:**

```
Positive: portrait of medieval pilgrim, young man, heavy burden on back,
storybook watercolor style, (warm ochre tones:1.3), soft brushstrokes,
parchment texture, dramatic lighting, upper body, expressive eyes,
(children's book illustration:1.4), John Bunyan inspired

Negative: photorealistic, 3d render, anime, cartoon, low quality,
blurry, modern clothing, weapons
```

#### Step 3: 스타일 일관성 유지 기법

| 기법 | 도구 | 설명 |
|------|------|------|
| **Style Reference (--sref)** | Midjourney v7 | 첫 번째 만족스러운 이미지를 스타일 참조로 고정 |
| **ControlNet** | SD 3.5 / ComfyUI | 포즈·구도를 OpenPose로 제어, 스타일은 별도 LoRA로 고정 |
| **커스텀 LoRA** | SD 3.5 | 초기 10~15장의 정제된 이미지로 미세 조정 LoRA 학습 |
| **컬러 그레이딩** | Photoshop / Krita | 모든 이미지에 동일 LUT(Color Lookup Table) 적용 |
| **스타일 가이드 시트** | Figma | 컬러 팔레트·선 굵기·질감 레퍼런스를 한 장에 정리 |

**LoRA 학습 팁 (Stable Diffusion):**
1. 최초 AI 생성 → 수작업 정제한 이미지 10~15장 선별
2. Kohya SS로 LoRA 학습 (Epoch 20~30, LR 1e-4)
3. 이후 모든 캐릭터/배경 생성 시 해당 LoRA 적용
4. 결과물에 Photoshop/Krita에서 동일 브러시 텍스처 오버레이

#### Step 4: 수작업 정제 (Photoshop / Krita)

| 작업 | 세부 내용 | 예상 시간/장 |
|------|----------|-------------|
| 불필요한 요소 제거 | AI 아티팩트, 엉뚱한 손가락, 이상한 텍스트 제거 | 15분 |
| 스타일 통일 | 아웃라인 보정, 수채화 브러시로 터치 추가 | 20분 |
| 컬러 그레이딩 | 프로젝트 LUT 적용, 톤 조절 | 5분 |
| 표정 변형 | 기본 이미지에서 눈·입만 변형하여 감정 표현 제작 | 10분/변형 |
| 최종 크롭 & 리사이즈 | 게임 내 해상도에 맞게 자르기 | 5분 |

**Krita 추천 브러시 세트:**
- `Watercolor Wash` — 배경 터치업
- `Ink Gpen` — 아웃라인 보정
- `Soft Eraser` — AI 아티팩트 자연스럽게 제거

#### Step 5: Unity 임포트

| 설정 | 값 |
|------|-----|
| Texture Type | Sprite (2D and UI) |
| Sprite Mode | Single |
| Pixels Per Unit | 100 |
| Filter Mode | Bilinear |
| Compression | High Quality (RGBA Compressed) |
| Max Size | 2048 (캐릭터), 4096 (배경) |
| Read/Write | Disabled (런타임 수정 불필요) |

### 1.3 배경 일러스트레이션 워크플로우

#### 배경 유형별 필요 수량 (MVP 기준)

| 장소 | 분위기 | 변형 수 | 비고 |
|------|--------|---------|------|
| 멸망의 도시 | 황폐, 어둠, 불안 | 2 (낮/밤) | 시작 지점 |
| 들판 (일반) | 평범, 넓은 시야 | 1 | 이동 배경 |
| 절망의 늪 | 어둡고 축축함, 안개 | 1 | 위험 장소 |
| 시내산 | 거대하고 위압적, 번개 | 1 | 율법의 무서움 |
| 좁은 문 | 빛이 새어 나오는 문 | 1 | 전환점 |
| 해석자의 집 | 따뜻하고 아늑함 | 7 (방별) | 핵심 교육 구간 |
| 십자가/무덤 | 극적인 빛, 감동 | 2 (전/후) | 클라이맥스 |
| **합계** | | **약 16장** | |

#### Midjourney 배경 프롬프트 예시 — 멸망의 도시:

```
A desolate medieval city at dusk, crumbling walls and dark smoke rising,
desperate atmosphere, storybook watercolor illustration, wide panoramic view,
warm earth tones mixed with ominous dark purples, soft painterly brushstrokes,
children's book fantasy art, John Bunyan City of Destruction --ar 16:9
--style raw --v 7 --sref [스타일 참조 URL]
```

#### Midjourney 배경 프롬프트 예시 — 십자가 (빛의 장면):

```
A radiant hilltop with a wooden cross bathed in golden divine light,
a heavy burden falling from a pilgrim's back, storybook watercolor illustration,
luminous warm golds and soft whites, ethereal atmosphere, rays of light
breaking through clouds, painterly soft brush strokes, children's book art style,
deeply emotional and hopeful scene --ar 16:9 --style raw --v 7
--sref [스타일 참조 URL]
```

#### Stable Diffusion 배경 프롬프트 예시 — 해석자의 집:

```
Positive: interior of a warm medieval study room, candlelight, bookshelves,
fireplace, storybook watercolor style, (warm golden tones:1.3),
soft painterly textures, (children's book illustration:1.4), cozy atmosphere,
parchment and leather textures

Negative: photorealistic, modern, 3d render, anime, low quality, people
```

#### 배경 특수 처리

| 기법 | 용도 | 구현 |
|------|------|------|
| **패럴랙스 레이어** | 깊이감 연출 | 배경을 3~4개 레이어로 분리 (전경/중경/원경/하늘) |
| **시간대 변형** | 같은 장소의 시간 변화 | 컬러 그레이딩만 변경 (새벽/낮/저녁/밤) |
| **날씨 오버레이** | 분위기 변화 | Unity 파티클로 비/안개/눈 오버레이 |
| **조명 애니메이션** | 실내 장면 분위기 | Unity Light2D 컴포넌트로 촛불 깜빡임 등 |

### 1.4 UI 에셋 제작

#### 제작 도구: Figma (무료 플랜) → Unity UI Toolkit

| UI 요소 | 스타일 | 제작 방식 |
|---------|--------|----------|
| 대화 박스 | 양피지 질감, 둥근 모서리 | Figma에서 디자인 → 9-slice PNG 익스포트 |
| 선택지 버튼 | 가죽 북마크 느낌 | Figma → 9-slice PNG |
| 스탯 표시 | 옛 나침반/장식 프레임 | Figma → Unity UI Toolkit |
| 메뉴 화면 | 고서적 표지 느낌 | AI 생성 배경 + Figma 레이아웃 |
| 성경 구절 카드 | 양피지 + 캘리그래피 | AI 생성 프레임 + 폰트 합성 |
| HUD (스탯/챕터) | 미니멀, 반투명 | Unity UI Toolkit 직접 제작 |

**UI 폰트 추천 (무료 한글 폰트):**

| 폰트 | 용도 | 라이선스 |
|------|------|---------|
| Noto Serif KR | 본문 대사 | OFL (완전 무료) |
| Nanum Myeongjo | 성경 구절, 내레이션 | OFL |
| Black Han Sans | 제목, 챕터명 | OFL |
| Gowun Batang | 대화 텍스트 대안 | OFL |

### 1.5 VFX / 파티클 시스템

| 이펙트 | 사용 장면 | Unity 구현 |
|--------|----------|-----------|
| 빛 입자 (Dust Motes) | 궁전, 천성, 십자가 장면 | Particle System — 작은 원형, 느린 이동, 반투명 |
| 안개 / 연무 | 사망의 골짜기, 절망의 늪 | Particle System + Shader Graph (투명 텍스처 스크롤) |
| 불꽃 | 아폴리온 전투, 시내산 | Particle System — 화염 텍스처, 위방향 방출 |
| 빗방울 | 야외 시련 장면 | Particle System — 하방향 라인 렌더러 |
| 십자가 빛 | 짐이 떨어지는 결정적 순간 | Light2D 확장 + Bloom 후처리 + 파티클 |
| 화면 흔들림 | 전투, 충격 장면 | Cinemachine Impulse |
| 수채화 전환 | 장면 전환 | Custom Shader — 수채화 번짐 디졸브 |

### 1.6 파일 형식 & 해상도 표준

| 에셋 유형 | 형식 | 해상도 | 비고 |
|----------|------|--------|------|
| 캐릭터 초상화 | PNG (투명 배경) | 1024×1365 (3:4) | 표정 변형 시 같은 크기 유지 |
| 배경 일러스트 | PNG / JPG | 1920×1080 (16:9) | 패럴랙스용은 레이어별 분리 |
| UI 요소 | PNG (투명 배경) | 가변 | 9-slice 지원 형태로 제작 |
| 파티클 텍스처 | PNG (투명 배경) | 128×128 ~ 256×256 | 심플한 형태, 저해상도 OK |
| 아이콘 | PNG (투명 배경) | 128×128 | 성경 카드, 아이템 등 |
| 스프라이트 시트 | PNG (투명 배경) | 가변 | 단순 애니메이션용 |

### 1.7 아트 에셋 네이밍 컨벤션

```
[유형]_[장소/캐릭터]_[세부]_[변형].확장자

예시:
chr_christian_default.png          # 크리스천 기본 표정
chr_christian_sad.png              # 크리스천 슬픈 표정
chr_evangelist_default.png         # 전도자 기본
bg_city_of_destruction_night.png   # 멸망의 도시 밤
bg_cross_hill_before.png           # 십자가 언덕 (짐 떨어지기 전)
bg_cross_hill_after.png            # 십자가 언덕 (짐 떨어진 후)
ui_dialogue_box.png                # 대화 박스
ui_choice_button_normal.png        # 선택지 버튼 기본
ui_choice_button_hover.png         # 선택지 버튼 호버
fx_particle_light_dust.png         # 빛 먼지 파티클
icon_bible_verse.png               # 성경 구절 아이콘
```

### 1.8 Unity 프로젝트 아트 디렉토리 구조

```
Assets/
├── Art/
│   ├── Characters/
│   │   ├── Christian/
│   │   │   ├── chr_christian_default.png
│   │   │   ├── chr_christian_sad.png
│   │   │   └── ...
│   │   ├── Evangelist/
│   │   └── ...
│   ├── Backgrounds/
│   │   ├── CityOfDestruction/
│   │   │   ├── bg_city_of_destruction_day.png
│   │   │   └── bg_city_of_destruction_night.png
│   │   ├── CrossHill/
│   │   └── ...
│   ├── UI/
│   │   ├── DialogueBox/
│   │   ├── Buttons/
│   │   ├── Icons/
│   │   └── Fonts/
│   ├── VFX/
│   │   ├── Textures/
│   │   └── Materials/
│   └── StyleGuide/
│       ├── color_palette.png
│       ├── style_reference.png
│       └── LUT/
├── Audio/           # → 2장 참조
├── Narrative/       # → 3장 참조
└── ...
```

---

## 2. 오디오 에셋 파이프라인

### 2.1 오디오 설계 원칙

| 원칙 | 설명 |
|------|------|
| **감정 우선** | 음악과 효과음은 서사의 감정을 증폭해야 함 |
| **레이어드 디자인** | BGM + 앰비언트 + SFX를 독립 레이어로 관리, 장면에 따라 믹싱 |
| **부드러운 전환** | 장면 전환 시 크로스페이드로 자연스러운 음악 변경 |
| **반복 가능성** | BGM은 루프 가능해야 함 (시작/끝이 자연스럽게 연결) |

### 2.2 BGM — AI 음악 생성

#### 장소별 BGM 요구사항

| 장소/장면 | 분위기 | 악기 | 길이 | BPM |
|----------|--------|------|------|-----|
| 메인 메뉴 | 경건, 희망적 | 피아노, 현악 | 2~3분 루프 | 70~80 |
| 멸망의 도시 | 불안, 긴장 | 저음 현악, 불협화음 | 2분 루프 | 60~70 |
| 들판 (탐험) | 평화, 약간의 외로움 | 어쿠스틱 기타, 플루트 | 3분 루프 | 80~90 |
| 절망의 늪 | 무거움, 절망 | 첼로, 저음 패드 | 2분 루프 | 50~60 |
| 좁은 문 | 결의, 전환 | 피아노 솔로 → 현악 합류 | 1분 (일회성) | 70 |
| 해석자의 집 | 따뜻함, 배움 | 하프시코드, 류트 | 3분 루프 | 70~80 |
| 십자가 (클라이맥스) | 감동, 해방, 은혜 | 풀 오케스트라, 합창 | 2분 (일회성) | 60→80 |
| 전투 (아폴리온) | 긴박, 위험 | 타악기, 금관, 전자음 | 2분 루프 | 120~140 |
| 사망의 골짜기 | 공포, 고독 | 미니멀 앰비언트, 저음 드론 | 3분 루프 | N/A |

#### AI 음악 생성 도구별 워크플로우

**Suno v4 (추천):**

```
프롬프트 예시 (십자가 장면 BGM):
"Orchestral cinematic piece, starting with solo piano,
building to full strings and choir, emotional climax,
warm and hopeful, key of D major, 70 BPM rising to 80 BPM,
no lyrics, fantasy RPG soundtrack style"

스타일 태그: cinematic, orchestral, emotional, hopeful, no vocals
```

```
프롬프트 예시 (멸망의 도시 BGM):
"Dark ambient orchestral piece, low strings tremolo,
occasional dissonant piano notes, oppressive atmosphere,
medieval fantasy, minor key, 65 BPM, sense of dread and urgency"

스타일 태그: dark ambient, orchestral, tense, cinematic, no vocals
```

**Udio:**
- Suno보다 음질이 높은 편이나 루프 제작이 불편
- 짧은 원샷(전환음, 팡파르) 제작에 적합
- Suno에서 메인 트랙 → Udio에서 보조 트랙/변형 생성

**AIVA (클래식 특화):**
- 해석자의 집, 궁전 같은 클래식 분위기 트랙에 최적
- MIDI 익스포트 가능 → DAW에서 추가 편집 가능
- 무료 플랜: 월 3곡, 크레딧 표기 필요 (유료: $11/월)

#### BGM 후처리 워크플로우

1. AI 도구로 2~3개 후보 생성
2. 가장 적합한 트랙 선택
3. **Audacity** (무료)에서 편집:
   - 루프 포인트 설정 (끝→시작 크로스페이드)
   - 노이즈 제거
   - 볼륨 노멀라이즈 (-14 LUFS 기준)
4. OGG Vorbis (q6)로 익스포트

### 2.3 SFX — 효과음

#### 필요 효과음 목록 (MVP)

| 카테고리 | 효과음 | 소스 |
|---------|--------|------|
| **UI** | 버튼 클릭, 선택지 호버, 페이지 넘김, 메뉴 열기/닫기 | Freesound.org |
| **대화** | 텍스트 타이핑 틱 (캐릭터별 톤 변형) | 자체 제작 (Audacity 톤 생성) |
| **탐험** | 발걸음 (풀/돌/나무/진흙), 문 열기, 아이템 획득 | Freesound.org / Pixabay |
| **전투** | 검 부딪힘, 방패 막기, 타격, 화살 (아폴리온) | Freesound.org |
| **환경** | 바람, 빗소리, 천둥, 새소리, 시냇물, 모닥불 | Freesound.org / BBC Sound Effects |
| **연출** | 짐 떨어지는 소리, 빛 효과음, 심장 박동, 종소리 | Freesound.org + 후처리 |

#### 무료 SFX 라이브러리

| 라이브러리 | URL | 라이선스 | 특징 |
|-----------|-----|---------|------|
| Freesound.org | freesound.org | CC0 / CC BY (확인 필요) | 최대 규모, 검색 강력 |
| Pixabay | pixabay.com/sound-effects | 상업적 무료 | 고품질, 큐레이션됨 |
| BBC Sound Effects | sound-effects.bbcrewind.co.uk | 비상업적 무료 | 자연음 최고 |
| Sonniss GDC Bundle | sonniss.com | 로열티 프리 | 매년 무료 번들 배포 |
| Kenney.nl | kenney.nl | CC0 | 게임 특화 에셋 |

#### SFX 제작 팁

- **텍스트 타이핑 사운드**: Audacity에서 짧은 톤(50ms) 생성 → 피치 변형으로 캐릭터별 구분
- **짐 떨어지는 소리**: 무거운 천 낙하음 + 쇠사슬 소리 레이어링 → 리버브 추가
- **모든 SFX는 WAV 16bit/44.1kHz로 통일**

### 2.4 앰비언트 사운드

| 환경 유형 | 레이어 구성 | 예시 장소 |
|----------|------------|----------|
| **도시** | 군중 웅웅 + 멀리서 개 짖는 소리 + 바람 | 멸망의 도시 |
| **야외 (평원)** | 바람 + 새소리 + 풀 스치는 소리 | 들판 |
| **습지** | 물 튀는 소리 + 개구리 + 안개 드론음 | 절망의 늪 |
| **실내** | 모닥불 + 시계 째깍 + 나무 삐걱 | 해석자의 집 |
| **산** | 강한 바람 + 천둥(간헐) + 돌 굴러가는 소리 | 시내산 |
| **거룩한 장소** | 부드러운 패드 드론 + 멀리서 합창 | 십자가, 궁전 |

- 앰비언트는 BGM과 별도 레이어로 동시 재생
- FMOD에서 랜덤 간격으로 일회성 사운드 트리거 (새소리 등)

### 2.5 오디오 포맷 표준

| 유형 | 포맷 | 샘플레이트 | 비트 | 비고 |
|------|------|-----------|------|------|
| BGM | OGG Vorbis (q6) | 44.1 kHz | — | 스트리밍 재생, 파일 크기 절약 |
| SFX | WAV | 44.1 kHz | 16 bit | 빠른 로드 필요, 짧은 파일 |
| 앰비언트 (루프) | OGG Vorbis (q5) | 44.1 kHz | — | BGM과 동일 |
| 보이스 (추후) | OGG Vorbis (q7) | 44.1 kHz | — | 음질 우선 |

### 2.6 FMOD 통합 개요

Unity 6에서 FMOD를 사용하면 복잡한 오디오 동작을 코드 없이 관리할 수 있습니다.

| 기능 | FMOD 구현 |
|------|----------|
| BGM 크로스페이드 | Transition Timeline 사용 |
| 앰비언트 레이어링 | Multi-instrument + 파라미터 기반 볼륨 |
| 랜덤 SFX 변형 | Scatterer Instrument (같은 소리의 여러 변형 랜덤 재생) |
| 감정별 음악 변화 | 게임 파라미터 연동 (긴장도 0~1 → BGM 레이어 믹스) |
| 3D 사운드 (해당 시) | FMOD Spatializer (향후 3D 장면 고려) |

**FMOD 무료 라이선스**: 연 수익 $200K 미만 인디 → 무료

**대안 (FMOD 미사용 시):**
- Unity 기본 Audio Mixer + 스크립트
- 크로스페이드, 레이어링 정도는 C# 코드로 충분히 구현 가능
- 프로토타입에서는 기본 AudioSource로 시작 → 필요 시 FMOD 전환

### 2.7 음악 라이선싱 주의사항

| AI 도구 | 상업적 사용 가능 여부 | 조건 |
|---------|---------------------|------|
| Suno v4 | Pro 플랜 이상 ($10/월) 필요 | 무료 플랜 생성물은 비상업적만 가능 |
| Udio | 유료 플랜 필요 | 무료 플랜 비상업적만 |
| AIVA | Standard 이상 ($11/월) | Free 플랜은 크레딧 표기 + 비상업적 |
| Freesound.org | 라이선스별 상이 | CC0는 자유, CC BY는 크레딧 표기 필수 |

**체크리스트:**
- [ ] 사용한 모든 오디오의 라이선스 스프레드시트 관리
- [ ] CC BY 에셋은 크레딧 화면에 표기
- [ ] AI 생성 음악은 유료 플랜에서 생성 확인
- [ ] Steam 출시 전 모든 오디오 라이선스 재확인

---

## 3. 내러티브 에셋 파이프라인

### 3.1 Ink 파일 구조

```
Assets/Narrative/
├── Ink/
│   ├── main.ink                  # 글로벌 변수, include 선언
│   ├── globals.ink               # 공유 변수 (스탯, 플래그)
│   ├── chapters/
│   │   ├── ch01_city_of_destruction.ink
│   │   ├── ch02_slough_of_despond.ink
│   │   ├── ch03_worldly_wiseman.ink
│   │   ├── ch04_wicket_gate.ink
│   │   ├── ch05_interpreters_house.ink
│   │   ├── ch06_cross_and_sepulchre.ink
│   │   └── ...
│   ├── characters/
│   │   ├── christian_dialogues.ink   # 크리스천 공통 반응
│   │   └── npc_templates.ink         # NPC 대화 템플릿
│   └── systems/
│       ├── stats.ink                 # 스탯 변동 함수
│       ├── inventory.ink             # 수집 시스템
│       └── endings.ink               # 엔딩 분기 로직
```

### 3.2 Ink 작성 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| 변수 프리픽스 | 스탯: `stat_`, 플래그: `flag_`, 아이템: `item_` | `VAR stat_faith = 50` |
| 태그 활용 | 캐릭터 표시, 배경 전환, 음악 전환에 태그 사용 | `# speaker:evangelist` |
| 챕터 분리 | 챕터당 1개의 .ink 파일 | `INCLUDE chapters/ch01_...` |
| 선택지 피드백 | 모든 선택지에 스탯 변동 주석 | `+ [용기 있게 나아간다] // courage +10` |
| 한/영 키 분리 | 표시 텍스트는 로컬라이제이션 키 사용 | `{loc("ch01_greeting")}` |

#### Ink 코드 예시 (Chapter 01 일부):

```ink
=== city_of_destruction ===

# background:bg_city_of_destruction_night
# music:bgm_city_despair
# ambient:amb_city

{loc("ch01_narration_01")}

크리스천은 손에 책을 들고, 등에 무거운 짐을 진 채 서 있다.

# speaker:christian
# emotion:distressed
"이 도시가 하늘에서 내리는 불로 멸망한다고? 어떻게 해야 하지..."

+ [{loc("ch01_choice_seek_help")}]
    ~ stat_wisdom += 5
    -> seek_evangelist
+ [{loc("ch01_choice_tell_family")}]
    ~ stat_courage += 5
    -> tell_family
+ [{loc("ch01_choice_ignore")}]
    ~ stat_faith -= 10
    -> ignore_warning
```

### 3.3 story-data/ → Ink 변환 워크플로우

기존 `docs/story-data/` 마크다운 파일들은 원작의 서사 데이터를 정리한 것입니다. 이를 Ink 스크립트로 변환하는 흐름:

```
[story-data/*.md] → [시나리오 설계] → [Ink 초안 작성] → [Inky 테스트] → [Unity 통합]
     (원작 정리)      (분기/선택 설계)   (대사/선택지)     (로직 검증)    (최종 연동)
```

| story-data 파일 | 대응 Ink 챕터 | 주요 변환 작업 |
|----------------|-------------|--------------|
| 01-city-of-destruction-to-wicket-gate.md | ch01 ~ ch04 | 서사를 대화형으로 변환, 선택지 추가 |
| 02-interpreters-house-and-cross.md | ch05 ~ ch06 | 7개 방의 교훈을 인터랙티브 퍼즐로 변환 |
| 03-hill-difficulty-to-palace-beautiful.md | ch07 ~ ch09 | 분기 경로 추가, 난이도 선택 |
| 00-index-and-glossary.md | globals.ink, characters/ | 캐릭터 속성, 장소 메타데이터로 변환 |

### 3.4 테스트 워크플로우

```
1. Inky 에디터에서 Ink 작성 & 1차 테스트
   └─ 분기 로직 검증, 오타 확인, 데드엔드 체크

2. Unity로 .ink.json 컴파일 & 임포트
   └─ InkIntegration 스크립트로 Unity 이벤트 연동

3. Unity 에디터 플레이테스트
   └─ 캐릭터 표시, 배경 전환, 음악 전환 확인
   └─ 스탯 변동이 UI에 반영되는지 확인

4. 빌드 후 QA 플레이테스트
   └─ 모든 분기 경로 최소 1회 통과
   └─ 선택지 → 결과 매핑 스프레드시트로 추적
```

**분기 경로 검증 스프레드시트 예시:**

| 챕터 | 선택지 | 경로 A 결과 | 경로 B 결과 | 경로 C 결과 | 테스트 완료 |
|------|--------|-----------|-----------|-----------|-----------|
| ch01 | 도움 구하기/가족 설득/무시 | 전도자 만남 | 가족 갈등 | 경고 재등장 | ☐ |
| ch02 | 늪에서 포기/계속 전진 | 돌아감(게임오버) | 도움 NPC 등장 | — | ☐ |

### 3.5 로컬라이제이션 워크플로우

#### Unity Localization 패키지 설정

```
1. Package Manager → Unity Localization 설치
2. Localization Settings 생성
3. Locale 추가: ko (한국어), en (English)
4. String Table Collection 생성: "Dialogue", "UI", "System"
5. Ink 태그에서 로컬라이제이션 키 참조
```

#### 스트링 테이블 구조

| Key | ko | en |
|-----|-----|-----|
| ch01_narration_01 | 이 도시는 곧 멸망할 것이다... | This city shall soon be destroyed... |
| ch01_choice_seek_help | 누군가에게 도움을 구한다 | Seek help from someone |
| ch01_choice_tell_family | 가족에게 알린다 | Tell your family |
| ui_faith | 믿음 | Faith |
| ui_courage | 용기 | Courage |
| ui_wisdom | 지혜 | Wisdom |

#### 로컬라이제이션 작업 흐름

```
한국어 원본 작성 → 영어 번역 (Claude/GPT 초벌 + 수동 감수) → String Table 등록
                                                              ↓
                                                    Ink에서 키로 참조
                                                              ↓
                                                    런타임 Locale 전환
```

---

## 4. AI 도구 종합 가이드 (2026 기준)

### 4.1 이미지 생성 도구

| 도구 | 버전 | 가격 (월) | 상업적 사용 | 장점 | 단점 | 추천 용도 |
|------|------|----------|-----------|------|------|----------|
| **Midjourney** | v7 | $10 (Basic) / $30 (Standard) | 유료 플랜 OK | 최고 품질, --sref로 스타일 고정 | 웹/디스코드만, 로컬 불가 | 캐릭터 초상화, 핵심 배경 |
| **Stable Diffusion** | 3.5 | 무료 (로컬) | 완전 자유 | 로컬 실행, LoRA/ControlNet, 완전 제어 | 셋업 복잡, GPU 필요 (VRAM 8GB+) | 대량 변형 생성, 표정 변형 |
| **DALL-E** | 3 | ChatGPT Plus ($20) | OK | 프롬프트 이해도 높음, 텍스트 렌더링 | 스타일 일관성 제어 어려움 | 컨셉 아트 초기 탐색 |
| **Flux** | 1.1 Pro | API 과금 | OK | 고품질, 빠름 | API 전용, UI 없음 | 배치 작업, 파이프라인 자동화 |
| **Leonardo.ai** | — | $12 (Apprentice) | 유료 플랜 OK | 게임 에셋 특화, 타일/텍스처 | 수채화 스타일 약함 | UI 텍스처, 패턴 |

**추천 조합:**
1. **Midjourney v7** — 핵심 아트 (캐릭터, 주요 배경) 생성
2. **Stable Diffusion 3.5 + LoRA** — 변형 대량 생산, 표정 변형, 세밀 제어
3. **Krita/Photoshop** — 최종 정제

### 4.2 음악 생성 도구

| 도구 | 버전 | 가격 (월) | 상업적 사용 | 장점 | 단점 | 추천 용도 |
|------|------|----------|-----------|------|------|----------|
| **Suno** | v4 | $10 (Pro) | Pro 이상 OK | 다양한 장르, 고품질, 빠름 | 루프 포인트 제어 불가 | 메인 BGM |
| **Udio** | — | $10 (Standard) | 유료 OK | 음질 우수, 세밀한 제어 | 생성 속도 느림 | 보조 BGM, 팡파르 |
| **AIVA** | — | $11 (Standard) | Standard 이상 OK | 클래식 특화, MIDI 익스포트 | 장르 제한적 | 해석자의 집, 궁전 BGM |
| **Mubert** | — | $14 (Creator) | Creator 이상 OK | 무한 루프 앰비언트 | 멜로디 약함 | 앰비언트 배경음 |

**추천 조합:**
1. **Suno v4 Pro** ($10/월) — 모든 메인 BGM
2. **AIVA Free** — 보조 클래식 트랙 (크레딧 표기)
3. **Audacity** (무료) — 편집, 루프 처리, 노멀라이즈

### 4.3 글쓰기 보조 도구

| 도구 | 용도 | 가격 | 비고 |
|------|------|------|------|
| **Claude** | 시나리오 초안, 대사 정제, 번역 초벌 | $20/월 (Pro) | 긴 문맥 처리에 강함 |
| **GPT-4o** | 대화 자연스러움 검증, 교정 | $20/월 (Plus) | 다국어 능력 우수 |
| **DeepL** | 번역 크로스체크 | 무료/유료 | 자연스러운 번역 |

**대사 정제 프롬프트 예시:**

```
아래는 게임 '천로역정'의 대화 장면입니다.
캐릭터: [전도자] — 지혜롭고 따뜻한 노인, 성경적 언어를 자연스럽게 사용
상황: 크리스천에게 좁은 문으로 가는 길을 알려주는 장면

원본 대사: "저 빛이 보이느냐? 그리로 가라."

요청: 이 대사를 더 감정적이고 캐릭터에 맞게 다듬어주세요.
- 원작의 분위기를 유지하면서
- 현대 한국어 화자가 자연스럽게 느끼도록
- 게임 대사답게 간결하되 인상적이게
```

### 4.4 코드 보조 도구

| 도구 | 용도 | 가격 | 비고 |
|------|------|------|------|
| **Cursor AI** | 전체 개발 워크플로우, C# 코딩, 디버깅 | $20/월 (Pro) | 현재 사용 중 |
| **GitHub Copilot** | 코드 자동완성 | $10/월 | VS Code 전용 |
| **Unity Muse** | Unity 특화 AI 코딩 보조 | Unity Pro에 포함 | 공식 도구 |

### 4.5 음성 도구 (향후 계획)

| 도구 | 용도 | 가격 | 비고 |
|------|------|------|------|
| **ElevenLabs** | 캐릭터 보이스 생성 | $5/월 (Starter) | 최고 품질 TTS |
| **로컬 TTS** | 내레이션 프로토타입 | 무료 | Coqui TTS, Bark |
| **LMNT** | 게임 특화 보이스 | $25/월 | 감정 표현 우수 |

> 음성은 MVP에는 포함하지 않으며, 정식 출시 이후 DLC 또는 업데이트로 추가 검토

### 4.6 비용 종합 비교

| 카테고리 | 도구 | 월 비용 | 연간 비용 | 필수 여부 |
|---------|------|---------|----------|----------|
| 이미지 | Midjourney Standard | $30 | $360 | 강력 추천 |
| 이미지 | Stable Diffusion (로컬) | $0 | $0 | 추천 (GPU 필요) |
| 음악 | Suno Pro | $10 | $120 | 필수 |
| 글쓰기 | Claude Pro | $20 | $240 | 강력 추천 |
| 코드 | Cursor Pro | $20 | $240 | 이미 사용 중 |
| 편집 | Krita | $0 | $0 | 필수 (무료) |
| 편집 | Audacity | $0 | $0 | 필수 (무료) |
| 디자인 | Figma (무료 플랜) | $0 | $0 | 추천 |
| **합계** | | **~$80/월** | **~$960/년** | |

### 4.7 윤리적 고려사항

#### AI 생성 콘텐츠 공개

| 항목 | 권장 사항 |
|------|----------|
| 게임 내 크레딧 | "Art created with AI assistance (Midjourney, Stable Diffusion) and refined by hand" 명시 |
| 스토어 페이지 | AI 도구 사용 사실 투명하게 공개 |
| Steam 정책 | AI 생성 콘텐츠 사용 시 제출 폼에 명시 (2024년부터 의무) |
| 커뮤니티 소통 | 개발 과정에서 AI 활용 방법을 devlog로 공유 → 투명성 확보 |

#### 저작권 가이드라인

| 도구 | 저작권 소유 | 주의사항 |
|------|-----------|---------|
| Midjourney | 유료 구독자에게 귀속 | TOS 준수, 실존 인물 생성 금지 |
| Stable Diffusion | 생성자에게 귀속 | 학습 데이터 출처 논란 인지 |
| Suno/Udio | 유료 플랜 생성물 → 사용자 귀속 | 무료 플랜 생성물 주의 |
| AIVA | Standard 이상 → 사용자 귀속 | Free 플랜은 AIVA 귀속 |

**원칙:**
1. 모든 AI 생성물은 **수작업 정제** 과정을 반드시 거침 (AI는 도구, 최종 결과물은 개발자의 창작)
2. 라이선스 추적 스프레드시트를 반드시 유지
3. AI 사용 사실을 숨기지 않음 (투명성)
4. 기독교 게임으로서 정직함은 핵심 가치

---

## 5. 에셋 관리

### 5.1 Git LFS 설정

Unity 프로젝트의 대용량 바이너리 파일은 Git LFS로 관리합니다.

#### .gitattributes 설정

```gitattributes
# Images
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.kra filter=lfs diff=lfs merge=lfs -text

# Audio
*.wav filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text

# Unity
*.unity filter=lfs diff=lfs merge=lfs -text
*.prefab filter=lfs diff=lfs merge=lfs -text
*.asset filter=lfs diff=lfs merge=lfs -text
*.cubemap filter=lfs diff=lfs merge=lfs -text
*.unitypackage filter=lfs diff=lfs merge=lfs -text

# Video
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.mov filter=lfs diff=lfs merge=lfs -text

# Fonts
*.ttf filter=lfs diff=lfs merge=lfs -text
*.otf filter=lfs diff=lfs merge=lfs -text

# 3D (향후)
*.fbx filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
```

#### Git LFS 초기 설정

```bash
# Git LFS 설치 확인
git lfs install

# 현재 리포에 LFS 활성화
git lfs track "*.png" "*.jpg" "*.wav" "*.ogg"

# .gitattributes 커밋
git add .gitattributes
git commit -m "Configure Git LFS for binary assets"
```

**LFS 호스팅 옵션:**

| 서비스 | 무료 용량 | 유료 | 추천도 |
|--------|----------|------|--------|
| GitHub | 1GB 스토리지 + 1GB/월 대역폭 | $5/50GB | ★★★ |
| GitLab | 5GB | 유료 전환 | ★★★★ |
| Bitbucket | 1GB | $3/100GB | ★★★ |
| 자체 서버 | 무제한 | 서버 비용 | ★★ |

### 5.2 Unity Addressables

Addressables를 사용하면 에셋을 필요한 시점에 로드하여 초기 로딩 시간을 줄이고, 추후 DLC 배포가 용이합니다.

#### Addressable 그룹 구성

| 그룹 | 포함 에셋 | 로드 타이밍 |
|------|----------|-----------|
| `Core` | UI, 시스템 사운드, 폰트 | 앱 시작 시 |
| `Chapter_01` | ch01 배경, 캐릭터, BGM | 챕터 시작 시 |
| `Chapter_02` | ch02 배경, 캐릭터, BGM | 챕터 시작 시 |
| `Shared_Characters` | 크리스천 모든 표정 | 앱 시작 시 |
| `Shared_Audio` | 공통 SFX, 앰비언트 | 앱 시작 시 |

#### Addressable 라벨링

```
label: "chapter_01" → ch01 관련 모든 에셋
label: "character"  → 모든 캐릭터 초상화
label: "bgm"        → 모든 배경 음악
label: "sfx"        → 모든 효과음
```

### 5.3 에셋 네이밍 컨벤션 종합표

| 유형 | 접두사 | 형식 | 예시 |
|------|--------|------|------|
| 캐릭터 초상화 | `chr_` | `chr_[이름]_[감정].png` | `chr_christian_default.png` |
| 배경 | `bg_` | `bg_[장소]_[변형].png` | `bg_cross_hill_after.png` |
| UI 요소 | `ui_` | `ui_[요소]_[상태].png` | `ui_btn_choice_hover.png` |
| 아이콘 | `icon_` | `icon_[대상].png` | `icon_bible_card.png` |
| 파티클 텍스처 | `fx_` | `fx_[이름].png` | `fx_light_dust.png` |
| BGM | `bgm_` | `bgm_[장소/장면].ogg` | `bgm_city_despair.ogg` |
| SFX | `sfx_` | `sfx_[동작]_[변형].wav` | `sfx_footstep_grass_01.wav` |
| 앰비언트 | `amb_` | `amb_[환경].ogg` | `amb_forest_birds.ogg` |
| Ink 파일 | `ch##_` | `ch[번호]_[장소].ink` | `ch01_city_of_destruction.ink` |
| 프리팹 | `pf_` | `pf_[대상].prefab` | `pf_dialogue_box.prefab` |
| 머티리얼 | `mat_` | `mat_[대상].mat` | `mat_watercolor_dissolve.mat` |
| 셰이더 | `sh_` | `sh_[효과].shader` | `sh_dissolve_transition.shader` |
| 애니메이션 | `anim_` | `anim_[대상]_[동작].anim` | `anim_christian_idle.anim` |
| ScriptableObject | `so_` | `so_[유형]_[이름].asset` | `so_chapter_01_data.asset` |

### 5.4 전체 Unity 프로젝트 폴더 구조

```
Assets/
├── Art/
│   ├── Characters/           # 캐릭터 초상화
│   ├── Backgrounds/          # 배경 일러스트
│   ├── UI/                   # UI 스프라이트, 폰트
│   ├── VFX/                  # 파티클 텍스처, 머티리얼
│   └── StyleGuide/           # 스타일 가이드, LUT, 참조 이미지
│
├── Audio/
│   ├── BGM/                  # 배경 음악 (OGG)
│   ├── SFX/                  # 효과음 (WAV)
│   ├── Ambient/              # 앰비언트 루프 (OGG)
│   └── Voice/                # 음성 (향후, OGG)
│
├── Narrative/
│   ├── Ink/                  # Ink 소스 파일
│   │   ├── main.ink
│   │   ├── globals.ink
│   │   ├── chapters/
│   │   ├── characters/
│   │   └── systems/
│   └── Localization/         # String Table 에셋
│
├── Prefabs/
│   ├── UI/                   # UI 프리팹
│   ├── Characters/           # 캐릭터 표시 프리팹
│   └── Effects/              # 이펙트 프리팹
│
├── Scenes/
│   ├── MainMenu.unity
│   ├── GamePlay.unity
│   └── Loading.unity
│
├── Scripts/
│   ├── Core/                 # 게임 매니저, 씬 전환
│   ├── Narrative/            # Ink 통합, 대화 시스템
│   ├── UI/                   # UI 컨트롤러
│   ├── Audio/                # 오디오 매니저
│   ├── Stats/                # 스탯 시스템
│   ├── Save/                 # 저장/로드
│   └── Utils/                # 유틸리티
│
├── Settings/
│   ├── Addressables/         # Addressable 설정
│   ├── Localization/         # Localization 설정
│   └── Rendering/            # URP 설정
│
├── ThirdParty/
│   ├── Ink/                  # Ink Unity Integration
│   ├── FMOD/                 # FMOD (사용 시)
│   └── DOTween/              # 트윈 애니메이션
│
└── StreamingAssets/          # 런타임 로드 파일 (필요 시)
```

### 5.5 에셋 제작 체크리스트 (MVP)

#### 아트 에셋

- [ ] 스타일 가이드 시트 완성 (컬러 팔레트, 참조 이미지, 브러시 설정)
- [ ] Midjourney/SD LoRA로 스타일 참조 이미지 10장 생성 & 정제
- [ ] 크리스천 초상화 기본 + 8개 감정 변형
- [ ] NPC 초상화 5인 (전도자, 완고, 유연, 해석자, 빛나는 자)
- [ ] 배경 16장 (MVP 장소 전체)
- [ ] UI 에셋 (대화 박스, 선택지 버튼, 메뉴 화면, 스탯 표시)
- [ ] 파티클 텍스처 5종
- [ ] 타이틀 화면 일러스트

#### 오디오 에셋

- [ ] BGM 9곡 (장소별 + 전투 + 이벤트)
- [ ] SFX 20종 (UI + 대화 + 탐험 + 전투 + 연출)
- [ ] 앰비언트 6종 (환경 유형별)
- [ ] 모든 오디오 노멀라이즈 & 포맷 변환 완료
- [ ] 라이선스 추적 스프레드시트 작성 완료

#### 내러티브 에셋

- [ ] globals.ink — 변수/스탯 정의
- [ ] ch01 ~ ch06 Ink 파일 작성
- [ ] Inky에서 모든 분기 경로 테스트
- [ ] Unity Localization String Table 한국어 등록
- [ ] 영어 번역 초벌 완료
- [ ] 분기 경로 검증 스프레드시트 완성

### 5.6 에셋 생산 일정 추정 (MVP 기준)

| 단계 | 작업 | 예상 기간 | 비고 |
|------|------|----------|------|
| **1주차** | 스타일 가이드 확정, AI 프롬프트 테스트 | 1주 | LoRA 학습 포함 |
| **2~3주차** | 캐릭터 초상화 전체 (6인 + 감정 변형) | 2주 | AI 생성 + 정제 |
| **4~5주차** | 배경 일러스트 16장 | 2주 | AI 생성 + 정제 |
| **6주차** | UI 에셋 전체 | 1주 | Figma → Unity |
| **7주차** | BGM 9곡 + SFX + 앰비언트 | 1주 | AI 생성 + 편집 |
| **8~11주차** | Ink 스크립트 6챕터 | 4주 | 가장 시간 소요 |
| **12주차** | 통합 테스트 & 수정 | 1주 | QA |
| **합계** | | **약 12주 (3개월)** | 풀타임 기준 |

> 파트타임(주 20시간) 개발 시 약 6개월 예상

---

*이 문서는 에셋 파이프라인의 전체 흐름을 정의합니다. 각 에셋의 구체적 사양은 해당 단계에서 업데이트하세요.*
*관련 문서: `01-game-concept-and-vision.md`, `04-mvp-specification.md`*
