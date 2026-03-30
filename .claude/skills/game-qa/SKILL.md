---
name: game-qa
description: "Run automated visual QA and regression testing for the 천로역정 (Pilgrim's Progress) game. Use when the user wants to: test game UI, check for visual regressions, verify game flow works end-to-end, take screenshots of all scenes, check for console errors, verify dialogue/HUD/menu layout. Also trigger when user says 'QA', '테스트', '화면 확인', '게임 동작 확인', 'regression test', or 'check game'."
---

# Game QA Skill — 천로역정

## Overview

This skill automates visual QA of the game using:
1. **Playwright MCP** (`mcp__playwright__*`) for browser automation
2. **`window.__pp` debug API** exposed by `DebugPanel.ts`
3. Sequential screenshots saved to `web/tests/qa/screenshots/`

## Required: Game server must be running

Before running QA, ensure the dev server is up:
```bash
cd /Users/peterjeon/Desktop/workspace/pilgrims-progress/web && npm run dev &
```
Or check if it's already running on port 5173.

## QA Execution Steps

### Step 1 — Navigate to game
```
browser_navigate: http://localhost:5173
browser_wait_for: canvas (timeout: 15000)
```

### Step 2 — Wait for `window.__pp` to be available
```javascript
// Poll until __pp is ready
await page.waitForFunction(() => !!window.__pp, { timeout: 15000 });
```

### Step 3 — Screenshot each key scene

Take screenshots in this order, advancing through the game:

| Step | Action | Screenshot name |
|------|--------|-----------------|
| Boot | Load page, wait for canvas | `01_boot.png` |
| Language | Wait ~1.5s | `02_language.png` |
| Menu | Click canvas to select KO, wait for menu | `03_menu.png` |
| New Game | Click at (240, 156) scaled to canvas | `04_new_game.png` |
| Onboarding | Advance dialogue 8-10x via `__pp.advanceDialogue()` | `05_onboarding.png` |
| Game Ch1 | Wait for game scene, check state | `06_game_ch1.png` |
| NPC Interaction | Walk to NPC (WASD/arrow simulation) or check HUD | `07_hud_npc.png` |
| Fast-travel Ch5 | `__pp.gotoChapter(5)` | `08_chapter_5.png` |
| Fast-travel Ch7 | `__pp.gotoChapter(7)` | `09_chapter_7.png` |
| Fast-travel Ch12 | `__pp.gotoChapter(12)` | `10_chapter_12.png` |
| Ending Glory | `__pp.skipToEnding('glory')` | `11_ending_glory.png` |
| Ending Barely | `__pp.skipToEnding('barely')` | `12_ending_barely.png` |

### Step 4 — Check console errors

Monitor console throughout: any `console.error` or page errors = test failure.

### Step 5 — Generate report

After all screenshots, compare with baseline (if baseline exists in `tests/qa/baseline/`) or report as new baseline.

## Using `window.__pp` API

The game exposes this global in DEV mode AND in production builds:

```javascript
// Get current game state
window.__pp.getState()
// → { chapter: 1, state: 'GAME', language: 'ko', stats: { faith: 30, ... } }

// Set a stat directly
window.__pp.setStat('faith', 80)

// Fast-travel to chapter
window.__pp.gotoChapter(5)

// Advance dialogue (like pressing Space)
window.__pp.advanceDialogue()

// Select choice by index (0-based)
window.__pp.selectChoice(0)

// Jump to ending with specific tier
window.__pp.skipToEnding('glory')  // or 'humble', 'barely', 'grace'
```

## Visual Checks

After each screenshot, verify:
- [ ] No text overlap (title/subtitle in menu, HUD labels/bars/values)
- [ ] Portrait visible in dialogue box (left side)
- [ ] Dialogue text readable (right of portrait)
- [ ] HUD stats aligned (icon / label / bar / value all on same row)
- [ ] Buttons within screen bounds (not clipped at bottom)
- [ ] No console errors

## Regression Mode

If baseline screenshots exist in `tests/qa/baseline/`:
- Compare new screenshots pixel-by-pixel
- Report percentage difference
- Flag any diff > 2% as potential regression

## Example Playwright MCP sequence

```javascript
// 1. Navigate
mcp__playwright__browser_navigate({ url: 'http://localhost:5173' })

// 2. Wait for game
mcp__playwright__browser_wait_for({ selector: 'canvas', timeout: 15000 })

// 3. Screenshot
mcp__playwright__browser_take_screenshot({ path: 'tests/qa/screenshots/01_boot.png' })

// 4. Advance via debug API
mcp__playwright__browser_evaluate({
  expression: 'window.__pp.advanceDialogue()'
})

// 5. Get state
mcp__playwright__browser_evaluate({
  expression: 'JSON.stringify(window.__pp.getState())'
})
```

## Output

Save all screenshots to: `web/tests/qa/screenshots/`
Print QA report showing pass/fail summary.
