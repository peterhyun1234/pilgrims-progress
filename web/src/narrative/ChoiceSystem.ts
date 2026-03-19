import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';

export interface ChoiceConfig {
  text: string;
  index: number;
  requiredStat?: { stat: string; value: number };
  isHidden?: boolean;
}

export class ChoiceSystem {
  filterChoices(choices: ChoiceConfig[]): ChoiceConfig[] {
    const statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    return choices.map((choice) => {
      if (choice.requiredStat) {
        const currentValue = statsManager.get(choice.requiredStat.stat as 'faith' | 'courage' | 'wisdom' | 'burden');
        if (currentValue < choice.requiredStat.value) {
          return { ...choice, isHidden: true };
        }
      }
      return choice;
    });
  }

  meetsRequirement(stat: string, required: number): boolean {
    const statsManager = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
    return statsManager.get(stat as 'faith' | 'courage' | 'wisdom' | 'burden') >= required;
  }
}
