# QA & UI Improvement Prompt

이 프롬프트를 Claude Code 세션 시작 시 붙여넣어 전체 QA + UI 개선을 실행합니다.

---

## 실행 지시 (paste this as your prompt)

```
pilgrims-progress 프로젝트 전체 QA를 수행하고 발견되는 모든 문제를 수정해줘.
아래 체크리스트를 순서대로 점검하고, 각 항목에서 문제가 있으면 바로 코드를 고쳐줘.

---

### 1. 모바일 렌더링 품질
- [ ] 폰트가 흐릿하지 않은가?
  - `pixelArt: true`, `roundPixels: true`, shadow `blur: 0` 확인
  - Phaser scale `zoom: 2` 설정 여부 확인 (960×540 canvas → text 2× pixel density)
  - `index.html` canvas CSS에 `image-rendering: pixelated` 적용 확인
  - `font-display: block` (Galmuri11 FOUT 방지) 확인
- [ ] 터치 버튼 크기가 최소 44px CSS (Apple HIG) 이상인가?
  - MobileControls action button hit zone 확인
  - 히트존이 숨겨질 때 `disableInteractive()` 호출 확인 (dialogue 중 버튼이 tap 가로챔 방지)
- [ ] 조이스틱 dead zone이 적절한가? (`TOUCH.JOYSTICK_DEADZONE`)

### 2. 입력 버그
- [ ] NPC 대화가 한 번 탭에 한 번만 트리거되는가?
  - `GameScene.update()`에서 `vi.interact` edge-trigger 패턴 확인:
    `if (vi.interact) { input.interact = true; vi.interact = false; }`
- [ ] 키보드 `E` 키 중복 트리거 없는가? (`Phaser.Input.Keyboard.JustDown` 사용 확인)
- [ ] 대화 중 이동 입력이 무시되는가? (DIALOGUE state에서 player.update 스킵 확인)
- [ ] ESC/pause 중 게임 로직이 멈추는가?

### 3. UI 레이아웃 (480×270 기준)
- [ ] 텍스트가 패널 밖으로 넘치는 곳이 없는가? (`wordWrap` 설정 확인)
- [ ] NPC 이름이 대화창 안에 잘 들어가는가?
- [ ] HUD 요소가 화면 가장자리에 겹치지 않는가? (최소 4px 여백)
- [ ] 스크롤 팩터 0인 UI 요소가 카메라 이동에 영향받지 않는가? (`setScrollFactor(0)`)
- [ ] Portrait (캐릭터 초상화)가 대화창 내에 올바르게 렌더링되는가?
  - `RenderTexture` origin이 `(0, 0)`인지 확인
  - `rt.setScrollFactor(0)` 확인

### 4. 한국어/영어 이중 언어
- [ ] 언어 선택에 따라 올바른 폰트가 사용되는가?
  - 한국어: Galmuri11 (11px 또는 11의 배수 권장)
  - 영어: Press Start 2P
- [ ] 한국어 텍스트가 잘리지 않는가? (fontSize 11px 이하 사용 시 주의)
- [ ] `DesignSystem.FONT_SIZE` 값이 한국어/영어 모두에서 적절한가?

### 5. 씬 전환 & 상태 관리
- [ ] fadeIn/fadeOut 트랜지션이 모든 씬에서 동작하는가?
- [ ] 씬 전환 시 이전 씬 리소스가 정리되는가? (`destroy()` 호출 확인)
- [ ] GameState 변경 이벤트가 올바르게 emit/receive되는가?
- [ ] `ServiceLocator`에 등록되지 않은 서비스에 접근하는 곳이 없는가?

### 6. 오디오
- [ ] BGM이 씬 전환 시 중복 재생되지 않는가?
- [ ] `visibilitychange` 이벤트로 탭 숨김 시 음소거되는가? (`main.ts` 확인)
- [ ] 사운드 파일이 없을 때 에러가 발생하지 않는가? (옵셔널 체이닝 확인)

### 7. 성능
- [ ] `update()` 루프에서 불필요한 객체 생성이 없는가? (new Array/Object 등)
- [ ] 타일맵 렌더 범위가 카메라 뷰포트로 제한되는가?
- [ ] 파티클/그래픽 오브젝트가 화면 밖에서도 업데이트되는가? (frustum culling 확인)
- [ ] `RenderTexture` 캐시가 씬 종료 시 정리되는가? (`clearCache()`)

### 8. 내러티브 & 대화
- [ ] 대화가 끝난 후 NPC와 재대화 시 올바른 dialogue ID로 시작되는가?
- [ ] Bible verse/fallback dialogue 파일이 로드되는가?
- [ ] 대화 중 선택지 버튼이 올바른 위치에 렌더링되는가?

### 9. 시각적 polish
- [ ] 버튼 hover/press 애니메이션이 자연스러운가? (scale tween 확인)
- [ ] 프롤로그 텍스트 타이밍 및 y 위치 겹침이 없는가?
- [ ] 파티클 효과(ambient, prologue)가 화면 경계에서 재순환되는가?
- [ ] 씬별 배경색이 일관성 있는가? (`COLORS.UI.DARK_BG` 사용 확인)

### 10. 배포 (itch.io / GitHub Pages)
- [ ] `vite.config.ts`의 `base`가 환경에 맞게 설정되어 있는가?
  - itch.io: `'./'` (상대 경로)
  - GitHub Pages: `'/pilgrims-progress/'`
- [ ] 폰트 파일(`Galmuri11.woff2`)이 `public/fonts/`에 있는가?
- [ ] 빌드 후 `dist/` 폴더에서 모든 에셋이 상대 경로로 로드되는가?

---

각 항목 점검 후:
1. 문제 발견 시 즉시 코드 수정
2. 모든 수정 완료 후 `npx tsc --noEmit`으로 타입 오류 없음 확인
3. 변경사항 git commit (메시지 형식: `fix: [항목] 설명`)
4. 새로 발견한 개선점이 있으면 이 체크리스트에 추가해줘
```
