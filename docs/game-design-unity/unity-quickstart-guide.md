# 07. Unity 퀵스타트 가이드 (Unity Quickstart Guide)

> **대상 독자**: 웹 개발 경험은 있지만 Unity는 처음인 개발자
> **Unity 버전**: Unity 6 LTS (6000.3.11f1)
> **프로젝트**: pilgrims-progress-unity (2D URP 템플릿)
> **최종 수정**: 2026-03-16

---

## 목차

1. [Unity Editor 기본 이해](#1-unity-editor-기본-이해)
2. [첫 번째 게임 실행하기](#2-첫-번째-게임-실행하기)
3. [Cursor를 외부 에디터로 설정](#3-cursor를-외부-에디터로-설정)
4. [코드 수정하고 결과 보기](#4-코드-수정하고-결과-보기)
5. [WebGL 빌드하기](#5-webgl-빌드하기)
6. [itch.io에 수동 배포하기](#6-itchio에-수동-배포하기)
7. [GitHub Actions 자동 배포](#7-github-actions-자동-배포)
8. [Unity 프로젝트 폴더 구조 이해](#8-unity-프로젝트-폴더-구조-이해)
9. [자주 쓰는 단축키 & 팁](#9-자주-쓰는-단축키--팁)
10. [웹 개발자를 위한 Unity 개념 매핑](#10-웹-개발자를-위한-unity-개념-매핑)

---

## 1. Unity Editor 기본 이해

### 1.1 에디터를 한마디로

웹 개발자에게 익숙한 비유로 설명하면:

> **Unity Editor = 브라우저 DevTools + 비주얼 레이아웃 편집기 + 코드 런타임**이 하나로 합쳐진 것

React/Next.js에서 코드를 작성하고, 브라우저에서 결과를 확인하고, DevTools로 디버깅하는 흐름을 하나의 앱에서 전부 한다고 생각하면 된다.

### 1.2 5개 핵심 패널

Unity Editor를 처음 열면 여러 패널이 보인다. 각각의 역할을 웹 개발 개념에 매핑하면 다음과 같다.

#### 1) Hierarchy (계층 구조) — 왼쪽

```
웹 비유: HTML DOM 트리
```

- 현재 씬(Scene)에 존재하는 **모든 오브젝트(GameObject)** 의 트리 구조
- 브라우저 DevTools의 Elements 패널에서 DOM 트리를 보는 것과 같다
- 부모-자식 관계를 드래그로 설정할 수 있다
- 오브젝트를 클릭하면 오른쪽 Inspector에 상세 정보가 표시된다
- 우클릭하면 새 오브젝트를 생성할 수 있다

#### 2) Scene View (씬 뷰) — 가운데

```
웹 비유: 비주얼 캔버스 / CSS 편집기의 시각적 미리보기
```

- 게임 월드를 **편집하는 공간**
- 오브젝트를 드래그하여 위치를 옮기고, 크기를 조절하고, 회전시킬 수 있다
- 2D 프로젝트에서는 평면 뷰가 기본이다
- 마우스 스크롤로 줌(Zoom) 인/아웃, 마우스 가운데 버튼(또는 Option+드래그)으로 패닝(Panning)

#### 3) Game View (게임 뷰) — 가운데 탭

```
웹 비유: 브라우저의 실제 렌더링 결과 미리보기
```

- **플레이어가 실제로 보게 될 화면**
- Scene View 옆의 "Game" 탭을 클릭하면 전환
- Play 버튼(▶)을 누르면 이 뷰에서 게임이 실행된다
- 해상도를 변경하여 다양한 화면 크기에서 테스트할 수 있다 (Free Aspect → 원하는 해상도 선택)

#### 4) Inspector (인스펙터) — 오른쪽

```
웹 비유: DevTools의 Properties / CSS 패널
```

- Hierarchy에서 선택한 오브젝트의 **모든 속성과 컴포넌트(Component)** 를 보여준다
- Transform(위치, 회전, 크기), 스크립트의 public 변수, 이미지 설정 등을 직접 수정
- 웹에서 DevTools로 요소의 CSS 속성을 실시간으로 바꾸는 것과 비슷하다
- C# 스크립트의 `public` 필드는 여기에 자동으로 노출된다

#### 5) Project (프로젝트) — 하단

```
웹 비유: 파일 탐색기 / src 폴더 브라우저
```

- `Assets/` 폴더 내의 **모든 파일**을 보여주는 탐색기
- 스크립트(.cs), 씬(.unity), 이미지, 오디오 등 모든 에셋이 여기 있다
- 폴더를 만들어 정리할 수 있다 (우클릭 → Create → Folder)
- 파일을 더블클릭하면 해당 에디터에서 열린다 (스크립트 → 코드 에디터, 씬 → Scene View)

#### 6) Console (콘솔) — 하단 탭

```
웹 비유: 브라우저 개발자 도구의 Console 탭
```

- `Debug.Log()` 출력이 여기에 표시된다 (= `console.log()`)
- 컴파일 에러, 런타임 에러, 경고(Warning) 모두 여기서 확인
- 에러가 있으면 빨간색, 경고는 노란색으로 표시
- "Clear" 버튼으로 로그를 지울 수 있다
- "Collapse" 토글로 같은 메시지를 묶어서 볼 수 있다
- 에러 메시지를 더블클릭하면 해당 코드 줄로 점프한다

### 1.3 패널 레이아웃 재배치

패널이 보이지 않거나 레이아웃이 꼬였을 때:

1. 상단 메뉴 → **Window** → **Layouts** → **Default** 클릭
2. 기본 레이아웃으로 초기화된다
3. 특정 패널이 안 보이면: **Window** 메뉴에서 해당 패널 이름을 클릭하면 다시 나타난다
   - Window → General → Console
   - Window → General → Inspector
   - Window → General → Hierarchy

---

## 2. 첫 번째 게임 실행하기

이미 `Assets/Scripts/SimpleDialogueRunner.cs` 스크립트가 준비되어 있다. 이 스크립트는 모든 UI를 코드에서 직접 생성하므로, 빈 오브젝트에 붙이기만 하면 바로 실행된다.

### 단계별 따라하기

#### Step 1: Unity에서 프로젝트 열기

1. **Unity Hub** 실행
2. 프로젝트 목록에서 **pilgrims-progress-unity** 클릭
3. Unity Editor가 열리면서 `SampleScene`이 자동으로 로드된다
4. Hierarchy 패널에 **SampleScene** 아래 `Main Camera`와 `Global Volume` 등이 보인다

#### Step 2: 빈 게임 오브젝트 생성

1. **Hierarchy 패널**에서 빈 공간을 **우클릭(Right-click)**
2. 맨 위의 **"Create Empty"** 클릭
3. "GameObject"라는 이름의 빈 오브젝트가 생성된다

#### Step 3: 이름 변경

1. 방금 생성한 오브젝트가 Hierarchy에서 선택된 상태에서
2. 오른쪽 **Inspector 패널** 상단에 이름이 "GameObject"로 표시된다
3. 이름을 클릭하여 **"DialogueManager"** 로 변경
4. Enter 키를 눌러 확정

> **팁**: Hierarchy에서 오브젝트를 선택하고 F2 키를 눌러도 이름 변경이 가능하다.

#### Step 4: 스크립트 찾기

1. 하단 **Project 패널**에서 `Assets` 폴더를 연다
2. `Scripts` 폴더를 더블클릭
3. **SimpleDialogueRunner** 파일이 보인다 (C# 스크립트 아이콘)

> **팁**: Project 패널 상단 검색창에 "SimpleDialogue"를 타이핑하면 바로 찾을 수 있다.

#### Step 5: 스크립트를 오브젝트에 연결

**방법 A — 드래그 앤 드롭(Drag & Drop):**

1. Project 패널에서 **SimpleDialogueRunner** 스크립트를 마우스로 집어서
2. Hierarchy 패널의 **DialogueManager** 오브젝트 위에 드롭(놓기)

**방법 B — Inspector에서 추가:**

1. Hierarchy에서 **DialogueManager** 오브젝트를 선택
2. Inspector 패널 맨 아래 **"Add Component"** 버튼 클릭
3. 검색창에 "SimpleDialogue" 입력
4. **SimpleDialogueRunner** 를 선택

연결이 완료되면 Inspector에 `Simple Dialogue Runner (Script)` 컴포넌트가 추가된 것이 보인다.

#### Step 6: 게임 실행

1. 에디터 상단 중앙에 있는 **▶ Play 버튼** 클릭
2. 화면이 Game View로 전환된다
3. 대화 UI가 나타난다!
   - 상단: 장소 표시 ("멸망의 도시 (City of Destruction)")
   - 중앙: 대화 텍스트
   - 하단: **"계속 ▶"** 버튼

#### Step 7: 대화 진행

1. **"계속 ▶"** 버튼을 클릭하면 다음 대사로 넘어간다
2. 선택지가 나타나면 원하는 선택지 버튼을 클릭
3. 이야기가 분기되어 진행된다
4. "[ 데모 끝 ]" 메시지가 나오면 데모 종료

#### Step 8: 게임 정지

1. 상단의 **▶ Play 버튼**을 다시 클릭 (또는 `Cmd + P`)
2. 게임이 정지되고 편집 모드로 돌아간다

> **⚠️ 중요**: Play 모드에서 변경한 내용은 **Play를 중지하면 모두 사라진다**. 이것은 Unity의 핵심 특성이다. 웹 개발에서 React DevTools로 state를 변경하면 새로고침 시 리셋되는 것과 같다.

#### Step 9: 씬 저장

1. `Cmd + S` (Mac) 또는 `Ctrl + S` (Windows)
2. 또는 메뉴: **File** → **Save**

> **⚠️ 중요**: Unity는 씬(Scene)을 자동 저장하지 않는다! 작업 후 반드시 수동 저장해야 한다. 웹 개발에서 파일은 자동 저장되고 핫 리로드가 되지만, Unity에서 씬은 수동 저장이 필수이다.

---

## 3. Cursor를 외부 에디터로 설정

Unity에서 C# 스크립트를 더블클릭하면 외부 에디터가 열린다. 기본으로는 Visual Studio가 설정되어 있을 수 있으므로, Cursor로 변경한다.

### 단계별 따라하기

#### Step 1: Preferences 열기

- **Mac**: 상단 메뉴 → **Unity** → **Settings...**
- **Windows**: 상단 메뉴 → **Edit** → **Preferences**

#### Step 2: External Script Editor 변경

1. 왼쪽 목록에서 **"External Tools"** 클릭
2. **"External Script Editor"** 드롭다운 클릭
3. **"Browse..."** 선택
4. 파일 탐색기에서 다음 경로로 이동:
   - **Mac**: `/Applications/Cursor.app` 선택
   - **Windows**: `C:\Users\{사용자명}\AppData\Local\Programs\cursor\Cursor.exe` 선택
5. 드롭다운에 **"Cursor"** 가 표시되면 성공

#### Step 3: 확인

1. Unity로 돌아가기
2. Project 패널에서 `Assets/Scripts/SimpleDialogueRunner.cs` 를 **더블클릭**
3. Cursor가 열리면서 해당 파일이 표시되면 설정 완료

#### Step 4: Cursor에서 C# 확장 설치

Cursor에서 IntelliSense(자동 완성, 타입 체크)를 사용하려면:

1. Cursor 열기
2. 좌측 사이드바 **Extensions** 아이콘 클릭 (또는 `Cmd + Shift + X`)
3. 검색창에 **"C# Dev Kit"** 입력
4. **C# Dev Kit** (Microsoft) 설치
5. 설치 완료 후, `.cs` 파일을 열면 자동 완성과 에러 표시가 활성화된다

> **참고**: C# Dev Kit이 `.sln` 파일을 인식하지 못할 수 있다. Unity 메뉴에서 **Edit** → **Preferences** → **External Tools** → **"Regenerate project files"** 버튼을 클릭하면 `.sln`과 `.csproj` 파일이 다시 생성된다.

---

## 4. 코드 수정하고 결과 보기

### 4.1 개발 사이클 (Edit-Test Cycle)

웹 개발과의 비교:

| 웹 개발 | Unity 개발 |
|---------|-----------|
| 코드 수정 → 저장 → 브라우저가 핫 리로드 | 코드 수정 → 저장 → Unity로 전환 → 자동 컴파일 → **Play 버튼** |
| 즉시 반영 | 컴파일 + Play 클릭 필요 |
| `npm start` 한 번이면 계속 | 매번 Play/Stop 반복 |

### 4.2 구체적인 흐름

1. **Cursor에서 C# 코드 수정**
   - 예: `SimpleDialogueRunner.cs`의 대사 텍스트를 변경

2. **저장** (`Cmd + S`)

3. **Unity로 전환** (`Cmd + Tab` 또는 Alt + Tab)
   - Unity가 포커스를 받으면 **자동으로 컴파일이 시작**된다
   - 에디터 하단 오른쪽에 **진행 바(progress bar)** 가 나타난다
   - 컴파일이 끝날 때까지 기다려야 한다 (보통 2~5초)

4. **Play 버튼(▶) 클릭** (`Cmd + P`)
   - 변경된 코드가 반영된 상태로 게임이 실행된다

5. **테스트 후 Play 다시 클릭하여 정지**

### 4.3 코드를 수정해 보기 — 실습

대사를 하나 바꿔보자. `SimpleDialogueRunner.cs`에서 첫 번째 대사를 수정:

```csharp
// 기존:
Body = "어느 날, 한 남자가 누더기 옷을 입고 등에 무거운 짐을 진 채 서 있었다.\n" +
       "그의 손에는 한 권의 책이 들려 있었다.",

// 수정 예시:
Body = "어둡고 긴 밤이 지나고, 한 남자가 누더기 옷을 입고 등에 무거운 짐을 진 채 서 있었다.\n" +
       "그의 손에는 낡고 오래된 한 권의 책이 들려 있었다.",
```

저장 → Unity 전환 → 컴파일 대기 → Play → 변경 확인!

### 4.4 에러 처리

컴파일 에러가 있으면:

1. **Unity Console** 패널에 빨간색 에러 메시지가 표시된다
2. Play 버튼을 눌러도 **게임이 실행되지 않는다**
3. 에러 메시지를 **더블클릭**하면 Cursor에서 해당 줄이 열린다
4. 에러를 수정하고 저장하면 Unity가 다시 컴파일한다

자주 만나는 에러 예시:

| 에러 메시지 | 원인 | 해결 |
|------------|------|------|
| `CS1002: ; expected` | 세미콜론 누락 | 해당 줄 끝에 `;` 추가 |
| `CS0246: type or namespace not found` | `using` 문 누락 또는 오타 | 올바른 `using` 문 추가 |
| `NullReferenceException` | null 객체에 접근 | 객체가 초기화되었는지 확인 |

### 4.5 주의사항

- **컴파일 중에는 Play를 누르지 말 것**: 하단 오른쪽 진행 바가 완료될 때까지 대기
- **Play 모드에서 코드 수정 가능하지만 권장하지 않음**: 저장하면 Unity가 리컴파일을 시도하고 Play가 중단될 수 있다
- **Debug.Log()를 적극 활용**: 웹의 `console.log()`처럼, 값을 확인하고 싶을 때 사용

```csharp
void Start()
{
    Debug.Log("게임이 시작됩니다!");
    Debug.Log($"스토리 노드 개수: {_story.Count}");
}
```

---

## 5. WebGL 빌드하기

Unity로 만든 게임을 웹 브라우저에서 실행할 수 있는 WebGL 빌드를 만든다.

### 5.1 WebGL 빌드 모듈 확인

WebGL 빌드 모듈이 설치되어 있지 않을 수 있다. 먼저 확인:

1. **Unity Hub** 열기
2. 왼쪽 메뉴에서 **"Installs"** 클릭
3. 설치된 Unity 6 버전 옆의 **⚙ 톱니바퀴** 아이콘 클릭
4. **"Add Modules"** 선택
5. **"WebGL Build Support"** 체크 → **Install** 클릭
6. 설치 완료 후 Unity 재시작

### 5.2 빌드 설정

#### Step 1: Build Profiles 열기

1. Unity 메뉴: **File** → **Build Profiles**
2. Build Profiles 창이 열린다

#### Step 2: WebGL 프로필 추가

1. **"Add Build Profile"** 버튼 클릭
2. 플랫폼 목록에서 **"WebGL"** 선택
3. WebGL 프로필이 목록에 추가된다

#### Step 3: 씬 확인

1. Build Profiles 창에서 **"Scene List"** 섹션 확인
2. `Scenes/SampleScene` 이 목록에 있어야 한다
3. 없으면: 상단의 **"Add Open Scenes"** 버튼 클릭

#### Step 4: 빌드 실행

1. WebGL 프로필이 선택된 상태에서 **"Build"** 버튼 클릭
2. 출력 폴더를 선택하는 대화상자가 나타난다
3. 프로젝트 루트에 `Builds/WebGL` 폴더를 만들어 선택
4. **빌드가 시작된다** — 첫 빌드는 **5~10분** 이상 소요될 수 있다
5. 완료되면 선택한 폴더에 빌드 결과물이 생성된다

> **팁**: 빌드 시간을 줄이려면 **File** → **Build Profiles** → **Player Settings** (하단) → **Publishing Settings** → **Compression Format** → **Disabled** 로 설정 (개발 중에만).

### 5.3 빌드 결과물 구조

```
Builds/WebGL/
├── index.html          ← 이 파일이 진입점
├── Build/
│   ├── WebGL.data      ← 게임 에셋 데이터
│   ├── WebGL.framework.js  ← Unity 런타임
│   ├── WebGL.loader.js     ← 로딩 스크립트
│   └── WebGL.wasm      ← WebAssembly 바이너리
└── TemplateData/
    ├── style.css        ← 로딩 화면 스타일
    └── ...              ← 로딩 바 이미지 등
```

### 5.4 로컬 테스트

WebGL 빌드는 보안 정책(CORS) 때문에 `file://` 프로토콜로 직접 열 수 없다.
로컬 웹 서버를 사용해야 한다:

```bash
# 빌드 결과 폴더로 이동
cd pilgrims-progress-unity/Builds/WebGL

# Python 내장 HTTP 서버 실행
python3 -m http.server 8080
```

브라우저에서 http://localhost:8080 을 열면 게임이 실행된다.

> **Node.js를 선호한다면:**
> ```bash
> npx serve Builds/WebGL -p 8080
> ```

서버를 중지하려면 터미널에서 `Ctrl + C`를 누른다.

---

## 6. itch.io에 수동 배포하기

[itch.io](https://itch.io)는 인디 게임을 무료로 배포할 수 있는 플랫폼이다. WebGL 빌드를 업로드하면 브라우저에서 바로 플레이 가능하다.

### 단계별 따라하기

#### Step 1: 계정 생성

1. https://itch.io 접속
2. **"Register"** 클릭
3. 사용자 이름, 이메일, 비밀번호 입력 후 가입

#### Step 2: 새 프로젝트 생성

1. 로그인 후 우측 상단 화살표 메뉴 → **"Dashboard"** 클릭
2. **"Create new project"** 버튼 클릭

#### Step 3: 프로젝트 설정

다음과 같이 입력:

| 항목 | 설정값 |
|------|--------|
| **Title** | `천로역정 — 순례자의 여정` |
| **Project URL** | `pilgrims-progress` (자동 생성되며 수정 가능) |
| **Kind of project** | **HTML** 선택 |
| **Classification** | Game |
| **Pricing** | 원하는 가격 모델 선택 (무료는 "No payments") |

#### Step 4: WebGL 빌드 업로드

1. 먼저 빌드 결과물을 ZIP으로 압축:

```bash
cd pilgrims-progress-unity/Builds
zip -r WebGL.zip WebGL/
```

2. itch.io 프로젝트 페이지에서 **"Upload files"** 클릭
3. 생성한 **WebGL.zip** 파일 업로드
4. 업로드 완료 후, 파일 옆에 나타나는 체크박스:
   - ✅ **"This file will be played in the browser"** 반드시 체크

#### Step 5: 디스플레이 설정

| 항목 | 설정값 |
|------|--------|
| **Viewport dimensions** | `960 x 600` 또는 `1280 x 720` |
| **Fullscreen button** | ✅ 체크 (권장) |
| **Mobile friendly** | 현재는 체크 해제 |

#### Step 6: 저장 및 공개

1. 페이지 하단의 **"Save & view page"** 클릭
2. 게임 페이지가 생성된다
3. 게임이 브라우저에서 로드되고 플레이 가능한지 확인

게임 URL: `https://your-username.itch.io/pilgrims-progress`

> **팁**: 처음에는 **Visibility** 를 "Draft"로 두고 테스트한 후, 준비되면 "Public"으로 변경하면 된다.

---

## 7. GitHub Actions 자동 배포

매번 빌드하고 itch.io에 수동으로 업로드하는 것은 번거롭다.
GitHub Actions를 사용하면 `main` 브랜치에 push할 때마다 자동으로 빌드하고 itch.io에 배포할 수 있다.

### 7.1 개념 설명

```
[코드 Push to main]
     ↓
[GitHub Actions 트리거]
     ↓
[GameCI unity-builder: WebGL 빌드]
     ↓
[Butler CLI: itch.io 업로드]
     ↓
[게임 자동 업데이트!]
```

사용하는 주요 도구:
- **[GameCI](https://game.ci/)** (`game-ci/unity-builder`): GitHub Actions에서 Unity 프로젝트를 빌드하는 액션
- **[Butler CLI](https://itch.io/docs/butler/)**: itch.io의 커맨드라인 업로드 도구

### 7.2 필수 GitHub Secrets 설정

GitHub Actions가 Unity 빌드와 itch.io 업로드를 수행하려면 3개의 시크릿(Secret)이 필요하다.

#### Secret 1: `UNITY_LICENSE`

Unity는 빌드 시 라이선스 인증이 필요하다. GitHub Actions 환경에서 사용할 라이선스 파일을 얻는 방법:

**A) 활성화 파일 요청 (.alf 생성)**

1. GitHub 리포지토리에 다음 워크플로우 파일을 생성:

```yaml
# .github/workflows/request-activation.yml
name: Request Unity Activation File
on: workflow_dispatch
jobs:
  request:
    runs-on: ubuntu-latest
    steps:
      - name: Request activation file
        id: getManualLicenseFile
        uses: game-ci/unity-request-activation-file@v2
        with:
          unityVersion: 6000.3.11f1
      - name: Upload activation file
        uses: actions/upload-artifact@v4
        with:
          name: Unity_v6000.3.11f1.alf
          path: ${{ steps.getManualLicenseFile.outputs.filePath }}
```

2. GitHub에 push한 후, **Actions** 탭 → **"Request Unity Activation File"** → **"Run workflow"** 클릭
3. 워크플로우 완료 후 **Artifacts**에서 `.alf` 파일 다운로드

**B) 라이선스 파일 획득 (.ulf 생성)**

1. https://license.unity3d.com/manual 접속
2. 다운로드한 `.alf` 파일 업로드
3. Unity Personal 라이선스 선택 (무료)
4. `.ulf` 파일이 다운로드됨

**C) GitHub Secret으로 등록**

1. GitHub 리포지토리 → **Settings** → **Secrets and variables** → **Actions**
2. **"New repository secret"** 클릭
3. Name: `UNITY_LICENSE`
4. Value: `.ulf` 파일의 **전체 내용**을 복사하여 붙여넣기
5. **"Add secret"** 클릭

#### Secret 2: `BUTLER_CREDENTIALS`

1. https://itch.io/user/settings/api-keys 접속
2. **"Generate new API key"** 클릭
3. 생성된 API key를 복사
4. GitHub 리포지토리 → **Settings** → **Secrets and variables** → **Actions**
5. **"New repository secret"** 클릭
6. Name: `BUTLER_CREDENTIALS`
7. Value: 복사한 API key 붙여넣기
8. **"Add secret"** 클릭

#### Secret 3: `ITCH_GAME`

1. GitHub 리포지토리 → **Settings** → **Secrets and variables** → **Actions**
2. **"New repository secret"** 클릭
3. Name: `ITCH_GAME`
4. Value: itch.io 게임 경로 (예: `your-username/pilgrims-progress`)
5. **"Add secret"** 클릭

### 7.3 GitHub Actions 워크플로우

3개의 시크릿 설정이 완료되면, 다음 워크플로우 파일을 작성:

```yaml
# .github/workflows/deploy-webgl.yml
name: Build & Deploy WebGL to itch.io

on:
  push:
    branches: [main]
    paths:
      - 'pilgrims-progress-unity/**'
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      # 1. 코드 체크아웃
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          lfs: true

      # 2. 캐시 (빌드 속도 향상)
      - name: Cache Library
        uses: actions/cache@v4
        with:
          path: pilgrims-progress-unity/Library
          key: Library-WebGL-${{ hashFiles('pilgrims-progress-unity/Assets/**', 'pilgrims-progress-unity/Packages/**', 'pilgrims-progress-unity/ProjectSettings/**') }}
          restore-keys: |
            Library-WebGL-

      # 3. Unity WebGL 빌드
      - name: Build WebGL
        uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
        with:
          projectPath: pilgrims-progress-unity
          targetPlatform: WebGL
          unityVersion: 6000.3.11f1

      # 4. itch.io 배포
      - name: Deploy to itch.io
        uses: robpc/itchio-upload-action@v1
        with:
          path: build/WebGL/WebGL
          project: ${{ secrets.ITCH_GAME }}
          channel: html5
          api-key: ${{ secrets.BUTLER_CREDENTIALS }}
```

### 7.4 동작 확인

1. 위 파일을 커밋하고 `main` 브랜치에 push
2. GitHub 리포지토리의 **Actions** 탭에서 워크플로우 실행 확인
3. 모든 단계가 ✅ 녹색이면 성공
4. itch.io 게임 페이지를 새로고침하면 최신 빌드가 반영되어 있다

> **첫 빌드는 15~30분 소요될 수 있다.** 이후에는 캐시 덕분에 5~10분으로 줄어든다.

> **트러블슈팅**: 빌드 실패 시 Actions 탭에서 로그를 확인한다. 가장 흔한 원인은:
> - `UNITY_LICENSE` 시크릿이 잘못 등록됨 → `.ulf` 파일 전체 내용인지 확인
> - Unity 버전 불일치 → 워크플로우의 `unityVersion`이 `ProjectVersion.txt`의 버전과 일치하는지 확인
> - 컴파일 에러 → 로컬에서 먼저 빌드가 되는지 확인

---

## 8. Unity 프로젝트 폴더 구조 이해

웹 프로젝트의 폴더 구조에 익숙한 개발자를 위해, Unity 프로젝트 폴더와 웹 프로젝트 폴더를 매핑한다.

### 8.1 전체 구조

```
pilgrims-progress-unity/
├── Assets/             ← 핵심! 모든 코드, 아트, 오디오가 들어가는 곳 (= src/)
│   ├── Scripts/        ← C# 스크립트 (= src/components/, src/utils/)
│   ├── Scenes/         ← 씬 파일 (= pages/, routes/)
│   ├── Settings/       ← URP 렌더 파이프라인 설정
│   └── ...             ← 추후 Art/, Audio/, Prefabs/ 등 추가
│
├── Packages/           ← 패키지 의존성 (= package.json)
│   └── manifest.json   ← 설치된 패키지 목록
│
├── ProjectSettings/    ← 프로젝트 전역 설정 (= .env, config 파일들)
│   ├── ProjectSettings.asset    ← 빌드, 플레이어 설정
│   ├── ProjectVersion.txt       ← Unity 버전 기록
│   └── ...
│
├── Library/            ← 자동 생성되는 캐시 (= node_modules/) — gitignore 대상
├── Temp/               ← 빌드 임시 파일 — gitignore 대상
├── Logs/               ← 로그 파일 — gitignore 대상
├── UserSettings/       ← 개인 에디터 설정 — gitignore 대상
└── .gitignore          ← 위 폴더들이 자동 제외됨
```

### 8.2 중요 규칙

| 규칙 | 설명 |
|------|------|
| **Assets/ 안에서만 작업** | 직접 만드는 모든 파일은 `Assets/` 하위에 둔다 |
| **Library/는 건드리지 않는다** | `node_modules/`처럼 Unity가 자동 관리. 삭제하면 재생성됨 (시간 오래 걸림) |
| **.meta 파일은 커밋해야 한다** | `Assets/` 안의 모든 파일/폴더에는 `.meta` 파일이 자동 생성됨. 이것은 Unity의 고유 ID 시스템이며, 삭제하면 참조가 깨진다 |
| **ProjectSettings/는 커밋한다** | 프로젝트 공유에 필요한 설정 파일들 |
| **Packages/manifest.json은 커밋한다** | 어떤 패키지가 설치되어 있는지 기록 |

### 8.3 권장 Assets/ 폴더 구조

프로젝트가 커지면 다음과 같이 정리하는 것을 권장:

```
Assets/
├── Scripts/           ← C# 코드 전부
│   ├── Dialogue/      ← 대화 시스템 관련
│   ├── Core/          ← 게임 매니저, 씬 전환 등
│   └── UI/            ← UI 관련 스크립트
├── Scenes/            ← 씬 파일
├── Art/               ← 이미지, 스프라이트
│   ├── Characters/
│   ├── Backgrounds/
│   └── UI/
├── Audio/             ← 음악, 효과음
│   ├── BGM/
│   └── SFX/
├── Prefabs/           ← 재사용 가능한 프리팹 (= 리액트 컴포넌트)
├── Fonts/             ← 폰트 파일
└── Settings/          ← URP 등 렌더 설정
```

---

## 9. 자주 쓰는 단축키 & 팁

### 9.1 핵심 단축키

| 단축키 (Mac) | 단축키 (Windows) | 기능 |
|-------------|-----------------|------|
| `Cmd + P` | `Ctrl + P` | **Play / Stop** (가장 많이 쓰는 단축키!) |
| `Cmd + S` | `Ctrl + S` | **씬 저장** (자주 눌러야 한다!) |
| `Cmd + Z` | `Ctrl + Z` | 실행 취소 (Undo) |
| `Cmd + Shift + Z` | `Ctrl + Y` | 다시 실행 (Redo) |
| `F` | `F` | Scene View에서 선택한 오브젝트로 포커스 이동 |
| `Cmd + D` | `Ctrl + D` | 선택한 오브젝트 복제 (Duplicate) |
| `Delete` | `Delete` | 선택한 오브젝트 삭제 |
| `Cmd + Shift + N` | `Ctrl + Shift + N` | 새 빈 게임 오브젝트 생성 |
| `F2` | `F2` | 선택한 오브젝트 이름 변경 |

### 9.2 Scene View 조작

| 조작 | Mac | Windows |
|------|-----|---------|
| 패닝 (이동) | `Option + 마우스 가운데 드래그` | `Alt + 마우스 가운데 드래그` |
| 줌 | 마우스 스크롤 | 마우스 스크롤 |
| 오브젝트 포커스 | 오브젝트 선택 후 `F` | 오브젝트 선택 후 `F` |
| 2D/3D 토글 | Scene View 상단 "2D" 버튼 | Scene View 상단 "2D" 버튼 |

### 9.3 유용한 팁

#### Inspector 잠금 (Lock)

Inspector 패널 우측 상단의 🔒 **자물쇠 아이콘**을 클릭하면, 다른 오브젝트를 클릭해도 현재 보고 있는 오브젝트의 Inspector가 유지된다. 웹 DevTools에서 요소를 고정(pin)하는 것과 같다.

#### Console 필터

Console 패널에서:
- **Clear** 버튼: 모든 로그 제거
- **Collapse** 토글: 같은 메시지를 하나로 묶어서 표시
- 상단 아이콘 필터:
  - 💬 Info (일반 로그) — 끄면 `Debug.Log()` 숨김
  - ⚠️ Warning (경고) — 끄면 경고 숨김
  - ❌ Error (에러) — 항상 켜두기 권장

#### 실행 모드 시각적 표시

Play 모드에서는 Unity Editor의 **색상이 변하는** 설정이 가능하다. Play 모드에서 실수로 수정하는 것을 방지할 수 있다:

1. **Unity** → **Settings** (Mac) 또는 **Edit** → **Preferences** (Windows)
2. **Colors** 섹션
3. **"Playmode tint"** 의 색상을 연한 빨강이나 연한 파랑으로 변경
4. Play 모드 진입 시 에디터 전체가 그 색상으로 물든다

#### 오브젝트 빠르게 만들기

Hierarchy에서 우클릭하면 자주 쓰는 오브젝트를 빠르게 생성할 수 있다:
- **Create Empty**: 빈 오브젝트 (스크립트만 붙일 때)
- **UI** → **Canvas**: UI 루트 캔버스
- **UI** → **Button**: 버튼
- **UI** → **Text - TextMeshPro**: 텍스트 (TMP 권장)
- **2D Object** → **Sprite**: 2D 이미지 오브젝트

---

## 10. 웹 개발자를 위한 Unity 개념 매핑

### 10.1 핵심 개념 대응표

| 웹 개발 | Unity | 설명 |
|---------|-------|------|
| HTML DOM | **Hierarchy** (GameObject tree) | 오브젝트의 부모-자식 트리 구조 |
| CSS 스타일링 | **Inspector 컴포넌트** (Transform, Image 등) | 오브젝트의 위치, 크기, 색상 등을 설정 |
| JavaScript / TypeScript | **C# Scripts** (MonoBehaviour) | 게임 로직을 작성하는 언어 |
| React Component | **MonoBehaviour** 클래스 | 오브젝트에 붙이는 동작(행동) 단위 |
| `useState` / `props` | **public 필드** (Inspector에 노출) | Inspector에서 직접 값 수정 가능 |
| `npm` / `yarn` 패키지 | **Unity Package Manager** | Window → Package Manager에서 관리 |
| `console.log()` | **Debug.Log()** | Console 패널에 출력 |
| `index.html` | **Scene 파일** (`.unity`) | 게임의 한 "화면" 단위 |
| Routes / Pages | **Scenes** (씬 전환) | `SceneManager.LoadScene("SceneName")` |
| `addEventListener()` | **Unity Events / Button.onClick** | 이벤트 기반 프로그래밍 |
| `setInterval()` / `setTimeout()` | **InvokeRepeating() / Coroutine** | 시간 기반 반복 및 지연 실행 |
| `fetch()` / `axios` | **UnityWebRequest** | HTTP 요청 보내기 |
| `npm start` (dev server) | **Play 버튼 (▶)** | 게임 실행 |
| `npm run build` | **File → Build Profiles → Build** | 빌드하여 배포 가능한 결과물 생성 |
| `.env` 파일 | **ProjectSettings/** | 프로젝트 전역 설정 |
| `node_modules/` | **Library/** | 자동 생성 캐시 (git 제외) |
| Component composition | **GameObject + Components** | 하나의 오브젝트에 여러 컴포넌트를 추가 |
| `className` / CSS class | **Tag / Layer** | 오브젝트를 그룹화하고 분류 |

### 10.2 코드 패턴 비교

#### 상태 관리

```javascript
// React
const [health, setHealth] = useState(100);
```

```csharp
// Unity C#
public int health = 100; // Inspector에서 직접 수정 가능
```

#### 이벤트 처리

```javascript
// JavaScript
button.addEventListener('click', () => {
  console.log('클릭됨!');
});
```

```csharp
// Unity C#
button.onClick.AddListener(() => {
    Debug.Log("클릭됨!");
});
```

#### 타이머

```javascript
// JavaScript
setInterval(() => {
  console.log('매 초마다 실행');
}, 1000);
```

```csharp
// Unity C#
void Start()
{
    InvokeRepeating("MyMethod", 0f, 1f);
}

void MyMethod()
{
    Debug.Log("매 초마다 실행");
}
```

#### HTTP 요청

```javascript
// JavaScript
const response = await fetch('https://api.example.com/data');
const data = await response.json();
```

```csharp
// Unity C# (Coroutine 사용)
IEnumerator FetchData()
{
    var request = UnityWebRequest.Get("https://api.example.com/data");
    yield return request.SendWebRequest();
    
    if (request.result == UnityWebRequest.Result.Success)
    {
        string json = request.downloadHandler.text;
        Debug.Log(json);
    }
}
```

### 10.3 Unity 특유의 개념

웹 개발에는 없는 Unity 고유 개념들:

#### GameObject와 Component

```
웹: <div className="player"> ... </div>
Unity: GameObject("Player") + SpriteRenderer + Rigidbody2D + PlayerScript
```

모든 것이 **GameObject**이고, 기능은 **Component**를 붙여서 추가한다. React에서 컴포넌트를 조합하는 것과 비슷하지만, Unity에서는 하나의 오브젝트에 여러 컴포넌트를 "장착"하는 방식이다.

#### MonoBehaviour 생명주기 (Lifecycle)

React의 생명주기와 비교:

| React | Unity MonoBehaviour | 설명 |
|-------|---------------------|------|
| `constructor()` | `Awake()` | 가장 먼저 한 번 호출 |
| `componentDidMount()` | `Start()` | 첫 프레임 전에 한 번 호출 |
| `render()` (매 프레임) | `Update()` | 매 프레임마다 호출 (60fps = 초당 60번) |
| `componentWillUnmount()` | `OnDestroy()` | 오브젝트 파괴 시 호출 |
| — | `FixedUpdate()` | 물리 연산용 (고정 간격) |

```csharp
public class MyScript : MonoBehaviour
{
    void Awake()    { /* 초기화 (constructor) */ }
    void Start()    { /* 첫 실행 (componentDidMount) */ }
    void Update()   { /* 매 프레임 (requestAnimationFrame) */ }
    void OnDestroy(){ /* 정리 (componentWillUnmount) */ }
}
```

#### Prefab (프리팹)

```
웹: 재사용 가능한 React 컴포넌트를 export → 여러 곳에서 import
Unity: GameObject를 Prefab으로 저장 → 여러 씬에서 재사용
```

- Hierarchy의 오브젝트를 Project 패널에 드래그하면 **Prefab**이 된다
- Prefab을 수정하면 이를 사용하는 모든 인스턴스에 변경이 반영된다
- React 컴포넌트를 만들어 여러 페이지에서 재사용하는 것과 같은 개념

---

## 부록: 자주 묻는 질문 (FAQ)

### Q: Unity에서 console.log()는 어떻게 하나요?

```csharp
Debug.Log("일반 메시지");        // 흰색 (Info)
Debug.LogWarning("경고 메시지"); // 노란색 (Warning)
Debug.LogError("에러 메시지");   // 빨간색 (Error)
```

### Q: 씬을 저장 안 하고 Unity를 종료하면 어떻게 되나요?

저장하지 않은 변경사항은 **모두 사라진다**. Unity는 종료 전에 저장 여부를 묻지만, Play 모드 중 변경사항은 묻지 않고 버려진다. `Cmd + S`를 습관적으로 누르자.

### Q: Unity가 너무 느린데 어떻게 하나요?

1. Play 모드에서 Scene View 대신 **Game View**를 사용 (렌더링 부담 감소)
2. Console에 과도한 `Debug.Log()` 출력이 있으면 성능 저하 → 확인 후 제거
3. **Window** → **Layouts** → **Default**로 레이아웃 초기화
4. **Library/** 폴더 삭제 후 Unity 재시작 (캐시 재생성, 시간 소요)

### Q: `.meta` 파일이 뭔가요? 지워도 되나요?

**절대 수동으로 삭제하지 마세요.** `.meta` 파일은 Unity가 각 에셋에 부여하는 고유 ID(GUID)를 포함한다. 삭제하면 해당 에셋에 대한 모든 참조가 깨진다. Git에 반드시 커밋해야 한다.

### Q: 웹 개발에서 쓰던 Git workflow를 그대로 쓸 수 있나요?

예. 다만 주의할 점:
- `.gitignore`가 `Library/`, `Temp/`, `Logs/`, `UserSettings/`를 제외하는지 확인 (이미 설정됨)
- 바이너리 에셋(이미지, 오디오)이 많아지면 **Git LFS** 사용을 권장
- 씬 파일(`.unity`)과 프리팹은 바이너리에 가까워서 merge conflict가 발생하기 쉬움 → 한 사람만 수정하는 것이 안전

---

> **이 가이드는 프로젝트의 첫 걸음을 위한 문서입니다.**
> Unity에 익숙해지면 [04-mvp-specification.md](./04-mvp-specification.md)를 참고하여 본격적인 MVP 개발을 시작하세요.
