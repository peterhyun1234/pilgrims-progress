# 08. 에셋 준비 가이드 (Asset Preparation Guide)

> **대상**: 게임 개발 경험이 없지만 소프트웨어 개발에 익숙한 1인 개발자
> **전제**: 에셋을 직접 그리거나 작곡할 능력이 없으며, AI 도구와 무료 리소스를 최대한 활용
> **목표**: 12챕터 풀게임에 필요한 모든 에셋을 효율적으로 준비

---

## 1. 에셋 카테고리 총괄표

| 카테고리 | 현재 상태 | 필요량 | 우선순위 | 난이도 |
|----------|----------|--------|---------|--------|
| **Ink 스토리 (ch07-12)** | 6/12 챕터 | 6챕터 추가 | ★★★ 최우선 | 중 (AI 작성 가능) |
| **픽셀 아트 캐릭터** | 코드 생성 11종 | 20+ NPC | ★★★ 높음 | 중 |
| **타일셋** | 코드 생성 6종 | 챕터별 차별화 | ★★☆ 중간 | 중 |
| **BGM** | 0곡 | 14곡 | ★★☆ 중간 | 쉬움 (AI 생성) |
| **SFX** | 0개 | 30+개 | ★★☆ 중간 | 쉬움 |
| **UI 아트** | 코드 생성 | 개선 필요 | ★☆☆ 낮음 | 중 |
| **CG 일러스트** | 0장 | 5-7장 | ★☆☆ 낮음 | 높음 |
| **폰트** | 1개 | 2-3개 | ★☆☆ 낮음 | 쉬움 |

---

## 2. 카테고리별 상세 가이드

---

### 2.1 Ink 스토리 (내러티브 스크립트)

**현재**: ch01~ch06 완성, ch07~ch12 없음
**이 작업은 제가 직접 작성합니다.**

각 챕터 Ink 파일에 포함되는 것:
- 장소 설명 + 분위기 태그 (`# LOCATION`, `# BGM`, `# EMOTION`)
- NPC 대화 (한국어 기본, `# SPEAKER` 태그)
- 선택지 (2-4개, 스탯 영향 포함)
- 성경 구절 카드 획득 (`# BIBLE_CARD`)
- 스탯 변동 (`# STAT: faith +5`)

**파일 경로**: `Assets/_Project/Ink/chapters/ch07~ch12_*.ink`

---

### 2.2 픽셀 아트 — 캐릭터 스프라이트

**사양:**
- 크기: 16×16 픽셀 (기본), 32×32 (보스/특수)
- 방향: 4방향 (상/하/좌/우) × 2프레임 (정지/걷기) = 캐릭터당 8프레임
- 형식: PNG (투명 배경)
- 팔레트: 캐릭터당 4-6색 제한 (레트로 감성)

**필요한 캐릭터 스프라이트:**

| # | 캐릭터 | 챕터 | 특징 | 현재 상태 |
|---|--------|------|------|----------|
| 1 | 크리스천 (짐 있음) | 전체 | 누더기+등 짐 | 코드 생성 |
| 2 | 크리스천 (짐 없음) | ch06~ | 밝은 옷 | 미구현 |
| 3 | 전도자 | ch01,03 | 짙은 로브, 수염 | 코드 생성 |
| 4 | 완고 | ch01 | 붉은 로브 | 코드 생성 |
| 5 | 유연 | ch01-02 | 초록 로브 | 코드 생성 |
| 6 | 도움 | ch02 | 파란 로브 | 코드 생성 |
| 7 | 세상지혜씨 | ch03 | 보라 로브, 교활 | 코드 생성 |
| 8 | 선의 | ch04 | 금빛 로브 | 코드 생성 |
| 9 | 해석자 | ch05 | 학자, 수염 | 코드 생성 |
| 10 | 빛나는 자 ×3 | ch06 | 흰 로브, 빛남 | 미구현 |
| 11 | 신중 | ch07 | 연보라 로브, 여성 | **필요** |
| 12 | 경건 | ch07 | 진보라 로브, 여성 | **필요** |
| 13 | 사랑 | ch07 | 붉은 로브, 여성 | **필요** |
| 14 | 아볼론 | ch08 | 붉은 피부, 뿔, 날개, 32×32 | 코드 생성 |
| 15 | 신실 | ch10 | 금색 로브, 용감 | 코드 생성 |
| 16 | 소망 | ch10-12 | 하늘색 로브, 밝음 | 코드 생성 |
| 17 | 거인 절망 | ch11 | 거대, 어두운 톤, 32×32 | **필요** |
| 18 | 소심부인 | ch11 | 음침한 여성 | **필요** |
| 19 | 목자 4인 | ch11 | 흰 로브, 지팡이 | **필요** |
| 20 | 무지 | ch12 | 평범한 옷, 밝은 표정 | **필요** |
| 21 | 아첨꾼 | ch12 | 화려한 옷 | **필요** |
| 22 | 무신론자 | ch12 | 현대적 복장 | **필요** |
| 23 | 사리 | ch10 | 상인 복장 | **필요** |
| 24 | 데마 | ch10 | 반짝이는 옷 | **필요** |

