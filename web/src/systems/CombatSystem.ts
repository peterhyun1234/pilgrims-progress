import { EventBus } from '../core/EventBus';
import { GameEvent } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { COMBAT } from '../config';
import { SkillDef, SKILLS, EnemyDef } from './SkillData';

export interface CombatState {
  playerHp: number;
  playerMaxHp: number;
  enemyHp: number;
  enemyMaxHp: number;
  enemy: EnemyDef;
  turn: number;
  isPlayerTurn: boolean;
  defending: boolean;
  defenseMultiplier: number;
  availableSkills: SkillDef[];
  log: CombatLogEntry[];
  finished: boolean;
  victory: boolean;
}

export interface CombatLogEntry {
  textKo: string;
  textEn: string;
  type: 'player' | 'enemy' | 'system' | 'heal';
}

export class CombatSystem {
  private eventBus: EventBus;
  private state: CombatState | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  startCombat(enemy: EnemyDef): CombatState {
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const maxHp = COMBAT.BASE_HP + sm.get('faith');

    const availableSkills = Object.values(SKILLS).filter(skill => {
      return sm.get(skill.requiredStat) >= skill.requiredValue;
    });

    this.state = {
      playerHp: maxHp,
      playerMaxHp: maxHp,
      enemyHp: enemy.hp,
      enemyMaxHp: enemy.hp,
      enemy,
      turn: 1,
      isPlayerTurn: true,
      defending: false,
      defenseMultiplier: 1,
      availableSkills,
      log: [],
      finished: false,
      victory: false,
    };

    this.addLog(
      `${enemy.nameKo}이(가) 나타났다!`,
      `${enemy.nameEn} appeared!`,
      'system',
    );

    this.eventBus.emit(GameEvent.BATTLE_START, {
      enemyId: enemy.id,
      enemyName: enemy.nameEn,
      enemyNameKo: enemy.nameKo,
      isBoss: enemy.isBoss,
    });

    return this.state;
  }

  pray(): CombatState | null {
    if (!this.state || !this.state.isPlayerTurn || this.state.finished) return null;

    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    const faithBonus = Math.floor(sm.get('faith') / 10);
    const damage = COMBAT.PRAY_BASE_POWER + faithBonus;

    const weaknessMultiplier = this.state.enemy.weakness === 'faith' ? 1.5 : 1;
    const finalDamage = Math.floor(damage * weaknessMultiplier);

    this.state.enemyHp = Math.max(0, this.state.enemyHp - finalDamage);

    this.addLog(
      `기도했다! ${finalDamage} 데미지!`,
      `Prayed! ${finalDamage} damage!`,
      'player',
    );

    this.eventBus.emit(GameEvent.ENEMY_DAMAGED, finalDamage);
    this.state.defending = false;
    this.checkVictory();
    if (!this.state.finished) this.enemyTurn();

    return this.state;
  }

  defend(): CombatState | null {
    if (!this.state || !this.state.isPlayerTurn || this.state.finished) return null;

    this.state.defending = true;
    this.state.defenseMultiplier = COMBAT.DEFEND_REDUCTION;

    this.addLog('방어 자세를 취했다!', 'Took a defensive stance!', 'player');
    this.enemyTurn();

    return this.state;
  }

  useSkill(skillId: string): CombatState | null {
    if (!this.state || !this.state.isPlayerTurn || this.state.finished) return null;

    const skill = SKILLS[skillId];
    if (!skill) return null;

    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    if (sm.get(skill.requiredStat) < skill.requiredValue) return null;

    sm.change(skill.costStat, -skill.cost);

    const weaknessMultiplier = this.state.enemy.weakness === skill.requiredStat ? 1.5 : 1;

    switch (skill.type) {
      case 'attack':
      case 'special': {
        const damage = Math.floor(skill.power * weaknessMultiplier);
        this.state.enemyHp = Math.max(0, this.state.enemyHp - damage);
        this.addLog(
          `${skill.nameKo} 사용! ${damage} 데미지!`,
          `Used ${skill.nameEn}! ${damage} damage!`,
          'player',
        );
        this.eventBus.emit(GameEvent.ENEMY_DAMAGED, damage);
        break;
      }
      case 'defend': {
        this.state.defending = true;
        this.state.defenseMultiplier = Math.max(0.2, COMBAT.DEFEND_REDUCTION - 0.1);
        this.addLog(
          `${skill.nameKo} 사용! 방어력 강화!`,
          `Used ${skill.nameEn}! Defense boosted!`,
          'player',
        );
        break;
      }
      case 'heal': {
        const heal = skill.power;
        this.state.playerHp = Math.min(this.state.playerMaxHp, this.state.playerHp + heal);
        this.addLog(
          `${skill.nameKo} 사용! ${heal} 회복!`,
          `Used ${skill.nameEn}! Healed ${heal}!`,
          'heal',
        );
        break;
      }
    }

    this.eventBus.emit(GameEvent.SKILL_USED, { skillId });
    this.checkVictory();
    if (!this.state.finished) this.enemyTurn();

    return this.state;
  }

  private enemyTurn(): void {
    if (!this.state || this.state.finished) return;

    this.state.isPlayerTurn = false;
    const patterns = this.state.enemy.attackPatterns;
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];

    let damage = pattern.power - (this.state.defending ? Math.floor(pattern.power * this.state.defenseMultiplier) : 0);
    damage = Math.max(1, damage);

    this.state.playerHp = Math.max(0, this.state.playerHp - damage);

    this.addLog(
      `${this.state.enemy.nameKo}의 ${pattern.nameKo}! ${damage} 데미지!`,
      `${this.state.enemy.nameEn}'s ${pattern.nameEn}! ${damage} damage!`,
      'enemy',
    );

    this.eventBus.emit(GameEvent.PLAYER_DAMAGED, damage);

    this.state.defending = false;
    this.state.defenseMultiplier = 1;
    this.state.turn++;
    this.state.isPlayerTurn = true;

    this.checkDefeat();
  }

  private checkVictory(): void {
    if (!this.state) return;
    if (this.state.enemyHp <= 0) {
      this.state.finished = true;
      this.state.victory = true;
      this.addLog('승리했다!', 'Victory!', 'system');
    }
  }

  private checkDefeat(): void {
    if (!this.state) return;
    if (this.state.playerHp <= 0) {
      this.state.finished = true;
      this.state.victory = false;
      this.state.playerHp = 1;

      this.addLog(
        '쓰러졌지만... 은혜로 다시 일어선다.',
        'Fallen... but grace lifts you up again.',
        'system',
      );

      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      sm.incrementGrace();
    }
  }

  private addLog(textKo: string, textEn: string, type: CombatLogEntry['type']): void {
    if (!this.state) return;
    this.state.log.push({ textKo, textEn, type });
  }

  getState(): CombatState | null {
    return this.state;
  }

  reset(): void {
    this.state = null;
  }
}
