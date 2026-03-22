# 다이나믹 내러티브 연출 설계서

> 천로역정: 순례자의 여정 — Web Reboot  
> 버전: 1.0 | 최종 수정: 2026-03-19

---

## 1. 설계 철학

내러티브는 텍스트가 아니다. **플레이어가 느끼는 감정의 총합**이다.

1. **말하지 않고 보여준다** — 대사 전에 카메라, 조명, 음악, 캐릭터 동작으로 분위기를 깔아야 한다
2. **침묵은 가장 강력한 연출이다** — 모든 음악이 멈추고 1초의 정적 후 나오는 한 마디가 100줄보다 강하다
3. **선택 전에 무게를 느끼게 한다** — 중요한 선택지는 즉시 나타나지 않는다. 시간이 멈추고, 배경이 어두워지고, 선택의 무게를 체감시킨 후 나타난다
4. **감정은 곡선이다** — 긴장 → 클라이맥스 → 해소의 리듬이 모든 장면에 있어야 한다. 내내 긴장하거나 내내 평화로운 것은 둘 다 실패다
5. **게임 오버 없음이 서사를 깊게 만든다** — 잘못된 선택의 결과를 '리트라이'가 아니라 '서사'로 보여준다

참조: Undertale(텍스트 이펙트, 무음, 4번째 벽), To the Moon(감정 타이밍, 음악-서사 동기화), Omori(분위기 전환, 공포와 따뜻함의 교차), Night in the Woods(환경과 서사의 융합), Celeste(도전과 내러티브의 일체)

---

## 2. 감정 연출 시스템 (Emotion Direction System)

### 2.1 감정 팔레트

게임 전체에서 사용되는 감정 유형과 그 연출 요소.

| 감정 코드 | 감정 | 카메라 | 조명 | BGM | SFX | 텍스트 | 파티클 |
|----------|------|--------|------|-----|-----|--------|--------|
| `tense` | 긴박 | 살짝 줌인 | 어두워짐 | 빠른 템포, 저음 강조 | 심장 박동 | 빠른 타이핑 | 없음 |
| `dread` | 공포 | 느린 줌인 | 매우 어둡게 + 비네트 | 불협화음, 드론 | 바람, 속삭임 | 흔들리는 텍스트 | 어둠 입자 |
| `sorrow` | 슬픔 | 천천히 줌아웃 | 차가운 톤 | 피아노 솔로, 느림 | 빗소리 | 느린 타이핑 | 빗방울 |
| `awe` | 경외 | 줌아웃 (넓은 시야) | 밝아짐, 골든 톤 | 현악 크레센도 | 종소리 | 한 글자씩 | 빛 입자 |
| `joy` | 기쁨 | 약간 줌아웃 | 밝고 따뜻 | 경쾌한 선율 | 벨 소리 | 보통 타이핑 | 빛 입자, 꽃잎 |
| `anger` | 분노 | 줌인 (얼굴) | 붉은 틴트 | 강렬한 타악기 | 폭발음 | 크기 커지는 텍스트 | 불꽃 |
| `peace` | 평안 | 고정 | 자연광 | 잔잔한 현악+피아노 | 새소리, 바람 | 보통 타이핑 | 나뭇잎, 빛 |
| `resolve` | 결단 | 줌인 (인물) | 인물에 스포트라이트 | 단호한 멜로디 빌드업 | 검 뽑는 소리 | 강조 텍스트 | 없음 |
| `despair` | 절망 | 줌아웃 (고립감) | 극도로 어둡게 | 무음 → 저음 드론 | 쇠사슬 | 떨리는 텍스트 | 없음 |
| `grace` | 은혜 | 줌아웃 (넓은 시야) | 극적으로 밝아짐 | 풀 오케스트라 | 하프, 합창 | 한 글자씩, 빛남 | 빛 폭발 |
| `silence` | 침묵 | 고정 | 현 상태 유지 | 페이드아웃 → 무음 | 무음 | 정지 후 한 줄 | 없음 |
| `betrayal` | 배신감 | 급격한 줌인 | 색상 빠짐 (채도 감소) | 불협화음 스팅 | 유리 깨짐 | 즉시 표시 | 없음 |

### 2.2 Ink 태그 확장

