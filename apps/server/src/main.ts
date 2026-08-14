import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'colyseus';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { createServer } from 'http';
import { GameRoom } from './multiplayer/rooms/GameRoom';
import { ProfileService } from './profile/profile.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS for frontend API calls
  app.enableCors({
    origin: (origin, callback) => {
      // Allow local development and Vercel production/preview deploys
      if (
        !origin || 
        origin.startsWith('http://localhost') || 
        origin.startsWith('http://127.0.0.1') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.') ||
        origin.endsWith('.vercel.app')
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  const expressInstance = app.getHttpAdapter().getInstance();
  
  // IP Ban Checker Middleware
  expressInstance.use((req: any, res: any, next: any) => {
    // Bypass for public banned endpoints if needed, but blocking everything for banned IPs is safer!
    if (req.url && req.url.includes('/profile/banned')) {
      return next();
    }

    // Bypass IP ban check for admin username
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('ascii'));
        if (decoded && decoded.username === 'admin') {
          return next();
        }
      }
    } catch (e) {}

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip;
    if (ip && ProfileService.bannedIps && ProfileService.bannedIps.has(ip)) {
      console.log(`[Moderation] Request blocked from banned IP address: ${ip}`);
      return res.status(403).json({
        statusCode: 403,
        message: 'Your IP address has been banned by the administrator.',
        error: 'Forbidden'
      });
    }
    next();
  });

  // Create an HTTP server derived from Express inside NestJS adapter
  const server = createServer(expressInstance);

  // Mount Colyseus WebSocket transport layers on the same port
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: server,
    }),
  });

  // Register real-time matchmaking game room
  const { LobbyRoom } = require('./multiplayer/rooms/LobbyRoom');
  GameRoom.profileService = app.get(ProfileService);
  gameServer.define('duel_room', GameRoom).filterBy(['puzzleType']);
  gameServer.define('private_room', GameRoom).filterBy(['privatePin']);
  gameServer.define('lobby_room', LobbyRoom);

  const port = process.env.PORT || 4000;

  // Listen
  await app.init();
  server.listen(port, () => {
    console.log(`🚀 Cognerix NestJS Server listening on http://localhost:${port}`);
    console.log(`🛰️ Colyseus Game Rooms bound on ws://localhost:${port}`);
  });
}

bootstrap();
