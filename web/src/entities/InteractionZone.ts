import { NPC_CONFIG } from '../config';
import { Player } from './Player';
import { NPC } from './NPC';

export class InteractionZone {
  private player: Player;
  private npcs: NPC[];

  constructor(_scene: Phaser.Scene, player: Player, npcs: NPC[]) {
    this.player = player;
    this.npcs = npcs;
  }

  setNPCs(npcs: NPC[]): void {
    this.npcs = npcs;
  }

  update(): void {
    let closestNPC: NPC | null = null;
    let closestDist: number = Infinity;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x, this.player.sprite.y,
        npc.sprite.x, npc.sprite.y,
      );

      if (dist < NPC_CONFIG.INTERACTION_DISTANCE && dist < closestDist) {
        closestDist = dist;
        closestNPC = npc;
      }
    }

    if (closestNPC !== this.player.nearbyNPC) {
      this.player.nearbyNPC?.hidePrompt();
      this.player.nearbyNPC = closestNPC;
      closestNPC?.showPrompt();
    }
  }
}
