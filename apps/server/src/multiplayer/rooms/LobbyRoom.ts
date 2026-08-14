import { Room, Client } from 'colyseus';

export class LobbyRoom extends Room {
  public static activeLobbies = new Set<LobbyRoom>();

  onCreate(options: any) {
    LobbyRoom.activeLobbies.add(this);
    console.log(`[LobbyRoom] Room created: ${this.roomId}`);
  }

  onJoin(client: Client, options: any) {
    console.log(`[LobbyRoom] Client joined: ${client.sessionId}`);
    const { ProfileService } = require('../../profile/profile.service');
    const clientIp = (client.ref as any)?.headers?.['x-forwarded-for'] || (client.ref as any)?.socket?.remoteAddress || (client as any).ip;
    if (clientIp && ProfileService.bannedIps && ProfileService.bannedIps.has(clientIp)) {
      console.warn(`[LobbyRoom] Connection rejected: Banned IP ${clientIp} tried to join lobby`);
      throw new Error("Your IP address has been banned.");
    }
    const { GameRoom } = require('./GameRoom');
    client.send("queue_update", GameRoom.getQueueCounts());
  }

  onLeave(client: Client, consented: boolean) {
    console.log(`[LobbyRoom] Client left: ${client.sessionId}`);
  }

  onDispose() {
    console.log(`[LobbyRoom] Room disposed: ${this.roomId}`);
    LobbyRoom.activeLobbies.delete(this);
  }

  static broadcastToAll(counts: any) {
    LobbyRoom.activeLobbies.forEach(lobby => {
      try {
        lobby.broadcast("queue_update", counts);
      } catch (e) {
        console.error("[LobbyRoom] Failed to broadcast queue update:", e);
      }
    });
  }
}
