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
  - `pixelArt: true`, `roundPixels: true`, shadow `blur: 0` 전체 소스에서 확인
    (grep: `blur:\s*[1-9]` — 장식적 glow 제외한 모든 텍스트 shadow blur는 0이어야 함)
  - Phaser scale `zoom: 2` 설정 여부 확인 (`main.ts` scale 블록)
  - `index.html` canvas CSS에 `image-rendering: pixelated` 확인
  - `font-display: block` (Galmuri11 FOUT 방지) 확인
- [ ] `Date.now()` 핫패스 사용 없는가?
  - grep: `Date\.now\(\)` — save timestamp 제외한 모든 update/animation 루프는
    `scene.time.now` 또는 `this.time.now` 사용
  - 대상: HUD.update(), Player.applyIdleBob(), DialogueBox.update(),
    GameScene.updateFaithVignette(), MenuScene.update()
- [ ] 터치 버튼 hit zone이 최소 44px CSS (Apple HIG) 이상인가?
  - zoom:2 기준: 논리적 22px 이상이면 CSS 30px+, 30px 이상이면 OK
  - MobileControls: action button hit zone = `r + 6` 확인
  - 히트존이 숨겨질 때 `disableInteractive()` 호출 확인

### 2. 입력 버그
- [ ] NPC 대화가 한 번 탭에 한 번만 트리거되는가?
  - `GameScene.update()`에서 edge-trigger 패턴:
    `if (vi.interact) { input.interact = true; vi.interact = false; }`
- [ ] 키보드 `E` 키 edge-trigger: `Phaser.Input.Keyboard.JustDown` 사용 확인
- [ ] 대화/일시정지 중 이동 입력 무시되는가?
- [ ] MobileControls action button이 dialogue 중 `disableInteractive()` 상태인가?

### 3. UI 레이아웃 (480×270 논리 해상도)
- [ ] 하드코딩된 작은 폰트(4px, 5px) 없는가?
  - grep: `fontSize.*['"]\d{1,1}px['"]` — zoom:2 기준 최소 6px 이상 권장
  - 주요 위치: GameScene 챕터 레이블, 저장 인디케이터, MenuScene 세이브 데이터
- [ ] 텍스트가 패널 밖으로 넘치는 곳이 없는가? (`wordWrap` 설정 확인)
- [ ] HUD 요소가 화면 가장자리에 겹치지 않는가? (최소 2px 여백)
- [ ] ScrollFactor(0) UI가 카메라 이동에 영향받지 않는가?
- [ ] Portrait RenderTexture origin이 `(0, 0)`인가? (`rt.setOrigin(0, 0).setScrollFactor(0)`)

### 4. 한국어/영어 이중 언어
- [ ] 하드코딩된 폰트패밀리 없는가?
  - 모든 텍스트는 `DesignSystem.textStyle()` 또는 `getFontFamily()` 사용
  - grep: `fontFamily.*Press Start 2P` — DesignSystem 외에 직접 사용되는 곳 확인
- [ ] 한국어: Galmuri11 11px 사용 (`FONT_SIZE.SM`), 영어: Press Start 2P 확인
- [ ] 모바일 힌트 텍스트 등 모든 UI 문자열이 이중 언어인가?
  - 한국어 전용 or 영어 전용 문자열 grep 확인

### 5. 씬 전환 & 상태 관리
- [ ] fadeIn/fadeOut이 모든 씬에서 동작하는가?
- [ ] 씬 shutdown 시 EventBus 리스너, 타이머, RenderTexture 캐시 정리되는가?
- [ ] `ServiceLocator`에 등록되지 않은 서비스 접근 시 조용히 실패하는가?

### 6. 오디오
- [ ] BGM이 씬 전환 시 중복 재생되지 않는가?
- [ ] `visibilitychange`로 탭 숨김 시 음소거 확인 (`main.ts`)
- [ ] 사운드 파일 없을 때 에러 없는가? (옵셔널 체이닝)

### 7. 성능
- [ ] update() 루프 핫패스에 객체 생성 없는가?
  - dust 파티클: 220ms 간격으로 제한됨 확인
  - 앰비언트 파티클: frustum culling 적용 확인
- [ ] HUD burden bar pulse가 scene.time.now 사용하는가?
- [ ] RenderTexture 캐시가 씬 종료 시 `clearCache()` 호출되는가?

### 8. 내러티브 & 대화
- [ ] 대화 종료 후 재대화 시 올바른 시작 지점인가?
- [ ] 선택지 버튼이 올바른 위치에 렌더링되는가?
- [ ] 키보드 shortcut handler(1-5) cleanup이 선택지 show/hide에서 올바르게 동작하는가?

### 9. 시각적 polish
- [ ] 버튼 hover/press scale tween이 자연스러운가?
- [ ] 프롤로그 텍스트 y위치 겹침이 없는가?
- [ ] 씬별 배경색이 일관성 있는가?
- [ ] 장식적 glow 효과(✝ 십자가, 배경 glow)만 blur > 0 사용하는가?

### 10. 배포
- [ ] `vite.config.ts` base: itch.io=`'./'`, GitHub Pages=`'/pilgrims-progress/'`
- [ ] `public/fonts/Galmuri11.woff2` 존재 확인
- [ ] `npx tsc --noEmit` 에러 없음 확인

---

각 항목 점검 후:
1. 문제 발견 시 즉시 코드 수정
2. 모든 수정 완료 후 `npx tsc --noEmit`으로 타입 오류 없음 확인
3. 변경사항 git commit + push
4. 새로 발견한 개선점이 있으면 이 체크리스트에 추가해줘
```

---

## 현재 적용된 핵심 설정 (참조용)

| 항목 | 값 | 위치 |
|------|-----|------|
| 캔버스 해상도 | 480×270 논리, 960×540 실제 (zoom:2) | `main.ts` |
| 폰트 shadow blur | 0 (전체 통일) | `DesignSystem.textStyle()` |
| font-display | block | `index.html` |
| 터치 hit zone | r+6 (≈42px CSS) | `MobileControls.ts` |
| 한국어 폰트 | Galmuri11 11px (`FONT_SIZE.SM`) | `config.ts` FONT |
| 영어 폰트 | Press Start 2P (×0.85 scale) | `config.ts` FONT |
| Date.now() | 모두 scene.time.now 대체됨 | 전체 소스 |