```ink
// 감정 분위기 설정 (이후 모든 대사에 적용)
# MOOD: tense

// 카메라 연출
# CAMERA: zoom_in 1.5 1.0        // 배율, 지속시간(초)
# CAMERA: zoom_out 1.0 1.5
# CAMERA: pan 100 50 2.0          // 목표x, 목표y, 지속시간
# CAMERA: shake 3 0.5 4           // 강도(px), 지속시간, 횟수
# CAMERA: focus christian 1.2 0.8 // 대상, 배율, 지속시간
# CAMERA: reset 1.0               // 원래 위치로, 지속시간

// 조명/색조
# LIGHT: darken 0.3 1.0           // 밝기(0=검정, 1=원래), 지속시간
# LIGHT: brighten 1.5 0.5         // 밝기, 지속시간
# LIGHT: tint #FFD700 0.3 1.0     // 색상, 강도, 지속시간
# LIGHT: vignette 0.6 1.0         // 강도, 지속시간
# LIGHT: spotlight christian 1.0  // 대상, 지속시간
# LIGHT: reset 1.0

// 음악/사운드
# MUSIC: play ch1_tension          // BGM 재생
# MUSIC: fade_out 2.0              // 페이드아웃 (초)
# MUSIC: fade_to_silence 3.0       // 완전 무음까지 (초)
# MUSIC: crossfade ch1_peace 2.0   // 크로스페이드 전환
# MUSIC: volume 0.3 1.0            // 볼륨 변경
# MUSIC: stinger danger             // 짧은 음악 스팅 (위에 재생)
# SFX: heartbeat loop               // 효과음 루프
# SFX: heartbeat stop
# SFX: glass_break                   // 일회성 효과음
# AMBIENT: wind 0.5                  // 환경음 볼륨
# AMBIENT: silence 2.0               // 모든 환경음 페이드아웃

// 텍스트 연출
# TYPING: slow                       // 타이핑 속도 변경
# TYPING: fast
# TYPING: dramatic                   // 한 글자씩, 길게
# TYPING: instant                    // 즉시 표시
# TEXT_EFFECT: shake 0.5             // 흔들리는 텍스트 (지속시간)
# TEXT_EFFECT: wave                   // 물결 텍스트
# TEXT_EFFECT: grow                   // 점점 커지는 텍스트
# TEXT_EFFECT: color #FF0000          // 텍스트 색상 변경
# TEXT_EFFECT: center                 // 화면 중앙 대형 텍스트
# TEXT_EFFECT: italic                 // 이탈릭 (내면 독백)
# TEXT_EFFECT: reset                  // 기본으로

// 대기/타이밍
# WAIT: 1.5                          // 1.5초 대기 (연출 타이밍용)
# PAUSE: player                      // 플레이어 입력까지 대기

// 화면 전환
# TRANSITION: fade_black 1.0         // 검은색 페이드
# TRANSITION: fade_white 0.5         // 흰색 페이드 (깨달음)
# TRANSITION: iris_wipe 0.8          // 아이리스 와이프
# TRANSITION: flash 0.2              // 흰색 플래시

// 환경 변화
# WEATHER: rain start 0.5            // 비 시작, 강도
# WEATHER: rain stop 2.0             // 비 멈춤, 페이드 시간
# WEATHER: fog 0.8 3.0               // 안개, 밀도, 전환 시간
# WEATHER: clear 2.0                 // 날씨 맑아짐

// 캐릭터 연출 (character-animation-spec 참조)
# ANIM: christian pray
# EMOTE: evangelist surprise
# EMOTION: christian scared
```

### 2.3 감정 전환 타이밍 패턴

모든 내러티브 시퀀스는 다음 3박자 패턴을 따른다:

```
[빌드업] ─── 분위기 조성, 긴장 고조
    │
    ▼
[클라이맥스] ─── 감정의 정점, 핵심 순간
    │
    ▼
[해소] ─── 감정 정리, 다음으로의 전환
```

| 패턴 | 빌드업 | 클라이맥스 | 해소 |
|------|--------|-----------|------|
| 공포→안도 | 어둠+드론+느린 진행 | 충격적 등장/이벤트 | 빛+안도의 음악 |
| 긴장→결단 | BGM 빌드업+줌인 | 선택의 순간(시간 정지) | 선택 결과+BGM 전환 |
| 슬픔→감동 | 피아노+느린 타이핑 | 핵심 대사+침묵 | 빛 파티클+크레센도 |
| 일상→위기 | 평화로운 분위기 | 갑작스러운 전환(스팅) | 긴박한 새 분위기 |
| 위기→구원 | 절망적 상황 극대화 | 구원자 등장+빛 | 안도+감사의 대화 |

---

## 3. 카메라 내러티브 연출

### 3.1 카메라 기본 동작

| 상태 | 카메라 행동 |
|------|-----------|
| 탐험 | 플레이어 중심 추적, 데드존 24x16px |
| 대화 | 대화 참여자 중간점으로 부드러운 이동, 약간 줌인 (1.1x) |
| 전투 | 전투 영역 중앙 고정, 줌아웃 (0.9x) |
| 컷씬 | 스크립트 제어 (패닝, 줌, 추적 대상 변경) |

### 3.2 줌 연출

| 상황 | 줌 레벨 | 전환 시간 | 용도 |
|------|--------|----------|------|
| 일반 탐험 | 1.0x | — | 기본 |
| 대화 시작 | 1.1x | 0.5초 | 인물 집중 |
| 중요 대사 강조 | 1.3x | 0.8초 | 감정 극대화 |
| 감정적 클라이맥스 | 1.5x | 1.0초 | 최대 집중 (얼굴 클로즈업 느낌) |
| 환경 보여주기 | 0.8x | 1.5초 | 장소 전체 조감 |
| 전투 시작 | 0.9x | 0.8초 | 전투 영역 확보 |
| 십자가 해방 후 | 0.7x → 1.0x | 3.0초 | 경외감, 넓은 세계 |

### 3.3 카메라 패닝

| 상황 | 시작 | 끝 | 속도 | 용도 |
|------|------|-----|------|------|
| NPC 등장 | NPC 위치 | 플레이어와 NPC 중간 | 1.5초 | 새 인물 소개 |
| 보스 등장 | 플레이어 위치 | 보스 → 다시 플레이어 | 3.0초 | 위협 강조 |
| 장소 소개 | 입구 | 핵심 랜드마크 → 플레이어 | 2.0초 | 환경 설정 |
| 도망 장면 | 뒤쪽 | 앞쪽 (달리는 방향) | 연속 | 추격 긴장감 |

### 3.4 화면 흔들림 스펙트럼

