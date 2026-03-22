import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { StatType, ChoiceWeight } from '../core/GameEvents';
import { InkChoice } from './InkService';

export interface FilteredChoice extends InkChoice {
  isLocked: boolean;
  lockReason?: string;
  weight: ChoiceWeight;
}

export class ChoiceSystem {
  static filterChoices(choices: InkChoice[]): FilteredChoice[] {
    const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);

    return choices.map(choice => {
      let isLocked = false;
      let lockReason: string | undefined;
      const weight: ChoiceWeight = choice.isHidden ? 'heavy' : 'light';

      if (choice.requiredStat && choice.requiredValue !== undefined) {
        const current = sm.get(choice.requiredStat as StatType);
        if (current < choice.requiredValue) {
          isLocked = true;
          lockReason = `${choice.requiredStat} ${choice.requiredValue} required`;
        }
      }

      return { ...choice, isLocked, lockReason, weight };
    });
  }
}
