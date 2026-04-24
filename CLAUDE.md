# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This is a monorepo with two parallel implementations of *Pilgrim's Progress* (천로역정), a 12-chapter Christian narrative pixel-art game:

- `web/` — **the active project**. Phaser 3 + TypeScript + Vite (pnpm workspace). All new work happens here.
- `pilgrims-progress-unity/` — legacy Unity prototype, no longer maintained.
- `docs/` — design specs (`game-design-web/`), source material (`story-data/`), platform guidance, and the QA checklist (`qa-prompt.md`).

Anything outside `web/` is reference material; treat the web project as the working tree.

## Common commands

All commands run from `web/` (Node ≥ 24, pnpm ≥ 10):

```bash
pnpm dev            # Vite dev server on :3000 (does not auto-open browser)
pnpm build          # tsc + vite build → web/dist
pnpm typecheck      # tsc --noEmit (CI gate)
pnpm test           # vitest watch
pnpm test:run       # vitest run (CI gate)
pnpm lint           # eslint src/
pnpm format         # prettier --write src/
```

Run a single unit test file:

```bash
pnpm vitest run src/__tests__/StatsManager.test.ts
```

Build for GitHub Pages base path (`/pilgrims-progress/`) instead of itch.io root (`./`):

```bash
GITHUB_PAGES=true pnpm build
```

The Playwright spec at `web/tests/qa/game-visual.spec.ts` is for manual visual QA only — not wired into `pnpm test`. The `game-qa` skill (`.claude/skills/`) drives it via Playwright MCP.

## Architecture — what spans many files

### Phaser scene graph (registered in `web/src/main.ts`)

Linear flow: `BootScene → PreloadScene → LanguageScene → MenuScene → OnboardingScene → GameScene`. `BattleScene`, `CutsceneScene`, `SettingsScene`, and `EndingScene` are launched on demand. `BootScene` is where the game world is *constructed* (it instantiates `GameManager`, `ResponsiveManager`, `AudioManager`, `SaveManager`, `AutoSave` and registers them in `ServiceLocator`); `PreloadScene` only loads assets. New cross-scene services should be created and registered in `BootScene.create()`.

### Service wiring: `ServiceLocator` + `EventBus`

Two singletons own all cross-scene wiring:

- `ServiceLocator` (`src/core/ServiceLocator.ts`) — string-keyed registry. **Always use the `SERVICE_KEYS` constants** (e.g. `SERVICE_KEYS.GAME_MANAGER`); never pass a raw string. `get()` throws if missing — gate optional services with `has()`.
- `EventBus` (`src/core/EventBus.ts`) — global pub/sub via `EventBus.getInstance()`. Event names live in the `GameEvent` enum in `src/core/GameEvents.ts` along with their payload types. Adding a new cross-scene event means adding it there, not introducing a new string literal.

Anything stateful that outlives a single scene (game state, stats, save data, audio, dialogue, narrative direction) flows through these two — not through scene references or static imports.

### Game state: `GameManager` + `StateMachine`

`GameManager` (`src/core/GameManager.ts`) owns the FSM (`GameState` enum: BOOT/MENU/GAME/PAUSE/BATTLE/CUTSCENE/DIALOGUE/INVENTORY), the I18n instance, `StatsManager`, current chapter, language, and accessibility settings (colorblind palettes, reduce-motion). Scenes read game state from here, never from each other.

### Narrative pipeline (Ink → choices → effects)

Three-layer structure under `src/narrative/`:

1. `InkService` wraps `inkjs` and persists per-story state (`getAllStates()` is what `SaveManager` snapshots). Story JSON lives in `web/public/assets/ink/`.
2. `DialogueManager` drives the typing/choice presentation (consumed by `DialogueBox` UI).
3. `NarrativeDirector` reacts to Ink tags by emitting `EventBus` events (BGM changes, screen shake, palette shifts, etc.). Tag conventions are documented in the existing tag handlers — extend there rather than inventing parallel paths.

There are also fallback dialogues in `src/narrative/data/fallbackDialogues.ts` for NPCs without an Ink script — keep those in sync if you add an NPC.

### World generation

`ChapterData.ts` defines the data shape (`ChapterConfig` with theme, NPCs, events, objects). `CHAPTER_CONFIGS` is a static array indexed by chapter number — there is no runtime chapter loader, just lookup. `ChapterManager.loadChapter(n)` calls `TileMapManager.generateMap(config)` to procedurally render the tile map from the theme. To add or modify a chapter, edit `ChapterData.ts`; to change how a theme renders, edit `TileMapManager.ts`.

