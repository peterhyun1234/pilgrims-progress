# CI/CD 자동화 설정 가이드

> **프로젝트**: 천로역정 — 순례자의 여정 (The Pilgrim's Progress)
> **엔진**: Unity 6 (6000.3.11f1)
> **배포 대상**: itch.io (WebGL)
> **CI/CD**: GitHub Actions + GameCI + Butler
> **최종 수정**: 2026-03-16

---

## 목차

1. [전체 아키텍처](#1-전체-아키텍처)
2. [사전 준비 사항](#2-사전-준비-사항)
3. [Step 1 — Unity 라이선스 활성화](#3-step-1--unity-라이선스-활성화)
4. [Step 2 — itch.io 프로젝트 및 API 키 설정](#4-step-2--itchio-프로젝트-및-api-키-설정)
5. [Step 3 — GitHub Secrets 등록](#5-step-3--github-secrets-등록)
6. [Step 4 — 워크플로우 검증](#6-step-4--워크플로우-검증)
7. [Step 5 — 고급 설정 (선택)](#7-step-5--고급-설정-선택)
8. [트러블슈팅](#8-트러블슈팅)
9. [추천 진행 순서 요약](#9-추천-진행-순서-요약)

---

## 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Repository                        │
│  pilgrims-progress/                                             │
│  ├── pilgrims-progress-unity/   ← Unity 프로젝트                │
│  └── .github/workflows/                                         │
│       ├── unity-activate.yml    ← (1회) 라이선스 활성화 도우미   │
│       └── build-and-deploy.yml  ← 자동 빌드 & 배포              │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │  push to main (Unity 파일 변경 시)
                   │  또는 수동 실행 (workflow_dispatch)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GitHub Actions Runner                         │
│                                                                  │
│  Job 1: build-webgl                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ① 코드 체크아웃 (LFS 포함)                               │   │
│  │ ② Library 폴더 캐시 복원 (빌드 속도 향상)                 │   │
│  │ ③ GameCI unity-builder → WebGL 빌드                      │   │
│  │ ④ 빌드 아티팩트 업로드                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                                                      │
│           ▼                                                      │
│  Job 2: deploy-itch                                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ ① 빌드 아티팩트 다운로드                                  │   │
│  │ ② Butler 설치 (itch.io CLI 도구)                          │   │
│  │ ③ butler push → itch.io에 WebGL 빌드 업로드               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                          itch.io                                 │
│                                                                  │
│  https://[username].itch.io/pilgrims-progress                   │
│  → WebGL 빌드가 자동으로 업데이트됨                              │
│  → 브라우저에서 바로 플레이 가능                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 자동화 흐름 요약

| 트리거 | 동작 | 결과 |
|--------|------|------|
| `main` 브랜치에 Unity 파일 push | WebGL 빌드 → itch.io 배포 | 게임 자동 업데이트 |
| GitHub Actions 탭에서 수동 실행 | 위와 동일 | 원할 때 수동 배포 |

---

## 2. 사전 준비 사항

시작하기 전에 아래 항목을 확인하세요.

| # | 항목 | 상태 | 비고 |
|---|------|------|------|
| 1 | GitHub 리포지토리 | ✅ 완료 | `pilgrims-progress` 리포 존재 |
| 2 | Unity 프로젝트 | ✅ 완료 | `pilgrims-progress-unity/` 디렉토리 |
| 3 | GitHub Actions 워크플로우 | ✅ 완료 | `.github/workflows/` 에 2개 파일 |
| 4 | Unity Personal 라이선스 | ⬜ 필요 | Unity Hub에서 무료 라이선스 활성화 |
| 5 | itch.io 계정 | ⬜ 필요 | GitHub SSO로 로그인 완료 |
| 6 | itch.io 게임 프로젝트 | ⬜ 필요 | itch.io에서 새 프로젝트 생성 |
| 7 | GitHub Secrets 등록 | ⬜ 필요 | 3개 시크릿 등록 필요 |

---

## 3. Step 1 — Unity 라이선스 활성화

GameCI v4는 Unity를 CI 서버에서 실행하기 위해 라이선스 파일(`.ulf`)과
Unity 계정 정보가 필요합니다.

### 1.1 Unity Hub에서 라이선스 활성화

1. **Unity Hub 설치**: https://unity.com/download 에서 다운로드/설치
2. **Unity Hub 로그인**: Unity 계정으로 로그인
3. **라이선스 추가**: Unity Hub > Preferences > Licenses > **Add** 클릭
4. **"Get a free personal license"** 선택하여 활성화

> **중요**: Unity Hub에 라이선스가 이미 보이더라도 반드시 **Add 버튼을 클릭**해야
> `.ulf` 파일이 생성됩니다. 이 단계를 건너뛰지 마세요.

### 1.2 `.ulf` 파일 위치 확인

라이선스 활성화 후 아래 경로에 파일이 생성됩니다:

| OS | 경로 |
|------|------|
| Windows | `C:\ProgramData\Unity\Unity_lic.ulf` |
| macOS | `/Library/Application Support/Unity/Unity_lic.ulf` |
| Linux | `~/.local/share/unity3d/Unity/Unity_lic.ulf` |

> **참고**: `C:\ProgramData`는 숨김 폴더일 수 있습니다.
> 탐색기 주소창에 직접 경로를 입력하세요.

### 1.3 `.ulf` 파일 내용 복사

1. `.ulf` 파일을 텍스트 에디터(메모장, VS Code 등)로 열기
2. **전체 내용 복사** (XML 형식, `<?xml` 으로 시작)
3. Step 3에서 `UNITY_LICENSE` 시크릿 값으로 사용

> **주의**: `.ulf` 파일은 절대 Git에 커밋하지 마세요. 민감한 라이선스 정보입니다.
> 라이선스는 특정 OS에 종속되지 않으므로 Windows에서 생성한 파일을
> Ubuntu CI 러너에서 사용할 수 있습니다.

---

## 4. Step 2 — itch.io 프로젝트 및 API 키 설정

### 2.1 itch.io에 새 프로젝트 생성

1. https://itch.io/game/new 접속 (GitHub SSO 로그인 상태)
2. 아래 정보 입력:

| 필드 | 권장 값 | 비고 |
|------|---------|------|
| Title | Pilgrim's Progress | 게임 이름 |
| Project URL | `pilgrims-progress` | URL 슬러그 (영문 소문자, 하이픈) |
| Kind of project | HTML | WebGL = HTML 프로젝트 |
| Classification | Game | — |
| Pricing | $0.00 (무료) 또는 Name your price | 초기에는 무료 권장 |
| Uploads | — | CI/CD가 자동으로 업로드하므로 비워두기 |

3. **"Save & view page"** 클릭
4. 프로젝트 URL 확인: `https://[your-username].itch.io/pilgrims-progress`

### 2.2 itch.io 게임 경로 확인

`ITCH_GAME` 시크릿에 사용할 값:

```
[your-username]/pilgrims-progress
```

예시: `johndoe/pilgrims-progress`

> **확인 방법**: itch.io 대시보드에서 프로젝트 URL을 보면
> `https://[username].itch.io/[game-slug]` 형태입니다.
> 시크릿 값은 `[username]/[game-slug]` 형태로 입력합니다.

### 2.3 itch.io API 키 발급

1. https://itch.io/user/settings/api-keys 접속
2. **"Generate new API key"** 클릭
3. 설명: `GitHub Actions CI/CD` (식별용)
4. 생성된 API 키 **복사** (한 번만 표시됨, Step 3에서 사용)

> **보안**: API 키는 노출되면 누구든 당신의 itch.io에 파일을 업로드할 수 있습니다.
> 안전하게 보관하고 GitHub Secrets에만 저장하세요.

### 2.4 itch.io 프로젝트 WebGL 설정

게임 페이지에서 WebGL 빌드가 제대로 표시되려면 추가 설정이 필요합니다:

1. itch.io 프로젝트 → **Edit game** 
2. **Uploads** 섹션에서 Butler가 업로드한 파일이 보이면:
   - **"This file will be played in the browser"** 체크 ✅
3. **Embed options**:
   - Width: `960` (또는 원하는 크기)
   - Height: `600` (또는 원하는 크기)
   - ☑ SharedArrayBuffer support (Unity WebGL에 필요)
4. **Save**

> **참고**: 첫 Butler 업로드 후에 이 설정을 해야 합니다.
> 최초 배포 전에는 업로드 파일이 없으므로 Step 4 이후에 진행하세요.

---

## 5. Step 3 — GitHub Secrets 등록

GitHub Actions가 Unity 라이선스와 itch.io에 접근하기 위해 3개의 시크릿이 필요합니다.

### 등록 방법

1. GitHub 리포지토리 → **Settings** → 왼쪽 사이드바 **Secrets and variables** → **Actions**
2. **"New repository secret"** 클릭
3. 아래 3개 시크릿을 각각 등록:

| Secret Name | 값 | 출처 |
|-------------|---|------|
| `UNITY_LICENSE` | `.ulf` 파일의 전체 XML 내용 | Step 1에서 획득 |
| `UNITY_EMAIL` | Unity 계정 이메일 주소 | Unity Hub 로그인에 사용하는 이메일 |
| `UNITY_PASSWORD` | Unity 계정 비밀번호 | Unity Hub 로그인에 사용하는 비밀번호 |
| `BUTLER_CREDENTIALS` | itch.io API 키 문자열 | Step 2.3에서 발급 |
| `ITCH_GAME` | `[username]/pilgrims-progress` | Step 2.2에서 확인 |

### 등록 확인

등록 후 Settings → Secrets → Actions에서 5개 시크릿이 보이면 완료:

```
UNITY_LICENSE       Updated ...
UNITY_EMAIL         Updated ...
UNITY_PASSWORD      Updated ...
BUTLER_CREDENTIALS  Updated ...
ITCH_GAME           Updated ...
```

---

## 6. Step 4 — 워크플로우 검증

모든 시크릿이 등록되면 첫 빌드 & 배포를 테스트합니다.

### 4.1 수동 실행으로 테스트

1. GitHub 리포지토리 → **Actions** 탭
2. 왼쪽에서 **"Build & Deploy to itch.io"** 워크플로우 선택
3. **"Run workflow"** → 브랜치: `main` → **"Run workflow"** 확인
4. 워크플로우 실행 모니터링

### 4.2 예상 소요 시간

| Job | 첫 실행 | 이후 실행 (캐시) |
|-----|---------|-----------------|
| build-webgl | 15~30분 | 5~15분 |
| deploy-itch | 1~3분 | 1~3분 |
| **합계** | **~30분** | **~15분** |

> **첫 실행이 오래 걸리는 이유**: Unity Library 폴더 캐시가 없어서
> 모든 에셋을 처음부터 임포트합니다. 이후 실행부터는 캐시 덕분에 빨라집니다.

### 4.3 성공 확인

1. **GitHub Actions**: 두 Job 모두 녹색 체크 ✅
2. **itch.io 대시보드**: 업로드된 빌드가 보임
3. **게임 페이지**: `https://[username].itch.io/pilgrims-progress` 에서 WebGL 게임 플레이 가능

### 4.4 자동 배포 확인

성공했다면, 이후에는 `main` 브랜치에 Unity 파일을 push할 때마다 자동으로:

```
git add .
git commit -m "대화 시스템 업데이트"
git push origin main
→ GitHub Actions 자동 실행
→ WebGL 빌드
→ itch.io 자동 배포
→ 게임 페이지 업데이트 완료!
```

---

## 7. Step 5 — 고급 설정 (선택)

기본 CI/CD가 동작한 후, 프로젝트가 성장하면 아래 개선 사항을 적용할 수 있습니다.

### 5.1 버전 태깅 자동화

릴리스마다 Git 태그를 달아 버전을 관리합니다.

```yaml
# build-and-deploy.yml에 추가 가능한 트리거
on:
  push:
    tags:
      - 'v*'  # v0.1.0, v0.2.0 등 태그 push 시 실행
```

사용법:

```bash
git tag v0.1.0
git push origin v0.1.0
# → 태그 push 시 빌드 & 배포 실행
```

### 5.2 멀티 플랫폼 빌드

WebGL 외에 Windows/macOS/Linux 빌드를 추가하려면 `build-and-deploy.yml`에
matrix 전략을 사용할 수 있습니다:

```yaml
strategy:
  matrix:
    targetPlatform:
      - WebGL
      - StandaloneWindows64
      - StandaloneOSX
      - StandaloneLinux64
```

### 5.3 PR 빌드 검증

Pull Request에서 빌드가 성공하는지 자동 검증:

```yaml
on:
  pull_request:
    branches: [main]
    paths:
      - 'pilgrims-progress-unity/**'
```

이 설정을 추가하면 PR을 올릴 때 빌드가 돌아가서, 머지 전에 빌드 문제를 발견할 수 있습니다.

### 5.4 빌드 번호 자동 증가

```yaml
- name: Unity WebGL 빌드
  uses: game-ci/unity-builder@v4
  env:
    UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
  with:
    projectPath: pilgrims-progress-unity
    targetPlatform: WebGL
    unityVersion: 6000.3.11f1
    versioning: Semantic  # 자동 버전 증가
```

### 5.5 Slack/Discord 알림

빌드 결과를 알림으로 받고 싶다면:

```yaml
- name: Discord 알림
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    title: "빌드 결과"
    description: "${{ job.status == 'success' && '✅ 빌드 & 배포 성공!' || '❌ 빌드 실패' }}"
```

### 5.6 GitHub Actions 비용 관리

| 항목 | 무료 한도 | 예상 사용량 |
|------|----------|------------|
| GitHub Actions 실행 시간 | 2,000분/월 (무료 계정) | 빌드 1회 ≈ 15~30분 |
| 예상 월 빌드 횟수 | — | 10~20회 |
| 예상 월 사용량 | — | 150~600분 (무료 범위 내) |

> 무료 한도 내에서 충분히 사용 가능합니다.
> 빌드가 자주 트리거되지 않도록 `paths` 필터가 이미 설정되어 있습니다.

---

## 8. 트러블슈팅

### 8.1 Unity 라이선스 오류

**증상**: `UNITY_LICENSE` 관련 에러 메시지

```
Error: Unity license is not activated
```

**해결**:
- `.ulf` 파일 내용이 올바르게 복사되었는지 확인 (XML 시작/끝 포함)
- Unity 6 버전과 라이선스 버전이 일치하는지 확인
- 라이선스가 만료되지 않았는지 확인 (Personal 라이선스는 갱신 필요 가능)

### 8.2 Butler 인증 실패

**증상**: `butler push` 실패

```
Error: invalid API key
```

**해결**:
- `BUTLER_CREDENTIALS` 시크릿의 API 키가 올바른지 확인
- itch.io API 키 페이지에서 키가 활성 상태인지 확인
- 키를 재발급하고 시크릿을 업데이트

### 8.3 itch.io 게임 경로 오류

**증상**: Butler가 프로젝트를 찾지 못함

```
Error: game not found
```

**해결**:
- `ITCH_GAME` 형식 확인: `username/game-slug` (대소문자 주의)
- itch.io에서 해당 프로젝트가 실제로 존재하는지 확인
- URL slug가 정확한지 확인 (대시보드에서 Edit game → URL 확인)

### 8.4 WebGL 빌드 실패

**증상**: Unity 빌드 단계에서 에러

**해결**:
- 로컬에서 먼저 WebGL 빌드 테스트: Unity → File → Build Settings → WebGL → Build
- `unityVersion`이 `ProjectVersion.txt`의 버전과 일치하는지 확인
- 빌드 에러 로그에서 구체적인 에러 메시지 확인

### 8.5 빌드는 성공했는데 게임이 안 보이는 경우

**해결**:
- itch.io → Edit game → Uploads에서 업로드된 파일의 **"This file will be played in the browser"** 체크
- **Embed options**에서 SharedArrayBuffer support 체크
- Visibility를 **"Public"** 또는 **"Restricted"** 로 변경 (Draft 상태면 접근 불가)

---

## 9. 추천 진행 순서 요약

아래 순서대로 한 단계씩 진행하면 됩니다.

```
Phase A: 준비 (30분)
├── A1. itch.io에 새 게임 프로젝트 생성
├── A2. itch.io API 키 발급
└── A3. itch.io 게임 경로(username/slug) 확인

Phase B: Unity 라이선스 (10~30분)
├── B1. Unity Hub 설치 및 로그인 (Unity가 있는 PC에서)
├── B2. Preferences > Licenses > Add > Personal License 활성화
├── B3. C:\ProgramData\Unity\Unity_lic.ulf 파일 내용 복사
└── B4. .ulf 내용 복사해두기

Phase C: 시크릿 등록 (5분)
├── C1. GitHub → Settings → Secrets → UNITY_LICENSE 등록
├── C2. UNITY_EMAIL 등록
├── C3. UNITY_PASSWORD 등록
├── C4. BUTLER_CREDENTIALS 등록  ← ✅ 완료
└── C5. ITCH_GAME 등록            ← ✅ 완료

Phase D: 검증 (15~30분)
├── D1. build-and-deploy.yml 수동 실행
├── D2. 두 Job 모두 성공 확인 (녹색 체크)
├── D3. itch.io 대시보드에서 업로드 확인
├── D4. itch.io 게임 페이지 WebGL 설정
│   ├── "This file will be played in the browser" 체크
│   └── SharedArrayBuffer support 체크
└── D5. 게임 페이지에서 플레이 테스트

Phase E: 자동화 확인 (5분)
├── E1. Unity 파일 수정 후 main에 push
└── E2. 자동 빌드 & 배포 확인
```

**예상 총 소요 시간: 약 1~2시간** (첫 빌드 대기 시간 포함)

---

## 부록: 현재 워크플로우 파일 위치

| 파일 | 역할 | 트리거 |
|------|------|--------|
| `.github/workflows/unity-activate.yml` | Unity 라이선스 활성화 도우미 | 수동 (1회성) |
| `.github/workflows/build-and-deploy.yml` | WebGL 빌드 + itch.io 배포 | main push + 수동 |

---

> **결론**: itch.io를 통한 WebGL 자동 배포는 인디 게임 개발에서 가장 빠르고 비용 효율적인
> 배포 방식입니다. 무료이고, 브라우저에서 바로 플레이할 수 있어 초기 피드백을 모으기에
> 최적입니다. 현재 워크플로우가 이미 잘 구성되어 있으므로, GitHub Secrets 3개만 등록하면
> 즉시 자동화가 가동됩니다.
