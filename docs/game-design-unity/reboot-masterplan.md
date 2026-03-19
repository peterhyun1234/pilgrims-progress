# Pilgrim's Progress — Reboot Master Plan v2.0

> **선언**: 기존 프로토타입의 모든 아키텍처를 전면 폐기하고, 상용 출시 가능한 수준의 품질을 목표로 바닥부터 재구축한다.
> **벤치마크**: SANABI (조작감), Celeste (게임 필), Dead Cells (시스템 아키텍처)

---

## 1. 신규 폴더 구조

```
Assets/_Project/
├── Scripts/
│   ├── Runtime/
│   │   ├── Core/           # Bootstrap, GameManager, ServiceLocator, EventBus
│   │   ├── StateMachine/   # 범용 FSM 프레임워크 (IState, StateMachine<T>)
│   │   ├── Input/          # InputManager (New Input System 래퍼)
│   │   ├── Player/         # PlayerController, PlayerMotor, PlayerStateMachine, States/
│   │   ├── Camera/         # CameraController (Cinemachine + PixelPerfect)
│   │   ├── Narrative/      # InkService, DialogueManager, QuestSystem
│   │   ├── Interaction/    # InteractionDetector, Interactable, WorldPrompt
│   │   ├── UI/             # DialogueView, HUDView, MenuView (MVC 분리)
│   │   ├── Audio/          # AudioManager, SFX/BGM 분리
│   │   ├── Save/           # SaveManager, SaveData
│   │   ├── Visuals/        # GameFeel, ScreenEffects, ParticleManager
│   │   ├── Combat/         # HitSystem, DamageData
│   │   └── Util/           # Extensions, Constants, ObjectPool
│   ├── Editor/             # 커스텀 에디터, 인스펙터
│   └── Tests/              # EditMode / PlayMode 테스트
├── Data/                   # ScriptableObject 에셋
│   ├── Characters/         # CharacterDataSO
│   ├── Quests/             # QuestDataSO
│   ├── Chapters/           # ChapterDataSO
│   └── Platform/           # PlatformConfigSO
├── Prefabs/
├── Scenes/
├── Art/
├── Audio/
├── Ink/
├── Fonts/
└── Resources/
```

### 네이밍 컨벤션
| 카테고리 | 규칙 | 예시 |
|----------|------|------|
| 클래스 | PascalCase | `PlayerMotor`, `DialogueManager` |
| 인터페이스 | I + PascalCase | `IState`, `IInteractable` |
| ScriptableObject | PascalCase + SO 접미사 | `CharacterDataSO`, `QuestDataSO` |
| private 필드 | _camelCase | `_moveSpeed`, `_currentState` |
| 이벤트 | On + PascalCase | `OnStateChanged`, `OnDialogueLine` |
| 상수/Enum | PascalCase | `GamePhase.Gameplay`, `ControlScheme.Touch` |
| 네임스페이스 | PP.기능 (충돌 방지) | `PP.Core`, `PP.Player`, `PP.Narrative` |

> **핵심 변경**: `PilgrimsProgress.*` → `PP.*`로 축약하여 C# 기본 타입(Camera, Input)과의 네임스페이스 충돌을 원천 차단.

---

## 2. 아키텍처 원칙

### 2.1 의존성 관리 — ServiceLocator → 인터페이스 기반 DI
```
문제: ServiceLocator는 암묵적 의존(Hidden Dependency)을 만든다.
해결: 인터페이스를 통한 명시적 계약 + ServiceLocator는 Bootstrap 단계에서만 사용.
```

### 2.2 상태 관리 — 단일 진실의 원천(Single Source of Truth)
```
문제: GameManager.CurrentState와 GameStateManager.CurrentState 이중 관리
해결: GameManager가 유일한 상태 소유자. FSM 패턴으로 전이 규칙 강제.
```

### 2.3 플레이어 제어 — 관심사 분리(Separation of Concerns)
```
문제: PlayerController가 이동+입력+상호작용+전투를 모두 처리 (215줄)
해결: PlayerController(조율) / PlayerMotor(물리) / PlayerStateMachine(상태) 3분할
```

### 2.4 UI — MVC 분리
```
문제: DialogueUI가 데이터+로직+표시를 모두 담당 (767줄)
해결: DialogueManager(로직) / DialogueView(표시) / CharacterDataSO(데이터) 분리
```

---

## 3. Phase 상세

### Phase 1: 코어 아키텍처 (즉시 실행)
- ServiceLocator 리팩터링 (인터페이스 기반, 자동 정리)
- GameManager + GameStateMachine (FSM 패턴, 상태 전이 규칙 강제)
- EventBus (타입 안전 전역 이벤트 시스템)
- InputManager (New Input System 완전 통합, Action Map 자동 전환)
- Bootstrap 재설계 (초기화 순서 보장, 씬 전환 관리)

### Phase 2: 산나비급 플레이어 컨트롤러
- PlayerStateMachine (IState 기반 상태 패턴)
- PlayerMotor (가속/감속 커브, 즉각 방향 전환, Coyote Time)
- PlayerAnimationController (Animator 연동, 즉각 전환)
- GameFeel (Hitstop, ScreenShake, InputBuffer, SquashStretch)

### Phase 3: 무결점 내러티브 & UI/UX
- 이벤트 기반 대화 시스템 (InkService + DialogueManager)
- QuestSystem (ScriptableObject 기반, 상태 추적, 반복 방지)
- DialogueView 전면 재작성 (타이핑 연출, 캐릭터 초상화)
- InteractionSystem (월드 프롬프트, NPC 인디케이터, HUD)

### Phase 4: 폴리싱 & 연출
- CameraController (Cinemachine + PixelPerfect, Jitter 완벽 제거)
- 동적 연출 (화면 흔들림, 감정 이모트, 2D 라이팅)
- MobileControls + SafeArea + PlatformConfig
- 최종 통합 및 테스트

---

## 4. 기술 스택

| 영역 | 기술 |
|------|------|
| 렌더링 | URP 2D Renderer + PixelPerfectCamera |
| 입력 | Unity New Input System (InputActionAsset) |
| 카메라 | Cinemachine 2D + PixelPerfect 확장 |
| 내러티브 | Ink (inkle) |
| UI | TextMeshPro + CanvasScaler (ScaleWithScreenSize) |
| 물리 | Rigidbody2D (Continuous Detection) |
| 빌드 | GitHub Actions CI/CD |