| 레벨 | 강도 (px) | 횟수 | 지속 시간 | 트리거 |
|------|----------|------|----------|--------|
| Micro | 0.5 | 2 | 0.1초 | 대화 중 강한 감정 |
| Light | 1 | 3 | 0.2초 | 충격적 대사, 문 닫힘 |
| Medium | 2 | 4 | 0.3초 | 전투 타격, 폭발 |
| Heavy | 3 | 6 | 0.5초 | 보스 등장, 시내산 불 |
| Earthquake | 4 | 10 | 1.0초 | 건물 붕괴, 십자가 이벤트 |

### 3.5 슬로모션

| 상황 | 속도 | 지속 시간 | 용도 |
|------|------|----------|------|
| 짐 해방 순간 | 0.25x | 2.0초 | 카타르시스 극대화 |
| QTE 성공 직전 | 0.5x | 0.5초 | 승리 순간 강조 |
| 중요 선택 직후 | 0.3x | 0.8초 | 선택의 무게 체감 |
| 신실의 순교 | 0.25x | 3.0초 | 비극적 순간 |

---

## 4. 대화 연출 고도화

### 4.1 타이핑 속도 동적 변화

대화 중 감정에 따라 타이핑 속도가 자동으로 변한다.

| 감정/상황 | 기본 속도 대비 | ms/글자 | 예시 |
|----------|--------------|---------|------|
| 평상시 | 1.0x | 40 | 일반 대화 |
| 흥분/급함 | 2.0x | 20 | "빨리! 이쪽으로!" |
| 슬픔/무거움 | 0.5x | 80 | "그는... 다시 돌아오지 못했습니다..." |
| 한 글자씩 강조 | 0.2x | 200 | "나...는...망...했...도...다..." |
| 외침 | 즉시 | 0 | "화로다!" (전체 즉시 + 화면 흔들림) |
| 속삭임 | 0.7x | 55 | 작은 텍스트 + 낮은 타이핑 SFX |
| 성경 인용 | 0.6x | 65 | 금색 텍스트 + 벨 SFX |

### 4.2 텍스트 이펙트

Ink 태그로 트리거되는 특수 텍스트 렌더링.

| 이펙트 | 비주얼 | 트리거 | 사용 장면 |
|--------|--------|--------|----------|
| Shake | 각 글자가 ±1px 랜덤 진동 | `# TEXT_EFFECT: shake` | 공포, 분노, 떨림 |
| Wave | 글자가 사인파로 위아래 | `# TEXT_EFFECT: wave` | 꿈, 수중, 몽환 |
| Grow | 문장이 점점 큰 폰트로 | `# TEXT_EFFECT: grow` | 외침, 강조 |
| Shrink | 문장이 점점 작아짐 | `# TEXT_EFFECT: shrink` | 소멸, 속삭임 |
| Color | 특정 단어/구절 색 변경 | `# TEXT_EFFECT: color #hex` | 키워드 강조 |
| Glow | 텍스트에 빛 아우라 | `# TEXT_EFFECT: glow` | 신성한 대사, 성경 인용 |
| Fade In | 글자가 투명에서 불투명으로 | `# TEXT_EFFECT: fade` | 기억, 회상 |
| Typewriter Pause | 특정 위치에서 0.5초 멈춤 | `...` (말줄임표) | 주저함, 생각 |
| Center Big | 화면 중앙에 대형 텍스트 | `# TEXT_EFFECT: center` | 내레이션, 핵심 대사 |
| Italic | 기울임체 | `# TEXT_EFFECT: italic` | 내면 독백, 생각 |

### 4.3 화면 위치별 대사 표시

| 유형 | 위치 | 스타일 | 용도 |
|------|------|--------|------|
| 일반 대화 | 하단 대화 박스 | 포트레이트 + 이름 + 텍스트 | 표준 NPC 대화 |
| 내면 독백 | 상단 중앙 | 이탈릭, 반투명 배경, 자아 색상 | 크리스천의 생각 |
| 외침 | 화면 중앙 | 큰 폰트, 흔들림, 잔상 | 극적 외침 |
| 속삭임 | 화자 머리 위 말풍선 | 작은 폰트, 낮은 대비 | 비밀, 속삭임 |
| 내레이션 | 상단 전체 너비 | 세리프 스타일, 양피지 배경 | 챕터 도입, 서술 |
| 환경 텍스트 | 오브젝트 근처 | 작은 폰트, 환경 색상 | 표지판, 비문 |

### 4.4 무음 연출 (The Power of Silence)

Undertale의 핵심 기법. 가장 강렬한 순간에 모든 소리를 제거한다.

| 구성 | 설명 | 시간 |
|------|------|------|
| 1. BGM 페이드아웃 | 현재 BGM이 서서히 사라짐 | 2–3초 |
| 2. 환경음 페이드아웃 | 바람, 새소리 등 모든 소리 제거 | 1–2초 |
| 3. 완전한 침묵 | 아무 소리도 없는 순간. 대화 텍스트 타이핑 SFX도 무음 | 1–3초 |
| 4. 한 줄 | 침묵을 깨는 단 한 줄의 대사 (또는 효과음) | — |
| 5. 반응 | 그 한 줄이 끝난 후 서서히 새로운 BGM/환경음 시작 | 2초 |

**사용 위치:**
- Ch1: 크리스천이 가족을 두고 도시를 떠나는 순간
- Ch6-R6: 철창의 사나이 "오 영원이여, 영원이여!" 직전
- Ch6-B: 십자가에서 짐이 떨어지는 순간
- Ch10: 신실의 순교 직후
- Ch12: 천성 문이 열리는 순간

