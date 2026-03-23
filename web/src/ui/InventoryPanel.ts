import { GAME_WIDTH, GAME_HEIGHT, COLORS, ITEMS as ITEMS_CONFIG } from '../config';
import { EventBus } from '../core/EventBus';
import { GameEvent, GameState } from '../core/GameEvents';
import { ServiceLocator, SERVICE_KEYS } from '../core/ServiceLocator';
import { GameManager } from '../core/GameManager';
import { DesignSystem } from './DesignSystem';
import { ItemSystem, InventorySlot } from '../systems/ItemSystem';
import { ItemDef, ITEMS } from '../systems/ItemData';

export class InventoryPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private eventBus: EventBus;
  private itemSystem: ItemSystem;
  private isOpen = false;

  private overlay!: Phaser.GameObjects.Rectangle;
  private itemSlots: Phaser.GameObjects.Container[] = [];
  private detailPanel: Phaser.GameObjects.Container | null = null;

  private static readonly PANEL_W = 380;
  private static readonly PANEL_H = 220;
  private static readonly SLOT_SIZE = 32;
  private static readonly SLOT_GAP = 4;

  constructor(scene: Phaser.Scene, itemSystem: ItemSystem) {
    this.scene = scene;
    this.itemSystem = itemSystem;
    this.eventBus = EventBus.getInstance();
    this.container = scene.add.container(0, 0).setDepth(600).setScrollFactor(0).setVisible(false);

    this.buildUI();
    this.setupEvents();
  }

  private buildUI(): void {
    this.overlay = this.scene.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6,
    );
    this.container.add(this.overlay);

    const px = (GAME_WIDTH - InventoryPanel.PANEL_W) / 2;
    const py = (GAME_HEIGHT - InventoryPanel.PANEL_H) / 2;

    const bg = DesignSystem.createPanel(this.scene, px, py, InventoryPanel.PANEL_W, InventoryPanel.PANEL_H);
    this.container.add(bg);

    const ko = this.getKo();
    const title = this.scene.add.text(
      GAME_WIDTH / 2, py + 14,
      ko ? '📦 소지품' : '📦 Inventory',
      DesignSystem.goldTextStyle(DesignSystem.FONT_SIZE.LG),
    ).setOrigin(0.5);
    this.container.add(title);

    const line = this.scene.add.graphics();
    line.lineStyle(0.5, COLORS.UI.GOLD, 0.3);
    line.lineBetween(px + 12, py + 28, px + InventoryPanel.PANEL_W - 12, py + 28);
    this.container.add(line);

    const equippedTitle = this.scene.add.text(
      px + InventoryPanel.PANEL_W - 90, py + 36,
      ko ? '장착' : 'Equipped',
      DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
    ).setOrigin(0.5, 0);
    this.container.add(equippedTitle);
  }

  private onInventoryOpen = () => this.open();
  private onInventoryClose = () => this.close();

  private setupEvents(): void {
    this.eventBus.on(GameEvent.INVENTORY_OPEN, this.onInventoryOpen);
    this.eventBus.on(GameEvent.INVENTORY_CLOSE, this.onInventoryClose);
  }

  open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
    gm.changeState(GameState.INVENTORY);

    this.refreshItems();
    this.container.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 200, ease: 'Sine.easeOut' });
  }

  close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.scene.tweens.add({
      targets: this.container, alpha: 0, duration: 150,
      onComplete: () => {
        this.container.setVisible(false);
        const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
        gm.changeState(GameState.GAME);
      },
    });
  }

  toggle(): void {
    if (this.isOpen) this.close();
    else this.open();
  }

  private refreshItems(): void {
    this.itemSlots.forEach(s => s.destroy(true));
    this.itemSlots = [];
    this.detailPanel?.destroy(true);
    this.detailPanel = null;

    const inventory = this.itemSystem.getInventory();
    const equipped = this.itemSystem.getEquipped();
    const px = (GAME_WIDTH - InventoryPanel.PANEL_W) / 2 + 12;
    const py = (GAME_HEIGHT - InventoryPanel.PANEL_H) / 2 + 36;
    const cols = ITEMS_CONFIG.GRID_COLS;
    const size = InventoryPanel.SLOT_SIZE;
    const gap = InventoryPanel.SLOT_GAP;

    inventory.forEach((slot, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const sx = px + col * (size + gap);
      const sy = py + row * (size + gap);

      const slotContainer = this.createItemSlot(sx, sy, slot);
      this.itemSlots.push(slotContainer);
      this.container.add(slotContainer);
    });

    const equipX = (GAME_WIDTH + InventoryPanel.PANEL_W) / 2 - 100;
    const equipY = py + 16;
    const slots: Array<{ key: keyof typeof equipped; label: string }> = [
      { key: 'weapon', label: '⚔' },
      { key: 'armor', label: '🛡' },
      { key: 'accessory', label: '💍' },
    ];

    slots.forEach((s, i) => {
      const ey = equipY + i * (size + gap + 2);
      const equipSlot = this.createEquipSlot(equipX, ey, s.label, equipped[s.key]);
      this.container.add(equipSlot);
      this.itemSlots.push(equipSlot);
    });
  }

  private createItemSlot(x: number, y: number, slot: InventorySlot): Phaser.GameObjects.Container {
    const def = ITEMS[slot.itemId];
    const size = InventoryPanel.SLOT_SIZE;
    const c = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    const rarityColor = DesignSystem.ITEM_RARITY_COLORS[def?.rarity ?? 'common'];
    bg.fillStyle(0x1e1830, 0.9);
    bg.fillRoundedRect(0, 0, size, size, 3);
    bg.lineStyle(1, rarityColor, 0.5);
    bg.strokeRoundedRect(0, 0, size, size, 3);

    const icon = this.scene.add.text(size / 2, size / 2 - 2, def?.icon ?? '?', {
      fontSize: '14px',
    }).setOrigin(0.5);

    c.add([bg, icon]);

    if (slot.quantity > 1) {
      const qty = this.scene.add.text(size - 2, size - 2, `${slot.quantity}`, {
        fontSize: '7px', color: '#ffffff',
        fontFamily: DesignSystem.getFontFamily(),
        shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 1, stroke: true, fill: true },
      }).setOrigin(1, 1);
      c.add(qty);
    }

    const hit = this.scene.add.rectangle(size / 2, size / 2, size, size, 0, 0)
      .setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      this.showItemDetail(def, x, y);
    });
    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x2a2040, 0.95);
      bg.fillRoundedRect(0, 0, size, size, 3);
      bg.lineStyle(1.5, COLORS.UI.GOLD, 0.8);
      bg.strokeRoundedRect(0, 0, size, size, 3);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x1e1830, 0.9);
      bg.fillRoundedRect(0, 0, size, size, 3);
      bg.lineStyle(1, rarityColor, 0.5);
      bg.strokeRoundedRect(0, 0, size, size, 3);
    });
    c.add(hit);

    return c;
  }

  private createEquipSlot(x: number, y: number, label: string, itemId: string | null): Phaser.GameObjects.Container {
    const size = InventoryPanel.SLOT_SIZE;
    const c = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1428, 0.8);
    bg.fillRoundedRect(0, 0, size, size, 3);
    bg.lineStyle(1, COLORS.UI.GOLD, 0.3);
    bg.strokeRoundedRect(0, 0, size, size, 3);

    const displayIcon = itemId ? (ITEMS[itemId]?.icon ?? label) : label;
    const iconText = this.scene.add.text(size / 2, size / 2, displayIcon, {
      fontSize: itemId ? '14px' : '10px',
      color: itemId ? '#ffffff' : '#555555',
    }).setOrigin(0.5);

    c.add([bg, iconText]);
    return c;
  }

  private showItemDetail(def: ItemDef | undefined, _sx: number, _sy: number): void {
    if (!def) return;
    this.detailPanel?.destroy(true);

    const ko = this.getKo();
    const px = (GAME_WIDTH - InventoryPanel.PANEL_W) / 2;
    const py = (GAME_HEIGHT + InventoryPanel.PANEL_H) / 2 - 55;
    const w = InventoryPanel.PANEL_W - 24;

    this.detailPanel = this.scene.add.container(px + 12, py);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x12101e, 0.95);
    bg.fillRoundedRect(0, 0, w, 46, 4);
    bg.lineStyle(1, DesignSystem.ITEM_RARITY_COLORS[def.rarity], 0.6);
    bg.strokeRoundedRect(0, 0, w, 46, 4);

    const name = this.scene.add.text(8, 6, `${def.icon} ${ko ? def.nameKo : def.nameEn}`,
      DesignSystem.textStyle(DesignSystem.FONT_SIZE.SM, DesignSystem.hex(DesignSystem.ITEM_RARITY_COLORS[def.rarity])),
    );

    const desc = this.scene.add.text(8, 22, ko ? def.descKo : def.descEn, {
      ...DesignSystem.mutedTextStyle(DesignSystem.FONT_SIZE.XS),
      wordWrap: { width: w - 100 },
    });

    this.detailPanel.add([bg, name, desc]);

    if (def.type === 'consumable' || def.type === 'scripture') {
      const useBtn = DesignSystem.createButton(
        this.scene, w - 40, 23, 60, 20,
        ko ? '사용' : 'Use',
        () => {
          this.itemSystem.useItem(def.id);
          this.refreshItems();
        },
        { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: 0x2a4a2a, hoverColor: 0x3a6a3a },
      );
      this.detailPanel.add(useBtn);
    } else if (def.type === 'equipment') {
      const isEquipped = this.itemSystem.isEquipped(def.id);
      const equipBtn = DesignSystem.createButton(
        this.scene, w - 40, 23, 60, 20,
        isEquipped ? (ko ? '해제' : 'Remove') : (ko ? '장착' : 'Equip'),
        () => {
          if (isEquipped && def.equipSlot) {
            this.itemSystem.unequipItem(def.equipSlot);
          } else {
            this.itemSystem.equipItem(def.id);
          }
          this.refreshItems();
        },
        { fontSize: DesignSystem.FONT_SIZE.XS, bgColor: isEquipped ? 0x3a1a1a : 0x2a4a2a },
      );
      this.detailPanel.add(equipBtn);
    }

    this.container.add(this.detailPanel);
  }

  private getKo(): boolean {
    try {
      const gm = ServiceLocator.get<GameManager>(SERVICE_KEYS.GAME_MANAGER);
      return gm.language === 'ko';
    } catch {
      return true;
    }
  }

  get visible(): boolean {
    return this.isOpen;
  }

  destroy(): void {
    this.eventBus.off(GameEvent.INVENTORY_OPEN, this.onInventoryOpen);
    this.eventBus.off(GameEvent.INVENTORY_CLOSE, this.onInventoryClose);
    this.container.destroy(true);
  }
}