#### 추천 도구 (우선순위순):

**1. Aseprite ($19.99, 최추천)**
- 픽셀 아트 전문 에디터. 업계 표준.
- 애니메이션, 팔레트 관리, 스프라이트시트 내보내기 지원
- Steam에서 구매: https://store.steampowered.com/app/431730/Aseprite/
- 또는 소스에서 무료 빌드: https://github.com/aseprite/aseprite

**2. Piskel (무료, 웹 기반)**
- https://www.piskelapp.com/
- 브라우저에서 바로 사용, 설치 불필요
- GIF 애니메이션 내보내기
- 16×16 간단한 스프라이트에 충분

**3. AI 보조 도구**

| 도구 | 용도 | 가격 | 추천도 |
|------|------|------|--------|
| **PixelLab** (pixellab.ai) | 텍스트→픽셀아트 생성 | 무료/유료 | ★★★ 16x16에 최적화 |
| **Midjourney** | 컨셉 아트 참고용 | $10/월 | ★★☆ 픽셀아트 직접 생성은 부적합, 레퍼런스용 |
| **DALL-E 3** (ChatGPT Plus) | 컨셉 아트 참고용 | $20/월 | ★★☆ 비슷하게 레퍼런스용 |
| **Stable Diffusion + LoRA** | 픽셀아트 LoRA 모델 활용 | 무료 (로컬) | ★★☆ 설정 복잡 |

#### 실전 워크플로우:

```
1. AI 도구로 캐릭터 컨셉 생성 (예: Midjourney "pixel art evangelist character, 
   dark robe, white beard, holding book, 16x16, retro RPG style")
2. AI 결과물을 참고하여 Piskel/Aseprite에서 16x16로 직접 찍기
   (16x16는 256픽셀뿐이라 AI보다 손으로 하는 게 빠를 수 있음)
3. 4방향 스프라이트 시트로 내보내기 (64×16 또는 16×64)
4. Unity에 import → Sprite Editor에서 분할
```

#### 프롬프트 예시 (PixelLab/Midjourney):

```
"16x16 pixel art RPG character sprite, [캐릭터 설명], 
top-down view, transparent background, 4-color palette, 
retro SNES style"
```

#### 무료 에셋 팩 (참고/사용):

- **itch.io 무료 에셋**: https://itch.io/game-assets/free/tag-pixel-art
  - 검색어: "16x16 RPG character", "top-down tileset"
  - 라이선스 반드시 확인 (CC0, CC-BY 등)
- **OpenGameArt**: https://opengameart.org/
  - 검색: "16x16 RPG"

---

### 2.3 픽셀 아트 — 타일셋

**사양:**
- 크기: 16×16 픽셀
- 형식: PNG
- 챕터별 고유 테마

**필요한 타일 종류:**

| 테마 | 챕터 | 기본 타일 | 특수 타일 |
|------|------|----------|----------|
| City | ch01 | 돌바닥, 벽 | 집 지붕, 문, 창문 |
| Fields | ch02 | 잔디, 흙길 | 늪(진흙+물), 디딤돌 |
| Village | ch03 | 잔디, 흙길, 벽 | 지붕, 울타리 |
| Gate | ch04 | 잔디, 돌길 | 성벽, 좁은 문, 철문 |
| Interior | ch05 | 나무 바닥 | 벽, 촛불, 커튼 |
| Hill | ch06-07 | 잔디, 돌길 | 경사 타일, 십자가 |
| DarkValley | ch08-09 | 어두운 잔디, 돌 | 절벽, 동굴, 용암/불꽃 |
| Market | ch10 | 돌바닥 | 천막, 상점, 우리 |
| Castle | ch11 | 돌바닥, 벽 | 감옥 철창, 사슬 |
| Celestial | ch12 | 빛나는 잔디 | 강(요단강), 금빛 길, 성문 |