```ink
# MUSIC: fade_to_silence 3.0
# AMBIENT: silence 2.0
# WAIT: 2.0
# TYPING: dramatic
# TEXT_EFFECT: center
"화로다, 나는 망했도다!"
# WAIT: 1.5
# MUSIC: play evangelist_grace
# TEXT_EFFECT: reset
# TYPING: slow
```

---

## 5. 환경 내러티브 연출

### 5.1 날씨/조명 동적 변화

대화 진행에 따라 환경이 반응하여 감정을 증폭한다.

| 장면 | 시작 상태 | 변화 트리거 | 최종 상태 |
|------|----------|-----------|----------|
| Ch1 도시 탈출 | 흐린 하늘, 회색 조명 | 크리스천 결단 순간 | 저녁 노을 빛, 달리는 방향에 빛 |
| Ch2 들판 → 늪 | 밝은 들판 | 늪 진입 | 점진적 어두워짐, 녹색 안개 |
| Ch2 늪 → 구출 | 극도의 어둠, 늪 거품 | 도움 등장 | 빛 확산, 안개 걷힘 |
| Ch3 시내산 | 밝은 마을 | 불 산 접근 | 붉은 하늘, 번개, 땅 흔들림 |
| Ch4 좁은 문 | 어두운 길 | 문 두드림 → 문 열림 | 문 뒤에서 밝은 빛 쏟아짐 |
| Ch5 해석자R4 | 어두운 방 | 벽 뒤 관찰 | 불이 더 밝아짐 (은혜의 기름) |
| Ch6 십자가 | 언덕 오르기, 점점 밝아짐 | 십자가 도달 | 빛 폭발, 하얀 화면 |
| Ch8 아볼론 | 어두운 골짜기 | 보스 등장 | 붉은 하늘, 불꽃 파티클 |
| Ch9 사망의 골짜기 | 어둠 (거의 검정) | 기도 시 | 미세한 빛 (발 아래만) |
| Ch12 천성 | 몽환 → 강 → 문 | 문 도달 | 화면 전체 금빛, 파티클 폭발 |

### 5.2 환경음 레이어링

3~5개의 환경음 레이어를 동시 재생하며, 대화 분위기에 따라 개별 볼륨을 동적 조절한다.

| 레이어 | 예시 | 평상시 볼륨 | 긴박 시 | 평화 시 |
|--------|------|-----------|---------|---------|
| Base | 바람, 대기음 | 0.3 | 0.5 | 0.2 |
| Nature | 새소리, 풀벌레 | 0.2 | 0.0 | 0.4 |
| Tension | 심장박동, 저음 드론 | 0.0 | 0.4 | 0.0 |
| Sacred | 합창 허밍, 종소리 | 0.0 | 0.0 | 0.3 |
| Danger | 화염, 쇠사슬, 으르렁 | 0.0 | 0.3 | 0.0 |

```ink
# AMBIENT: base 0.5
# AMBIENT: tension 0.4
# AMBIENT: nature 0.0
```

### 5.3 화면 색조 전환 (Palette Shift)

빛의 팔레트 ↔ 어둠의 팔레트를 동적으로 블렌드.

| 값 | 상태 | 시각적 효과 |
|----|------|-----------|
| 0.0 | 완전한 어둠 팔레트 | 어둡고 차가운 색조, 채도 낮음 |
| 0.3 | 어둠 쪽 | 약간 어두운 분위기 |
| 0.5 | 중립 | 두 팔레트의 중간 |
| 0.7 | 빛 쪽 | 밝고 따뜻한 분위기 |
| 1.0 | 완전한 빛의 팔레트 | 금빛, 따뜻한 색조, 채도 높음 |

```ink
# PALETTE: 0.3 2.0    // 어둠 쪽으로 2초에 걸쳐 전환
# PALETTE: 1.0 3.0    // 빛의 팔레트로 3초에 걸쳐 전환
```

챕터별 기본 팔레트 값:

| 챕터 | 기본 팔레트 | 변동 범위 |
|------|-----------|----------|
| Ch1 멸망의 도시 | 0.3 | 0.2–0.5 |
| Ch2 들판 | 0.6 | 0.2–0.7 (늪에서 급감) |
| Ch3 시내산 | 0.2 | 0.1–0.4 (불 산에서 최저) |
| Ch4 좁은 문 | 0.5 → 0.8 | 문 통과 시 급상승 |
| Ch5 해석자의 집 | 0.6 | 0.4–0.8 (방마다 다름) |
| Ch6 십자가 | 0.5 → 1.0 | 짐 해방에서 최고 |
| Ch8 아볼론 | 0.1 | 0.05–0.3 |
| Ch9 사망의 골짜기 | 0.05 | 0.0–0.15 |
| Ch12 천성 | 0.8 → 1.0 | 입성에서 최고 |

---

## 6. 핵심 장면 연출 스크립트

### 6.1 Ch1 — "도시 탈출 결단"

**감정 목표:** 일상의 평화 → 자각의 공포 → 결단의 긴박 → 뒤돌아보지 않는 각오

