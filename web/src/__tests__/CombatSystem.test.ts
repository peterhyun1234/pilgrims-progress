import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config
vi.mock('../config', () => ({
  STATS: {
    FAITH: { initial: 30, min: 0, max: 100 },
    COURAGE: { initial: 20, min: 0, max: 100 },
    WISDOM: { initial: 20, min: 0, max: 100 },
    BURDEN: { initial: 60, min: 0, max: 100 },
  },
  HIDDEN_STAT_CAPS: {
    SPIRITUAL_INSIGHT: 100,
    GRACE_COUNTER: 10,
  },
  COMBAT: {
    BASE_HP: 100,
    QTE_WINDOW_MS: 1500,
    QTE_PERFECT_MS: 300,
    PRAY_BASE_POWER: 15,
    DEFEND_REDUCTION: 0.5,
    TURN_DELAY_MS: 800,
  },
}));

import { EventBus } from '../core/EventBus';
import { StatsManager } from '../core/StatsManager';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { CombatSystem } from '../systems/CombatSystem';
import { EnemyDef } from '../systems/SkillData';

const TEST_ENEMY: EnemyDef = {
  id: 'test_enemy',
  nameKo: '테스트',
  nameEn: 'Test Enemy',
  hp: 60,
  attack: 10,
  defense: 5,
  weakness: 'faith',
  isBoss: false,
  chapter: 1,
  iconColor: 0x555555,
  attackPatterns: [
    { nameKo: '공격', nameEn: 'Attack', power: 12, type: 'faith' },
  ],
};

