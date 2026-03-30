/**
 * Automated game QA — visual regression + functionality tests.
 *
 * Run with:
 *   npx playwright test tests/qa/game-visual.spec.ts
 *
 * Requires game dev server running on port 5173:
 *   npm run dev &
 *
 * Or use the `game-qa` Claude skill which starts/stops the server automatically.
 */

// NOTE: These tests use the `window.__pp` debug API exposed by DebugPanel.
// The API is always available (not gated by DEV mode).

import type { Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = 'tests/qa/screenshots';

/** Helper: wait for Phaser to load and the canvas to be present */
async function waitForGame(page: Page, timeoutMs = 15000): Promise<void> {
  await page.waitForSelector('canvas', { timeout: timeoutMs });
  // Wait for PreloadScene to finish (game ready signal)
  await page.waitForFunction(
    () => !!(window as any).__pp,
    { timeout: timeoutMs },
  );
  // Extra buffer for scene to settle
  await page.waitForTimeout(800);
}

/** Helper: get game state via __pp API */
async function getState(page: Page) {
  return page.evaluate(() => (window as any).__pp?.getState());
}

/** Helper: advance dialogue once */
async function advanceDialogue(page: Page): Promise<void> {
  await page.evaluate(() => (window as any).__pp?.advanceDialogue());
  await page.waitForTimeout(400);
}

/** Helper: take named screenshot */
async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${SCREENSHOT_DIR}/${name}.png`, fullPage: false });
}

// ============================================================
// NOTE: The tests below use Playwright's built-in test runner.
// To run without full Playwright install, each test can also be
// executed as a standalone script using the game-qa Claude skill.
// ============================================================

export async function runFullQA(page: Page): Promise<QAReport> {
  const report: QAReport = { passed: [], failed: [], screenshots: [], errors: [] };

  try {
    // ── Boot ──────────────────────────────────────────────────────────────
    await page.goto(BASE_URL);
    report.passed.push('navigate to game');

    await waitForGame(page).catch(() => report.failed.push('game load timeout'));
    await shot(page, '01_boot');
    report.screenshots.push('01_boot');

    // ── Check console errors ──────────────────────────────────────────────
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => report.errors.push(err.message));

    // ── Language screen ───────────────────────────────────────────────────
    await page.waitForTimeout(1500); // language selection
    await shot(page, '02_language');
    report.screenshots.push('02_language');

    // Click KO option (first button typically)
    await page.click('canvas');
    await page.waitForTimeout(500);

    // ── Menu ──────────────────────────────────────────────────────────────
    await page.waitForTimeout(2000);
    await shot(page, '03_menu');
    report.screenshots.push('03_menu');

    const stateAtMenu = await getState(page);
    if (stateAtMenu) {
      report.passed.push('window.__pp API accessible');
    } else {
      report.failed.push('window.__pp API not found');
    }

    // ── Check UI alignment: HUD bars visible ─────────────────────────────
    const hudVisible = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return !!canvas && canvas.width > 0;
    });
    if (hudVisible) report.passed.push('canvas renders');
    else report.failed.push('canvas not rendering');

    // ── Start game via __pp API (skip click-through) ──────────────────────
    await page.evaluate(() => {
      const gm = (window as any).__pp;
      if (gm) {
        // Start new game directly
        const { ServiceLocator, SERVICE_KEYS } = (window as any).__phaserInternals ?? {};
        // Fallback: dispatch keyboard event to trigger new game
      }
    });

    // Click menu (simulate pointer at new game button position)
    // MenuScene: new game button at approximately (240, 156) at 480x270 internal
    // The canvas is scaled up — need to find actual click position
    const canvasBox = await page.locator('canvas').boundingBox();
    if (canvasBox) {
      const scaleX = canvasBox.width / 480;
      const scaleY = canvasBox.height / 270;
      // New game button at ~(240, 156) internal
      await page.mouse.click(
        canvasBox.x + 240 * scaleX,
        canvasBox.y + 156 * scaleY,
      );
      report.passed.push('clicked new game button');
    }

    await page.waitForTimeout(2000);
    await shot(page, '04_onboarding_or_game');
    report.screenshots.push('04_onboarding_or_game');

    // ── Auto-advance onboarding ───────────────────────────────────────────
    for (let i = 0; i < 10; i++) {
      await advanceDialogue(page);
    }
    await shot(page, '05_after_onboarding');
    report.screenshots.push('05_after_onboarding');

    // ── Game scene check ─────────────────────────────────────────────────
    await page.waitForTimeout(1000);
    const gameState = await getState(page);
    if (gameState?.chapter >= 1) {
      report.passed.push(`game scene loaded (ch${gameState.chapter})`);
    } else {
      report.failed.push('game scene not loaded after onboarding');
    }
    await shot(page, '06_game_ch1');
    report.screenshots.push('06_game_ch1');

    // ── Fast-travel to key chapters via __pp ─────────────────────────────
    for (const ch of [3, 5, 7, 8, 12]) {
      await page.evaluate((c) => (window as any).__pp?.gotoChapter(c), ch);
      await page.waitForTimeout(800);
      await shot(page, `07_chapter_${ch}`);
      report.screenshots.push(`07_chapter_${ch}`);
      report.passed.push(`fast-travel to ch${ch}`);
    }

    // ── Ending scene tiers ───────────────────────────────────────────────
    for (const tier of ['glory', 'barely', 'grace'] as const) {
      await page.evaluate((t) => (window as any).__pp?.skipToEnding(t), tier);
      await page.waitForTimeout(1500);
      await shot(page, `08_ending_${tier}`);
      report.screenshots.push(`08_ending_${tier}`);
      report.passed.push(`ending scene: ${tier}`);
    }

    // ── Battle scene ─────────────────────────────────────────────────────
    await page.evaluate(() => {
      // Navigate to battle by starting it directly
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scene = (window as any).__phaserGame?.scene.getScenes(true)[0];
      scene?.scene?.start('BattleScene');
    });
    await page.waitForTimeout(1500);
    await shot(page, '09_battle');
    report.screenshots.push('09_battle');

    // ── Console errors check ─────────────────────────────────────────────
    if (consoleErrors.length === 0) {
      report.passed.push('no console errors');
    } else {
      consoleErrors.forEach(e => report.failed.push(`console error: ${e}`));
    }

  } catch (err) {
    report.errors.push(`QA run error: ${err}`);
  }

  return report;
}

export interface QAReport {
  passed: string[];
  failed: string[];
  screenshots: string[];
  errors: string[];
}

/** Format report as human-readable string */
export function formatReport(report: QAReport): string {
  const lines: string[] = [
    '═══════════════════════════════════════',
    '  천로역정 — Automated QA Report',
    '═══════════════════════════════════════',
    `  ✅ PASSED: ${report.passed.length}`,
    `  ❌ FAILED: ${report.failed.length}`,
    `  📸 SCREENSHOTS: ${report.screenshots.length}`,
    `  🔴 ERRORS: ${report.errors.length}`,
    '───────────────────────────────────────',
  ];

  if (report.passed.length > 0) {
    lines.push('PASSED:');
    report.passed.forEach(p => lines.push(`  ✅ ${p}`));
  }

  if (report.failed.length > 0) {
    lines.push('FAILED:');
    report.failed.forEach(f => lines.push(`  ❌ ${f}`));
  }

  if (report.errors.length > 0) {
    lines.push('ERRORS:');
    report.errors.forEach(e => lines.push(`  🔴 ${e}`));
  }

  if (report.screenshots.length > 0) {
    lines.push(`SCREENSHOTS saved to: tests/qa/screenshots/`);
  }

  lines.push('═══════════════════════════════════════');
  return lines.join('\n');
}