```
[빌드업 — 40초]
  • PALETTE: 0.4 (회색빛 도시)
  • BGM: "city_of_destruction" (우울한 현악, 느림)
  • AMBIENT: 바람 0.3, 까마귀 0.1
  • 크리스천 집 내부, 가족과 대화
  • 가족의 반응 → 포트레이트: wife worried → angry → dismissive
  • 크리스천 포트레이트: worried → determined
  • 선택: "당장 떠나야 한다" / "좀 더 설득해보자"

[클라이맥스 — 15초]
  • 선택 후 MUSIC: fade_to_silence 2.0
  • AMBIENT: silence 1.0
  • WAIT: 1.5 (완전한 침묵)
  • 크리스천 내면 독백 (상단 이탈릭):
    "돌아볼 수 없다... 이 길을 가야만 한다..."
  • TYPING: dramatic (한 글자씩)
  • CAMERA: zoom_in 1.3 1.0

[해소 — 20초]
  • SFX: footstep_run (발소리 시작)
  • BGM: "flee_from_destruction" (긴박한 스트링)
  • 크리스천 자동 달리기 (동쪽으로)
  • CAMERA: 달리는 방향으로 약간 앞서 패닝
  • 뒤에서 가족/이웃 외침 (텍스트 버블, 점점 작아짐)
  • 크리스천 외침 (화면 중앙): "생명! 생명! 영원한 생명!"
  • TEXT_EFFECT: grow + shake
  • PALETTE: 0.4 → 0.5 (먹구름 사이로 한 줄기 빛)
```

### 6.2 Ch2 — "낙심의 늪에 빠짐"

**감정 목표:** 동행의 따뜻함 → 갑작스러운 공포 → 고립의 절망 → 구원의 손길

```
[빌드업 — 30초]
  • 들판 걷기, BGM: "open_field" (평화로운 목관+현악)
  • 유연과의 대화 (천국 묘사, 흥분)
  • PALETTE: 0.6 → 0.4 (점진적으로 어두워짐, 플레이어가 눈치채지 못하게)
  • AMBIENT: 풀벌레 0.3 → 0.1, 늪 거품 0.0 → 0.2
  • 발소리 SFX 변화: 풀밭 → 진흙

[클라이맥스 — 25초]
  • SFX: splash (빠짐)
  • CAMERA: shake Heavy + zoom_in 1.2
  • MUSIC: stinger "danger"
  • BGM: "slough_of_despond" (저음 첼로, 불안한 드론)
  • 크리스천 fall 애니메이션
  • PALETTE: 0.2 (급격히 어둠)
  • LIGHT: vignette 0.7
  • EMOTE: christian fear
  • EMOTE: pliable scared
  • 유연: "이것이 당신이 말한 행복이란 것이오?" (angry 포트레이트)
  • ANIM: pliable flee (도망)
  • 유연 퇴장 → 크리스천 홀로
  • 이동 속도 극감 (인내 QTE 시작)

  [인내 QTE — 20~30초]
    • 화면에 방향 화살표 등장
    • 성공: 조금씩 이동 + 빛 파티클
    • 실패: 더 가라앉는 연출 + 화면 더 어두워짐

[해소 — 20초]
  • SFX: hand_reach
  • 도움 등장 — 화면 우측에서 빛과 함께
  • LIGHT: spotlight help 1.0
  • PALETTE: 0.2 → 0.6 (빛 확산, 2초)
  • BGM: crossfade "help_grace" (따뜻한 피아노)
  • 도움: "네 손을 내밀어라."
  • EMOTE: christian relieved
  • ANIM: help pull (끌어올리기)
  • 크리스천 위로 올라옴
  • LIGHT: vignette 0.0 (비네트 해제)
  • 파티클: dust + light_particles
```

### 6.3 Ch6-B — "십자가 짐 해방" (THE MOMENT)

**감정 목표:** 피곤한 오르막 → 경외 → 해방의 카타르시스 → 순수한 기쁨

이 장면은 게임 전체의 정점이자, 플레이어가 30–60분간 짊어진 Burden의 해방.

