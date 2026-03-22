import { EventBus } from '../core/EventBus';
import { GameEvent, StatType, EquipSlot } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { StatsManager } from '../core/StatsManager';
import { ItemDef, ITEMS } from './ItemData';
import { ITEMS as ITEMS_CONFIG } from '../config';

export interface InventorySlot {
  itemId: string;
  quantity: number;
}

export interface EquippedItems {
  weapon: string | null;
  armor: string | null;
  accessory: string | null;
}

export class ItemSystem {
  private inventory: InventorySlot[] = [];
  private equipped: EquippedItems = { weapon: null, armor: null, accessory: null };
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
  }

  addItem(itemId: string, quantity = 1): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;

    if (def.stackable) {
      const existing = this.inventory.find(s => s.itemId === itemId);
      if (existing) {
        const canAdd = Math.min(quantity, def.maxStack - existing.quantity);
        if (canAdd <= 0) return false;
        existing.quantity += canAdd;
        this.eventBus.emit(GameEvent.ITEM_ACQUIRED, { itemId, quantity: canAdd });
        return true;
      }
    }

    if (this.inventory.length >= ITEMS_CONFIG.MAX_INVENTORY) return false;

    this.inventory.push({ itemId, quantity: Math.min(quantity, def.maxStack) });
    this.eventBus.emit(GameEvent.ITEM_ACQUIRED, { itemId, quantity });
    return true;
  }

  removeItem(itemId: string, quantity = 1): boolean {
    const idx = this.inventory.findIndex(s => s.itemId === itemId);
    if (idx === -1) return false;

    const slot = this.inventory[idx];
    slot.quantity -= quantity;
    if (slot.quantity <= 0) {
      this.inventory.splice(idx, 1);
    }
    this.eventBus.emit(GameEvent.ITEM_REMOVED, { itemId, quantity });
    return true;
  }

  useItem(itemId: string): boolean {
    const def = ITEMS[itemId];
    if (!def) return false;

    const slot = this.inventory.find(s => s.itemId === itemId);
    if (!slot) return false;

    if (def.type === 'equipment') {
      return this.equipItem(itemId);
    }

    if (def.onUseEffect) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      if (def.onUseEffect.stat && def.onUseEffect.amount) {
        sm.change(def.onUseEffect.stat, def.onUseEffect.amount);
      }
      if (def.onUseEffect.special === 'armor_of_god') {
        sm.change('faith', 15);
        sm.change('courage', 15);
        sm.change('wisdom', 15);
      }
    }

    if (def.type === 'consumable') {
      this.removeItem(itemId, 1);
    }

    this.eventBus.emit(GameEvent.ITEM_USED, { itemId, quantity: 1 });
    return true;
  }

  equipItem(itemId: string): boolean {
    const def = ITEMS[itemId];
    if (!def || def.type !== 'equipment' || !def.equipSlot) return false;

    const slot = def.equipSlot;
    const currentEquipped = this.equipped[slot];

    if (currentEquipped) {
      this.unequipItem(slot);
    }

    this.equipped[slot] = itemId;

    if (def.statBonus) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      Object.entries(def.statBonus).forEach(([stat, bonus]) => {
        if (bonus) sm.change(stat as StatType, bonus);
      });
    }

    this.eventBus.emit(GameEvent.ITEM_EQUIPPED, { itemId, quantity: 1 });
    return true;
  }

  unequipItem(slot: EquipSlot): boolean {
    const itemId = this.equipped[slot];
    if (!itemId) return false;

    const def = ITEMS[itemId];
    if (def?.statBonus) {
      const sm = ServiceLocator.get<StatsManager>(SERVICE_KEYS.STATS_MANAGER);
      Object.entries(def.statBonus).forEach(([stat, bonus]) => {
        if (bonus) sm.change(stat as StatType, -bonus);
      });
    }

    this.equipped[slot] = null;
    return true;
  }

  getInventory(): InventorySlot[] {
    return [...this.inventory];
  }

  getEquipped(): EquippedItems {
    return { ...this.equipped };
  }

  getItemDef(itemId: string): ItemDef | undefined {
    return ITEMS[itemId];
  }

  hasItem(itemId: string): boolean {
    return this.inventory.some(s => s.itemId === itemId);
  }

  getItemCount(itemId: string): number {
    const slot = this.inventory.find(s => s.itemId === itemId);
    return slot?.quantity ?? 0;
  }

  isEquipped(itemId: string): boolean {
    return Object.values(this.equipped).includes(itemId);
  }

  getSerializable(): { inventory: InventorySlot[]; equipped: EquippedItems } {
    return {
      inventory: [...this.inventory],
      equipped: { ...this.equipped },
    };
  }

  loadFromSave(data: { inventory: InventorySlot[]; equipped: EquippedItems }): void {
    this.inventory = [...data.inventory];
    this.equipped = { ...data.equipped };
  }

  reset(): void {
    this.inventory = [];
    this.equipped = { weapon: null, armor: null, accessory: null };
  }
}