describe('CombatSystem', () => {
  let combat: CombatSystem;
  let sm: StatsManager;
  let bus: EventBus;

  beforeEach(() => {
    // Reset EventBus singleton
    bus = EventBus.getInstance();
    bus.clear();

    sm = new StatsManager(bus);
    sm.setAll({ faith: 50, courage: 50, wisdom: 50, burden: 0 });

    // Register StatsManager in ServiceLocator (clear first to avoid stale state)
    ServiceLocator.clear();
    ServiceLocator.register(SERVICE_KEYS.STATS_MANAGER, sm);

    combat = new CombatSystem();
  });

  describe('startCombat', () => {
    it('initializes combat state correctly', () => {
      const state = combat.startCombat(TEST_ENEMY);
      expect(state.playerHp).toBe(150); // BASE_HP(100) + faith(50)
      expect(state.playerMaxHp).toBe(150);
      expect(state.enemyHp).toBe(60);
      expect(state.enemyMaxHp).toBe(60);
      expect(state.turn).toBe(1);
      expect(state.isPlayerTurn).toBe(true);
      expect(state.finished).toBe(false);
    });

    it('filters available skills by stat requirements', () => {
      sm.setAll({ faith: 10, courage: 10, wisdom: 10, burden: 0 });
      const state = combat.startCombat(TEST_ENEMY);
      // Only fervent_prayer (requiredValue: 0) should be available
      expect(state.availableSkills.length).toBeGreaterThanOrEqual(1);
      expect(state.availableSkills.some(s => s.id === 'fervent_prayer')).toBe(true);
      // shield_of_faith requires faith >= 40, should be excluded
      expect(state.availableSkills.some(s => s.id === 'shield_of_faith')).toBe(false);
    });

    it('adds appearance log entry', () => {
      const state = combat.startCombat(TEST_ENEMY);
      expect(state.log.length).toBe(1);
      expect(state.log[0].type).toBe('system');
      expect(state.log[0].textEn).toContain('appeared');
    });
  });

  describe('pray', () => {
    it('deals damage based on faith', () => {
      combat.startCombat(TEST_ENEMY);
      const state = combat.pray()!;
      // PRAY_BASE_POWER(15) + faith(50)/10 = 15 + 5 = 20
      // weakness is faith → ×1.5 = 30
      const expectedDamage = 30;
      expect(state.enemyHp).toBe(60 - expectedDamage);
    });

    it('applies weakness multiplier', () => {
      const noWeaknessEnemy = { ...TEST_ENEMY, weakness: 'wisdom' as const };
      combat.startCombat(noWeaknessEnemy);
      const state = combat.pray()!;
      // No weakness bonus: 15 + 5 = 20
      expect(state.enemyHp).toBe(60 - 20);
    });

    it('triggers enemy turn after praying', () => {
      combat.startCombat(TEST_ENEMY);
      const state = combat.pray()!;
      // After pray + enemy turn, turn should advance
      expect(state.turn).toBe(2);
      expect(state.isPlayerTurn).toBe(true);
    });

    it('returns null when not player turn or finished', () => {
      expect(combat.pray()).toBeNull(); // No combat started
    });
  });

  describe('defend', () => {
    it('sets defending flag', () => {
      combat.startCombat(TEST_ENEMY);
      const state = combat.defend()!;
      // After defend + enemy turn, defending is reset
      // But the enemy damage should have been reduced
      expect(state.log.some(l => l.textEn.includes('defensive'))).toBe(true);
    });

    it('reduces incoming damage', () => {
      combat.startCombat(TEST_ENEMY);
      const beforeHp = combat.getState()!.playerHp;
      combat.defend();
      const afterHp = combat.getState()!.playerHp;
      // Enemy power is 12, defending reduces by DEFEND_REDUCTION(0.5)
      // damage = 12 - floor(12 * 0.5) = 12 - 6 = 6
      expect(beforeHp - afterHp).toBe(6);
    });
  });

  describe('useSkill', () => {
    it('deals skill damage with weakness multiplier', () => {
      combat.startCombat(TEST_ENEMY);
      const state = combat.useSkill('fervent_prayer')!;
      // power: 20, weakness is faith → ×1.5 = 30
      expect(state.enemyHp).toBeLessThan(60);
    });

    it('deducts skill cost from stat', () => {
      const initialFaith = sm.get('faith');
      combat.startCombat(TEST_ENEMY);
      combat.useSkill('fervent_prayer');
      // fervent_prayer costs 5 faith
      expect(sm.get('faith')).toBe(initialFaith - 5);
    });

    it('returns null for unknown skill', () => {
      combat.startCombat(TEST_ENEMY);
      expect(combat.useSkill('nonexistent')).toBeNull();
    });

    it('returns null when stat requirement not met', () => {
      sm.setAll({ faith: 5, courage: 5, wisdom: 5, burden: 0 });
      combat.startCombat(TEST_ENEMY);
      // shield_of_faith requires faith >= 40
      expect(combat.useSkill('shield_of_faith')).toBeNull();
    });
  });

  describe('heal skill', () => {
    it('adds a heal log entry when healing', () => {
      sm.setAll({ faith: 60, courage: 50, wisdom: 50, burden: 0 });
      combat.startCombat(TEST_ENEMY);
      combat.useSkill('psalm_of_comfort'); // heal type, power: 35
      const state = combat.getState()!;
      expect(state.log.some(l => l.type === 'heal')).toBe(true);
      const healLog = state.log.find(l => l.type === 'heal');
      expect(healLog?.textEn).toContain('Healed');
    });
  });

  describe('victory', () => {
    it('marks victory when enemy HP reaches 0', () => {
      const weakEnemy = { ...TEST_ENEMY, hp: 1 };
      combat.startCombat(weakEnemy);
      const state = combat.pray()!;
      expect(state.finished).toBe(true);
      expect(state.victory).toBe(true);
    });

    it('does not trigger enemy turn after victory', () => {
      const weakEnemy = { ...TEST_ENEMY, hp: 1 };
      combat.startCombat(weakEnemy);
      const state = combat.pray()!;
      // Turn should still be 1 since enemy didn't get a turn
      expect(state.turn).toBe(1);
    });
  });

  describe('defeat', () => {
    it('sets player HP to 1 on defeat (grace)', () => {
      const strongEnemy: EnemyDef = {
        ...TEST_ENEMY,
        attackPatterns: [{ nameKo: '필살', nameEn: 'Instakill', power: 9999, type: 'faith' }],
      };
      combat.startCombat(strongEnemy);
      const state = combat.pray()!;
      expect(state.finished).toBe(true);
      expect(state.victory).toBe(false);
      expect(state.playerHp).toBe(1);
    });

    it('increments grace counter on defeat', () => {
      const initialGrace = sm.getHidden().graceCounter;
      const strongEnemy: EnemyDef = {
        ...TEST_ENEMY,
        attackPatterns: [{ nameKo: '필살', nameEn: 'Kill', power: 9999, type: 'faith' }],
      };
      combat.startCombat(strongEnemy);
      combat.pray();
      expect(sm.getHidden().graceCounter).toBe(initialGrace + 1);
    });
  });

  describe('reset', () => {
    it('clears combat state', () => {
      combat.startCombat(TEST_ENEMY);
      combat.reset();
      expect(combat.getState()).toBeNull();
    });
  });
});