```
[빌드업 — 60초]
  • 언덕 오르기 시작
  • BGM: "hill_of_the_cross" (느린 오르간, 점점 빌드업)
  • 이동 속도: burden에 의한 최대 감속 (0.5x)
  • CAMERA: 약간 줌아웃 (0.95x) — 언덕의 가파름 강조
  • 크리스천 보행 FPS 감소 (4 FPS) — 힘겨운 발걸음
  • 짐 스프라이트: 최대 크기, 흔들림 강화
  • 땀 파티클 + 숨소리 SFX (점점 거침)
  • PALETTE: 0.5 → 0.6 → 0.7 (서서히 밝아짐)
  • 단계적 조명 변화: 어둠 → 여명 → 아침 빛
  • 내면 독백 (상단 이탈릭):
    "(이 짐이... 언제쯤...)"
    "(더... 갈 수... 있을까...)"
  • TYPING: slow

[정점 접근 — 30초]
  • 십자가 실루엣이 화면 상단에 등장
  • MUSIC: volume 0.5 → 0.3 (BGM이 서서히 작아짐)
  • CAMERA: zoom_in 1.2 1.5 (크리스천에 집중)
  • AMBIENT: 바람 0.5, 나머지 무음
  • 크리스천 걸음이 더 느려짐 → 결국 멈춤
  • EMOTE: christian shine
  • 내면 독백: "이것이... 그분의 십자가..."
  • TYPING: dramatic (한 글자씩)

[클라이맥스 — THE MOMENT — 15초]
  • MUSIC: fade_to_silence 2.0
  • AMBIENT: silence 2.0
  • WAIT: 2.0 (완전한 침묵)
  
  === 짐이 떨어지는 순간 ===
  • HITSTOP: 300 (0.3초 시간 정지)
  • 짐 스프라이트: 크리스천 등에서 미끄러지기 시작
  • 슬로모션 0.25x (2초간)
  • SFX: burden_release (느린 미끄러짐 → 구름 → 쿵!)
  • 짐이 무덤 입구로 굴러감
  • CAMERA: 짐을 추적하며 줌인
  • 짐 사라짐 + 먼지 파티클 폭발
  
  === 0.5초 완전한 정적 ===
  
  === 해방 ===
  • TRANSITION: flash 0.3 (흰색 플래시)
  • 크리스천 스프라이트 → christian_free 스왑
  • PALETTE: 0.7 → 1.0 (2초, 풀 빛의 팔레트)
  • PARTICLE: holy_light (360도 방사, 50개, 3초)
  • CAMERA: zoom_out 0.7 2.0 (경외감, 넓은 세계)
  • BGM: "burden_released" (풀 오케스트라 크레센도, 합창)
  • SFX: choir_amen

[해소 — 40초]
  • 크리스천 celebrate 애니메이션 (3회 점프)
  • EMOTE: christian joy
  • 크리스천 대사 (화면 중앙, 큰 텍스트, glow):
    "그분이 자신의 슬픔으로 나에게 안식을 주셨고,"
  • WAIT: 1.5
    "자신의 죽음으로 나에게 생명을 주셨도다."
  • TEXT_EFFECT: glow + center
  
  • 빛나는 자 3명 등장 (Float 애니메이션, 빛 파티클)
  • CAMERA: zoom_in 1.1
  • 첫째: "네 죄가 사함을 받았느니라."
    # STAT: faith +20 (최대 연출)
    # TEXT_EFFECT: color #FFD700
  • 둘째: (새 옷 입혀줌 — 이미 스프라이트 교체됨을 서사로 확인)
  • 셋째: (이마에 표 + 봉인된 두루마리)
    # BIBLE_CARD: 막 2:5 (자동 수집)
    # BIBLE_CARD: 딛 2:14 (자동 수집)
  
  • BGM: crossfade "after_the_cross" (잔잔하고 평화로운 선율)
  • PALETTE: 1.0 유지
  • 크리스천 노래 (내레이션):
    "복된 십자가! 복된 무덤!"
    "나를 위해 수치를 당하신 그분이시라!"
  • CAMERA: reset 2.0
```

### 6.4 Ch8 — "아볼론 전투"

**감정 목표:** 고요한 공포 → 위협의 실체화 → 격전의 긴장 → 극적인 승리

```
[빌드업 — 30초]
  • 어두운 골짜기 진입
  • BGM: "valley_approach" (저음 현악, 불안)
  • PALETTE: 0.15
  • LIGHT: vignette 0.5
  • AMBIENT: 바람 0.4, 드론 0.2
  • 크리스천 이동 속도 자동 감소 (분위기)
  • 내면 독백: "(이 골짜기의 공기가... 무겁다...)"

[보스 등장 — 15초]
  • MUSIC: stinger "apollyon_appear"
  • CAMERA: 크리스천에서 멈춤 → 느린 패닝 위쪽 (아볼론 실루엣)
  • CAMERA: shake Heavy
  • 아볼론 32x32 스프라이트 등장, 날개 펼침 애니메이션
  • SFX: wings_unfold + roar
  • LIGHT: tint #FF2222 0.2 0.5 (붉은 틴트)
  • PALETTE: 0.1
  • 아볼론: "나는 이 세상의 왕이자 신이다!"
  • TEXT_EFFECT: shake + grow + color #FF4444
  • CAMERA: zoom_out 0.85 (전투 영역 확보)

[전투 시퀀스 — QTE 4단계]
  
  Phase 1: Mash (연타)
  • BGM: "apollyon_battle_phase1" (강렬한 전투 음악)
  • 화면 중앙에 버튼 표시 → 연타
  • 성공: 아볼론 밀려남 + slash 이펙트
  • 실패: 크리스천 밀려남 + battle_hurt
  
  Phase 2: Timing (타이밍)
  • BGM 강도 상승
  • 화면에 타이밍 원 → 정확한 타이밍에 클릭
  • 성공: shield_flash + 아볼론 stagger
  • 실패: claw_mark 이펙트 + CAMERA shake Medium
  
  Phase 3: Dodge (회피)
  • 아볼론 fire_breath + arrow_rain
  • 방향키로 회피
  • CAMERA shake 연속
  
  Phase 4: Dialogue Battle (대화 전투)
  • BGM: volume 감소
  • 아볼론의 유혹/협박 대사
  • 올바른 성경 구절 선택 (3지선다)
  • 정답: scripture_light 이펙트 + 아볼론 hurt
  • 오답: 크리스천 battle_hurt + faith -5

[승리 — 20초]
  • 아볼론 defeat 애니메이션
  • HITSTOP: 200
  • TRANSITION: flash 0.1
  • BGM: "apollyon_victory" (승리의 팡파르)
  • CAMERA: zoom_in 1.3 (크리스천)
  • 크리스천 victory 애니메이션 (검 들어올림)
  • SFX: sword_raise + light_burst
  • PALETTE: 0.1 → 0.5 (어둠 물러남)
  • PARTICLE: light (크리스천 주변)
  • 칭호 토스트: "승리자!"
  • 스탯 변화: Courage +15, Faith +10
```

---

## 7. 선택의 무게감 연출

### 7.1 선택 가중치 분류

