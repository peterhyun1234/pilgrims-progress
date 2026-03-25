import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { GameManager } from '../core/GameManager';
import { StatType } from '../core/GameEvents';

/**
 * Dev-only debug overlay (backtick key to toggle).
 * Renders as a fixed DOM element so it stays above the Phaser canvas
 * and doesn't interfere with the game scene.
 *
 * Only created when import.meta.env.DEV === true.
 */
export class DebugPanel {
  private container: HTMLDivElement | null = null;
  private visible = false;
  private updateInterval: ReturnType<typeof setInterval> | null = null;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Only available in dev mode
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((import.meta as any).env?.DEV) {
        this.create();
        this.setupToggle();
      }
    } catch { /* not a Vite build */ }
  }

  private create(): void {
    this.container = document.createElement('div');
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '4px',
      right: '4px',
      width: '260px',
      maxHeight: '90vh',
      overflowY: 'auto',
      background: 'rgba(10,8,20,0.92)',
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

    const lines: string[] = ['<b>🔧 DEBUG PANEL</b>', '─'.repeat(30)];

    // Stats
    if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      lines.push('<b>STATS</b>');
      (['faith', 'courage', 'wisdom', 'burden'] as StatType[]).forEach(s => {
        lines.push(`  ${s}: <span style="color:#fff">${sm.get(s)}</span>`);
      });
      const h = sm.getHidden();
      lines.push(`  insight: <span style="color:#fff">${h.spiritualInsight}</span> | grace: <span style="color:#fff">${h.graceCounter}</span>`);
    }

    lines.push('─'.repeat(30));

    // Chapter & state
    if (ServiceLocator.has(SERVICE_KEYS.GAME_MANAGER)) {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      lines.push(`<b>CHAPTER</b> <span style="color:#fff">${gm.currentChapter}</span>  <b>STATE</b> <span style="color:#fff">${gm.state ?? '?'}</span>`);
    }

    lines.push('─'.repeat(30));

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

    lines.push('─'.repeat(30));

    // Triggered events
    if (ServiceLocator.has(SERVICE_KEYS.GAMEPLAY_STATE)) {
      const gps = ServiceLocator.get<import('../core/GamePlayState').GamePlayState>(SERVICE_KEYS.GAMEPLAY_STATE);
      lines.push('<b>TRIGGERED EVENTS</b>');
      if (gps.triggeredEvents.size === 0) {
        lines.push('  (none)');
      } else {
        gps.triggeredEvents.forEach(id => lines.push(`  ✓ ${id}`));
      }
    }

    lines.push('─'.repeat(30));

    // Narrative Director fired triggers
    if (ServiceLocator.has(SERVICE_KEYS.NARRATIVE_DIRECTOR)) {
      const nd = ServiceLocator.get<import('../narrative/NarrativeDirector').NarrativeDirector>(SERVICE_KEYS.NARRATIVE_DIRECTOR);
      const triggers = nd.getFiredTriggers();
      lines.push('<b>STORY TRIGGERS FIRED</b>');
      if (triggers.length === 0) {
        lines.push('  (none)');
      } else {
        triggers.forEach(t => lines.push(`  ✓ ${t}`));
      }
    }

    lines.push('─'.repeat(30));

    // Ink state
    if (ServiceLocator.has(SERVICE_KEYS.INK_SERVICE)) {
      const ink = ServiceLocator.get<import('../narrative/InkService').InkService>(SERVICE_KEYS.INK_SERVICE);
      const knot = ink.getCurrentKnot();
      lines.push(`<b>INK KNOT</b> <span style="color:#fff">${knot || '(none)'}</span>`);
      const states = ink.getAllStates();
      const keys = Object.keys(states);
      lines.push(`<b>INK SAVED</b> [${keys.join(', ') || 'none'}]`);
    }

    lines.push('─'.repeat(30));
    lines.push('<span style="color:#555">` to close</span>');

    this.container.innerHTML = lines.join('<br>');

    // Stat override buttons (one-off injection, only if not already present)
    if (!this.container.querySelector('[data-dbg-btn]')) {
      this.injectStatButtons();
    }
  }

  private injectStatButtons(): void {
    if (!this.container) return;

    const row = document.createElement('div');
    row.style.marginTop = '6px';

    const statBtns: [StatType, number][] = [
      ['faith', 10], ['courage', 10], ['wisdom', 10], ['burden', -20],
    ];

    statBtns.forEach(([stat, delta]) => {
      const btn = document.createElement('button');
      const sign = delta > 0 ? '+' : '';
      btn.textContent = `${stat} ${sign}${delta}`;
      btn.setAttribute('data-dbg-btn', '1');
      Object.assign(btn.style, {
        margin: '2px',
        padding: '2px 4px',
        background: '#1a1428',
        color: '#d4a853',
        border: '1px solid #d4a853',
        borderRadius: '2px',
        cursor: 'pointer',
        fontSize: '9px',
      });
      btn.onclick = () => {
        if (ServiceLocator.has(SERVICE_KEYS.STATS_MANAGER)) {
          ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER).change(stat, delta);
        }
      };
      row.appendChild(btn);
    });

    // Reset NPC states button
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset NPCs';
    resetBtn.setAttribute('data-dbg-btn', '1');
    Object.assign(resetBtn.style, {
      margin: '2px',
      padding: '2px 4px',
      background: '#3a1a1a',
      color: '#ff8888',
      border: '1px solid #ff4444',
      borderRadius: '2px',
      cursor: 'pointer',
      fontSize: '9px',
    });
    resetBtn.onclick = () => {
      if (ServiceLocator.has(SERVICE_KEYS.NPC_STATE_MANAGER)) {
        const nsm = ServiceLocator.get<import('../systems/NpcStateManager').NpcStateManager>(SERVICE_KEYS.NPC_STATE_MANAGER);
        const states = nsm.getNpcStates();
        Object.keys(states).forEach(id => nsm.setPhase(id as string, 'available'));
      }
    };
    row.appendChild(resetBtn);

    this.container.appendChild(row);
  }

  destroy(): void {
    this.stopUpdating();
    this.container?.remove();
    this.container = null;
  }
}