**현재**: 6종 타일이 코드(ProceduralAssets)로 생성됨. 기능적으로 동작하지만 시각적 퀄리티 향상 필요.

#### 추천 접근법:

**옵션 A: 무료 타일셋 팩 활용 (가장 빠름)**

itch.io에서 16×16 타일셋을 검색하여 구매/다운로드:
- **"Ninja Adventure"** (무료, 방대한 RPG 타일셋) — https://pixel-boy.itch.io/ninja-adventure-asset-pack
- **"Mystic Woods"** (무료, 숲/자연) — https://game-endeavor.itch.io/mystic-woods
- **"Micro Tileset - Overworld"** 검색

장점: 즉시 사용 가능, 일관된 스타일
단점: 천로역정 특유의 분위기와 맞지 않을 수 있음

**옵션 B: AI + 수작업 혼합**

Aseprite에서 기본 타일 세트 직접 제작. 16×16 타일은 256픽셀뿐이라 초보자도 30분이면 1타일 완성 가능.

```
추천 순서:
1. 잔디 기본 타일 1개 → 변형 3개 (색상만 미세 조정)
2. 흙길 타일 1개
3. 벽 타일 1개
4. 물 타일 1개
→ 이 4개면 기본 맵은 동작함
→ 나머지는 챕터별로 점진적 추가
```

---

### 2.4 BGM (배경음악)

**사양:**
- 형식: OGG Vorbis (Unity 추천, MP3도 가능)
- 샘플레이트: 44100Hz
- 루핑: 자연스럽게 반복 가능하도록
- 길이: 1-3분 (루프)

**필요한 트랙:**

| # | 트랙명 | 용도 | 분위기 | 템포 |
|---|--------|------|--------|------|
| 1 | title_menu | 타이틀/메인메뉴 | 장엄, 희망적 | 중간 |
| 2 | prologue | 프롤로그 | 신비, 어둠→빛 | 느림 |
| 3 | ch01_city | 멸망의 도시 | 불안, 우울 | 느림 |
| 4 | ch02_fields | 들판/늪 | 자연→무거움 | 중간→느림 |
| 5 | ch03_village | 마을 | 달콤한 유혹 | 중간 |
| 6 | ch04_gate | 좁은 문 | 긴장→안도 | 중간 |
| 7 | ch05_interpreter | 해석자의 집 | 경건, 교훈적 | 느림 |
| 8 | ch06_cross | 십자가 (핵심!) | 슬픔→카타르시스 | 느림→클라이맥스 |
| 9 | ch07_hill | 어려움의 언덕 | 모험, 활기 | 빠름 |
| 10 | ch08_battle | 아볼론 전투 | 전투, 긴박 | 빠름 |
| 11 | ch09_shadow | 사망의 골짜기 | 극도의 어둠, 공포 | 매우 느림 |
| 12 | ch10_market | 허영의 시장 | 혼란→슬픔 | 다양 |
| 13 | ch11_castle | 의심의 성 | 절망→해방 | 느림→중간 |
| 14 | ch12_celestial | 천성 입성 (핵심!) | 환희, 찬양 | 장엄 |

#### 추천 도구:

**1. Suno AI (★★★ 최추천)**
- https://suno.com/
- 텍스트 프롬프트로 음악 생성
- 무료 플랜: 하루 5곡, 유료: $8/월 무제한
- **상업적 사용**: 유료 플랜에서 허용

프롬프트 예시:
```
Track 1 (title_menu):
"orchestral fantasy RPG title screen music, hopeful yet mysterious, 
choir pad, strings, harp, medieval atmosphere, loopable, 
instrumental only"

Track 6 (ch06_cross):
"emotional orchestral piece, starts sad and heavy with solo cello, 
gradually builds to triumphant climax with full orchestra and choir, 
cathartic, spiritual, medieval fantasy RPG, instrumental"

Track 8 (ch08_battle):
"intense pixel RPG boss battle music, brass fanfare, fast drums, 
heroic, 16-bit SNES style, loopable, instrumental"
```

**2. AIVA (대안)**
- https://www.aiva.ai/
- AI 작곡, 스타일/분위기 선택 가능
- 무료 플랜 있음 (상업적 사용은 유료)

**3. Soundraw (대안)**
- https://soundraw.io/
- 분위기/장르/악기/길이 설정 → AI 생성
- $16.99/월