| 가중치 | 설명 | 예시 | 연출 |
|--------|------|------|------|
| `light` | 서사에 미미한 영향 | 대화 응답 톤 선택 | 선택지 즉시 등장, 간단한 스탯 토스트 |
| `medium` | 스탯에 의미 있는 영향 | NPC 설득 방식, 방 탐색 선택 | 0.3초 대기 후 등장, 스탯 변화 애니메이션 |
| `heavy` | 서사 경로에 큰 영향 | 세상지혜씨 유혹 수락/거부, 도시 탈출 결단 | 아래 "Heavy Choice" 시퀀스 |
| `critical` | 게임 전체 서사에 핵심 | 십자가 앞 반응, 신실 관련 선택 | 아래 "Critical Choice" 시퀀스 |

### 7.2 Heavy Choice 시퀀스

```
1. 대화 텍스트 완료 후 0.5초 대기
2. CAMERA: zoom_in 1.2 0.8
3. LIGHT: darken 0.6 0.5 (배경 디밍)
4. BGM: volume 0.3 0.5 (BGM 작아짐)
5. SFX: tension_drone (저음 드론 시작)
6. 선택지 하나씩 등장 (0.5초 간격, 아래에서 위로 슬라이드)
7. 각 선택지 등장 시 짧은 "틱" SFX
8. 숨겨진 선택지(스탯 게이팅 충족 시): 마지막에 금빛 빛과 함께 등장
9. [플레이어 선택]
10. 선택된 항목 확대 + 나머지 페이드아웃 (0.3초)
11. CAMERA: reset
12. LIGHT: reset
13. SFX: tension_drone stop
14. 결과 대사 + 스탯 변화 연출
```

### 7.3 Critical Choice 시퀀스

```
1. 대화 텍스트 완료 후 1.0초 대기
2. CAMERA: zoom_in 1.4 1.0
3. LIGHT: darken 0.4 1.0 (강한 디밍)
4. BGM: fade_to_silence 2.0
5. AMBIENT: silence 1.0
6. WAIT: 1.0 (침묵)
7. 화면 가장자리에 미세한 비네트 (선택의 무게)
8. 선택지 하나씩 등장 (1.0초 간격)
9. 각 선택지: 큰 폰트 + 글자가 빛나며 등장
10. 선택지 사이에 0.5초 정적
11. [플레이어 선택]
12. HITSTOP: 100
13. 선택에 따른 화면 효과:
    - 올바른 선택 → 흰색 플래시 + 빛 파티클
    - 잘못된 선택 → 붉은 비네트 + 어둠 파티클
14. PALETTE: 즉시 변화 (±0.2)
15. 새 BGM 시작
16. 결과 시퀀스 (NPC 반응, 스탯 변화, 환경 변화)
```

### 7.4 선택 후 피드백 레이어

| 레이어 | 설명 | 타이밍 |
|--------|------|--------|
| 1. 시각 | 화면 색조 변화 (빛↔어둠) | 즉시 (0.3초 전환) |
| 2. 사운드 | BGM 스팅 + SFX | 즉시 |
| 3. 캐릭터 | NPC 포트레이트 감정 변화 + 이모트 | 0.2초 후 |
| 4. 수치 | 스탯 변화 토스트 + 바 애니메이션 | 0.5초 후 |
| 5. 대사 | NPC/크리스천 반응 대사 | 1.0초 후 |
| 6. 환경 | 날씨/조명 변화 (해당 시) | 2.0초에 걸쳐 |

---

## 8. 챕터별 감정 아크 상세

### 8.1 전체 감정 아크

```
감정
강도
 ▲
 │           ★ Ch6 십자가              ★ Ch10 순교
 │          ╱ ╲                       ╱ ╲
 │    ★ Ch3╱   ╲               ★ Ch8╱   ╲    ★ Ch12 천성
 │   ╱ 시내산    ╲ Ch7 궁전    ╱ 아볼론   ╲  ╱
 │  ╱    ╲       ╲          ╱      ╲     ╲╱
 │ ╱ Ch2  ╲ Ch4   ╲ Ch7    ╱ Ch9    ╲ Ch11╲
 │╱ 늪     ╲ 좁은문 ╲ 사자  ╱ 골짜기   ╲    ╲
 │  Ch1     ╲       ╲     ╱         ╲    ╲
 │  도시      ╲  Ch5  ╲   ╱           ╲    ╲
 │            ╲ 해석자  ╲ ╱             ╲    ╲
 ├─────────────────────────────────────────────── 시간 ▶
```

### 8.2 챕터별 감정 목표와 핵심 연출