### Save system

`SaveManager` snapshots player position (read from `GameManager.playerX/playerY`, which `GameScene` writes every frame), stats, current chapter, and `InkService.getAllStates()`. `AutoSave` listens to `EventBus` triggers. Persistence is via `localforage` (IndexedDB w/ fallback). New save fields go in `src/save/SaveData.ts` — bump nothing automatically; saved data is user-visible, so plan migrations explicitly.

### Audio

`AudioManager` consumes `BGM_PLAY` / `MUSIC_CROSSFADE` / `AMBIENT_CHANGE` events. `ProceduralBGM` generates the chapter-12 score via Web Audio API (no asset files). Use events, not direct calls into the manager, when triggering music from gameplay.

## Constants and config (`src/config.ts`)

A single file owns global tunables — read it before introducing new magic numbers:

- **Resolution**: 480 × 270 logical, rendered with `pixelArt: true`, `roundPixels: true`. Phaser's `Scale.FIT` auto-scales for display.
- **STATS** (`FAITH`, `COURAGE`, `WISDOM`, `BURDEN`) — initial/min/max per stat. The four-stat system is load-bearing across HUD, battle, dialogue choices, and Ink `STAT` checks.
- **PLAYER**, **ANIM**, **NPC_CONFIG**, **DIALOGUE** — movement, animation framerates, NPC interaction distances, typing speeds.
- **COLORS** — palette per scene (LIGHT/DARK/BATTLE/STAT/UI). `DesignSystem` (`src/ui/DesignSystem.ts`) wraps these for text styles.
- `ENGLISH_DISABLED = true` currently hides the English language toggle. Bilingual data (`i18n/{ko,en}.json`, NPC `labelEn`, etc.) is still maintained — don't strip it.

## UI conventions

- **All text styles go through `DesignSystem.textStyle()` / `goldTextStyle()` / `mutedTextStyle()`**. Don't hardcode `fontFamily` — Korean uses Galmuri11 (`public/fonts/Galmuri11.woff2`, `font-display: block`), English uses "Press Start 2P" via Google Fonts. `main.ts` waits on `document.fonts.ready` before booting Phaser to avoid FOUT-induced `drawImage` crashes.
- **Shadow `blur` must be 0 on text** (decorative glows on the `✝` cross and ambient FX are the only exceptions). The pixel-art look depends on this.
- **Don't call `Date.now()` in update/animation loops** — use `scene.time.now` or `this.time.now`. `Date.now()` is reserved for save timestamps.
- **Mobile hit zones**: `MobileControls` action button uses `r + 6` (≈42px CSS at zoom:2). Hidden buttons must `disableInteractive()`, especially during dialogue.
- **Edge-trigger inputs**: NPC interact uses `if (vi.interact) { input.interact = true; vi.interact = false; }` in `GameScene.update()`; keyboard uses `Phaser.Input.Keyboard.JustDown`. Don't introduce level-triggered interact paths.

The full QA checklist (`docs/qa-prompt.md`) is the source of truth for these polish rules.

## TypeScript & lint rules worth knowing

- `tsconfig.json` is strict, with `noUnusedLocals`/`noUnusedParameters`. Prefix intentional unused with `_`.
- ESLint forbids `any` (`@typescript-eslint/no-explicit-any: error`) and bans non-`warn`/`error` `console` calls in `src/` (test files relax both).
- Path alias `@/*` → `src/*` is set in both `tsconfig.json` and `vite.config.ts`/`vitest.config.ts`.
- `consistent-type-imports` is on — use `import type { ... }` for type-only imports.

## CI and deployment

- `.github/workflows/web-tests.yml` — runs `pnpm typecheck` + `pnpm test:run` on every PR and push to `main` touching `web/**`.
- `.github/workflows/deploy-web.yml` — on push to `main`, builds twice (GitHub Pages base + itch.io root) and deploys to GitHub Pages; itch.io push runs only when `vars.DEPLOY_ITCH == 'true'` (needs `BUTLER_CREDENTIALS` + `ITCH_GAME` secrets).

Vite chunks vendors separately (`vendor-phaser`, `vendor-ink`, `vendor-storage`, `vendor-audio`) — Phaser alone is ~2.7 MB, hence the 3000 KB `chunkSizeWarningLimit`.