#### 워크플로우:

```
1. Suno에서 각 챕터 분위기에 맞는 프롬프트 입력
2. 여러 변형 생성 → 가장 어울리는 것 선택
3. Audacity(무료)로 편집:
   - 루프 포인트 조정
   - 페이드 인/아웃
   - OGG로 내보내기 (128kbps)
4. Assets/_Project/Audio/BGM/ 폴더에 저장
5. AudioManager에서 챕터별 자동 로딩
```

**Audacity**: https://www.audacityteam.org/ (무료, 오디오 편집)

---

### 2.5 SFX (효과음)

**사양:**
- 형식: WAV 또는 OGG
- 모노, 44100Hz
- 길이: 0.1-2초

**필요한 효과음:**

| 카테고리 | 효과음 | 파일명 | 우선순위 |
|----------|--------|--------|---------|
| **UI** | 버튼 클릭 | sfx_ui_click.ogg | ★★★ |
| | 메뉴 열기 | sfx_ui_open.ogg | ★★☆ |
| | 메뉴 닫기 | sfx_ui_close.ogg | ★★☆ |
| | 선택지 선택 | sfx_ui_select.ogg | ★★★ |
| | 텍스트 타이핑 | sfx_ui_type.ogg | ★★☆ |
| | 저장 완료 | sfx_ui_save.ogg | ★☆☆ |
| | 카드 획득 | sfx_ui_card.ogg | ★★★ |
| | 스탯 업 | sfx_stat_up.ogg | ★★☆ |
| | 스탯 다운 | sfx_stat_down.ogg | ★★☆ |
| **환경** | 발걸음 (잔디) | sfx_step_grass.ogg | ★★★ |
| | 발걸음 (돌) | sfx_step_stone.ogg | ★★☆ |
| | 물 흐르는 소리 | sfx_water.ogg | ★☆☆ |
| | 바람 | sfx_wind.ogg | ★☆☆ |
| | 문 열림 | sfx_door_open.ogg | ★★☆ |
| | 문 닫힘 | sfx_door_close.ogg | ★☆☆ |
| **이벤트** | 짐 떨어짐 (핵심!) | sfx_burden_fall.ogg | ★★★ |
| | 전투 타격 | sfx_hit.ogg | ★★☆ |
| | 전투 방어 | sfx_block.ogg | ★☆☆ |
| | 챕터 완료 | sfx_chapter_clear.ogg | ★★☆ |
| | NPC 만남 | sfx_npc_greet.ogg | ★★☆ |
| **특수** | 아볼론 으르렁 | sfx_apollyon_roar.ogg | ★★☆ |
| | 천성 나팔 | sfx_trumpet.ogg | ★★☆ |
| | 늪 버블링 | sfx_swamp.ogg | ★☆☆ |

#### 추천 도구:

**1. jsfxr (★★★ 최추천, 무료)**
- https://sfxr.me/
- 브라우저에서 바로 레트로 SFX 생성
- 유형 선택 (코인, 폭발, 점프, 파워업 등) → 랜덤 생성 → 파라미터 조정
- WAV 다운로드
- 픽셀 아트 게임에 완벽히 어울리는 8bit/16bit 사운드

**2. Freesound.org (★★★, 무료)**
- https://freesound.org/
- CC0/CC-BY 라이선스 효과음 수만 개
- "footstep grass", "door creak", "trumpet fanfare" 검색
- 라이선스 반드시 확인!

**3. ElevenLabs Sound Effects (★★☆)**
- https://elevenlabs.io/sound-effects
- AI로 텍스트→SFX 생성
- "heavy burden falling on stone ground" 같은 프롬프트

#### 워크플로우:

```
1. jsfxr에서 UI/게임 효과음 생성 (버튼 클릭, 카드 획득 등)
2. Freesound에서 환경음 다운로드 (발걸음, 물소리 등)
3. Audacity로 편집 (트리밍, 볼륨 정규화)
4. OGG로 내보내기
5. Assets/_Project/Audio/SFX/ 폴더에 저장
```

---

### 2.6 CG 일러스트 (컷신 이미지)

**사양:**
- 크기: 1920×1080 (16:9)
- 형식: PNG 또는 JPG
- 스타일: 수채화/동화책 느낌 or 반실사 환타지

**필요한 CG (우선순위순):**