| 챕터 | 주 감정 | 부 감정 | 핵심 연출 기법 | 클라이맥스 순간 |
|------|--------|--------|-------------|---------------|
| Ch1 | 긴박, 결단 | 두려움, 각오 | 무음 연출 → 달리기 | "생명! 생명! 영원한 생명!" |
| Ch2 | 좌절, 고립 | 안도, 감사 | 점진적 어둠 → 빛 폭발 | 도움의 손 |
| Ch3 | 유혹, 후회 | 회복, 결심 | 평화→위기 전환, 불산 연출 | "화로다, 나는 망했도다!" |
| Ch4 | 간청, 두려움 | 환영, 안도 | 어둠 속 문 두드리기 → 문 열림의 빛 | "결코 쫓겨나지 않으리라" |
| Ch5 | 궁금, 경외 | 경고, 두려움 | 방마다 다른 분위기, R6 무음 | "오 영원이여, 영원이여!" |
| Ch6 | 해방, 기쁨 | 경외, 감사 | 빌드업 → 짐 해방 슬로모션 | 짐이 떨어지는 순간 (THE MOMENT) |
| Ch7 | 도전, 안식 | 두려움(사자), 따뜻함(궁전) | 사자 소리→통과→궁전의 빛 | 궁전의 환영 |
| Ch8 | 공포, 용기 | 승리, 안도 | 보스 등장 패닝 → QTE 전투 | 아볼론 격퇴 |
| Ch9 | 극한 공포 | 작은 빛 | 화면 극도의 어둠, 소리만 | 기도로 빛 발견 |
| Ch10 | 분노, 슬픔 | 의로움, 결의 | 재판 대화 전투 → 순교 슬로모션 | 신실의 최후 |
| Ch11 | 절망, 탈출 | 깨달음, 희망 | 감옥 어둠 → 열쇠 발견의 빛 | "약속의 열쇠가 내게 있었구나!" |
| Ch12 | 두려움, 감동 | 평안, 완성 | 요단강 공포 → 문 열림의 영광 | 천성 입성 |

---

## 9. 내러티브 엔진 동작 흐름

### 9.1 Ink → 연출 파이프라인

```
InkService.continue()
    │
    ├── text (대사)
    │      └── DialogueManager.showLine()
    │              └── DialogueBox.type(text, speed, effects)
    │
    └── tags[]
           ├── # MOOD: tense
           │      └── NarrativeDirector.setMood("tense")
           │              ├── CameraController.apply(mood.camera)
           │              ├── LightingManager.apply(mood.light)
           │              ├── AudioManager.apply(mood.bgm, mood.sfx)
           │              └── ParticleManager.apply(mood.particles)
           │
           ├── # CAMERA: zoom_in 1.5 1.0
           │      └── CameraController.zoomIn(1.5, 1.0)
           │
           ├── # STAT: faith +10
           │      └── StatsManager.change('faith', 10)
           │              └── StatFeedback.show('+10 믿음', 'large')
           │
           ├── # EMOTION: christian scared
           │      └── PortraitManager.setEmotion('christian', 'scared')
           │
           ├── # EMOTE: evangelist surprise
           │      └── EmoteManager.show('evangelist', 'surprise')
           │
           ├── # ANIM: christian pray
           │      └── AnimationController.play('christian', 'pray')
           │
           ├── # WAIT: 1.5
           │      └── NarrativeDirector.wait(1500)
           │
           └── # CHOICE_WEIGHT: heavy
                  └── ChoicePresenter.setWeight('heavy')
```

### 9.2 NarrativeDirector (신규 시스템)

Ink 태그를 해석하여 카메라, 조명, 오디오, 파티클을 일괄 제어하는 오케스트레이터.

```typescript
interface NarrativeDirector {
  setMood(mood: MoodType): void;
  applyTag(tag: string): Promise<void>;
  wait(ms: number): Promise<void>;
  runSequence(steps: DirectionStep[]): Promise<void>;
}

interface MoodConfig {
  camera: { zoom?: number; shake?: ShakeConfig };
  light: { brightness?: number; tint?: string; vignette?: number };
  bgm: { track?: string; volume?: number; fadeTime?: number };
  sfx: { loop?: string };
  ambient: Record<string, number>;
  typing: { speed: TypingSpeed; effect?: TextEffect };
  particles: ParticleConfig[];
  palette: number;
}

type MoodType = 'tense' | 'dread' | 'sorrow' | 'awe' | 'joy' | 'anger' |
                'peace' | 'resolve' | 'despair' | 'grace' | 'silence' | 'betrayal';

interface DirectionStep {
  type: 'camera' | 'light' | 'music' | 'sfx' | 'ambient' | 'anim' |
        'emote' | 'emotion' | 'particle' | 'wait' | 'palette' |
        'transition' | 'weather' | 'text' | 'hitstop' | 'slowmo';
  params: Record<string, unknown>;
  duration?: number;
  parallel?: boolean;
}
```

---

## 10. 구현 우선순위

연출 시스템은 단계적으로 구현한다.

### Phase 1: 기본 (Vertical Slice)

| 시스템 | 내용 |
|--------|------|
| 타이핑 속도 변화 | normal / slow / fast / dramatic |
| 기본 카메라 줌 | zoom_in / zoom_out / reset |
| 화면 흔들림 | shake (3단계) |
| 화면 전환 | fade_black / fade_white / flash |
| 포트레이트 감정 | 기본 5종 전환 |
| MOOD 태그 | 기본 분위기 프리셋 |

### Phase 2: 강화

| 시스템 | 내용 |
|--------|------|
| 텍스트 이펙트 | shake / wave / grow / color / glow |
| 카메라 패닝 | pan to target |
| 환경 조명 | darken / brighten / tint |
| 파티클 연출 | light / dust / fire / water |
| 이모트 버블 | 12종 + 애니메이션 |
| 환경음 레이어링 | 5레이어 독립 제어 |

### Phase 3: 완성

| 시스템 | 내용 |
|--------|------|
| 슬로모션 | 시간 스케일 제어 |
| 히트스탑 | 프레임 정지 |
| 팔레트 시프트 | 동적 색조 전환 |
| 선택 가중치 | light / medium / heavy / critical 시퀀스 |
| 무음 연출 | BGM+환경음+SFX 일괄 제어 |
| NarrativeDirector | 전체 연출 오케스트레이터 |
| 핵심 장면 스크립트 | Ch1, Ch2, Ch6, Ch8 전용 시퀀스 |
