# 천로역정 (Pilgrim's Progress) — 플랫폼별 개발 및 운영 베스트 프랙티스

> **작성 기준**: 2026년 3월 | Unity 6 + C# | 1인 개발자 / 서사 중심 게임 / MVP 게스트 모드 우선
>
> 이 문서는 글로벌 라이브 서비스 경험을 바탕으로, 1인 개발자가 **현실적으로 실행 가능한** 수준의 베스트 프랙티스를 정리한 것입니다.

---

## 목차

1. [초기 구축 및 운영 비용 가이드](#1-초기-구축-및-운영-비용-가이드-2026년-기준)
2. [서버 및 클라이언트 아키텍처](#2-서버server-및-클라이언트client-아키텍처-mvp-최적화)
3. [타겟 플랫폼별 개발 전략](#3-타겟-플랫폼별-개발-전략-크로스-플랫폼)
4. [추천 프로그래밍 언어 및 엔진](#4-unity-6--c-기술-스택)
5. [빌드, 배포 및 서비스 전략](#5-빌드-배포cicd-및-서비스-전략)
6. [하나의 코드베이스, 멀티 플랫폼 배포 전략](#6-하나의-코드베이스-멀티-플랫폼-배포-전략)

---

## 1. 초기 구축 및 운영 비용 가이드 (2026년 기준)

### 1.1 플랫폼별 등록비 (일회성 / 연간)

| 플랫폼 | 비용 | 주기 | 비고 |
|--------|------|------|------|
| **Apple Developer Program** | $99 (약 ₩130,000) | **매년** | iOS/macOS 동시 커버. 개인 계정 권장 |
| **Google Play Console** | $25 (약 ₩33,000) | **일회성** | 2024년부터 신규 계정에 20개 테스터 14일 요건 추가 |
| **Steam (Steamworks)** | $100 (약 ₩130,000) / 앱당 | **일회성** | 매출 $1,000 달성 시 환불. 별도 파트너 비용 없음 |
| **Epic Games Store** | $0 | - | 자체 퍼블리싱 프로그램 통해 무료 등록 가능 |
| **itch.io** | $0 | - | 인디 게임 얼리 테스트에 최적. 수수료 자율 설정 |

**MVP 단계 추천 전략**: itch.io(무료)로 PC 빌드 알파/베타 테스트 → Steam + 모바일 정식 출시

### 1.2 운영 유지비: 게스트 모드 vs 서버 도입

#### Phase 1: 게스트 모드 (MVP) — 월 $0

| 항목 | 비용 | 설명 |
|------|------|------|
| 서버 인프라 | $0 | 로컬 저장 방식으로 서버 불필요 |
| 분석/크래시 리포트 | $0 | Unity Analytics 무료 또는 Firebase Crashlytics |
| 푸시 알림 | $0 | Firebase Cloud Messaging 무료 |
| 리모트 컨피그 | $0 | Unity Remote Config 무료 티어 (30 rules, 10 settings) |

#### Phase 2: 클라우드 세이브/랭킹 도입 시 — 월 $0~15

| 서비스 | 프리 티어 한도 | 초과 시 예상 비용 | 추천도 |
|--------|---------------|-----------------|--------|
| **Unity Gaming Services (UGS)** | Cloud Save 1GB, 50 CCU | ~$10~20/월 | ★★★★★ |
| **Firebase (Firestore + Auth)** | 1GB 저장, 50K 읽기/일, 20K 쓰기/일 | ~$5~15/월 | ★★★★★ |
| **PlayFab (Microsoft)** | 100K MAU 무료 | 유료 전환 시 협의 | ★★★★☆ |
| **Supabase** | 500MB DB, 1GB 스토리지, 50K MAU | ~$25/월 (Pro) | ★★★☆☆ |

> **Unity 프로젝트 추천**: UGS(Unity Gaming Services)를 1순위로 고려하세요. Cloud Save, Authentication, Remote Config, Analytics가 Unity Editor에 네이티브 통합되어 있어 별도 SDK 연동 없이 바로 사용 가능합니다. Firebase는 UGS로 커버되지 않는 기능(Firestore의 유연한 쿼리 등)이 필요할 때 보조로 사용합니다.

#### Phase 3: 본격 라이브 서비스 — 월 $30~100

| 항목 | 예상 비용 | 설명 |
|------|----------|------|
| UGS 유료 플랜 | $10~30 | Cloud Save + Auth + Remote Config |
| Cloud Run / Cloud Functions | $10~30 | 서버리스 API (커스텀 로직 필요 시) |
| CDN (에셋 배포) | $5~20 | Unity CCD 또는 CloudFlare R2 |
| 모니터링 | $0~10 | Unity Dashboard 내장 + Grafana Cloud 무료 |

### 1.3 소프트웨어 및 에셋 비용

| 항목 | 추천 | 비용 | 비고 |
|------|------|------|------|
| **게임 엔진** | Unity 6 Personal | $0 (매출 $200K 미만) | 스플래시 스크린 제거됨 (Unity 6부터) |
| **IDE** | JetBrains Rider / VS Code | $0~$15/월 | Rider: 인디 라이선스 $15/월. VS Code: 무료 |
| **버전 관리** | GitHub (Free) + Git LFS | $0 | Private 리포, Actions 2,000분/월, LFS 1GB |
| **그래픽 도구** | Aseprite / Krita | $0~$20 | 2D: Aseprite $20. Krita 무료 |
| **사운드** | FMOD for Unity | $0 (매출 $200K 미만) | Unity 통합 플러그인 제공 |
| **대화 시스템** | Ink + Inkle Unity Plugin | $0 (MIT 라이선스) | 서사 게임 업계 표준 |
| **UI 프레임워크** | UI Toolkit (내장) | $0 | Unity 6 기본 내장, USS 스타일링 |
| **도메인** | .com / .dev | $10~15/년 | 랜딩 페이지용 |
| **폰트** | Google Fonts / Noto | $0 | TextMeshPro용 SDF 폰트 생성 |
| **협업/PM** | Notion (Free) | $0 | 1인 개발에 충분 |

### 1.4 첫 해 총 예상 비용 요약

| 시나리오 | 예상 비용 |
|----------|----------|
| **MVP (게스트 모드, PC only, itch.io)** | **$0~$20** |
| **MVP + 모바일 출시** | **$125~$150** (Apple $99 + Google $25) |
| **전 플랫폼 + UGS 클라우드** | **$300~$500/년** |

---

## 2. 서버(Server) 및 클라이언트(Client) 아키텍처 (MVP 최적화)

### 2.1 게스트 모드 로컬 데이터 관리

#### 저장 구조 설계 (Unity 경로 기준)

```
Application.persistentDataPath/
├── saves/
│   ├── slot_1.sav              # 메인 세이브 (암호화된 바이너리)
│   ├── slot_1.sav.bak          # 자동 백업 (이전 정상 세이브)
│   └── slot_1.meta.json        # 체크섬 + 타임스탬프 (UI 미리보기용)
├── settings.json               # 게임 설정 (PlayerPrefs 대체)
└── offline_events.json         # 오프라인 Analytics 이벤트 큐
```

> **PlayerPrefs를 쓰지 않는 이유**: PlayerPrefs는 플랫폼마다 저장 위치/형식이 다르고(Windows: 레지스트리, macOS: plist), 암호화가 불가하며, 데이터 크기 제한이 있습니다. 구조화된 JSON/Binary 직렬화로 `persistentDataPath`에 직접 관리하는 것이 크로스 플랫폼 일관성과 보안 모두에서 우월합니다.

#### 데이터 직렬화 및 보안 (치트 방지)

```
[Save Pipeline — Unity C# 구현]

GameState (C# Object)
    ↓
JsonUtility.ToJson() 또는 Newtonsoft.Json
    ↓
Compress (GZipStream — .NET 내장)
    ↓
Encrypt (Aes — System.Security.Cryptography 내장)
    ↓
File.WriteAllBytes() + SHA256 체크섬 저장
```

#### 핵심 C# 구현

```csharp
// SaveService.cs — 암호화 세이브 파이프라인 핵심
public class SaveService : ISaveService
{
    private readonly byte[] _key;  // 256-bit AES key
    private readonly byte[] _iv;   // 128-bit IV

    public void Save(GameState state, int slotIndex)
    {
        string json = JsonUtility.ToJson(state);
        byte[] compressed = Compress(Encoding.UTF8.GetBytes(json));
        byte[] encrypted = Encrypt(compressed);

        string path = GetSlotPath(slotIndex);
        string backupPath = path + ".bak";

        if (File.Exists(path))
            File.Copy(path, backupPath, overwrite: true);

        File.WriteAllBytes(path, encrypted);

        var meta = new SaveMeta
        {
            checksum = ComputeSHA256(encrypted),
            timestamp = DateTime.UtcNow.ToString("o"),
            schemaVersion = GameState.CURRENT_SCHEMA_VERSION
        };
        File.WriteAllText(GetMetaPath(slotIndex), JsonUtility.ToJson(meta));
    }

    public GameState Load(int slotIndex)
    {
        string path = GetSlotPath(slotIndex);
        byte[] encrypted = File.ReadAllBytes(path);

        var meta = JsonUtility.FromJson<SaveMeta>(
            File.ReadAllText(GetMetaPath(slotIndex)));
        if (ComputeSHA256(encrypted) != meta.checksum)
            return LoadBackup(slotIndex); // 무결성 실패 → 백업 복원

        byte[] compressed = Decrypt(encrypted);
        string json = Encoding.UTF8.GetString(Decompress(compressed));
        var state = JsonUtility.FromJson<GameState>(json);

        return MigrateIfNeeded(state);
    }

    private GameState MigrateIfNeeded(GameState state)
    {
        while (state.schemaVersion < GameState.CURRENT_SCHEMA_VERSION)
        {
            state = SchemaMigrator.Migrate(state, state.schemaVersion);
        }
        return state;
    }
}
```

**보안 레벨별 적용**:

| 보안 레벨 | 적용 대상 | 방법 |
|-----------|----------|------|
| **Level 1 — 기본** | 세이브 파일 | AES-256 암호화 + SHA256 체크섬 |
| **Level 2 — 중급** | 인메모리 값 | `ObfuscatedInt`/`ObfuscatedFloat` 래퍼 타입 |
| **Level 3 — 고급** | 게임 로직 | UGS Cloud Save 서버 사이드 검증 (Phase 2) |

> **1인 개발자 현실론**: 서사 중심 싱글 플레이 게임에서 치트 방지에 과도한 투자는 ROI가 낮습니다. Level 1만 구현해도 캐주얼 치터의 99%를 막을 수 있습니다.

#### 자동 저장 전략

```csharp
// AutoSaveManager.cs — MonoBehaviour
public class AutoSaveManager : MonoBehaviour
{
    [SerializeField] private float _intervalSeconds = 300f; // 5분

    // 트리거 1: 챕터/구간 완료 시 → Full Save
    public void OnChapterComplete() => _saveService.Save(_gameState, _currentSlot);

    // 트리거 2: 일정 시간 간격
    private IEnumerator AutoSaveLoop()
    {
        while (true)
        {
            yield return new WaitForSeconds(_intervalSeconds);
            _saveService.Save(_gameState, _currentSlot);
        }
    }

    // 트리거 3: 앱 백그라운드 / 종료 (모바일 필수)
    private void OnApplicationPause(bool paused)
    {
        if (paused) _saveService.Save(_gameState, _currentSlot);
    }

    private void OnApplicationQuit()
    {
        _saveService.Save(_gameState, _currentSlot);
    }
}
```

### 2.2 서버-클라이언트 분리 설계 (로컬 → 서버 마이그레이션 대비)

#### 핵심: Interface Abstraction + Dependency Injection

```
┌──────────────────────────────────────────────────────┐
│                    Game Logic Layer                   │
│          (MonoBehaviour / ScriptableObject)           │
│            순수 게임 로직, 플랫폼 무관                  │
└──────────────────────┬───────────────────────────────┘
                       │ Interface (C# interface)
┌──────────────────────▼───────────────────────────────┐
│                 Service Layer                         │
│     ISaveService / IAuthService / ILeaderboard        │
│     IAnalyticsService / IRemoteConfigService          │
└──────┬──────────────────────────────────┬────────────┘
       │ Phase 1 (MVP)                    │ Phase 2+
┌──────▼──────────────┐        ┌──────────▼───────────┐
│  LocalSaveService   │        │  UGSCloudSaveService  │
│  (File I/O)         │        │  (Unity Cloud Save)   │
│                     │        │                       │
│  GuestAuthService   │        │  UGSAuthService       │
│  (GUID.NewGuid)     │        │  (Google/Apple/Guest)  │
│                     │        │                       │
│  NoOpAnalytics      │        │  UnityAnalyticsService│
└─────────────────────┘        └───────────────────────┘
```

#### C# 인터페이스 정의

```csharp
// Services/ISaveService.cs
public interface ISaveService
{
    UniTask Save(GameState state, int slotIndex);
    UniTask<GameState> Load(int slotIndex);
    UniTask<SaveMeta[]> GetAllSlotMetas();
    UniTask Delete(int slotIndex);
}

// Services/IAuthService.cs
public interface IAuthService
{
    UniTask<string> GetPlayerId();
    UniTask<bool> IsAuthenticated();
    UniTask SignIn(AuthProvider provider = AuthProvider.Guest);
    UniTask LinkAccount(AuthProvider provider);
    event Action<string> OnPlayerIdChanged;
}

// Services/IRemoteConfigService.cs
public interface IRemoteConfigService
{
    UniTask Fetch();
    T GetValue<T>(string key, T defaultValue);
    string GetAssetBundleUrl(string bundleName);
    int GetLatestContentVersion();
}
```

#### ServiceLocator (간단한 DI)

```csharp
// Core/ServiceLocator.cs
public static class ServiceLocator
{
    private static readonly Dictionary<Type, object> _services = new();

    public static void Register<T>(T service) where T : class
        => _services[typeof(T)] = service;

    public static T Get<T>() where T : class
        => _services.TryGetValue(typeof(T), out var s) ? (T)s
            : throw new InvalidOperationException($"Service {typeof(T).Name} not registered");

    // 부트스트랩에서 한 번만 호출
    public static void InitializeMVP()
    {
        Register<ISaveService>(new LocalSaveService());
        Register<IAuthService>(new GuestAuthService());
        Register<IRemoteConfigService>(new LocalRemoteConfigService());
        Register<IAnalyticsService>(new NoOpAnalyticsService());
    }

    // Phase 2: 클라우드 전환 시 이 메서드만 교체
    public static void InitializeCloud()
    {
        Register<ISaveService>(new UGSCloudSaveService());
        Register<IAuthService>(new UGSAuthService());
        Register<IRemoteConfigService>(new UGSRemoteConfigService());
        Register<IAnalyticsService>(new UnityAnalyticsService());
    }
}
```

> **이 구조의 핵심**: 게임 로직 코드가 `ServiceLocator.Get<ISaveService>().Save(state, slot)`만 호출하면, 뒤에서 로컬이든 클라우드든 알 필요가 없습니다. Phase 2 전환 시 `InitializeMVP()` → `InitializeCloud()`로 한 줄만 바꾸면 됩니다.

#### 데이터 마이그레이션 설계

```
[로컬 → 클라우드 마이그레이션 흐름]

1. 유저가 "계정 연동" UI 선택
2. UGS Authentication으로 소셜/이메일 인증
3. 로컬 Guest UUID ↔ UGS Player ID 매핑
4. 로컬 세이브 → UGS Cloud Save로 업로드
5. 충돌 시: 타임스탬프 비교 → 최신 데이터 우선 OR 유저 선택 UI
6. 마이그레이션 완료 플래그 설정
7. 이후 Cloud Save 우선, 로컬은 오프라인 캐시/백업
```

#### 세이브 데이터 스키마

```csharp
[System.Serializable]
public class GameState
{
    public const int CURRENT_SCHEMA_VERSION = 3;

    public int schemaVersion = CURRENT_SCHEMA_VERSION;
    public string playerId;
    public string createdAt;
    public string lastSavedAt;
    public int playTimeSeconds;
    public ProgressData progress;
    public InventoryData inventory;
    public ChoicesData choices;
    public StatsData stats;
}

[System.Serializable]
public class ProgressData
{
    public string currentChapter;
    public string currentScene;
    public List<string> checkpoints;
}

[System.Serializable]
public class StatsData
{
    public int faith;
    public int courage;
    public int wisdom;
}
```

### 2.3 추천 아키텍처 요약

```
┌──────────────────────────────────────────────────┐
│              천로역정 아키텍처 (Unity 6)            │
├──────────────────────────────────────────────────┤
│                                                  │
│  [Client — Unity 6 + C#]                         │
│   ├── Core/          게임 핵심 로직 + 서비스 DI    │
│   ├── Narrative/     Ink 기반 대화/스토리 시스템    │
│   ├── UI/            UI Toolkit + USS 스타일링     │
│   ├── Services/      ISaveService 등 인터페이스    │
│   ├── Data/          ScriptableObject + 직렬화    │
│   └── Platform/      #if 전처리기 분기 코드        │
│                                                  │
│  [Backend — Phase 2: UGS]                        │
│   ├── Authentication  인증 (Guest → Social)       │
│   ├── Cloud Save      클라우드 세이브              │
│   ├── Remote Config   원격 설정/A/B 테스트         │
│   ├── Cloud Code      서버리스 로직 (C#/JS)       │
│   └── CCD             에셋 CDN (Addressables)     │
│                                                  │
│  [DevOps]                                        │
│   ├── GitHub Actions + GameCI    멀티 플랫폼 빌드  │
│   ├── Fastlane                   모바일 배포       │
│   ├── SteamCMD                   Steam 배포       │
│   └── Unity Addressables         에셋 OTA         │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 3. 타겟 플랫폼별 개발 전략 (크로스 플랫폼)

### 3.1 플랫폼 우선순위 (1인 개발자 현실 전략)

| 순서 | 플랫폼 | 이유 | 출시 시기 |
|------|--------|------|----------|
| 1 | **PC (Windows)** | 빌드/디버깅 가장 빠름, 스토어 심사 없음(itch.io) | MVP |
| 2 | **PC (macOS)** | 개발 머신에서 바로 테스트. Apple Silicon 네이티브 지원 | MVP |
| 3 | **Android** | 가장 큰 시장, 테스트 배포 용이 (APK 사이드로드) | MVP+1 |
| 4 | **iOS** | 수익성 높지만 심사/빌드 과정 무거움 | Beta |
| 5 | **Steam** | 글로벌 PC 게이머 도달, 위시리스트 마케팅 | 정식 출시 |
| 6 | **Nintendo Switch** | Unity 공식 지원, 인디/서사 게임 적합 | 정식 출시 후 |

### 3.2 크로스 플랫폼 코드베이스 관리 (Unity 프로젝트 구조)

```
Assets/
├── _Project/                      # 모든 프로젝트 코드 (90% 이상 플랫폼 무관)
│   ├── Scripts/
│   │   ├── Core/                  # ServiceLocator, GameManager, 이벤트 시스템
│   │   ├── Narrative/             # Ink 통합, 대화 컨트롤러, 선택지 시스템
│   │   ├── Data/                  # GameState, ScriptableObject 데이터
│   │   ├── Services/
│   │   │   ├── Interfaces/        # ISaveService, IAuthService 등
│   │   │   ├── Local/             # 로컬 구현 (MVP)
│   │   │   └── Cloud/             # UGS 구현 (Phase 2, asmdef 분리)
│   │   ├── UI/                    # UI Toolkit 컨트롤러
│   │   └── Platform/              # 플랫폼 분기 (#if UNITY_IOS 등)
│   │
│   ├── UI/                        # UXML + USS
│   │   ├── Layouts/
│   │   │   ├── MobileLayout.uxml
│   │   │   └── DesktopLayout.uxml
│   │   ├── Components/            # 재사용 UI 컴포넌트
│   │   └── Themes/
│   │       ├── MobileTheme.tss
│   │       └── DesktopTheme.tss
│   │
│   ├── Narrative/                 # Ink 파일 + 챕터 데이터
│   │   ├── Chapters/
│   │   │   ├── chapter_01.ink
│   │   │   ├── chapter_02.ink
│   │   │   └── ...
│   │   └── SharedData/            # 공용 변수/함수
│   │
│   ├── Art/                       # 원본 에셋
│   │   ├── Characters/
│   │   ├── Backgrounds/
│   │   └── UI/
│   │
│   ├── Audio/
│   │   ├── BGM/
│   │   ├── SFX/
│   │   └── Voice/ (선택)
│   │
│   └── Resources/                 # Resources.Load 필수 에셋만 (최소화)
│
├── AddressableAssetsData/         # Addressables 설정
│   ├── AssetGroups/
│   │   ├── LocalStaticAssets      # 앱에 포함되는 에셋
│   │   └── RemoteChapters         # OTA 다운로드 에셋 (Phase 2)
│   └── Profiles/
│       ├── Default                # 로컬 빌드용
│       └── Production             # CDN 빌드용
│
├── Plugins/                       # 서드파티 (Ink, FMOD 등)
│
├── Editor/                        # 에디터 전용 스크립트
│   ├── BuildPipeline/             # 커스텀 빌드 스크립트
│   └── Tools/                     # 챕터 편집 도구 등
│
└── StreamingAssets/               # 플랫폼별 네이티브 데이터
```

#### Assembly Definition (asmdef) 구조

```
PilgrimsProgress.Core.asmdef          ← 핵심 로직 (의존성 없음)
PilgrimsProgress.Services.asmdef      ← 서비스 인터페이스
PilgrimsProgress.Services.Local.asmdef ← 로컬 구현
PilgrimsProgress.Services.Cloud.asmdef ← UGS 구현 (UGS 패키지 참조)
PilgrimsProgress.UI.asmdef            ← UI 레이어
PilgrimsProgress.Narrative.asmdef     ← Ink 통합
PilgrimsProgress.Platform.asmdef      ← 플랫폼별 코드
PilgrimsProgress.Editor.asmdef        ← 에디터 전용
```

> **asmdef를 쓰는 이유**: (1) 컴파일 시간 단축 — 변경된 어셈블리만 재컴파일 (2) 의존성 강제 — Core가 Cloud에 의존하는 실수 방지 (3) 플랫폼별 조건부 컴파일 — Cloud asmdef에만 UGS Define 적용

### 3.3 UI/UX 대응 전략 (UI Toolkit 기반)

#### 반응형 UI 설계 원칙

| 요소 | 모바일 | 데스크탑 |
|------|--------|---------|
| **입력** | Touch + EventSystem | Mouse + Keyboard. Input System 패키지 통합 |
| **UI 크기** | 최소 터치 영역 48dp (`min-width: 48px`) | 표준 UI 크기 |
| **텍스트** | TextMeshPro 본문 32pt (Canvas 기준) | 본문 24pt |
| **레이아웃** | 세로, 하단 네비게이션 | 가로, 사이드바 가능 |
| **대화 UI** | 하단 1/3 영역 고정 | 중앙 또는 하단 1/4 |
| **메뉴** | 풀스크린 오버레이 | 팝업 / 사이드 패널 |
| **세이프 영역** | `Screen.safeArea` 반영 필수 | 불필요 |

#### USS 기반 반응형 스타일링

```css
/* Themes/BaseTheme.uss — 공통 스타일 */
.dialogue-container {
    flex-direction: column;
    justify-content: flex-end;
    padding: 16px;
}

.dialogue-text {
    font-size: 24px;
    color: #E8E0D0;
    white-space: normal;
    -unity-text-align: upper-left;
}

.choice-button {
    padding: 12px 24px;
    margin: 4px 0;
    border-radius: 8px;
    background-color: rgba(42, 36, 28, 0.85);
    color: #E8E0D0;
    transition-duration: 0.2s;
}

.choice-button:hover {
    background-color: rgba(62, 56, 48, 0.95);
}

/* Themes/MobileTheme.tss — 모바일 오버라이드 */
.dialogue-text {
    font-size: 32px;    /* 모바일에서 더 크게 */
    padding: 20px;
}

.choice-button {
    min-height: 48px;   /* 터치 최소 영역 */
    padding: 16px 32px;
    margin: 8px 0;
}

.dialogue-container {
    height: 33%;        /* 화면 하단 1/3 */
}

/* Themes/DesktopTheme.tss — 데스크탑 오버라이드 */
.dialogue-container {
    height: 25%;        /* 화면 하단 1/4 */
    max-width: 800px;
    align-self: center;
}
```

#### 런타임 테마 전환

```csharp
// UI/ThemeManager.cs
public class ThemeManager : MonoBehaviour
{
    [SerializeField] private ThemeStyleSheet _mobileTheme;
    [SerializeField] private ThemeStyleSheet _desktopTheme;
    [SerializeField] private UIDocument _uiDocument;

    private void Start()
    {
        ApplyPlatformTheme();
    }

    private void ApplyPlatformTheme()
    {
        bool isMobile = Application.isMobilePlatform;
        _uiDocument.panelSettings.themeStyleSheet = isMobile
            ? _mobileTheme : _desktopTheme;

        if (isMobile) ApplySafeArea();
    }

    private void ApplySafeArea()
    {
        var safeArea = Screen.safeArea;
        var root = _uiDocument.rootVisualElement;
        root.style.paddingTop = Screen.height - safeArea.yMax;
        root.style.paddingBottom = safeArea.y;
        root.style.paddingLeft = safeArea.x;
        root.style.paddingRight = Screen.width - safeArea.xMax;
    }
}
```

#### 서사 게임 특화 대화 UI

```
모바일 (세로):                    데스크탑 (가로):
┌────────────────┐               ┌──────────────────────────┐
│                │               │                          │
│   캐릭터 일러  │               │      캐릭터    스토리     │
│                │               │      일러스트  배경       │
│                │               │                          │
├────────────────┤               ├──────────────────────────┤
│  이름          │               │ 이름                     │
│  "대화 내용이  │               │ "대화 내용이 여기에      │
│   여기에..."   │               │  표시됩니다..."          │
│                │               │                          │
│ [선택지 A]     │               │  [선택지 A]  [선택지 B]  │
│ [선택지 B]     │               │  [선택지 C]              │
│ [선택지 C]     │               │                          │
└────────────────┘               └──────────────────────────┘
```

> **핵심 원칙**: "콘텐츠(서사)는 하나, 그릇(UI)만 다르게." Ink 스토리 데이터, 선택지, 분기 로직은 100% 공유하고, USS 테마와 UXML 레이아웃만 플랫폼에 따라 교체합니다.

---

## 4. Unity 6 + C# 기술 스택

### 4.1 Unity 6 선택 근거 (2026년 기준)

| 기준 | Unity 6 | 비고 |
|------|---------|------|
| **라이선스** | $0 (Personal, 매출 $200K 미만) | 스플래시 스크린 강제 없음 |
| **크로스 플랫폼** | iOS, Android, Windows, macOS, Linux, Switch, PS, Xbox, WebGL | 가장 넓은 커버리지 |
| **서사 게임 생태계** | Ink (Inkle), Yarn Spinner, Fungus | 성숙한 서사 도구 |
| **에셋 스토어** | 70,000+ 에셋 | 가장 큰 마켓플레이스 |
| **2D 기능** | Sprite, Tilemap, 2D Animation, 2D Lighting | 네이티브 2D 지원 |
| **UI 시스템** | UI Toolkit (UXML + USS) | CSS-like 스타일링, 반응형 |
| **에셋 관리** | Addressables + CCD | 원격 에셋 로딩, OTA 업데이트 |
| **백엔드 통합** | Unity Gaming Services (네이티브) | Editor에서 바로 연동 |
| **빌드 자동화** | GameCI (GitHub Actions) | 커뮤니티 검증 CI/CD |

### 4.2 서사 게임 완성 기술 스택

```
[천로역정 기술 스택]

엔진:         Unity 6.x LTS
언어:         C# (.NET Standard 2.1)
대화 시스템:   Ink (inkle) — 서사 게임 업계 표준
UI:           UI Toolkit (UXML + USS + ThemeStyleSheet)
텍스트:       TextMeshPro (SDF 렌더링)
오디오:       FMOD for Unity (무료 인디 라이선스)
입력:         Input System 패키지 (터치 + 키보드/마우스 통합)
비동기:       UniTask (async/await 최적화)
DI:           ServiceLocator (경량) 또는 VContainer
에셋 관리:     Addressables (로컬 + 원격)
로컬라이즈:    Unity Localization 패키지
분석:         Unity Analytics 또는 Firebase
CI/CD:        GitHub Actions + GameCI
버전 관리:     Git + Git LFS (에셋)
```

### 4.3 Ink — 서사 게임의 핵심 엔진

천로역정 같은 서사 중심 게임에서 **Ink**가 최적인 이유:

```ink
// chapter_01.ink — 천로역정 대화 예시

=== slough_of_despond ===
크리스천은 절망의 늪 앞에 서 있었다.
발밑의 땅은 질퍽거렸고, 등에 진 짐은 한없이 무거웠다.

* [앞으로 나아간다] -> wade_through
* [돌아서 길을 찾는다] -> seek_another_way
* [도움을 요청한다] -> call_for_help

=== wade_through ===
~ courage += 10
~ faith += 5
크리스천은 이를 악물고 늪 속으로 발을 내디뎠다.
진흙이 허벅지까지 차올랐지만, 그는 멈추지 않았다.
-> emerge_from_slough

=== call_for_help ===
~ wisdom += 10
"도와주세요!" 크리스천이 외쳤다.
도움이라는 이름의 사람이 달려와 손을 내밀었다.
"여기 단단한 디딤돌이 있습니다. 이 길로 오세요."
-> emerge_from_slough
```

**Ink의 장점**:
- **비프로그래머 친화적**: 시나리오 작가가 직접 편집 가능한 마크업 문법
- **변수/조건/함수**: `~ faith += 5`, `{faith > 50: ...}` — 게임 로직 내장
- **Unity 통합**: `ink-unity-integration` 플러그인으로 C#과 원활한 바인딩
- **핫 리로드**: `.ink` 파일 수정 → 에디터에서 즉시 반영
- **MIT 라이선스**: 무료, 로열티 없음

#### Ink ↔ Unity C# 바인딩

```csharp
// Narrative/InkStoryController.cs
public class InkStoryController : MonoBehaviour
{
    [SerializeField] private TextAsset _inkJsonAsset;
    private Story _story;

    public event Action<string> OnTextChanged;
    public event Action<List<Choice>> OnChoicesPresented;
    public event Action OnStoryEnd;

    private void Start()
    {
        _story = new Story(_inkJsonAsset.text);

        // Ink 변수 ↔ GameState 바인딩
        var state = ServiceLocator.Get<ISaveService>().Load(0).Result;
        _story.variablesState["faith"] = state.stats.faith;
        _story.variablesState["courage"] = state.stats.courage;
        _story.variablesState["wisdom"] = state.stats.wisdom;

        _story.ObserveVariable("faith", (name, val) =>
            GameEvents.OnStatChanged?.Invoke(name, (int)val));

        ContinueStory();
    }

    public void ContinueStory()
    {
        if (_story.canContinue)
        {
            string text = _story.Continue();
            OnTextChanged?.Invoke(text);

            if (_story.currentChoices.Count > 0)
                OnChoicesPresented?.Invoke(_story.currentChoices);
        }
        else
        {
            OnStoryEnd?.Invoke();
        }
    }

    public void MakeChoice(int choiceIndex)
    {
        _story.ChooseChoiceIndex(choiceIndex);
        ContinueStory();
    }
}
```

### 4.4 필수 Unity 패키지

| 패키지 | 용도 | 설치 방법 |
|--------|------|----------|
| `com.unity.inputsystem` | 크로스 플랫폼 입력 통합 | Package Manager |
| `com.unity.addressables` | 에셋 번들 + OTA | Package Manager |
| `com.unity.localization` | 다국어 지원 | Package Manager |
| `com.unity.textmeshpro` | 고품질 텍스트 렌더링 | 기본 내장 |
| `com.unity.ui` | UI Toolkit | 기본 내장 |
| `com.unity.services.core` | UGS 기반 | Package Manager |
| `com.unity.services.authentication` | 인증 (Phase 2) | Package Manager |
| `com.unity.services.cloud-save` | 클라우드 세이브 (Phase 2) | Package Manager |
| `ink-unity-integration` | Ink 대화 시스템 | Asset Store (무료) |
| `UniTask` | 고성능 async/await | OpenUPM |
| `FMOD for Unity` | 고급 오디오 (선택) | FMOD 공식 사이트 |

---

## 5. 빌드, 배포(CI/CD) 및 서비스 전략

### 5.1 CI/CD 파이프라인 (GitHub Actions + GameCI)

#### 전체 파이프라인 구조

```
[Git Push / Tag]
      │
      ▼
┌──────────────────────┐
│  Unity Build (GameCI) │
│  ├── StandaloneWindows│
│  ├── StandaloneOSX   │  ← GitHub Actions + game-ci/unity-builder
│  ├── Android (APK)   │
│  ├── iOS (Xcode)     │
│  └── WebGL           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Quality Gate         │
│  ├── EditMode Tests   │
│  ├── PlayMode Tests   │  ← game-ci/unity-test-runner
│  └── Build 크기 검증   │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Distribution         │
│  ├── itch.io          │  ← butler CLI
│  ├── Steam            │  ← steamcmd
│  ├── Google Play      │  ← Fastlane supply
│  ├── TestFlight       │  ← Fastlane deliver
│  └── GitHub Releases  │  ← actions/create-release
└──────────────────────┘
```

#### GitHub Actions 워크플로 (GameCI 기반)

```yaml
# .github/workflows/build-and-deploy.yml
name: Build & Deploy

on:
  push:
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  UNITY_VERSION: "6000.0.30f1"   # Unity 6 LTS
  PROJECT_PATH: "."

jobs:
  # ── 테스트 ──
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-test-runner@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
        with:
          projectPath: ${{ env.PROJECT_PATH }}
          testMode: all    # EditMode + PlayMode
          unityVersion: ${{ env.UNITY_VERSION }}

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: artifacts/

  # ── 멀티 플랫폼 빌드 ──
  build:
    needs: test
    strategy:
      fail-fast: false
      matrix:
        include:
          - targetPlatform: StandaloneWindows64
            artifact: windows
          - targetPlatform: StandaloneOSX
            artifact: macos
          - targetPlatform: Android
            artifact: android
          - targetPlatform: iOS
            artifact: ios
          - targetPlatform: WebGL
            artifact: webgl

    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true

      - uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL: ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD: ${{ secrets.UNITY_PASSWORD }}
        with:
          projectPath: ${{ env.PROJECT_PATH }}
          targetPlatform: ${{ matrix.targetPlatform }}
          unityVersion: ${{ env.UNITY_VERSION }}
          buildName: pilgrims-progress
          # Android 전용
          androidKeystoreName: ${{ matrix.targetPlatform == 'Android' && 'user.keystore' || '' }}
          androidKeystoreBase64: ${{ secrets.ANDROID_KEYSTORE_BASE64 }}
          androidKeystorePass: ${{ secrets.ANDROID_KEYSTORE_PASS }}
          androidKeyaliasName: ${{ secrets.ANDROID_KEYALIAS_NAME }}
          androidKeyaliasPass: ${{ secrets.ANDROID_KEYALIAS_PASS }}

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.artifact }}-build
          path: build/${{ matrix.targetPlatform }}/

  # ── iOS: Xcode → TestFlight ──
  deploy-ios:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: macos-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: ios-build
          path: build/iOS

      - uses: yukiarrr/ios-build-action@v1.12.0
        with:
          project-path: build/iOS/iOS/Unity-iPhone.xcodeproj
          p12-base64: ${{ secrets.IOS_P12_BASE64 }}
          mobileprovision-base64: ${{ secrets.IOS_PROVISION_BASE64 }}
          code-signing-identity: "iPhone Distribution"
          team-id: ${{ secrets.IOS_TEAM_ID }}
          export-method: app-store

      - uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: output.ipa
          issuer-id: ${{ secrets.APPSTORE_ISSUER_ID }}
          api-key-id: ${{ secrets.APPSTORE_API_KEY_ID }}
          api-private-key: ${{ secrets.APPSTORE_API_PRIVATE_KEY }}

  # ── Android: Google Play 내부 테스트 ──
  deploy-android:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: android-build

      - uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT }}
          packageName: com.yourname.pilgrimsprogress
          releaseFiles: "**/*.aab"
          track: internal

  # ── Steam ──
  deploy-steam:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: windows-build

      - uses: game-ci/steam-deploy@v3
        with:
          username: ${{ secrets.STEAM_USERNAME }}
          configVdf: ${{ secrets.STEAM_CONFIG_VDF }}
          appId: ${{ secrets.STEAM_APP_ID }}
          buildDescription: ${{ github.ref_name }}
          rootPath: build/StandaloneWindows64/

  # ── itch.io ──
  deploy-itch:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
      - uses: KikimoraGames/itch-publish@v0.0.3
        with:
          butlerApiKey: ${{ secrets.BUTLER_API_KEY }}
          gameData: ./windows-build/
          itchUsername: ${{ secrets.ITCH_USERNAME }}
          itchGameId: pilgrims-progress
          buildChannel: windows
```

### 5.2 스토어 심사 대응 노하우

#### Apple App Store

| 주의사항 | 대응 전략 |
|---------|----------|
| **개인정보 처리방침** 필수 | 랜딩 페이지에 Privacy Policy 게시. 게스트 모드라도 필요 |
| **앱 추적 투명성 (ATT)** | Unity의 `ATTrackingStatusBinding`으로 ATT 팝업 구현 |
| **인앱 결제 심사** | 디지털 콘텐츠는 반드시 IAP 사용. Unity IAP 패키지 |
| **최소 기능 요건** | "데모 수준"으로 보이면 리젝. MVP라도 1~2시간 플레이 분량 확보 |
| **메타데이터 정확성** | 스크린샷이 실제 게임과 일치해야 함 |
| **성능 기준** | iPhone SE 3세대급에서 30fps 이상 유지 |
| **IL2CPP 필수** | iOS는 Mono 백엔드 불가, IL2CPP만 허용 |

#### Google Play Store

| 주의사항 | 대응 전략 |
|---------|----------|
| **앱 콘텐츠 등급** | IARC 등급 필수. 종교 콘텐츠 주의 (천로역정 특성상) |
| **타겟 API 레벨** | 2026년 기준 Android 14 (API 34) 이상 타겟 필수 |
| **AAB 필수** | 2026년부터 APK 제출 불가, Android App Bundle만 허용 |
| **20명 테스터 요건** | 신규 계정은 비공개 테스트 14일 + 20명 통과 필요 |
| **64bit 필수** | Unity Player Settings → ARM64 체크 필수 |

#### Steam

| 주의사항 | 대응 전략 |
|---------|----------|
| **스토어 페이지 준비** | 출시 2~3개월 전 페이지 공개 → 위시리스트 확보 |
| **스팀 데크 호환** | Input System 패키지 + Proton 호환 테스트 |
| **Steamworks.NET** | 업적, 클라우드 세이브, 워크샵 연동용 무료 래퍼 |
| **데모** | Steam Next Fest 참가용 데모 빌드 별도 관리 |

### 5.3 Unity Addressables 기반 OTA 업데이트

#### Addressables — 서버 없이 에셋 OTA의 핵심

```
[Addressables OTA 흐름]

1. 빌드 시: 에셋을 Local/Remote 그룹으로 분류
   ├── Local: 앱에 포함 (UI, 핵심 스크립트)
   └── Remote: CDN에서 다운로드 (챕터 에셋, 배경, BGM)

2. 배포 시: Remote 에셋 카탈로그 + 번들을 CDN 업로드
   └── CloudFlare R2 / Unity CCD / GitHub Releases

3. 런타임:
   a. Addressables.CheckForCatalogUpdates() — 카탈로그 변경 확인
   b. Addressables.UpdateCatalogs() — 새 카탈로그 다운로드
   c. Addressables.DownloadDependenciesAsync("chapter_04") — 에셋 다운로드
   d. 로컬 캐시에 저장 → 이후 오프라인에서도 사용 가능

비용: CDN 비용만 (CloudFlare R2 이그레스 $0)
```

#### Addressables 그룹 설계

```csharp
// Editor/AddressablesConfig.cs — 에셋 그룹 자동 구성
// Asset Groups:
//
// [Local - Built In]  ← 앱에 포함, 항상 사용 가능
//   ├── UI/           모든 UI 에셋
//   ├── Fonts/        폰트 에셋
//   ├── Core/         핵심 프리팹, 매니저
//   └── Chapter_01/   첫 번째 챕터 (최소 플레이 보장)
//
// [Remote - CDN]      ← OTA 다운로드, 앱 업데이트 없이 추가 가능
//   ├── Chapter_02/
//   ├── Chapter_03/
//   ├── Chapter_04/   ← 나중에 추가되는 챕터
//   ├── BGM/          배경 음악 (용량 큼)
//   └── Localization/ 번역 데이터
```

#### 런타임 다운로드 매니저

```csharp
// Services/ContentDownloadManager.cs
public class ContentDownloadManager
{
    public async UniTask<bool> CheckForUpdates()
    {
        var catalogs = await Addressables.CheckForCatalogUpdates().ToUniTask();
        return catalogs.Count > 0;
    }

    public async UniTask UpdateCatalogs()
    {
        var catalogs = await Addressables.CheckForCatalogUpdates().ToUniTask();
        if (catalogs.Count > 0)
            await Addressables.UpdateCatalogs(catalogs).ToUniTask();
    }

    public async UniTask DownloadChapter(string chapterId, Action<float> onProgress = null)
    {
        var size = await Addressables.GetDownloadSizeAsync(chapterId).ToUniTask();
        if (size <= 0) return; // 이미 캐시됨

        var handle = Addressables.DownloadDependenciesAsync(chapterId);
        while (!handle.IsDone)
        {
            onProgress?.Invoke(handle.PercentComplete);
            await UniTask.Yield();
        }

        if (handle.Status != AsyncOperationStatus.Succeeded)
            throw new ContentDownloadException(chapterId, handle.OperationException);

        Addressables.Release(handle);
    }

    public async UniTask<long> GetChapterDownloadSize(string chapterId)
    {
        return await Addressables.GetDownloadSizeAsync(chapterId).ToUniTask();
    }
}
```

### 5.4 버전 관리 전략

#### Semantic Versioning + 빌드 넘버

```
v{MAJOR}.{MINOR}.{PATCH}+{BUILD}
예: v1.2.3+456

MAJOR: 대규모 콘텐츠 (새 챕터 묶음, 시스템 변경)
MINOR: 콘텐츠 추가 (새 챕터, 기능)
PATCH: 버그 수정, 밸런싱
BUILD: CI/CD 자동 증가 (PlayerSettings.Android.bundleVersionCode 등)
```

#### Git 브랜칭 + Unity 특화

```
main ──────●────●────●────●────●──── (안정 릴리스)
            \       / \       /
dev ─────────●──●──●───●──●──●────── (개발 브랜치)
              \   /       |
feature ───────●─●        ●──────── (기능/챕터별)
```

| 브랜치 | 용도 | 규칙 |
|--------|------|------|
| `main` | 스토어 출시 빌드 | 태그만 푸시, 직접 커밋 금지 |
| `dev` | 일상 개발 | 기본 작업 브랜치 |
| `feature/*` | 챕터/기능 개발 | `feature/chapter-04`, `feature/cloud-save` |
| `hotfix/*` | 긴급 버그 수정 | main에서 분기, main + dev에 머지 |

#### Unity 프로젝트 `.gitignore` 필수 항목

```gitignore
# Unity
/[Ll]ibrary/
/[Tt]emp/
/[Oo]bj/
/[Bb]uild/
/[Bb]uilds/
/[Ll]ogs/
/[Uu]ser[Ss]ettings/

# IDE
.idea/
.vs/
*.csproj
*.sln

# OS
.DS_Store
Thumbs.db

# Build
*.apk
*.aab
*.ipa
*.exe
*.app
```

#### Git LFS 설정 (대용량 에셋)

```gitattributes
# .gitattributes
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.obj filter=lfs diff=lfs merge=lfs -text
*.asset filter=lfs diff=lfs merge=lfs -text
*.prefab filter=lfs diff=lfs merge=lfs -text
*.unity filter=lfs diff=lfs merge=lfs -text
*.ink filter=lfs diff=lfs merge=lfs -text
```

---

## 6. 하나의 코드베이스, 멀티 플랫폼 배포 전략

> 이 섹션은 Unity의 강력한 크로스 플랫폼 능력을 **1인 개발자가 실제로 운영 가능한 수준**으로 정리한 것입니다. 핵심은 "코드 하나, 빌드 프로파일 여러 개"입니다.

### 6.1 전체 전략 개요

```
                    ┌─────────────────┐
                    │   Single C#     │
                    │   Codebase      │
                    │   (100% 공유)    │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼────┐  ┌─────▼─────┐  ┌─────▼──────┐
     │ Platform     │  │ Build     │  │ Asset      │
     │ Abstraction  │  │ Profiles  │  │ Variants   │
     │ Layer        │  │ (빌드설정) │  │ (에셋 품질) │
     └──────┬───────┘  └─────┬─────┘  └─────┬──────┘
            │                │              │
    ┌───────┴───────┐  ┌─────┴─────┐  ┌─────┴──────┐
    │ #if 전처리기   │  │ BuildConfig│  │ Addressable│
    │ Partial Class │  │ .asset     │  │ Profiles   │
    │ Interface DI  │  │ (per-plat) │  │ HD / SD    │
    └───────────────┘  └───────────┘  └────────────┘
            │                │              │
            ▼                ▼              ▼
     ┌──────────────────────────────────────────┐
     │              CI/CD (GameCI)              │
     │  git tag v1.0.0 → 5개 플랫폼 동시 빌드    │
     │  → 각 스토어 자동 배포                     │
     └──────────────────────────────────────────┘
```

### 6.2 Layer 1: 플랫폼 분기 코드 (전체의 5~10%)

#### 방법 A: 전처리기 지시자 (`#if`)

```csharp
// Platform/PlatformBridge.cs
// 간단한 플랫폼 분기에 적합. 로직이 짧을 때 사용.
public static class PlatformBridge
{
    public static string GetStoreName()
    {
#if UNITY_IOS
        return "App Store";
#elif UNITY_ANDROID
        return "Google Play";
#elif UNITY_STANDALONE_WIN
        return "Steam";
#elif UNITY_STANDALONE_OSX
        return "Steam";
#elif UNITY_WEBGL
        return "Web";
#else
        return "Unknown";
#endif
    }

    public static void RequestReview()
    {
#if UNITY_IOS
        UnityEngine.iOS.Device.RequestStoreReview();
#elif UNITY_ANDROID
        // Google Play In-App Review API
        var reviewManager = new ReviewManager();
        reviewManager.RequestReviewFlow();
#endif
    }

    public static string GetPersistentPath()
    {
        // Application.persistentDataPath는 이미 플랫폼별로 올바른 경로 반환
        // iOS: /var/mobile/.../Documents
        // Android: /data/data/com.xxx/files
        // Windows: C:/Users/.../AppData/LocalLow/...
        return Application.persistentDataPath;
    }
}
```

#### 방법 B: Interface + 플랫폼별 구현 (추천)

```csharp
// Services/Interfaces/IHapticService.cs
public interface IHapticService
{
    void LightImpact();
    void MediumImpact();
    void HeavyImpact();
    bool IsSupported { get; }
}

// Services/Platform/MobileHapticService.cs
public class MobileHapticService : IHapticService
{
    public bool IsSupported => true;

    public void LightImpact()
    {
#if UNITY_IOS
        iOSHapticFeedback.Trigger(iOSHapticFeedback.Type.ImpactLight);
#elif UNITY_ANDROID
        Handheld.Vibrate(); // 또는 Android 네이티브 플러그인
#endif
    }
    // ...
}

// Services/Platform/DesktopHapticService.cs
public class DesktopHapticService : IHapticService
{
    public bool IsSupported => false;
    public void LightImpact() { } // No-op
    public void MediumImpact() { }
    public void HeavyImpact() { }
}
```

#### 방법 C: Partial Class (플랫폼별 파일 분리)

```csharp
// Services/NativeShareService.cs — 공통
public partial class NativeShareService
{
    public void ShareScreenshot(string message, byte[] imageData)
    {
        string path = SaveTempImage(imageData);
        ShareInternal(message, path);
    }

    partial void ShareInternal(string message, string imagePath);
}

// Services/NativeShareService.iOS.cs — iOS 전용
#if UNITY_IOS
public partial class NativeShareService
{
    partial void ShareInternal(string message, string imagePath)
    {
        // iOS 네이티브 공유 시트 호출
        NativeShare share = new NativeShare();
        share.SetText(message).AddFile(imagePath).Share();
    }
}
#endif

// Services/NativeShareService.Android.cs — Android 전용
#if UNITY_ANDROID
public partial class NativeShareService
{
    partial void ShareInternal(string message, string imagePath)
    {
        // Android Intent 공유
        NativeShare share = new NativeShare();
        share.SetText(message).AddFile(imagePath).Share();
    }
}
#endif
```

### 6.3 Layer 2: Build Profile (Unity 6의 새 기능)

Unity 6에서 도입된 **Build Profiles**는 기존의 `EditorUserBuildSettings.SwitchActiveBuildTarget()` 방식을 대체합니다.

```
ProjectSettings/
├── BuildProfiles/
│   ├── Windows.buildprofile       # Windows 64-bit, IL2CPP
│   ├── macOS.buildprofile         # macOS Universal (Intel+ARM)
│   ├── Android.buildprofile       # ARM64, API 34+, AAB
│   ├── iOS.buildprofile           # ARM64, IL2CPP, 최소 iOS 16
│   ├── WebGL.buildprofile         # WebGL 2.0, Brotli 압축
│   └── Steam.buildprofile         # Windows + Steamworks 디파인
```

#### 플랫폼별 Scripting Define Symbols

| 빌드 프로파일 | 추가 Define | 용도 |
|--------------|-------------|------|
| Windows | `PLATFORM_STEAM` | Steamworks.NET 통합 |
| macOS | `PLATFORM_STEAM` | Steamworks.NET 통합 |
| Android | `PLATFORM_MOBILE` `PLATFORM_GOOGLE` | 모바일 UI, Google 결제 |
| iOS | `PLATFORM_MOBILE` `PLATFORM_APPLE` | 모바일 UI, Apple 결제 |
| WebGL | `PLATFORM_WEB` | 웹 특화 (로컬스토리지 세이브) |

```csharp
// 게임 코드에서의 활용
public class IAPService
{
    public void PurchaseChapter(string chapterId)
    {
#if PLATFORM_STEAM
        SteamPurchase(chapterId);
#elif PLATFORM_APPLE
        AppleIAP(chapterId);
#elif PLATFORM_GOOGLE
        GooglePlayBilling(chapterId);
#elif PLATFORM_WEB
        // 웹에서는 결제 비활성화 또는 외부 링크
        Debug.Log("Web platform: IAP not supported");
#endif
    }
}
```

#### 커스텀 빌드 스크립트 (CI/CD 연동)

```csharp
// Editor/BuildPipeline/ProjectBuilder.cs
public static class ProjectBuilder
{
    // CI에서 호출: Unity -executeMethod ProjectBuilder.BuildWindows
    public static void BuildWindows()
    {
        Build(new BuildConfig
        {
            Target = BuildTarget.StandaloneWindows64,
            Options = BuildOptions.CompressWithLz4HC,
            OutputPath = "build/Windows/pilgrims-progress.exe",
            Defines = new[] { "PLATFORM_STEAM" }
        });
    }

    public static void BuildAndroid()
    {
        PlayerSettings.Android.bundleVersionCode = GetBuildNumber();
        EditorUserBuildSettings.buildAppBundle = true; // AAB

        Build(new BuildConfig
        {
            Target = BuildTarget.Android,
            Options = BuildOptions.CompressWithLz4HC,
            OutputPath = "build/Android/pilgrims-progress.aab",
            Defines = new[] { "PLATFORM_MOBILE", "PLATFORM_GOOGLE" }
        });
    }

    public static void BuildiOS()
    {
        PlayerSettings.iOS.buildNumber = GetBuildNumber().ToString();

        Build(new BuildConfig
        {
            Target = BuildTarget.iOS,
            Options = BuildOptions.CompressWithLz4HC,
            OutputPath = "build/iOS",
            Defines = new[] { "PLATFORM_MOBILE", "PLATFORM_APPLE" }
        });
    }

    private static void Build(BuildConfig config)
    {
        // Define Symbols 설정
        var existingDefines = PlayerSettings.GetScriptingDefineSymbols(
            NamedBuildTarget.FromBuildTargetGroup(
                BuildPipeline.GetBuildTargetGroup(config.Target)));
        var allDefines = existingDefines + ";" + string.Join(";", config.Defines);
        PlayerSettings.SetScriptingDefineSymbols(
            NamedBuildTarget.FromBuildTargetGroup(
                BuildPipeline.GetBuildTargetGroup(config.Target)), allDefines);

        var scenes = EditorBuildSettings.scenes
            .Where(s => s.enabled)
            .Select(s => s.path)
            .ToArray();

        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
        {
            scenes = scenes,
            locationPathName = config.OutputPath,
            target = config.Target,
            options = config.Options
        });

        if (report.summary.result != BuildResult.Succeeded)
            throw new BuildFailedException(report.summary.ToString());
    }

    private static int GetBuildNumber()
    {
        // CI 환경변수에서 빌드 넘버 가져오기
        var buildNum = Environment.GetEnvironmentVariable("BUILD_NUMBER");
        return int.TryParse(buildNum, out var num) ? num : 1;
    }
}
```

### 6.4 Layer 3: 에셋 품질 분기 (Addressable Variants)

```
[에셋 품질 전략]

데스크탑 (HD):                  모바일 (SD):
├── 배경: 1920x1080 PNG         ├── 배경: 1280x720 ASTC
├── 캐릭터: 1024x1024           ├── 캐릭터: 512x512
├── BGM: 320kbps OGG            ├── BGM: 128kbps OGG
└── 이펙트: 고해상도              └── 이펙트: 저해상도
```

```csharp
// Editor/AddressableVariantBuilder.cs
// Addressable Groups에서 Label로 품질 분기
//
// 에셋 라벨링:
//   chapter_01_bg.png  → Labels: ["chapter_01", "hd"]
//   chapter_01_bg_sd.png → Labels: ["chapter_01", "sd"]
//
// 런타임에서:
public class AssetQualityManager
{
    private string _qualitySuffix;

    public void Initialize()
    {
        _qualitySuffix = Application.isMobilePlatform ? "sd" : "hd";
    }

    public async UniTask<Sprite> LoadBackground(string chapterId)
    {
        string address = $"{chapterId}_bg_{_qualitySuffix}";
        return await Addressables.LoadAssetAsync<Sprite>(address).ToUniTask();
    }
}
```

### 6.5 Layer 4: 입력(Input) 통합

```csharp
// Input/InputManager.cs — Input System 패키지 기반
// 하나의 Input Action Asset으로 모든 플랫폼 대응

// PilgrimsProgress.inputactions (Unity Input Action Asset):
//
// Action Map: "Gameplay"
//   ├── Navigate    : Value (Vector2)
//   │   ├── Keyboard: WASD / Arrow Keys
//   │   ├── Gamepad: Left Stick
//   │   └── Touch: Swipe Gesture (커스텀 Interaction)
//   │
//   ├── Select      : Button
//   │   ├── Keyboard: Enter / Space
//   │   ├── Gamepad: A / Cross
//   │   └── Touch: Tap
//   │
//   ├── Back        : Button
//   │   ├── Keyboard: Escape
//   │   ├── Gamepad: B / Circle
//   │   └── Touch: Back Button (Android)
//   │
//   └── AdvanceDialogue : Button
//       ├── Keyboard: Space / Enter / Click
//       ├── Gamepad: A / Cross
//       └── Touch: Tap anywhere

public class GameInputManager : MonoBehaviour
{
    private PilgrimsProgressInput _input;

    private void Awake()
    {
        _input = new PilgrimsProgressInput();
        _input.Gameplay.Enable();

        _input.Gameplay.AdvanceDialogue.performed += OnAdvanceDialogue;
        _input.Gameplay.Select.performed += OnSelect;
        _input.Gameplay.Back.performed += OnBack;
    }

    private void OnAdvanceDialogue(InputAction.CallbackContext ctx)
    {
        // 이 코드 하나로 키보드 Enter, 마우스 클릭, 터치 탭, 게임패드 A 모두 처리
        GameEvents.OnDialogueAdvance?.Invoke();
    }
}
```

### 6.6 운영 시 멀티 플랫폼 동시 배포 플로우

```
[실제 배포 워크플로 — 1인 개발자]

1. dev 브랜치에서 개발 완료
2. main으로 PR → 머지
3. git tag v1.2.0 → push

   ┌─ GitHub Actions 자동 시작 ──────────────────────────┐
   │                                                     │
   │  [Job 1] Test          → EditMode + PlayMode 테스트  │
   │                                                     │
   │  [Job 2~6] Build       → 5개 플랫폼 동시 빌드        │
   │    ├── Windows (.exe)                               │
   │    ├── macOS (.app)                                 │
   │    ├── Android (.aab)                               │
   │    ├── iOS (.xcodeproj → .ipa)                      │
   │    └── WebGL (.html)                                │
   │                                                     │
   │  [Job 7] Deploy Steam  → steamcmd 자동 업로드        │
   │  [Job 8] Deploy itch   → butler 자동 업로드          │
   │  [Job 9] Deploy Google → Fastlane → 내부 테스트      │
   │  [Job 10] Deploy iOS   → Fastlane → TestFlight      │
   │  [Job 11] Deploy Web   → GitHub Pages / Netlify     │
   │                                                     │
   └─────────────────────────────────────────────────────┘

4. 결과: tag 하나로 5개 플랫폼 빌드 + 5개 스토어 배포 완료
   소요 시간: 약 30~60분 (대기만 하면 됨)
```

### 6.7 플랫폼별 주의사항 체크리스트

| 항목 | Windows | macOS | Android | iOS | WebGL |
|------|---------|-------|---------|-----|-------|
| **스크립팅 백엔드** | IL2CPP 권장 | IL2CPP 권장 | IL2CPP 필수 | IL2CPP 필수 | IL2CPP (내장) |
| **아키텍처** | x64 | Universal (x64+ARM) | ARM64 필수 | ARM64 | WASM |
| **최소 OS** | Win 10+ | macOS 12+ | Android 7.0 (API 24) | iOS 16+ | 최신 브라우저 |
| **인앱 결제** | Steam IAP | Steam IAP | Google Billing v6+ | StoreKit 2 | N/A |
| **세이브 경로** | AppData/LocalLow | ~/Library/... | Internal Storage | Documents/ | IndexedDB |
| **코드 서명** | 선택 (EV 인증서) | **필수** (Notarize) | **필수** (Keystore) | **필수** (Provisioning) | 불필요 |
| **빌드 크기 목표** | < 500MB | < 500MB | < 150MB (AAB) | < 200MB | < 30MB |

### 6.8 핵심 정리: "바꿔야 하는 것 vs 절대 바꾸지 않는 것"

| 절대 바꾸지 않는 것 (100% 공유) | 플랫폼별로 바꾸는 것 (5~10%) |
|-------------------------------|----------------------------|
| 게임 로직 (C# 스크립트) | UI 레이아웃 (UXML + USS 테마) |
| 스토리 데이터 (Ink 파일) | 입력 바인딩 (Input Action Asset) |
| 세이브/로드 인터페이스 | 세이브 구현체 (Local/Cloud) |
| 게임 상태 관리 | 결제 시스템 (Steam/Apple/Google) |
| 선택지/분기 로직 | 코드 서명/빌드 설정 |
| 캐릭터/배경 프리팹 | 에셋 품질 (HD/SD) |
| 오디오 트리거 로직 | 네이티브 기능 (햅틱, 공유, 리뷰) |
| 로컬라이제이션 키 | 스토어별 메타데이터 |

---

## 부록: 1인 개발자를 위한 마일스톤 로드맵

```
[Phase 0 — 프로토타입] 2~3개월
  ├── Unity 6 프로젝트 셋업 + 디렉토리 구조
  ├── Ink 통합 + 핵심 대화 시스템
  ├── 1개 챕터 프로토타입
  ├── 로컬 세이브 시스템 (ISaveService)
  └── Git + LFS + .gitignore 설정

[Phase 1 — MVP] 3~4개월
  ├── 3~5개 챕터 콘텐츠 (Ink)
  ├── 게스트 모드 완성
  ├── UI Toolkit 기반 반응형 UI
  ├── PC 빌드 + itch.io 공개
  ├── GameCI 파이프라인 구축
  └── 커뮤니티 피드백 수집

[Phase 2 — 모바일 확장] 2~3개월
  ├── Android/iOS 빌드 최적화 (SD 에셋)
  ├── 모바일 UI 테마 + 세이프 영역
  ├── 스토어 심사 대응 (Privacy Policy 등)
  ├── Addressables Remote 설정
  └── (선택) UGS Cloud Save 도입

[Phase 3 — 정식 출시] 2~3개월
  ├── Steam 출시 + Steamworks 연동
  ├── 전체 스토리 콘텐츠 완성
  ├── Unity Localization (영어 우선)
  ├── tag → 5개 플랫폼 자동 배포 완성
  └── 마케팅 + 커뮤니티 빌딩

[Phase 4 — 라이브 서비스] 지속
  ├── Addressables로 챕터 OTA 추가
  ├── UGS 랭킹/소셜 기능
  ├── 콘솔 포팅 검토 (Nintendo Switch)
  └── 후속작 기획
```

---

## 마치며

> 천로역정은 300년 넘게 사람들의 마음을 울린 이야기입니다. 좋은 서사는 화려한 기술 스택이 아니라 **플레이어의 마음에 닿는 경험**에서 비롯됩니다.
>
> Unity 6와 C#은 1인 개발자가 **하나의 코드베이스로 세상 모든 플랫폼에 닿을 수 있는** 가장 현실적인 선택입니다. `git tag v1.0.0` 하나로 5개 플랫폼에 동시 배포되는 파이프라인을 일찍 구축해 두면, 이후에는 오직 콘텐츠에만 집중할 수 있습니다.
>
> 1인 개발의 가장 큰 적은 기술 부채가 아니라 **번아웃**입니다. 작게 만들고, 빨리 공개하고, 피드백을 받으세요. 완벽한 출시보다 불완전한 공개가 더 많은 것을 가르쳐 줍니다.
>
> 이 여정을 응원합니다.

---

*이 문서는 프로젝트의 발전에 따라 지속적으로 업데이트됩니다.*
*최종 수정: 2026-03-14*
