import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { GameManager } from '../core/GameManager';
import { StatType, GameEvent } from '../core/GameEvents';
import { EventBus } from '../core/EventBus';
import { SCENE_KEYS } from '../config';

/**
 * Dev-only debug overlay (backtick ` key to toggle).
 * Renders as a fixed DOM element above the Phaser canvas.
 * Only created when import.meta.env.DEV === true.
 *
 * Also exposes window.__pp for Playwright / automated QA:
 *   window.__pp.getState()          → { chapter, stats, state }
 *   window.__pp.setStat(stat, val)  → set stat directly
 *   window.__pp.gotoChapter(n)      → fast-travel to chapter
 *   window.__pp.advanceDialogue()   → emit DIALOGUE_CHOICE_SELECTED(-1)
 *   window.__pp.skipToEnding(tier)  → jump to EndingScene
 */
export class DebugPanel {
  private container: HTMLDivElement | null = null;
  private visible = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isDev = (import.meta as any).env?.DEV;
      if (isDev) {
        this.create();
        this.setupToggle();
      }
      // Always expose window.__pp for Playwright QA (works in prod build too)
      this.exposeTestAPI();
    } catch { /* not a Vite build */ }
  }

  // ── Window test API ───────────────────────────────────────────────────────

  private exposeTestAPI(): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__pp = {
      getState: () => {
        if (!ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) return null;
        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        const sm = ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)
          ? ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER) : null;
        return {
          chapter: gm.currentChapter,
          state: gm.state,
          language: gm.language,
          stats: sm ? {
            faith: sm.get('faith'), courage: sm.get('courage'),
            wisdom: sm.get('wisdom'), burden: sm.get('burden'),
          } : null,
        };
      },
      setStat: (stat: StatType, value: number) => {
        if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;
        const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
        const current = sm.get(stat);
        sm.change(stat, value - current);
      },
      changeStat: (stat: StatType, delta: number) => {
        if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;
        ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER).change(stat, delta);
      },
      gotoChapter: (chapter: number) => {
        if (!ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) return;
        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        gm.setChapter(chapter);
        EventBus.getInstance().emit(GameEvent.CHAPTER_CHANGED, { chapter });
      },
      advanceDialogue: () => {
        EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, -1);
      },
      selectChoice: (index: number) => {
        EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, index);
      },
      skipToEnding: (tier: 'glory' | 'humble' | 'barely' | 'grace' = 'glory') => {
        if (!ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) return;
        const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
        // Set stats to match the requested ending tier
        if (tier === 'glory') {
          sm.change('faith', 90 - sm.get('faith'));
          sm.change('wisdom', 80 - sm.get('wisdom'));
          sm.change('burden', 10 - sm.get('burden'));
        } else if (tier === 'barely') {
          sm.change('faith', 35 - sm.get('faith'));
          sm.change('burden', 75 - sm.get('burden'));
        } else if (tier === 'grace') {
          sm.change('faith', 55 - sm.get('faith'));
        }
        this.scene.scene.start(SCENE_KEYS.ENDING);
      },
      isDialogueOpen: () => {
        // Checks if DialogueBox container is visible
        const canvas = document.querySelector('canvas');
        if (!canvas) return false;
        // Use game object visibility via scene registry if accessible
        return !!(ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER));
      },
      waitForScene: (key: string, timeoutMs = 5000): Promise<boolean> => {
        return new Promise(resolve => {
          const start = Date.now();
          const check = () => {
            if (this.scene.scene.isActive(key)) { resolve(true); return; }
            if (Date.now() - start > timeoutMs) { resolve(false); return; }
            setTimeout(check, 100);
          };
          check();
        });
      },
    };
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  private create(): void {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '4px',
      right: '4px',
      width: '280px',
      maxHeight: '92vh',
      overflowY: 'auto',
      background: 'rgba(10,8,20,0.94)',
      border: '1px solid #d4a853',
      borderRadius: '4px',
      padding: '8px',
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#d4a853',
      zIndex: '9999',
      display: 'none',
      lineHeight: '1.5',
    });
    document.body.appendChild(this.container);
  }

  private setupToggle(): void {
    this.scene.input.keyboard?.on('keydown-BACKTICK', () => this.toggle());
  }

  toggle(): void {
    if (!this.container) return;
    this.visible = !this.visible;
    this.container.style.display = this.visible ? 'block' : 'none';

    if (this.visible) {
      this.startUpdating();
    } else {
      this.stopUpdating();
    }
  }

  private startUpdating(): void {
    this.render();
    this.updateInterval = setInterval(() => this.render(), 500);
  }

  private stopUpdating(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private render(): void {
    if (!this.container || !this.visible) return;

    const lines: string[] = ['<b>🔧 DEBUG PANEL</b>  <span style="color:#555">` to close</span>', '─'.repeat(34)];

    // Stats
    if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      lines.push('<b>STATS</b>');
      (['faith', 'courage', 'wisdom', 'burden'] as StatType[]).forEach(s => {
        const v = sm.get(s);
        const bar = '█'.repeat(Math.round(v / 10)) + '░'.repeat(10 - Math.round(v / 10));
        lines.push(`  ${s.padEnd(8)} <span style="color:#fff">${String(v).padStart(3)}</span> <span style="color:#555;font-size:9px">${bar}</span>`);
      });
      const h = sm.getHidden();
      lines.push(`  insight: <span style="color:#fff">${h.spiritualInsight}</span>  grace: <span style="color:#fff">${h.graceCounter}</span>`);
    }

    lines.push('─'.repeat(34));

    // Chapter & state
    if (ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      lines.push(`<b>CHAPTER</b> <span style="color:#fff">${gm.currentChapter}</span>  <b>STATE</b> <span style="color:#fff">${gm.state ?? '?'}</span>  <b>LANG</b> <span style="color:#fff">${gm.language}</span>`);
    }

    lines.push('─'.repeat(34));

    // NPC states
    if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
      const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
      lines.push('<b>NPC STATES</b>');
      const states = nsm.getNpcStates();
      for (const [id, s] of Object.entries(states)) {
        const color = s.phase === 'completed' ? '#4a7c59'
          : s.phase === 'locked' ? '#888'
          : s.phase === 'active' ? '#ffd700'
          : '#d4a853';
        lines.push(`  <span style="color:${color}">${id}: ${s.phase}</span> (talks:${s.talkCount})`);
      }
    }

    lines.push('─'.repeat(34));

    // Triggered events (condensed)
    if (ServiceLocator.has(SERVICE_KEYS.GAMEPLAY_STATE)) {
      const gps = ServiceLocator.get<import('../core/GamePlayState').GamePlayState>(SERVICE_KEYS.GAMEPLAY_STATE);
      const events = [...gps.triggeredEvents];
      lines.push(`<b>TRIGGERED EVENTS</b> [${events.length}]`);
      events.slice(-5).forEach(id => lines.push(`  ✓ ${id}`));
      if (events.length > 5) lines.push(`  ... +${events.length - 5} more`);
    }

    lines.push('─'.repeat(34));

    // Ink state
    if (ServiceLocator.has(SERVICE_KEYS.INK_SERVICE)) {
      const ink = ServiceLocator.get<import('../narrative/InkService').InkService>(SERVICE_KEYS.INK_SERVICE);
      lines.push(`<b>INK KNOT</b> <span style="color:#fff">${ink.getCurrentKnot() || '(none)'}</span>`);
    }

    lines.push('─'.repeat(34));

    this.container.innerHTML = lines.join('<br>');

    // Inject interactive buttons once
    if (!this.container.querySelector('[data-dbg-btn]')) {
      this.injectButtons();
    }
  }

  private injectButtons(): void {
    if (!this.container) return;

    const section = (label: string) => {
      const el = document.createElement('div');
      el.innerHTML = `<span style="color:#888;font-size:9px">${label}</span>`;
      el.style.marginTop = '6px';
      return el;
    };

    const btn = (
      text: string,
      color: string,
      bg: string,
      border: string,
      onClick: () => void,
    ) => {
      const b = document.createElement('button');
      b.textContent = text;
      b.setAttribute('data-dbg-btn', '1');
      Object.assign(b.style, {
        margin: '2px', padding: '2px 5px',
        background: bg, color,
        border: `1px solid ${border}`,
        borderRadius: '2px', cursor: 'pointer', fontSize: '9px',
      });
      b.onclick = onClick;
      return b;
    };

    // ── Stat tweaks ──
    const statRow = section('STAT TWEAKS');
    const statBtns: [StatType, number][] = [
      ['faith', 10], ['courage', 10], ['wisdom', 10], ['burden', -20],
    ];
    statBtns.forEach(([stat, delta]) => {
      const sign = delta > 0 ? '+' : '';
      statRow.appendChild(btn(`${stat} ${sign}${delta}`, '#d4a853', '#1a1428', '#d4a853', () => {
        if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
          ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER).change(stat, delta);
        }
      }));
    });
    this.container.appendChild(statRow);

    // ── Chapter fast-travel ──
    const chapRow = section('CHAPTER JUMP');
    for (let ch = 1; ch <= 12; ch++) {
      const c = ch;
      chapRow.appendChild(btn(`Ch${c}`, '#aaddff', '#0a1828', '#4a90d9', () => {
        if (ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) {
          const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
          gm.setChapter(c);
          EventBus.getInstance().emit(GameEvent.CHAPTER_CHANGED, { chapter: c });
        }
      }));
    }
    this.container.appendChild(chapRow);

    // ── Dialogue controls ──
    const dlgRow = section('DIALOGUE');
    dlgRow.appendChild(btn('Advance ▶', '#ffffff', '#1a2840', '#4a90d9', () => {
      EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, -1);
    }));
    dlgRow.appendChild(btn('Choice 1', '#d4a853', '#2a1a08', '#d4a853', () => {
      EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, 0);
    }));
    dlgRow.appendChild(btn('Choice 2', '#d4a853', '#2a1a08', '#d4a853', () => {
      EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, 1);
    }));
    dlgRow.appendChild(btn('Choice 3', '#d4a853', '#2a1a08', '#d4a853', () => {
      EventBus.getInstance().emit(GameEvent.DIALOGUE_CHOICE_SELECTED, 2);
    }));
    this.container.appendChild(dlgRow);

    // ── Scene shortcuts ──
    const sceneRow = section('SCENE JUMP');
    const sceneJumps: [string, string][] = [
      ['Menu', SCENE_KEYS.MENU],
      ['Game', SCENE_KEYS.GAME],
      ['Battle', SCENE_KEYS.BATTLE],
      ['Ending', SCENE_KEYS.ENDING],
    ];
    sceneJumps.forEach(([label, key]) => {
      sceneRow.appendChild(btn(label, '#ccffcc', '#0a2014', '#4a8a4a', () => {
        this.scene.scene.start(key);
      }));
    });
    this.container.appendChild(sceneRow);

    // ── Ending tiers ──
    const endingRow = section('ENDING TIER (jump)');
    (['Glory', 'Humble', 'Barely', 'Grace'] as const).forEach(tier => {
      const t = tier.toLowerCase() as 'glory' | 'humble' | 'barely' | 'grace';
      endingRow.appendChild(btn(tier, '#ffd700', '#1a1408', '#d4a853', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__pp?.skipToEnding(t);
      }));
    });
    this.container.appendChild(endingRow);

    // ── Reset controls ──
    const resetRow = section('RESET');
    resetRow.appendChild(btn('Reset NPCs', '#ff8888', '#2a0808', '#ff4444', () => {
      if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
        const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
        const states = nsm.getNpcStates();
        Object.keys(states).forEach(id => nsm.setPhase(id, 'available'));
      }
    }));
    resetRow.appendChild(btn('New Game', '#ff8888', '#2a0808', '#ff4444', () => {
      if (ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) {
        ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER).newGame();
        this.scene.scene.start(SCENE_KEYS.ONBOARDING);
      }
    }));
    this.container.appendChild(resetRow);
  }

  destroy(): void {
    this.stopUpdating();
    this.container?.remove();
    this.container = null;
  }
}
