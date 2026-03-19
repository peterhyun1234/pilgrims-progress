import Phaser from 'phaser';
import { NPC } from './NPC';
import { Player } from './Player';
import { NPC as NPCConfig } from '../config';

export class InteractionZone {
  private npcs: NPC[];
  private player: Player;

  constructor(_scene: Phaser.Scene, player: Player, npcs: NPC[]) {
    this.player = player;
    this.npcs = npcs;
  }

  update(): void {
    let closestNPC: NPC | null = null;
    let closestDist: number = NPCConfig.INTERACTION_DISTANCE;

    for (const npc of this.npcs) {
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        npc.sprite.x,
        npc.sprite.y,
      );

      if (dist < closestDist) {
        closestDist = dist;
        closestNPC = npc;
      }
    }

    this.player.setNearbyNPC(closestNPC);
  }
}