| # | 장면 | 챕터 | 중요도 | 설명 |
|---|------|------|--------|------|
| 1 | 십자가에서 짐이 떨어지는 장면 | ch06 | ★★★ | 게임의 가장 중요한 순간 |
| 2 | 천성 입성 | ch12 | ★★★ | 마지막 순간, 빛과 환희 |
| 3 | 멸망의 도시 출발 | ch01 | ★★☆ | 오프닝, 어두운 도시를 떠나는 |
| 4 | 아볼론 전투 | ch08 | ★★☆ | 거대한 악마와 대치 |
| 5 | 신실의 순교 | ch10 | ★★☆ | 감동적이고 비극적 |
| 6 | 사망의 골짜기 | ch09 | ★☆☆ | 극도로 어두운 좁은 길 |
| 7 | 요단강 건너기 | ch12 | ★☆☆ | 물속에서 빛을 향해 |

#### 추천 도구:

**1. Midjourney (★★★)**
- $10/월 기본 플랜
- 고퀄리티 환타지/동화 일러스트에 강함
- 일관된 스타일 유지를 위해 `--sref` (스타일 레퍼런스) 활용

프롬프트 예시:
```
/imagine prompt: A pilgrim with torn clothes kneeling at the foot 
of a wooden cross on a hilltop, a heavy burden rolling off his back 
into an open tomb, golden light streaming from the cross, 
watercolor storybook illustration style, spiritual, emotional, 
warm golden tones, 16:9 aspect ratio --ar 16:9 --style raw
```

**2. DALL-E 3 (ChatGPT Plus) (★★☆)**
- ChatGPT Plus ($20/월)에 포함
- 텍스트 지시를 정확히 따르는 편
- Midjourney보다 아트 퀄리티는 낮지만 접근성 좋음

**3. Stable Diffusion (무료, 로컬)**
- ComfyUI 또는 Automatic1111
- 무료지만 설정/학습 곡선 있음
- 스타일 LoRA로 일관성 유지 가능

#### 스타일 일관성 팁:

```
모든 CG에 동일한 스타일 프롬프트 접미어 사용:
"...watercolor storybook illustration, warm palette, 
soft edges, spiritual atmosphere, John Bunyan Pilgrim's Progress"
```

---

### 2.7 폰트

**현재**: NotoSansKR-Regular 1개

**추천 추가 폰트:**

| 용도 | 폰트 | 다운로드 | 라이선스 |
|------|------|---------|---------|
| 제목/강조 | Noto Sans KR Bold | fonts.google.com | OFL (무료) |
| 성경 구절 | Noto Serif KR | fonts.google.com | OFL (무료) |
| 영문 제목 | EB Garamond | fonts.google.com | OFL (무료) |
| 영문 본문 | Noto Sans | fonts.google.com | OFL (무료) |

#### 설치 방법:

```
1. https://fonts.google.com/ 에서 다운로드
2. .ttf 파일을 Assets/_Project/Fonts/ 폴더에 복사
3. Assets/_Project/Resources/ 폴더에도 복사 (런타임 로딩용)
4. KoreanFontSetup.cs에서 추가 폰트 로딩 코드 추가
```

---

## 3. 에셋 제작 우선순위 로드맵

### Phase 1: 핵심 기능 (1-2주)

```
[ ] Ink 스토리 ch07-ch12 작성 ← 제가 작성합니다
[ ] BGM 2곡: title_menu, ch06_cross (Suno AI)
[ ] SFX 5개: ui_click, ui_select, step_grass, burden_fall, card_get (jsfxr)
[ ] 폰트 추가: Noto Sans KR Bold, Noto Serif KR (Google Fonts)
```

### Phase 2: 시각 개선 (3-4주)

```
[ ] CG 일러스트 2장: 십자가, 천성 (Midjourney)
[ ] BGM 추가 6곡: ch01-05, ch07 (Suno AI)
[ ] 캐릭터 스프라이트 5종: 주요 NPC 교체 (Piskel/Aseprite)
[ ] 타일셋 업그레이드: 기본 4종 (Aseprite 또는 무료 팩)
[ ] SFX 추가 10개 (jsfxr + Freesound)
```

### Phase 3: 완성도 (5-6주)

```
[ ] CG 일러스트 나머지 5장 (Midjourney)
[ ] BGM 나머지 6곡 (Suno AI)
[ ] 캐릭터 스프라이트 15종 추가 (전체 NPC)
[ ] 타일셋 챕터별 차별화 (10 테마)
[ ] SFX 나머지 15개
[ ] 캐릭터 4방향 걷기 애니메이션
```

---

