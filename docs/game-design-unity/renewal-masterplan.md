# 천로역정 (Pilgrim's Progress) — 리뉴얼 마스터플랜

> **목표**: 산나비·셀레스테·데드셀 수준의 조작감과 픽셀 아트 퀄리티를 갖춘,  
> 당장 상용 출시해도 유저가 열광할 수 있는 인디 어드벤처 게임으로 전면 리부트.

---

## 목차

| # | 섹션 | 핵심 키워드 |
|---|------|-----------|
| 0 | [Phase 0: 리뉴얼 선행 작업 — 아키텍처 기틀 다지기](#phase-0-리뉴얼-선행-작업--아키텍처-기틀-다지기) | State Machine, Input System, Data-Logic 분리 |
| 1 | [Phase 1: 내러티브 몰입도 및 대화 시스템 재구축](#phase-1-내러티브-몰입도-및-대화-시스템-재구축) | Ink 상태 관리, 대화 연출, 스킵 방지 |
| 2 | [Phase 2: 역동적 픽셀 애니메이션과 산나비급 조작감](#phase-2-역동적-픽셀-애니메이션과-산나비급-조작감) | Sprite Animation, Input Buffering, Game Feel |
| 3 | [Phase 3: 시인성 확보 및 UI/UX 전면 개편](#phase-3-시인성-확보-및-uiux-전면-개편) | Contrast, HUD, NPC Prompt, 미니맵 |
| 4 | [Phase 4: 모바일 최적화 및 크로스 플랫폼 대응](#phase-4-모바일-최적화-및-크로스-플랫폼-대응) | Pixel Perfect Camera, New Input System, Virtual Controls |
| 5 | [Phase 5: 통합 폴리싱 및 출시 준비](#phase-5-통합-폴리싱-및-출시-준비) | Juice, Audio, QA, 빌드 |

---

## Phase 0: 리뉴얼 선행 작업 — 아키텍처 기틀 다지기

> **기간**: 1~2주  
> **원칙**: 이 단계를 건너뛰면 나머지 모든 작업이 모래 위의 성이 됩니다.

### 0-1. 현재 코드베이스 진단 — 반드시 고쳐야 할 구조적 문제들

현재 프로젝트를 분석한 결과, 다음과 같은 구조적 문제가 버그와 퀄리티 저하의 근본 원인입니다.

| 문제 | 현재 상태 | 영향 |
|------|----------|------|
| **하드코딩된 캐릭터 데이터** | `DialogueUI.cs`에 화자별 색상·이름이 switch문으로 30개 이상 하드코딩 | 캐릭터 추가 시 코드 수정 필수, 버그 유발 |
| **ScriptableObject 미활용** | `ChapterDataSO`, `CharacterDataSO`, `LocationDataSO` 정의만 있고 런타임에서 미사용 | 데이터-로직 분리 실패 |
| **Singleton 남발** | 14개 이상의 매니저가 각자 Singleton 패턴 사용 | 의존성 추적 불가, 테스트 불가 |
| **UI 전체 코드 생성** | `PrologueUI`, `DialogueUI`, `MainMenuUI` 등 UI를 전부 C# 코드로 런타임 생성 | 에디터에서 시각적 확인 불가, 레이아웃 튜닝 극난이도 |
| **입력 처리 분산** | `PlayerInputHandler`가 씬 종속, `Update()`에서 매 프레임 null 체크 | 입력 누락, 모바일 대응 곤란 |

### 0-2. 아키텍처 리팩터링 — "관계도" 재설계

```
┌─────────────────────────────────────────────────────┐
│                    Bootstrap.cs                      │
│  (RuntimeInitializeOnLoadMethod — 모든 것의 시작)     │
└──────────────┬──────────────────────────────────────┘
               │ 생성 & ServiceLocator 등록
               ▼
┌──────────────────────────────────────────────────────┐
│              Core Service Layer (DontDestroyOnLoad)   │
│                                                       │
│  GameStateManager ←→ InputManager ←→ AudioManager     │
│       ↕                   ↕               ↕           │
│  SaveManager    DialogueManager    ChapterManager     │
│       ↕                   ↕                           │
│  QuestStateManager  StatsManager                      │
└──────────────────────────────────────────────────────┘
               │
               ▼  ScriptableObject (데이터 레이어)
┌──────────────────────────────────────────────────────┐
│  CharacterDataSO[]  ChapterDataSO[]  LocationDataSO[] │
│  QuestDataSO[]      DialogueConfigSO   AudioDataSO[]  │
│  (에디터에서 수정 → 코드 변경 없이 콘텐츠 확장)         │
└──────────────────────────────────────────────────────┘
               │
               ▼  Scene-Specific Layer
┌──────────────────────────────────────────────────────┐
│  PlayerController  ←→  PlayerStateMachine             │
│  DialogueUI (Prefab)    ExplorationHUD (Prefab)       │
│  TopDownCamera (Cinemachine)                          │
│  InteractionDetector    NPCInteractable               │
└──────────────────────────────────────────────────────┘
```

### 0-3. GameStateManager 재설계 — 모든 상태 버그의 종착역

```csharp
// 기존 GameManager.GameState를 더 세분화하고, 전이(Transition) 규칙을 명시합니다.
public enum GameState
{
    Boot,
    MainMenu,
    Loading,
    Exploration,     // 탐색 중
    Dialogue,        // 대화 중
    Choice,          // 선택지 표시 중
    Challenge,       // QTE/미니게임 중
    Cutscene,        // 컷씬 재생 중
    Paused,
    Epilogue
}

public class GameStateManager : MonoBehaviour
{
    public event Action<GameState, GameState> OnStateChanged;
    
    public GameState Current { get; private set; }
    public GameState Previous { get; private set; }

    // 허용된 전이만 가능하게 제한 — 불법 전이를 막아 버그 원천 차단
    private static readonly Dictionary<GameState, HashSet<GameState>> _validTransitions = new()
    {
        { GameState.Exploration, new() { GameState.Dialogue, GameState.Challenge, 
                                          GameState.Cutscene, GameState.Paused } },
        { GameState.Dialogue,    new() { GameState.Choice, GameState.Exploration, 
                                          GameState.Cutscene } },
        { GameState.Choice,      new() { GameState.Dialogue } },
        { GameState.Challenge,   new() { GameState.Exploration, GameState.Cutscene } },
        { GameState.Cutscene,    new() { GameState.Exploration, GameState.Dialogue } },
        { GameState.Paused,      new() { GameState.Exploration, GameState.Dialogue, 
                                          GameState.Challenge } },
    };

    public bool TryChangeState(GameState next)
    {
        if (Current == next) return false;
        if (!_validTransitions.TryGetValue(Current, out var valid) || !valid.Contains(next))
        {
            Debug.LogWarning($"[State] 불법 전이 차단: {Current} → {next}");
            return false;
        }

        Previous = Current;
        Current = next;
        OnStateChanged?.Invoke(Previous, Current);
        return true;
    }
}
```

### 0-4. QuestStateManager — 대화 반복 버그의 근본 해결

```csharp
[CreateAssetMenu(menuName = "PilgrimsProgress/Quest Data")]
public class QuestDataSO : ScriptableObject
{
    public string questId;
    public string inkKnotName;
    public string[] prerequisiteQuestIds;
    public string[] rewardBibleCardIds;
}

public class QuestStateManager : MonoBehaviour
{
    // 퀘스트 상태: 각 NPC 대화의 완료 여부를 영구 추적
    private Dictionary<string, QuestStatus> _questStates = new();

    public enum QuestStatus { Locked, Available, InProgress, Completed }

    public QuestStatus GetStatus(string questId)
    {
        return _questStates.TryGetValue(questId, out var s) ? s : QuestStatus.Locked;
    }

    public bool TryStartQuest(string questId)
    {
        if (GetStatus(questId) != QuestStatus.Available) return false;
        _questStates[questId] = QuestStatus.InProgress;
        return true;
    }

    public void CompleteQuest(string questId)
    {
        _questStates[questId] = QuestStatus.Completed;
        OnQuestCompleted?.Invoke(questId);
        // 후속 퀘스트 잠금 해제 검사
        UnlockDependentQuests(questId);
    }

    public event Action<string> OnQuestCompleted;
    
    private void UnlockDependentQuests(string completedId) { /* 선행 조건 검사 */ }
}
```

### 0-5. ScriptableObject 활용 전환 — 데이터와 로직의 철저한 분리

**현재 문제**: `DialogueUI.cs`에 화자 색상이 하드코딩, `ChapterDatabase`에 챕터 정보가 코드로 존재

**해결**: 모든 콘텐츠 데이터를 ScriptableObject로 이관

```csharp
[CreateAssetMenu(menuName = "PilgrimsProgress/Character Data")]
public class CharacterDataSO : ScriptableObject
{
    public string characterId;
    public string nameKey_ko;
    public string nameKey_en;
    public Color plateColor;
    public Color nameColor;
    public Color panelTint;
    public Sprite[] emotionPortraits;  // 인덱스: enum Emotion
    public AudioClip voiceSfx;         // 대화 시 재생할 음성/효과음
    
    // 기존 DialogueUI의 switch문 30줄을 이 에셋 하나로 대체
    public string GetLocalizedName(string lang) 
        => lang == "ko" ? nameKey_ko : nameKey_en;
}

// 사용 측 (DialogueUI.cs)
// Before: switch(speaker) { case "Apollyon": return new Color(0.90f, 0.30f, 0.25f); ... }
// After:
Color nameColor = _characterDatabase.Get(speakerId).nameColor;
```

**에디터 워크플로우**: 유니티 에디터에서 `Create > PilgrimsProgress > Character Data`로 캐릭터별 에셋을 만들고, Inspector에서 색상/초상화/이름을 시각적으로 편집.

---

## Phase 1: 내러티브 몰입도 및 대화 시스템 재구축

> **기간**: 2~3주  
> **목표**: "텍스트를 멍하니 넘기는 게임"에서 "한 줄 한 줄이 기대되는 게임"으로.

### 1-1. 대화 반복 버그 근본 해결

#### 원인 분석

현재 `NPCInteractable.cs`에서 NPC와 대화를 시작할 때:

```
NPCInteractable.OnInteract() → InkService.JumpToKnot() → InkService.Continue()
```

문제는 **대화 완료 상태가 영구 저장되지 않는다**는 점입니다. `NPCOrderManager`로 순서를 관리하고 있지만, 씬 재진입이나 세이브/로드 시 상태가 리셋되어 동일 대화가 반복됩니다.

#### 해결 구조: Dialogue State Machine

```csharp
public class DialogueStateTracker
{
    // Ink의 내장 상태 저장 + 커스텀 플래그 조합
    private HashSet<string> _completedKnots = new();
    private Dictionary<string, int> _knotVisitCounts = new();

    public bool HasCompleted(string knotName) => _completedKnots.Contains(knotName);
    public int GetVisitCount(string knotName) 
        => _knotVisitCounts.TryGetValue(knotName, out int c) ? c : 0;

    public void MarkCompleted(string knotName)
    {
        _completedKnots.Add(knotName);
        _knotVisitCounts[knotName] = GetVisitCount(knotName) + 1;
    }

    // SaveManager와 연동
    public string Serialize() => JsonUtility.ToJson(new SavePayload
    {
        completedKnots = _completedKnots.ToArray(),
        // + Ink의 story.state.ToJson() 로 Ink 내부 변수 상태도 함께 저장
    });
}
```

#### NPCInteractable 개선

```csharp
public class NPCInteractable : Interactable
{
    [SerializeField] private string _inkKnotName;
    [SerializeField] private string _completedKnotName; // 대화 완료 후 전환될 knot
    [SerializeField] private NPCData _npcData;

    public override void Interact(PlayerController player)
    {
        var tracker = ServiceLocator.Get<DialogueStateTracker>();
        var inkService = ServiceLocator.Get<InkService>();
        
        // 이미 완료된 대화라면 → 완료 후 대사(짧은 인사) 재생
        string targetKnot = tracker.HasCompleted(_inkKnotName) 
            ? _completedKnotName 
            : _inkKnotName;

        if (string.IsNullOrEmpty(targetKnot)) return;

        inkService.JumpToKnot(targetKnot);
        
        // 상태 전이: Exploration → Dialogue
        ServiceLocator.Get<GameStateManager>().TryChangeState(GameState.Dialogue);
        inkService.Continue();
    }
}
```

#### Ink 스크립트 측 패턴

```ink
=== evangelist_first_meeting ===
# SPEAKER: Evangelist
# EMOTION: compassionate
# BGM: theme_evangelist

{ evangelist_met:
    // 이미 만난 적 있으면 짧은 인사
    크리스천, 여정은 순조롭나?
    -> DONE
}

~ evangelist_met = true
전도자가 크리스천에게 다가온다...
// ... 첫 만남 대화 전개 ...
~ quest_complete("meet_evangelist")
-> DONE
```

### 1-2. 스토리 몰입을 위한 대화 UI/UX 연출 7대 기법

#### 기법 1: "무의식적 참여" 타이핑 리듬

타이핑 속도를 감정에 따라 동적으로 변화시켜 플레이어가 무의식적으로 텍스트에 집중하게 만듭니다.

```csharp
public class EmotionalTypewriter
{
    // 감정별 타이핑 프로파일
    private static readonly Dictionary<string, TypeProfile> _profiles = new()
    {
        { "normal",      new(0.03f, 1.0f, false) },
        { "angry",       new(0.02f, 0.5f, true)  },  // 빠르고 짧은 멈춤 → 격앙
        { "sad",         new(0.06f, 2.0f, false) },   // 느리고 긴 멈춤 → 침울
        { "scared",      new(0.04f, 1.5f, true)  },   // 중간 속도 + 떨림
        { "whispering",  new(0.07f, 1.2f, false) },   // 매우 느림 → 속삭임
        { "shouting",    new(0.015f, 0.3f, false) },   // 극도로 빠름 → 외침
    };

    public struct TypeProfile
    {
        public float charDelay;
        public float punctuationMultiplier;
        public bool enableShake;
        
        public TypeProfile(float delay, float punctMult, bool shake)
        {
            charDelay = delay;
            punctuationMultiplier = punctMult;
            enableShake = shake;
        }
    }
}
```

#### 기법 2: 화면 연출 동기화 (Screen Direction Sync)

대화 태그로 카메라·배경·효과를 동시에 제어합니다.

```ink
# SPEAKER: Apollyon
# EMOTION: threatening
# SHAKE: 0.3, 0.5         // 카메라 흔들림
# ZOOM: 3.0               // 줌인
# BGM: battle_apollyon
# TINT: 0.2, 0.05, 0.05   // 화면 붉은 틴트
# LETTERBOX: 1             // 시네마틱 레터박스

나는 이 길의 왕이다. 네가 여기를 지나갈 수 있을 거라 생각했느냐!
```

```csharp
// DialogueDirector.cs — 기존 DialogueController를 확장
public class DialogueDirector : MonoBehaviour
{
    private TopDownCamera _camera;
    private AudioManager _audio;

    public void ProcessTag(InkTag tag)
    {
        switch (tag.Type)
        {
            case "SHAKE":
                var parts = tag.Value.Split(',');
                float mag = float.Parse(parts[0].Trim());
                float dur = float.Parse(parts[1].Trim());
                _camera.Shake(mag, dur);
                break;

            case "ZOOM":
                float targetZoom = float.Parse(tag.Value);
                _camera.SetZoomTarget(targetZoom);
                break;

            case "LETTERBOX":
                float amount = float.Parse(tag.Value);
                _camera.SetLetterbox(amount);
                break;

            case "TINT":
                // 화면 전체에 색조 오버레이
                var rgb = tag.Value.Split(',');
                ApplyScreenTint(new Color(
                    float.Parse(rgb[0].Trim()),
                    float.Parse(rgb[1].Trim()),
                    float.Parse(rgb[2].Trim()), 0.3f));
                break;

            case "WAIT":
                // 의도적 멈춤 — 긴장감 조성
                StartCoroutine(WaitBeforeContinue(float.Parse(tag.Value)));
                break;
        }
    }
}
```

#### 기법 3: 스킵 방지 — "참여형 텍스트 진행"

**핵심 원칙**: 스킵 버튼을 없애는 것이 아니라, 스킵하고 싶지 않게 만드는 것.

| 기법 | 구현 | 효과 |
|------|------|------|
| **Beat 시스템** | 긴 대사 중간에 0.3~0.5초 자연 멈춤 삽입 | 읽기 리듬 생성, 무의식적 집중 |
| **Reaction Shot** | NPC 대사 중 플레이어 캐릭터의 미세 표정 변화 | "내 캐릭터도 반응하네?" → 몰입 |
| **Interactive Moment** | 핵심 대사에서 터치/클릭 요구 (말풍선 흔들림) | 수동적 읽기 → 능동적 참여 |
| **Choice Preview** | 선택지 등장 2줄 전부터 상단에 힌트 표시 | "선택이 온다" → 앞 대사 집중 |
| **음성 Bark** | 전체 더빙 대신 캐릭터별 짧은 음성(2~3음절) 재생 | 캐릭터 존재감 + 대사 리듬감 |

```csharp
// Beat 시스템 구현
private IEnumerator TypewriterWithBeats(string text)
{
    _isTyping = true;
    _dialogueText.text = "";
    int visibleCount = 0;

    for (int i = 0; i < text.Length; i++)
    {
        if (_skipRequested) { _dialogueText.text = text; break; }

        // Rich text 태그 건너뛰기
        if (text[i] == '<')
        {
            int close = text.IndexOf('>', i);
            if (close > i) { i = close; continue; }
        }

        visibleCount++;
        _dialogueText.maxVisibleCharacters = visibleCount;

        // Beat 마커: 텍스트 내 {beat}를 만나면 잠시 멈춤
        if (text.Length > i + 6 && text.Substring(i, 6) == "{beat}")
        {
            i += 5; // {beat} 스킵
            yield return new WaitForSecondsRealtime(0.4f);
            continue;
        }

        float delay = GetCharDelay(text[i]);
        yield return new WaitForSecondsRealtime(delay);
    }

    _isTyping = false;
    ShowContinueIndicator();
}
```

#### 기법 4: 대화 UI Prefab 전환 — 코드 생성에서 에디터 기반으로

**Before** (현재): `DialogueUI.cs`에서 `BuildExtraControls()`, `BuildPortraitUI()` 등 UI를 코드로 생성  
**After**: Prefab 기반으로 전환

```
Assets/_Project/Prefabs/UI/
├── DialoguePanel.prefab        // 메인 대화 패널
│   ├── SpeakerPlate            // 화자 이름 영역
│   ├── DialogueText (TMP)      // 본문
│   ├── PortraitContainer       // 초상화 (좌측)
│   ├── ContinueIndicator       // ▼ 계속 아이콘
│   ├── ChoiceContainer         // 선택지 버튼 그룹
│   │   ├── ChoiceButton_0
│   │   ├── ChoiceButton_1
│   │   └── ChoiceButton_2
│   ├── TapHint                 // "탭하여 계속"
│   └── SkipButton              // "대화 종료"
├── BibleCardPopup.prefab       // 성경 카드 팝업
└── QuestCompleteToast.prefab   // 퀘스트 완료 토스트
```

#### 기법 5: 캐릭터 표정 연동 시스템

```csharp
// CharacterPortraitController.cs
public class CharacterPortraitController : MonoBehaviour
{
    [SerializeField] private Image _portraitImage;
    [SerializeField] private Animator _portraitAnimator; // 초상화 미세 애니메이션

    private CharacterDataSO _currentCharacter;

    public void SetCharacter(CharacterDataSO data, string emotion)
    {
        if (_currentCharacter != data)
        {
            _currentCharacter = data;
            PlayEntranceAnimation();
        }

        // ScriptableObject에서 감정별 초상화 로드
        Sprite portrait = data.GetExpression(emotion);
        if (portrait != null)
        {
            _portraitImage.sprite = portrait;
            // 표정 전환 시 미세 애니메이션 (펀치 스케일)
            _portraitAnimator.SetTrigger("EmotionChange");
        }
    }

    private void PlayEntranceAnimation()
    {
        // DOTween 또는 코루틴으로 슬라이드 인
        _portraitAnimator.SetTrigger("SlideIn");
    }
}
```

#### 기법 6: Ink + 커스텀 Tag 확장 시스템

기존 `InkTagParser`를 확장하여 연출 태그를 체계적으로 관리합니다.

```csharp
// InkDirectionTag.cs — 연출 태그 정의
public enum DirectionTagType
{
    Speaker, Emotion, Location,
    BGM, SFX, Ambient,
    Shake, Zoom, Letterbox, Tint,
    CG, Transition, Wait,
    Stat, Burden, BibleCard,
    
    // 새로 추가
    Beat,           // 의도적 멈춤
    Flash,          // 화면 플래시
    ParticleEffect, // 파티클 효과 (비, 눈, 빛줄기 등)
    CameraTarget,   // 카메라가 특정 오브젝트를 비추기
    Bark,           // 캐릭터 짧은 음성 재생
}
```

#### 기법 7: 대화 로그(History) 시스템

셀레스테의 일기장처럼, 지나간 대화를 돌아볼 수 있게 합니다.

```csharp
public class DialogueHistory
{
    private List<DialogueRecord> _records = new();
    private const int MaxRecords = 200;

    public void Record(string speaker, string text, string emotion, string location)
    {
        _records.Add(new DialogueRecord
        {
            speaker = speaker,
            text = text,
            emotion = emotion,
            location = location,
            timestamp = Time.time,
            chapter = ChapterManager.Instance?.CurrentChapter ?? 0
        });

        if (_records.Count > MaxRecords)
            _records.RemoveAt(0);
    }

    // UI에서 스크롤로 열람 가능
    public IReadOnlyList<DialogueRecord> GetRecords() => _records;
}
```

---

## Phase 2: 역동적 픽셀 애니메이션과 산나비급 조작감

> **기간**: 3~4주  
> **목표**: "걷기만 하는 캐릭터"에서 "보는 것만으로 즐거운 캐릭터"로.

### 2-1. 애니메이션 스프라이트 시트 구성 가이드

#### 필수 애니메이션 목록 (우선순위 기준)

| 우선도 | 애니메이션 | 프레임 수 | 방향 | 비고 |
|--------|-----------|----------|------|------|
| ★★★ | Idle (기본 서기) | 4 | 4방향 | 미세한 숨쉬기 + 옷 펄럭임 |
| ★★★ | Idle 변형 (주위 둘러보기) | 6 | 4방향 | 3.5초 대기 후 자동 재생 |
| ★★★ | Walk | 6 | 4방향 | 2프레임 컨택트, 2프레임 패싱 |
| ★★★ | Run/Sprint | 6 | 4방향 | Walk보다 보폭 넓고 팔 크게 |
| ★★☆ | Interact/Pickup | 4 | 4방향 | 손 뻗기 → 집기 |
| ★★☆ | Talk (대화 중) | 4 | 1방향(정면) | 입 움직임 + 고개 끄덕 |
| ★★☆ | Push/Pull | 4 | 2방향(좌우) | 무거운 물건 밀기 |
| ★★☆ | Hurt/Hit | 3 | 1방향 | 타격 리액션 |
| ★☆☆ | Attack (지팡이) | 5 | 4방향 | 산나비의 빠릿한 1프레임 임팩트 |
| ★☆☆ | Block/Guard | 3 | 1방향 | 방패 들기 (순례자의 갑주) |
| ★☆☆ | Pray | 6 | 1방향 | 무릎 꿇기 → 기도 (스킬 시전) |
| ★☆☆ | Celebrate | 4 | 1방향 | 손 들기 → 기뻐하기 |
| ★☆☆ | Fall/Stumble | 4 | 1방향 | 낙하/넘어짐 |
| ★☆☆ | Climb | 4 | 1방향 | 사다리/절벽 오르기 |

#### 스프라이트 시트 레이아웃 (16×16 기준)

```
Row 0: Idle Down     [F0][F1][F2][F3]
Row 1: Idle Left     [F0][F1][F2][F3]
Row 2: Idle Right    [F0][F1][F2][F3]
Row 3: Idle Up       [F0][F1][F2][F3]
Row 4: Walk Down     [F0][F1][F2][F3][F4][F5]
Row 5: Walk Left     [F0][F1][F2][F3][F4][F5]
Row 6: Walk Right    [F0][F1][F2][F3][F4][F5]
Row 7: Walk Up       [F0][F1][F2][F3][F4][F5]
Row 8: Run Down      [F0][F1][F2][F3][F4][F5]
Row 9: Run Left      [F0][F1][F2][F3][F4][F5]
Row 10: Run Right    [F0][F1][F2][F3][F4][F5]
Row 11: Run Up       [F0][F1][F2][F3][F4][F5]
Row 12: Attack Down  [F0][F1][F2][F3][F4]
Row 13: Attack Left  [F0][F1][F2][F3][F4]
Row 14: Attack Right [F0][F1][F2][F3][F4]
Row 15: Attack Up    [F0][F1][F2][F3][F4]
Row 16: Interact     [F0][F1][F2][F3]
Row 17: Hurt         [F0][F1][F2]
Row 18: Pray         [F0][F1][F2][F3][F4][F5]
Row 19: Celebrate    [F0][F1][F2][F3]
```

### 2-2. Unity Animator State Machine — 프로 수준 설정

현재 `PlayerAnimator.cs`는 코드로 프레임을 직접 교체하는 방식입니다. 이를 Unity Animator Controller 기반으로 전환하여 **전환(Transition)의 부드러움과 정밀 제어**를 확보합니다.

#### Animator Controller 구조

```
                    ┌──────────────────┐
                    │   Any State      │
                    │                  │
                    │  ─→ Hurt (높은 우선순위, 인터럽트 가능)
                    └──────────────────┘

    ┌─────────┐     ┌──────────┐     ┌──────────┐
    │  Idle   │◄───►│  Walk    │◄───►│   Run    │
    │ (Blend  │     │ (Blend   │     │ (Blend   │
    │  Tree)  │     │  Tree)   │     │  Tree)   │
    └────┬────┘     └──────────┘     └──────────┘
         │                                 
         ▼                                 
    ┌─────────┐     ┌──────────┐     ┌──────────┐
    │Interact │     │  Attack  │     │  Pray    │
    │         │     │ (Blend   │     │          │
    │         │     │  Tree)   │     │          │
    └─────────┘     └──────────┘     └──────────┘
```

#### Blend Tree 활용 — 방향별 자연스러운 전환

```
Idle Blend Tree (2D Simple Directional):
  Parameter: MoveX, MoveY
  
  (0, -1) → idle_down
  (-1, 0) → idle_left
  (1, 0)  → idle_right
  (0, 1)  → idle_up
  
Walk Blend Tree:
  동일 구조, walk 애니메이션 클립 연결
```

#### Animator 파라미터

| 파라미터 | 타입 | 용도 |
|---------|------|------|
| `Speed` | Float | 0=Idle, 0~0.5=Walk, 0.5~1=Run |
| `MoveX` | Float | 방향 X (-1~1) |
| `MoveY` | Float | 방향 Y (-1~1) |
| `IsMoving` | Bool | 이동 중 여부 |
| `IsSprinting` | Bool | 달리기 여부 |
| `Attack` | Trigger | 공격 시 |
| `Interact` | Trigger | 상호작용 시 |
| `Hurt` | Trigger | 피격 시 |
| `Pray` | Trigger | 기도 시 |

#### Transition 설정 — 산나비급 반응성의 핵심

```
산나비·셀레스테·데드셀의 공통점: 입력 → 동작 시작까지 0~1프레임 딜레이

■ Idle → Walk
  - Has Exit Time: OFF (즉시 전환)
  - Transition Duration: 0 (픽셀 게임은 블렌딩 없이 즉시 전환이 더 좋음)
  - Condition: IsMoving == true

■ Walk → Run
  - Has Exit Time: OFF
  - Transition Duration: 0
  - Condition: IsSprinting == true

■ Any State → Attack
  - Has Exit Time: OFF
  - Transition Duration: 0
  - Can Transition To Self: false
  - Condition: Attack (Trigger)

■ Attack → Idle
  - Has Exit Time: ON (공격 애니메이션 완료 후)
  - Exit Time: 1.0
  - Transition Duration: 0
```

**핵심 규칙**: 픽셀 게임에서 Transition Duration은 **항상 0**으로 설정합니다. 3D 게임의 부드러운 블렌딩은 픽셀 아트에서는 흐릿한 유령 같은 이미지를 만들 뿐입니다.

### 2-3. PlayerAnimatorController.cs — Animator 연동 스크립트

기존 `PlayerAnimator.cs`를 Animator 기반으로 교체합니다.

```csharp
[RequireComponent(typeof(Animator))]
[RequireComponent(typeof(SpriteRenderer))]
public class PlayerAnimatorController : MonoBehaviour
{
    private Animator _animator;
    private SpriteRenderer _sr;
    private PlayerController _controller;

    private static readonly int HashSpeed = Animator.StringToHash("Speed");
    private static readonly int HashMoveX = Animator.StringToHash("MoveX");
    private static readonly int HashMoveY = Animator.StringToHash("MoveY");
    private static readonly int HashIsMoving = Animator.StringToHash("IsMoving");
    private static readonly int HashIsSprinting = Animator.StringToHash("IsSprinting");
    private static readonly int HashAttack = Animator.StringToHash("Attack");
    private static readonly int HashInteract = Animator.StringToHash("Interact");
    private static readonly int HashHurt = Animator.StringToHash("Hurt");
    private static readonly int HashPray = Animator.StringToHash("Pray");

    private void Awake()
    {
        _animator = GetComponent<Animator>();
        _sr = GetComponent<SpriteRenderer>();
        _controller = GetComponent<PlayerController>();
        
        // 픽셀 게임: 애니메이터 업데이트를 UnscaledTime으로
        // (일시정지 메뉴에서도 Idle 애니메이션이 재생되도록)
        _animator.updateMode = AnimatorUpdateMode.Normal;
    }

    private void Update()
    {
        if (_controller == null) return;

        Vector2 facing = _controller.FacingDirection;
        float speed = _controller.IsMoving ? (_controller.IsSprinting ? 1f : 0.5f) : 0f;

        _animator.SetFloat(HashSpeed, speed);
        _animator.SetFloat(HashMoveX, facing.x);
        _animator.SetFloat(HashMoveY, facing.y);
        _animator.SetBool(HashIsMoving, _controller.IsMoving);
        _animator.SetBool(HashIsSprinting, _controller.IsSprinting);
    }

    public void TriggerAttack() => _animator.SetTrigger(HashAttack);
    public void TriggerInteract() => _animator.SetTrigger(HashInteract);
    public void TriggerHurt() => _animator.SetTrigger(HashHurt);
    public void TriggerPray() => _animator.SetTrigger(HashPray);

    // 애니메이션 이벤트에서 호출 (공격 히트 프레임 등)
    public void OnAttackHitFrame()
    {
        // 히트박스 활성화, SFX 재생, 화면 흔들림
        ServiceLocator.Get<AudioManager>()?.PlaySFX("sfx_attack_hit");
        TopDownCamera.Instance?.Shake(0.1f, 0.15f);
    }
}
```

### 2-4. 산나비급 조작감의 비밀 — Input Buffering & Coyote Time

#### Input Buffer (입력 버퍼)

산나비·셀레스테에서 점프 버튼을 "약간 일찍" 눌러도 정확히 점프가 되는 이유:

```csharp
public class InputBuffer
{
    private struct BufferedInput
    {
        public string actionName;
        public float timestamp;
    }

    private Queue<BufferedInput> _buffer = new();
    private const float BufferWindow = 0.15f; // 150ms 버퍼

    public void BufferAction(string actionName)
    {
        _buffer.Enqueue(new BufferedInput
        {
            actionName = actionName,
            timestamp = Time.time
        });
    }

    public bool ConsumeAction(string actionName)
    {
        // 만료된 입력 정리
        while (_buffer.Count > 0 && Time.time - _buffer.Peek().timestamp > BufferWindow)
            _buffer.Dequeue();

        // 버퍼에서 해당 액션 검색
        var temp = new Queue<BufferedInput>();
        bool found = false;

        while (_buffer.Count > 0)
        {
            var input = _buffer.Dequeue();
            if (!found && input.actionName == actionName)
                found = true;
            else
                temp.Enqueue(input);
        }

        _buffer = temp;
        return found;
    }
}
```

#### 타격감(Game Feel) 3종 세트

```csharp
public class GameFeelManager : MonoBehaviour
{
    // 1. Hitstop (프레임 정지) — 타격 순간 시간을 0.05초 멈춤
    public void Hitstop(float duration = 0.05f)
    {
        StartCoroutine(HitstopCoroutine(duration));
    }

    private IEnumerator HitstopCoroutine(float duration)
    {
        Time.timeScale = 0f;
        yield return new WaitForSecondsRealtime(duration);
        Time.timeScale = 1f;
    }

    // 2. Impact Frame — 타격 순간 1프레임 흰색 플래시
    public void ImpactFlash(SpriteRenderer target, float duration = 0.05f)
    {
        StartCoroutine(FlashCoroutine(target, duration));
    }

    private IEnumerator FlashCoroutine(SpriteRenderer sr, float duration)
    {
        Material originalMat = sr.material;
        sr.material = _flashMaterial; // 흰색 셰이더 마테리얼
        yield return new WaitForSecondsRealtime(duration);
        sr.material = originalMat;
    }

    // 3. Knockback + Squash & Stretch
    public void ApplyKnockback(Transform target, Vector2 direction, float force = 2f)
    {
        var rb = target.GetComponent<Rigidbody2D>();
        if (rb != null)
            rb.AddForce(direction.normalized * force, ForceMode2D.Impulse);

        // Squash & Stretch
        StartCoroutine(SquashStretch(target));
    }

    private IEnumerator SquashStretch(Transform t)
    {
        float duration = 0.15f;
        float elapsed = 0f;
        Vector3 original = t.localScale;

        while (elapsed < duration)
        {
            elapsed += Time.deltaTime;
            float progress = elapsed / duration;
            
            // 초반: 가로 늘림 + 세로 줄임 (Squash)
            // 후반: 원래대로 (Stretch)
            float xScale = 1f + Mathf.Sin(progress * Mathf.PI) * 0.2f;
            float yScale = 1f - Mathf.Sin(progress * Mathf.PI) * 0.15f;
            t.localScale = new Vector3(original.x * xScale, original.y * yScale, original.z);
            
            yield return null;
        }

        t.localScale = original;
    }

    [SerializeField] private Material _flashMaterial;
}
```

### 2-5. PlayerController 개선 — 움직임 자체의 쾌감

```csharp
// PlayerController.cs 핵심 개선 사항

// 1. 가속/감속 커브 적용 — 즉시 최고 속도가 아닌 부드러운 가속
[Header("Acceleration")]
[SerializeField] private float _accelerationTime = 0.08f;  // 0→최고속 도달 시간
[SerializeField] private float _decelerationTime = 0.05f;  // 최고속→0 도달 시간
[SerializeField] private AnimationCurve _accelerationCurve = AnimationCurve.EaseInOut(0, 0, 1, 1);

private float _currentSpeedFactor = 0f;

private void FixedUpdate()
{
    float targetFactor = _moveInput.sqrMagnitude > 0.01f ? 1f : 0f;
    
    if (targetFactor > _currentSpeedFactor)
        _currentSpeedFactor = Mathf.MoveTowards(_currentSpeedFactor, targetFactor, 
            Time.fixedDeltaTime / _accelerationTime);
    else
        _currentSpeedFactor = Mathf.MoveTowards(_currentSpeedFactor, targetFactor, 
            Time.fixedDeltaTime / _decelerationTime);

    float speed = CalculateSpeed() * _accelerationCurve.Evaluate(_currentSpeedFactor);
    if (IsSprinting) speed *= _sprintMultiplier;
    
    _rb.linearVelocity = _moveInput.normalized * speed;
}

// 2. 방향 전환 시 미끄러짐 방지
// 산나비의 핵심: 방향 전환이 즉각적
private void Update()
{
    // ... 기존 입력 처리 ...
    
    // 방향키를 반대로 누르면 즉시 방향 전환 (관성 제거)
    if (_moveInput.sqrMagnitude > 0.01f)
    {
        Vector2 newDir = _moveInput.normalized;
        float dot = Vector2.Dot(newDir, FacingDirection);
        if (dot < -0.5f) // 반대 방향 입력
        {
            _currentSpeedFactor *= 0.3f; // 빠른 감속 후 재가속
        }
    }
}
```

### 2-6. 픽셀 아트 애니메이션 제작 실전 팁

| 원칙 | 설명 | 참고 작품 |
|------|------|----------|
| **Subpixel Animation** | 1픽셀 단위의 미세한 움직임으로 생동감 부여 | Dead Cells의 Idle |
| **Anticipation Frame** | 동작 전 반대 방향으로 1프레임 준비 동작 | 산나비의 공격 |
| **Smear Frame** | 빠른 동작에 1프레임의 잔상/모션 블러 삽입 | 셀레스테의 대시 |
| **Overshoot** | 동작 끝에 1프레임 과장 후 복귀 | 모든 명작 공통 |
| **Secondary Motion** | 머리카락, 망토, 짐짝이 캐릭터 동작에 1~2프레임 지연 추종 | Dead Cells의 걷기 |
| **12 FPS 원칙** | 픽셀 게임에서 12fps가 애니메이션의 "매직 넘버" | 업계 표준 |

#### 크리스천(주인공) 특수 애니메이션 제안

| 상황 | 애니메이션 | 연출 |
|------|-----------|------|
| 짐(Burden) 있을 때 | 등에 짐이 무겁게 출렁이며 걸음 느림 | 짐 크기가 Burden 수치에 비례 |
| 십자가에서 짐 벗을 때 | 짐이 굴러 떨어지며 크리스천이 펄쩍 뜀 | 게임 최고의 카타르시스 순간 |
| 기도할 때 | 무릎 꿇고 손 모으기, 빛줄기 파티클 | Faith 스탯 증가 연동 |
| 강 건널 때 | 물에 잠기며 허우적, 점차 빛으로 가득 | 최종 챕터 클라이맥스 |

---

## Phase 3: 시인성 확보 및 UI/UX 전면 개편

> **기간**: 2~3주  
> **목표**: "어디를 봐야 할지 모르는 화면"에서 "한눈에 읽히는 화면"으로.

### 3-1. 시인성(Visibility) 향상 — 아트 디렉팅 핵심 원칙

#### 레이어별 명도/채도 분리 전략

```
Layer 구성 (뒤→앞 순서):

[Layer 0] 원경 배경 (하늘, 산)    — 채도 低, 명도 低, 블러 약간
[Layer 1] 중경 배경 (건물, 나무)   — 채도 中, 명도 中
[Layer 2] 지면/타일맵             — 채도 中, 명도 中~高
[Layer 3] ★ 캐릭터/NPC/아이템 ★  — 채도 高, 명도 高, 외곽선 뚜렷
[Layer 4] 전경 (풀, 안개)         — 반투명, 채도 低
[Layer 5] UI 오버레이              — 최상위
```

#### 핵심 대비(Contrast) 규칙

```csharp
// 캐릭터 외곽선(Outline) 셰이더 — 배경과의 분리
Shader "Custom/PixelOutline"
{
    Properties
    {
        _MainTex ("Sprite", 2D) = "white" {}
        _OutlineColor ("Outline Color", Color) = (0.1, 0.08, 0.15, 1)
        _OutlineWidth ("Outline Width", Float) = 1
    }
    SubShader
    {
        Tags { "RenderType"="Transparent" "Queue"="Transparent" }
        
        Pass
        {
            // 주변 픽셀 체크 → 투명이면 외곽선 색 출력
            // 캐릭터가 어떤 배경 위에 있어도 항상 선명하게 보임
        }
    }
}
```

#### 환경별 시인성 자동 조절

```csharp
// VisibilityManager.cs — 배경 밝기에 따라 캐릭터 외곽선 자동 조절
public class VisibilityManager : MonoBehaviour
{
    [SerializeField] private Material _outlineMaterial;

    public void OnLocationChanged(LocationDataSO location)
    {
        // 어두운 지역(Valley of Shadow): 캐릭터에 미세한 발광 추가
        if (location.isDarkArea)
        {
            _outlineMaterial.SetColor("_OutlineColor", new Color(0.8f, 0.7f, 0.5f, 0.8f));
            _outlineMaterial.SetFloat("_OutlineWidth", 1.5f);
        }
        else
        {
            _outlineMaterial.SetColor("_OutlineColor", new Color(0.1f, 0.08f, 0.15f, 1f));
            _outlineMaterial.SetFloat("_OutlineWidth", 1f);
        }
    }
}
```

### 3-2. HUD 전면 재설계

#### 디자인 철학: "읽히는 것이 아니라 느껴지는 UI"

셀레스테·하데스의 HUD 공통점: **최소한의 정보만, 캐릭터와 어울리는 아트 스타일로.**

#### HUD 레이아웃

```
┌──────────────────────────────────────────────────────┐
│ [좌상단]                              [우상단]        │
│ ┌─────────┐                     ┌──────────────┐    │
│ │ 📜 Ch.3 │                     │ ⚔ Faith  ███░│    │
│ │ 산넘어  │                     │ 🛡 Courage██░│    │
│ │   마을   │                     │ 📖 Wisdom █░░│    │
│ └─────────┘                     │ ⛓ Burden ██░│    │
│                                  └──────────────┘    │
│                                                       │
│                                                       │
│                    [게임 화면]                          │
│                                                       │
│                                                       │
│ [좌하단]                              [우하단]        │
│ ┌───────┐                        ┌──────────────┐    │
│ │미니맵 │                        │ [E] 대화하기  │    │
│ │(접이식)│                        │              │    │
│ └───────┘                        └──────────────┘    │
└──────────────────────────────────────────────────────┘

모바일일 때:
┌──────────────────────────────────────────────────────┐
│ [좌상단]                              [우상단]        │
│  Ch.3 산넘어마을                 ⚔██░ 🛡██░ 📖█░   │
│                                                       │
│                                                       │
│                    [게임 화면]                          │
│                                                       │
│                                                       │
│ [좌하단]                              [우하단]        │
│  🕹️ (가상                         [💬] [🗡️]        │
│    조이스틱)                       [🏃] [📖]        │
│                                                       │
└──────────────────────────────────────────────────────┘
```

#### 스탯 바 구현 — 픽셀 아트 스타일

```csharp
public class PixelStatBar : MonoBehaviour
{
    [SerializeField] private Image _fillImage;
    [SerializeField] private Image _backgroundImage;
    [SerializeField] private Image _iconImage;
    [SerializeField] private TextMeshProUGUI _valueText;

    [Header("Style")]
    [SerializeField] private Gradient _fillGradient;
    [SerializeField] private float _smoothSpeed = 5f;

    private float _displayValue;
    private float _targetValue;

    public void SetValue(float normalized)
    {
        _targetValue = Mathf.Clamp01(normalized);
    }

    private void Update()
    {
        // 부드러운 게이지 감소/증가 — 데드셀 스타일
        _displayValue = Mathf.Lerp(_displayValue, _targetValue, _smoothSpeed * Time.deltaTime);
        _fillImage.fillAmount = _displayValue;
        _fillImage.color = _fillGradient.Evaluate(_displayValue);

        // 값 변화 시 펀치 스케일 애니메이션
        if (Mathf.Abs(_displayValue - _targetValue) > 0.01f)
        {
            float pulse = 1f + Mathf.Sin(Time.time * 15f) * 0.03f;
            transform.localScale = Vector3.one * pulse;
        }
        else
        {
            transform.localScale = Vector3.one;
        }
    }
}
```

### 3-3. NPC 상호작용 프롬프트 — "자연스럽게 뜨는" UX

#### 현재 문제

현재 `InteractionDetector.cs`가 `CircleCollider2D` 트리거로 근처 Interactable을 감지하지만, 프롬프트 UI가 단순한 텍스트이고 위치/디자인이 직관적이지 않습니다.

#### 개선된 상호작용 프롬프트 시스템

```csharp
public class InteractionPromptUI : MonoBehaviour
{
    [Header("References")]
    [SerializeField] private Canvas _worldSpaceCanvas;
    [SerializeField] private CanvasGroup _promptGroup;
    [SerializeField] private Image _buttonIcon;
    [SerializeField] private TextMeshProUGUI _actionText;
    [SerializeField] private Image _backgroundBubble;

    [Header("Icons")]
    [SerializeField] private Sprite _keyboardIcon;     // [E] 키 아이콘
    [SerializeField] private Sprite _gamepadIcon;      // (A) 버튼 아이콘
    [SerializeField] private Sprite _touchIcon;        // 탭 아이콘

    [Header("Animation")]
    [SerializeField] private float _fadeSpeed = 8f;
    [SerializeField] private float _bobAmplitude = 2f; // 위아래 흔들림
    [SerializeField] private float _bobFrequency = 2f;
    
    private Transform _targetTransform;
    private Vector3 _offset = new Vector3(0, 1.5f, 0); // NPC 머리 위
    private bool _isShowing;
    private float _alpha;

    public void Show(Interactable target, string actionName = null)
    {
        _targetTransform = target.transform;
        _isShowing = true;

        // 입력 장치에 따라 아이콘 자동 전환
        var inputHandler = PlayerInputHandler.Instance;
        if (inputHandler != null)
        {
            switch (inputHandler.CurrentScheme)
            {
                case ControlScheme.KeyboardMouse:
                    _buttonIcon.sprite = _keyboardIcon;
                    break;
                case ControlScheme.Gamepad:
                    _buttonIcon.sprite = _gamepadIcon;
                    break;
                case ControlScheme.Touch:
                    _buttonIcon.sprite = _touchIcon;
                    break;
            }
        }

        // 상호작용 타입에 따라 텍스트 자동 설정
        _actionText.text = actionName ?? GetDefaultActionName(target);
    }

    public void Hide()
    {
        _isShowing = false;
        _targetTransform = null;
    }

    private void Update()
    {
        // 페이드 인/아웃
        float targetAlpha = _isShowing ? 1f : 0f;
        _alpha = Mathf.Lerp(_alpha, targetAlpha, _fadeSpeed * Time.deltaTime);
        _promptGroup.alpha = _alpha;

        if (_targetTransform == null) return;

        // 월드 스페이스에서 NPC 머리 위에 위치
        Vector3 worldPos = _targetTransform.position + _offset;
        
        // 위아래 약간 흔들림 (생동감)
        worldPos.y += Mathf.Sin(Time.time * _bobFrequency) * _bobAmplitude / 16f;
        
        transform.position = worldPos;
    }

    private string GetDefaultActionName(Interactable target)
    {
        bool isKo = GetCurrentLanguage() == "ko";
        return target switch
        {
            NPCInteractable => isKo ? "대화하기" : "Talk",
            ItemInteractable => isKo ? "줍기" : "Pick up",
            SignInteractable => isKo ? "읽기" : "Read",
            PortalInteractable => isKo ? "이동하기" : "Enter",
            _ => isKo ? "조사하기" : "Examine"
        };
    }
    
    private string GetCurrentLanguage()
    {
        return ServiceLocator.TryGet<Localization.LocalizationManager>(out var lm) 
            ? lm.CurrentLanguage : "ko";
    }
}
```

#### NPC 머리 위 말풍선 인디케이터

```csharp
// NPCIndicator.cs — NPC 위에 표시되는 퀘스트/대화 가능 아이콘
public class NPCIndicator : MonoBehaviour
{
    [SerializeField] private SpriteRenderer _indicatorSprite;

    [Header("Indicator Sprites")]
    [SerializeField] private Sprite _questAvailable;    // ! (노란색)
    [SerializeField] private Sprite _questInProgress;   // ? (회색)
    [SerializeField] private Sprite _questComplete;     // ? (노란색)
    [SerializeField] private Sprite _talkAvailable;     // 💬 (말풍선)
    [SerializeField] private Sprite _talkCompleted;     // 없음 (숨김)

    private float _bobTimer;

    public void SetState(NPCIndicatorState state)
    {
        _indicatorSprite.sprite = state switch
        {
            NPCIndicatorState.QuestAvailable => _questAvailable,
            NPCIndicatorState.QuestInProgress => _questInProgress,
            NPCIndicatorState.QuestComplete => _questComplete,
            NPCIndicatorState.TalkAvailable => _talkAvailable,
            _ => null
        };
        _indicatorSprite.enabled = _indicatorSprite.sprite != null;
    }

    private void Update()
    {
        if (!_indicatorSprite.enabled) return;

        _bobTimer += Time.deltaTime * 2f;
        float offset = Mathf.Sin(_bobTimer) * 0.06f; // 미세한 위아래
        _indicatorSprite.transform.localPosition = new Vector3(0, 1.2f + offset, 0);
    }
}

public enum NPCIndicatorState
{
    None, QuestAvailable, QuestInProgress, QuestComplete, TalkAvailable
}
```

### 3-4. 미니맵 시스템

```csharp
public class MinimapController : MonoBehaviour
{
    [SerializeField] private Camera _minimapCamera;
    [SerializeField] private RenderTexture _minimapRT;
    [SerializeField] private RawImage _minimapDisplay;
    [SerializeField] private Image _playerDot;

    [Header("Settings")]
    [SerializeField] private float _minimapZoom = 15f;
    [SerializeField] private bool _rotateWithPlayer = false;

    private Transform _playerTransform;

    private void LateUpdate()
    {
        if (_playerTransform == null) return;

        // 미니맵 카메라가 플레이어를 따라다님
        Vector3 pos = _playerTransform.position;
        pos.z = -10f;
        _minimapCamera.transform.position = pos;
        _minimapCamera.orthographicSize = _minimapZoom;
    }

    public void ToggleMinimap()
    {
        _minimapDisplay.gameObject.SetActive(!_minimapDisplay.gameObject.activeSelf);
    }
}
```

**미니맵 렌더링 최적화**:
- 별도 레이어(`Minimap`)에 간략화된 타일맵/아이콘 배치
- `RenderTexture`는 128×128 해상도면 충분
- 미니맵 카메라의 `Culling Mask`를 Minimap 레이어만으로 제한

### 3-5. UI 구현 Best Practice — UGUI vs UI Toolkit

| 기준 | UGUI (Canvas) | UI Toolkit |
|------|--------------|------------|
| 게임 내 HUD | ★★★ 추천 | ○ 가능 |
| 대화 UI | ★★★ 추천 | ○ 가능 |
| 메뉴/설정 | ★★ 좋음 | ★★★ 추천 |
| 월드 스페이스 UI | ★★★ 추천 | ✕ 불가 |
| 모바일 가상 조이스틱 | ★★★ 추천 | ✕ 불가 |
| 에디터 툴 UI | ✕ 불가 | ★★★ 추천 |

**결론**: 게임 내 UI는 **UGUI(Canvas)**로 통일. 월드 스페이스 프롬프트와 모바일 컨트롤 모두 UGUI로 구현해야 합니다.

#### Canvas 최적화 규칙

```
1. Canvas 분리 원칙 — 변경 빈도별로 Canvas를 분리
   ├── [Static Canvas]   챕터 이름, 미니맵 프레임   (거의 안 변함)
   ├── [Dynamic Canvas]  스탯 바, 위치 텍스트        (가끔 변함)
   └── [Overlay Canvas]  대화 패널, 토스트 메시지     (자주 변함)

2. Raycast Target 끄기 — 상호작용 불필요한 Image/Text는 모두 OFF
3. TextMeshPro 사용 — 기본 Text 대신 TMP (이미 사용 중이므로 유지)
4. Layout Group 최소화 — 복잡한 레이아웃은 Anchor로 직접 배치
```

---

## Phase 4: 모바일 최적화 및 크로스 플랫폼 대응

> **기간**: 2~3주  
> **목표**: "PC에서만 돌아가는 게임"에서 "어디서든 쾌적한 게임"으로.

### 4-1. 카메라 시스템 완전 재구축 — 화면 떨림 근절

#### 현재 문제 진단

현재 `TopDownCamera.cs` 분석 결과:

| 문제 | 원인 | 증상 |
|------|------|------|
| 화면 떨림 (Jitter) | `LateUpdate`에서 `Vector3.Lerp` 후 `SnapToPixelGrid`를 하지만, 캐릭터는 `FixedUpdate`에서 이동 | 캐릭터와 카메라의 업데이트 타이밍 불일치 |
| 줌 시 PixelPerfect 비활성화 | `_pixelPerfect.enabled = !needsZoomControl` | 줌 중 픽셀 깨짐 |
| Shake 후 좌표 어긋남 | `transform.position += _shakeOffset`이 SnapToPixelGrid 이후에 적용 | Shake 종료 후 1프레임 튀는 현상 |

#### 해결: Cinemachine + Pixel Perfect Camera 조합

```csharp
// CameraSystem.cs — 완전 재설계된 카메라 시스템
using Cinemachine;

public class CameraSystem : MonoBehaviour
{
    [Header("Cinemachine")]
    [SerializeField] private CinemachineVirtualCamera _explorationCam;
    [SerializeField] private CinemachineVirtualCamera _dialogueCam;
    [SerializeField] private CinemachineVirtualCamera _cinematicCam;

    [Header("Pixel Perfect")]
    [SerializeField] private PixelPerfectCamera _pixelPerfect;

    [Header("Shake")]
    [SerializeField] private CinemachineImpulseSource _impulseSource;
    
    private CinemachineBrain _brain;

    private void Awake()
    {
        _brain = GetComponent<CinemachineBrain>();
        
        // ★ 핵심 설정 1: Update Method를 Smart Update로
        // Cinemachine이 카메라 대상(FixedUpdate 기반 Rigidbody)의 
        // 업데이트 타이밍을 자동 감지하여 동기화
        _brain.m_UpdateMethod = CinemachineBrain.UpdateMethod.SmartUpdate;

        // ★ 핵심 설정 2: Blend Update Method
        _brain.m_BlendUpdateMethod = CinemachineBrain.BrainUpdateMethod.FixedUpdate;
    }

    public void SetupExplorationCamera(Transform player)
    {
        _explorationCam.Follow = player;
        
        // Transposer 설정 — 부드러운 팔로우
        var transposer = _explorationCam.GetCinemachineComponent<CinemachineFramingTransposer>();
        if (transposer != null)
        {
            transposer.m_XDamping = 1f;    // 수평 감쇠
            transposer.m_YDamping = 1f;    // 수직 감쇠
            transposer.m_ScreenX = 0.5f;   // 화면 중앙
            transposer.m_ScreenY = 0.5f;
            transposer.m_DeadZoneWidth = 0.1f;  // 데드존 (약간의 여유)
            transposer.m_DeadZoneHeight = 0.1f;
        }
    }

    // ★ 의도된 화면 흔들림만 허용 — Cinemachine Impulse 사용
    public void Shake(float force = 0.5f)
    {
        _impulseSource.GenerateImpulse(force);
    }

    // 대화 모드: 줌인 + 두 캐릭터 사이 포커스
    public void EnterDialogueCamera(Transform speaker)
    {
        _dialogueCam.Follow = speaker;
        _dialogueCam.Priority = 20; // 높은 우선순위 → 자동 전환
        _explorationCam.Priority = 10;
    }

    public void ExitDialogueCamera()
    {
        _explorationCam.Priority = 20;
        _dialogueCam.Priority = 10;
    }
}
```

#### Pixel Perfect Camera 설정 (Inspector)

```
■ Pixel Perfect Camera 컴포넌트 설정:
  Assets Pixels Per Unit: 16
  Reference Resolution: 320 × 180
  Grid Snapping: Pixel Snapping         ← 핵심! 모든 스프라이트를 픽셀 격자에 정렬
  Crop Frame: Pillarbox                 ← 가로 비율이 안 맞을 때 양쪽 검은 바
  Stretch Fill: OFF                      ← 절대 늘리지 않음
  
■ Cinemachine Virtual Camera 설정:
  Body: Framing Transposer
  Aim: Do Nothing
  Add Extension: CinemachinePixelPerfect  ← 이것이 핵심! 
  Add Extension: CinemachineImpulseListener
```

#### CinemachinePixelPerfect Extension

```csharp
// Cinemachine에 Pixel Perfect 스냅핑을 적용하는 커스텀 Extension
[AddComponentMenu("")]
public class CinemachinePixelPerfect : CinemachineExtension
{
    private PixelPerfectCamera _ppCamera;

    protected override void Awake()
    {
        base.Awake();
        _ppCamera = FindFirstObjectByType<PixelPerfectCamera>();
    }

    protected override void PostPipelineStageCallback(
        CinemachineVirtualCamera vcam,
        CinemachineCore.Stage stage,
        ref CameraState state,
        float deltaTime)
    {
        if (stage != CinemachineCore.Stage.Body) return;
        if (_ppCamera == null) return;

        // Cinemachine의 출력 위치를 픽셀 그리드에 스냅
        Vector3 pos = state.FinalPosition;
        float ppu = _ppCamera.assetsPPU;
        pos.x = Mathf.Round(pos.x * ppu) / ppu;
        pos.y = Mathf.Round(pos.y * ppu) / ppu;
        state.PositionCorrection += pos - state.FinalPosition;
    }
}
```

#### 화면 떨림 완전 해결 체크리스트

```
□ 캐릭터 이동: Rigidbody2D + FixedUpdate
□ Cinemachine Brain Update Method: Smart Update
□ Pixel Perfect Camera: Grid Snapping = Pixel Snapping
□ 모든 스프라이트: Pixels Per Unit = 16 (통일)
□ 모든 스프라이트: Filter Mode = Point (No Filter)
□ 모든 스프라이트: Compression = None
□ Camera Orthographic Size: 정수 또는 RefResY/(2*PPU) = 5.625
□ 카메라 Z 위치: 항상 정수 (-10)
□ Shake는 Cinemachine Impulse만 사용 (직접 position 조작 금지)
□ URP Asset: Anti Aliasing = None (픽셀 게임에서는 AA 불필요)
```

### 4-2. 입력 시스템 아키텍처 — PC/모바일 완전 통합

#### New Input System 기반 설계

```
InputSystem_Actions.inputactions
├── Player (Action Map)
│   ├── Move          (Value, Vector2)     — WASD, 가상 조이스틱
│   ├── Sprint        (Button)             — Shift, 모바일 버튼
│   ├── Interact      (Button)             — E, 모바일 버튼
│   ├── Attack        (Button)             — Space, 모바일 버튼
│   ├── Pray          (Button)             — Q, 모바일 버튼
│   ├── Pause         (Button)             — ESC, 뒤로 가기
│   └── Map           (Button)             — Tab/M, 모바일 버튼
│
├── Dialogue (Action Map)
│   ├── Continue      (Button)             — Space/Enter/탭
│   ├── Skip          (Button)             — ESC
│   ├── Choice1       (Button)             — 1
│   ├── Choice2       (Button)             — 2
│   └── Choice3       (Button)             — 3
│
└── UI (Action Map)
    ├── Navigate      (Value, Vector2)
    ├── Submit        (Button)
    ├── Cancel        (Button)
    └── ScrollWheel   (Value, Vector2)
```

#### InputManager.cs — 중앙 집중식 입력 관리

```csharp
public class InputManager : MonoBehaviour
{
    public static InputManager Instance { get; private set; }

    private InputSystem_Actions _actions;
    private InputActionMap _currentMap;

    // 이벤트 기반 입력 — 폴링 대신 콜백 사용
    public event Action OnInteractPressed;
    public event Action OnAttackPressed;
    public event Action OnPrayPressed;
    public event Action OnPausePressed;
    public event Action OnDialogueContinue;
    public event Action OnDialogueSkip;
    public event Action<int> OnChoiceSelected;

    public Vector2 MoveInput => _actions.Player.Move.ReadValue<Vector2>();
    public bool SprintHeld => _actions.Player.Sprint.IsPressed();

    public ControlScheme CurrentScheme { get; private set; } = ControlScheme.KeyboardMouse;

    private void Awake()
    {
        if (Instance != null) { Destroy(gameObject); return; }
        Instance = this;
        DontDestroyOnLoad(gameObject);

        _actions = new InputSystem_Actions();
        BindPlayerActions();
        BindDialogueActions();

        // 컨트롤 스킴 자동 감지
        InputSystem.onActionChange += OnActionChange;
    }

    private void BindPlayerActions()
    {
        _actions.Player.Interact.performed += _ => OnInteractPressed?.Invoke();
        _actions.Player.Attack.performed += _ => OnAttackPressed?.Invoke();
        _actions.Player.Pray.performed += _ => OnPrayPressed?.Invoke();
        _actions.Player.Pause.performed += _ => OnPausePressed?.Invoke();
    }

    private void BindDialogueActions()
    {
        _actions.Dialogue.Continue.performed += _ => OnDialogueContinue?.Invoke();
        _actions.Dialogue.Skip.performed += _ => OnDialogueSkip?.Invoke();
        _actions.Dialogue.Choice1.performed += _ => OnChoiceSelected?.Invoke(0);
        _actions.Dialogue.Choice2.performed += _ => OnChoiceSelected?.Invoke(1);
        _actions.Dialogue.Choice3.performed += _ => OnChoiceSelected?.Invoke(2);
    }

    // Action Map 전환 — 게임 상태에 따라 활성 입력 맵 교체
    public void SwitchToPlayerMap()
    {
        _actions.Dialogue.Disable();
        _actions.Player.Enable();
    }

    public void SwitchToDialogueMap()
    {
        _actions.Player.Disable();
        _actions.Dialogue.Enable();
    }

    public void SwitchToUIMap()
    {
        _actions.Player.Disable();
        _actions.Dialogue.Disable();
        _actions.UI.Enable();
    }

    // 컨트롤 스킴 자동 감지
    private void OnActionChange(object obj, InputActionChange change)
    {
        if (change != InputActionChange.ActionPerformed) return;
        if (obj is not InputAction action) return;

        var device = action.activeControl?.device;
        if (device is Keyboard || device is Mouse)
            SetScheme(ControlScheme.KeyboardMouse);
        else if (device is Gamepad)
            SetScheme(ControlScheme.Gamepad);
        else if (device is Touchscreen)
            SetScheme(ControlScheme.Touch);
    }

    private void SetScheme(ControlScheme scheme)
    {
        if (CurrentScheme == scheme) return;
        CurrentScheme = scheme;
        OnControlSchemeChanged?.Invoke(scheme);
    }

    public event Action<ControlScheme> OnControlSchemeChanged;

    private void OnEnable() => _actions.Enable();
    private void OnDisable() => _actions.Disable();

    private void OnDestroy()
    {
        InputSystem.onActionChange -= OnActionChange;
        _actions.Dispose();
    }
}

public enum ControlScheme { KeyboardMouse, Gamepad, Touch }
```

#### GameStateManager와 InputManager 연동

```csharp
// Bootstrap.cs 또는 GameStateManager 내부
gameStateManager.OnStateChanged += (prev, next) =>
{
    var input = InputManager.Instance;
    switch (next)
    {
        case GameState.Exploration:
            input.SwitchToPlayerMap();
            break;
        case GameState.Dialogue:
        case GameState.Choice:
            input.SwitchToDialogueMap();
            break;
        case GameState.Paused:
        case GameState.MainMenu:
            input.SwitchToUIMap();
            break;
    }
};
```

### 4-3. 모바일 가상 컨트롤 — On-Screen Components

#### 가상 조이스틱 + 액션 버튼 구성

```csharp
// MobileControlsUI.cs
public class MobileControlsUI : MonoBehaviour
{
    [SerializeField] private GameObject _controlsRoot;
    [SerializeField] private OnScreenStick _joystick;     // Input System 내장
    [SerializeField] private OnScreenButton _interactBtn;
    [SerializeField] private OnScreenButton _attackBtn;
    [SerializeField] private OnScreenButton _sprintBtn;
    [SerializeField] private OnScreenButton _mapBtn;

    private void Start()
    {
        // 컨트롤 스킴에 따라 자동 표시/숨김
        InputManager.Instance.OnControlSchemeChanged += OnSchemeChanged;
        OnSchemeChanged(InputManager.Instance.CurrentScheme);
    }

    private void OnSchemeChanged(ControlScheme scheme)
    {
        bool showMobile = scheme == ControlScheme.Touch;
        _controlsRoot.SetActive(showMobile);
    }
}
```

#### On-Screen Stick 설정 (Inspector)

```
On-Screen Stick 컴포넌트:
  Control Path: <Gamepad>/leftStick
  Movement Range: 50          ← 조이스틱 이동 반경 (픽셀)
  Behaviour: Exact Position   ← 터치한 위치 기준으로 조이스틱 생성
  
On-Screen Button (Interact):
  Control Path: <Gamepad>/buttonSouth   ← A 버튼에 매핑

On-Screen Button (Attack):
  Control Path: <Gamepad>/buttonWest    ← X 버튼에 매핑
  
※ 핵심: On-Screen 컴포넌트는 가상 게임패드를 시뮬레이션하므로,
  Player 액션 맵의 Gamepad 바인딩이 그대로 작동합니다.
  코드 수정 없이 PC Gamepad와 모바일 터치가 동일하게 작동!
```

#### 모바일 버튼 시각 피드백

```csharp
public class MobileButtonFeedback : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    [SerializeField] private Image _buttonImage;
    [SerializeField] private Color _normalColor = new Color(1, 1, 1, 0.5f);
    [SerializeField] private Color _pressedColor = new Color(1, 1, 1, 0.9f);
    [SerializeField] private float _pressScale = 0.9f;

    private Vector3 _originalScale;

    private void Awake() => _originalScale = transform.localScale;

    public void OnPointerDown(PointerEventData e)
    {
        _buttonImage.color = _pressedColor;
        transform.localScale = _originalScale * _pressScale;
        // 햅틱 피드백 (모바일)
        #if UNITY_IOS || UNITY_ANDROID
        Handheld.Vibrate();
        #endif
    }

    public void OnPointerUp(PointerEventData e)
    {
        _buttonImage.color = _normalColor;
        transform.localScale = _originalScale;
    }
}
```

### 4-4. 모바일 퍼포먼스 최적화

| 영역 | 기법 | 구현 |
|------|------|------|
| **드로우 콜** | Sprite Atlas로 스프라이트 배칭 | `Assets/_Project/Atlas/` 폴더에 캐릭터/타일/UI 아틀라스 분리 |
| **타일맵** | Tilemap Renderer의 Chunk Mode | Inspector에서 `Mode: Chunk` 설정 |
| **파티클** | Max Particles 제한 | 모바일: 50개, PC: 200개 |
| **해상도** | 동적 해상도 스케일링 | 저사양 기기에서 렌더 해상도 80%로 자동 조절 |
| **UI** | Canvas 배칭 분리 | 정적/동적/오버레이 Canvas 3개로 분리 |
| **GC** | Object Pooling | 파티클, 대미지 텍스트, 아이템에 풀링 적용 |
| **오디오** | Compressed (Vorbis) + Load on Demand | BGM은 Streaming, SFX는 Decompress on Load |
| **셰이더** | URP/Mobile 셰이더 사용 | 커스텀 셰이더도 모바일 분기 필수 |

#### Safe Area 대응 (노치/펀치홀 화면)

```csharp
// SafeAreaAdapter.cs — 기존 SafeAreaHandler 개선
public class SafeAreaAdapter : MonoBehaviour
{
    private RectTransform _panel;
    private Rect _lastSafeArea;

    private void Awake()
    {
        _panel = GetComponent<RectTransform>();
    }

    private void Update()
    {
        Rect safeArea = Screen.safeArea;
        if (safeArea == _lastSafeArea) return;
        _lastSafeArea = safeArea;

        Vector2 anchorMin = safeArea.position;
        Vector2 anchorMax = safeArea.position + safeArea.size;
        anchorMin.x /= Screen.width;
        anchorMin.y /= Screen.height;
        anchorMax.x /= Screen.width;
        anchorMax.y /= Screen.height;

        _panel.anchorMin = anchorMin;
        _panel.anchorMax = anchorMax;
    }
}
```

### 4-5. 플랫폼별 빌드 설정

```csharp
// PlatformConfig.cs — 플랫폼별 설정을 ScriptableObject로 관리
[CreateAssetMenu(menuName = "PilgrimsProgress/Platform Config")]
public class PlatformConfigSO : ScriptableObject
{
    [Header("Rendering")]
    public int targetFrameRate = 60;
    public bool enableVSync = true;
    public float renderScale = 1.0f;

    [Header("Input")]
    public bool showVirtualControls = false;
    public float joystickDeadZone = 0.15f;

    [Header("Audio")]
    public int maxSimultaneousSFX = 16;
    public AudioClipLoadType bgmLoadType = AudioClipLoadType.Streaming;

    [Header("Performance")]
    public int maxParticles = 200;
    public bool enableShadows = true;
}

// 사용:
// Resources/PlatformConfig_PC.asset
// Resources/PlatformConfig_Mobile.asset
// Bootstrap에서 Application.isMobilePlatform에 따라 자동 로드
```

---

## Phase 5: 통합 폴리싱 및 출시 준비

> **기간**: 2주  
> **목표**: "완성된 게임"에서 "빛나는 게임"으로.

### 5-1. Juice (게임 감각 향상) 체크리스트

| 카테고리 | 항목 | 상태 |
|---------|------|------|
| **화면** | 씬 전환 시 페이드 인/아웃 | □ |
| **화면** | 챕터 시작 시 제목 연출 (페이드 + 타이포) | □ |
| **화면** | 중요 이벤트 시 화면 플래시 (십자가 장면) | □ |
| **움직임** | 걷기 시 발밑 먼지 파티클 | □ |
| **움직임** | 달리기 시 속도선(Speed Line) | □ |
| **움직임** | 방향 전환 시 미세 Squash & Stretch | □ |
| **상호작용** | 아이템 줍기 시 파티클 + SFX + 스케일 펀치 | □ |
| **상호작용** | NPC 대화 시작 시 말풍선 팝업 애니메이션 | □ |
| **전투** | 타격 시 Hitstop + Flash + Shake | □ |
| **전투** | 피격 시 넉백 + 깜빡임 | □ |
| **UI** | 버튼 호버 시 스케일 + 색상 변화 | □ |
| **UI** | 스탯 변화 시 바 펄스 애니메이션 | □ |
| **UI** | 퀘스트 완료 시 토스트 + 팡파레 | □ |
| **오디오** | 걷기 SFX (지형별 다른 소리) | □ |
| **오디오** | 대화 시 캐릭터별 Bark SFX | □ |
| **오디오** | UI 버튼 클릭 SFX | □ |
| **카메라** | 중요 NPC 등장 시 카메라 팬 연출 | □ |
| **카메라** | 넓은 지역 진입 시 줌 아웃 | □ |

### 5-2. 오디오 레이어링 전략

```
Layer 0: Ambient (환경음)     — 새 소리, 바람, 물 소리 (루프, 저볼륨)
Layer 1: BGM (배경 음악)       — 챕터/장소별 테마 (크로스페이드)
Layer 2: SFX (효과음)          — 발걸음, UI, 상호작용 (즉시 재생)
Layer 3: Voice/Bark (음성)    — 캐릭터별 짧은 음성 (대화 시)
Layer 4: Stinger (이벤트 음악) — 퀘스트 완료, 성경 카드 획득 (BGM 위에 겹침)
```

### 5-3. QA 및 테스트 전략

```
■ 자동화 테스트
  ├── Unit Test: StatsManager, QuestStateManager, InkTagParser
  ├── Integration Test: Dialogue flow (Ink → DialogueUI)
  └── Play Mode Test: 씬 전환, 세이브/로드 무결성

■ 수동 테스트 매트릭스
  ├── PC: Windows 10/11, 1080p/1440p/4K
  ├── Android: Galaxy S21 (고사양), Galaxy A13 (저사양)
  ├── iOS: iPhone 13, iPhone SE 3
  └── WebGL: Chrome, Safari, Firefox

■ 체크리스트
  □ 모든 NPC 대화가 정확히 1회만 재생되는가
  □ 세이브 후 재시작 → 대화 상태 복원되는가
  □ 모바일 가상 조이스틱 응답성 ≤ 50ms
  □ 카메라 떨림 없음 (모든 해상도에서)
  □ 30분 연속 플레이 시 메모리 누수 없음
```

---

## 실행 로드맵 요약

```
Week 1-2  ─── Phase 0: 아키텍처 기틀 ────────────────────────
              │ GameStateManager, QuestStateManager 구축
              │ ScriptableObject 전환, ServiceLocator 정리
              │ InputManager 중앙화
              ▼
Week 3-5  ─── Phase 1: 내러티브 재구축 ──────────────────────
              │ DialogueStateTracker 구현
              │ 대화 UI Prefab 전환
              │ 감정별 타이핑, Beat 시스템
              │ 캐릭터 표정 연동
              ▼
Week 6-9  ─── Phase 2: 애니메이션 & 조작감 ──────────────────
              │ 스프라이트 시트 제작 (Aseprite)
              │ Animator Controller 구축
              │ Input Buffer, Game Feel 구현
              │ PlayerController 가속/감속 커브
              ▼
Week 10-12 ── Phase 3: UI/UX 개편 ──────────────────────────
              │ HUD 재설계 (Prefab 기반)
              │ NPC 프롬프트 & 인디케이터
              │ 미니맵, 스탯 바
              │ 시인성 셰이더
              ▼
Week 13-15 ── Phase 4: 모바일 & 크로스 플랫폼 ────────────────
              │ Cinemachine + Pixel Perfect 카메라
              │ On-Screen Controls (가상 조이스틱)
              │ Safe Area, 퍼포먼스 최적화
              │ 플랫폼별 빌드 프로파일
              ▼
Week 16-17 ── Phase 5: 폴리싱 ─────────────────────────────
              │ Juice 체크리스트 소화
              │ 오디오 레이어링
              │ QA 테스트 → 버그 수정
              │ 출시 준비
              ▼
           🎮  RELEASE
```

---

## 부록 A: 권장 유니티 패키지 목록

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `com.unity.inputsystem` | 1.7+ | New Input System |
| `com.unity.cinemachine` | 2.9+ | 카메라 시스템 |
| `com.unity.2d.pixel-perfect` | 내장 (URP) | 픽셀 아트 렌더링 |
| `com.unity.textmeshpro` | 내장 | 텍스트 렌더링 |
| `com.unity.2d.tilemap` | 내장 | 타일맵 |
| `com.unity.2d.sprite` | 내장 | 스프라이트 아틀라스 |
| `com.inkle.ink-unity-integration` | 1.2+ | Ink 내러티브 엔진 |
| `com.unity.addressables` | 1.21+ | 에셋 번들 관리 |
| `com.unity.2d.animation` | 9.0+ | 2D 본 애니메이션 (선택) |

## 부록 B: 폴더 구조 권장안

```
Assets/_Project/
├── Animations/
│   ├── Characters/
│   │   ├── Christian/
│   │   │   ├── Christian_Animator.controller
│   │   │   ├── Christian_Idle.anim
│   │   │   ├── Christian_Walk.anim
│   │   │   └── ...
│   │   ├── Evangelist/
│   │   └── Apollyon/
│   └── UI/
│       ├── DialoguePanel_FadeIn.anim
│       └── ButtonHover.anim
├── Art/
│   ├── Backgrounds/
│   ├── Characters/
│   │   ├── SpriteSheets/   ← 스프라이트 시트 원본
│   │   └── Portraits/      ← 대화 초상화
│   ├── Effects/
│   ├── Tilesets/
│   └── UI/
│       ├── HUD/
│       ├── Icons/
│       └── Buttons/
├── Audio/
│   ├── BGM/
│   ├── SFX/
│   ├── Ambient/
│   └── Bark/               ← 캐릭터별 짧은 음성
├── Data/                    ← ScriptableObject 에셋
│   ├── Characters/          ← CharacterDataSO 에셋들
│   ├── Chapters/            ← ChapterDataSO 에셋들
│   ├── Locations/           ← LocationDataSO 에셋들
│   ├── Quests/              ← QuestDataSO 에셋들
│   ├── Audio/               ← AudioDataSO 에셋들
│   └── Platform/            ← PlatformConfigSO 에셋들
├── Fonts/
├── Ink/
├── Materials/
│   ├── PixelOutline.mat
│   └── FlashWhite.mat
├── Prefabs/
│   ├── Characters/
│   │   ├── Player.prefab
│   │   └── NPC_Template.prefab
│   ├── Effects/
│   │   ├── DustParticle.prefab
│   │   └── ImpactFlash.prefab
│   ├── UI/
│   │   ├── DialoguePanel.prefab
│   │   ├── ExplorationHUD.prefab
│   │   ├── MobileControls.prefab
│   │   ├── InteractionPrompt.prefab
│   │   └── Minimap.prefab
│   └── Camera/
│       └── CameraRig.prefab  ← Cinemachine + PixelPerfect
├── Scenes/
│   ├── Bootstrap.unity
│   ├── MainMenu.unity
│   ├── Gameplay.unity
│   └── Test/                 ← 테스트용 씬
├── Scripts/
│   ├── Core/                 ← GameStateManager, ServiceLocator, Bootstrap
│   ├── Input/                ← InputManager (신규 분리)
│   ├── Narrative/            ← InkService, DialogueDirector, DialogueStateTracker
│   ├── Player/               ← PlayerController, PlayerAnimatorController
│   ├── Camera/               ← CameraSystem (신규 분리)
│   ├── Interaction/          ← Interactable, NPCInteractable, InteractionPromptUI
│   ├── UI/                   ← DialogueUI, ExplorationHUD, MobileControlsUI
│   ├── Challenge/            ← QTE, 미니게임
│   ├── Audio/                ← AudioManager
│   ├── Save/                 ← SaveManager, SaveData
│   ├── Visuals/              ← GameFeelManager, VisibilityManager
│   └── Editor/               ← 에디터 전용 스크립트
├── Shaders/
│   ├── PixelOutline.shader
│   └── FlashWhite.shader
├── Settings/
│   └── URP-PixelArt.asset    ← URP 렌더 파이프라인 설정
└── Atlas/                     ← Sprite Atlas 에셋
    ├── Characters.spriteatlas
    ├── Tiles.spriteatlas
    └── UI.spriteatlas
```

---

## 부록 C: 우선순위 Quick Reference

> "모든 것을 한 번에 할 수 없다면, 이 순서대로 하세요."

| 순위 | 작업 | 왜 먼저? |
|------|------|---------|
| 1 | `GameStateManager` 구축 | 모든 버그의 근원 해결 |
| 2 | `InputManager` 통합 | 모든 조작의 기반 |
| 3 | `DialogueStateTracker` | 대화 반복 버그 해결 |
| 4 | 대화 UI Prefab 전환 | 시각적 튜닝 가능하게 |
| 5 | Cinemachine + Pixel Perfect | 화면 떨림 근절 |
| 6 | Animator Controller | 캐릭터 생동감 |
| 7 | Game Feel (Hitstop 등) | 조작 쾌감 |
| 8 | HUD 재설계 | 시인성 확보 |
| 9 | 모바일 가상 컨트롤 | 크로스 플랫폼 |
| 10 | 폴리싱 & Juice | 상용 퀄리티 |

---

> **마지막 조언**: 리뉴얼은 마라톤입니다. 매주 하나의 Phase를 완성하겠다는 마음보다, **매일 하나의 시스템을 확실하게 만들겠다**는 마음으로 접근하세요. 산나비도 셀레스테도, 결국 하나하나 쌓아 올린 디테일의 총합입니다.  
> 천로역정의 크리스천처럼, 한 걸음씩 꾸준히 나아가시길 응원합니다. 🏔️