## 4. 비용 추정

| 항목 | 도구 | 비용 | 비고 |
|------|------|------|------|
| 픽셀 에디터 | Aseprite | $19.99 (1회) | 또는 Piskel 무료 |
| 음악 생성 | Suno AI | $8-10/월 × 2달 | 또는 무료 플랜으로 천천히 |
| CG 생성 | Midjourney | $10/월 × 2달 | 또는 DALL-E (ChatGPT Plus) |
| 오디오 편집 | Audacity | 무료 | |
| SFX 생성 | jsfxr | 무료 | |
| 폰트 | Google Fonts | 무료 | |
| **합계** | | **~$60-80** | 2달 기준 |

---

## 5. 파일 명명 규칙 & 폴더 구조

```
Assets/_Project/
├── Art/
│   ├── Characters/
│   │   ├── christian_burden.png     (스프라이트시트: 64×16, 4방향)
│   │   ├── christian_free.png
│   │   ├── evangelist.png
│   │   ├── obstinate.png
│   │   └── ... (캐릭터명_소문자.png)
│   ├── Tiles/
│   │   ├── tileset_city.png         (타일시트: 여러 타일 한 이미지)
│   │   ├── tileset_fields.png
│   │   └── ... (tileset_테마명.png)
│   ├── CG/
│   │   ├── cg_cross_burden.png      (1920×1080)
│   │   ├── cg_celestial_city.png
│   │   └── ... (cg_장면명.png)
│   ├── UI/
│   │   ├── panel_dialogue.png
│   │   ├── icon_faith.png
│   │   └── ... (ui요소_이름.png)
│   ├── Backgrounds/
│   │   └── bg_main_menu.png
│   └── Effects/
│       ├── particle_light.png
│       └── particle_burden.png
├── Audio/
│   ├── BGM/
│   │   ├── bgm_title_menu.ogg
│   │   ├── bgm_ch01_city.ogg
│   │   └── ... (bgm_챕터명.ogg)
│   ├── SFX/
│   │   ├── sfx_ui_click.ogg
│   │   ├── sfx_step_grass.ogg
│   │   ├── sfx_burden_fall.ogg
│   │   └── ... (sfx_카테고리_이름.ogg)
│   └── Ambient/
│       ├── amb_wind.ogg
│       └── amb_water.ogg
├── Fonts/
│   ├── NotoSansKR/
│   │   ├── NotoSansKR-Regular.ttf
│   │   └── NotoSansKR-Bold.ttf
│   └── NotoSerifKR/
│       └── NotoSerifKR-Regular.ttf
└── Ink/
    └── chapters/
        ├── ch01_city_of_destruction.ink
        ├── ...
        └── ch12_celestial_city.ink
```

#### Unity Import 설정:

**스프라이트 (캐릭터/타일):**
- Texture Type: Sprite (2D and UI)
- Pixels Per Unit: 16
- Filter Mode: Point (no filter) ← 픽셀아트 필수!
- Compression: None
- Sprite Mode: Multiple (스프라이트시트), Single (단일)

**오디오:**
- BGM: Load Type → Streaming, Compression → Vorbis, Quality 70%
- SFX: Load Type → Decompress On Load, Compression → PCM

---

## 6. 즉시 시작 체크리스트

**오늘 바로 할 수 있는 것 (15분):**
- [ ] https://sfxr.me/ 접속 → "Coin/Pickup" 클릭 → sfx_ui_click.wav 생성 → 다운로드
- [ ] https://sfxr.me/ → "Explosion" → sfx_burden_fall.wav 생성
- [ ] https://fonts.google.com/noto/specimen/Noto+Sans+KR → Bold 다운로드

**이번 주에 할 것 (2시간):**
- [ ] Suno AI 가입 → title_menu BGM 1곡 생성
- [ ] Suno AI → ch06_cross BGM 1곡 생성 (가장 중요한 곡)
- [ ] Piskel에서 16×16 테스트 캐릭터 1개 그려보기 (감 잡기용)

**해놓으면 좋은 것:**
- [ ] Midjourney 가입 → 십자가 CG 일러스트 테스트 생성
- [ ] itch.io에서 무료 16×16 타일셋 1개 다운로드하여 프로젝트에 테스트 import

---

*이 가이드는 프로젝트 진행에 따라 업데이트됩니다.*
*에셋 제작 시 라이선스를 반드시 확인하세요. 상업 배포 시 CC-BY 크레딧 표기 필요.*
