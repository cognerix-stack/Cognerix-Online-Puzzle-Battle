import { Client, Room } from 'colyseus.js';
import { PuzzleType } from '@puzzle-verse/shared';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Connect to Colyseus server (runs on NestJS port 4000 in dev)
const isLocal = !isNative && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1' || 
  window.location.hostname.startsWith('192.168.') || 
  window.location.hostname.startsWith('10.') ||
  !!import.meta.env.DEV
);

const customBackendUrl = import.meta.env.VITE_BACKEND_URL || '';
const PRODUCTION_URL = 'https://cognerix-online-puzzle-battle-production.up.railway.app';

export const BACKEND_HTTP_URL = customBackendUrl
  ? customBackendUrl
  : (isNative
      ? PRODUCTION_URL
      : (isLocal
          ? `http://${window.location.hostname}:4000`
          : `${window.location.protocol}//${window.location.host}`));

export const BACKEND_WS_URL = customBackendUrl
  ? customBackendUrl.replace(/^http/, 'ws')
  : (isNative
      ? PRODUCTION_URL.replace(/^http/, 'ws')
      : (isLocal
          ? `ws://${window.location.hostname}:4000`
          : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`));

export const colyseusClient = new Client(BACKEND_WS_URL);

export interface DuelRoomState {
  roomId: string;
  mode: string;
  puzzleType: string;
  puzzleSeed: string;
  status: string;
  winnerId: string;
  startTime: number;
}

export class MultiplayerService {
  /**
   * Joins or creates a real-time matchmaking puzzle duel room.
   */
  static async joinDuel(
    userId: string,
    username: string,
    puzzleType: PuzzleType,
    nameColor?: string,
    badges?: string[],
    rank?: string,
    avatar?: string,
    frame?: string
  ): Promise<Room<any>> {
    try {
      console.log(`Connecting to matchmaking queue for ${puzzleType}...`);
      const room = await colyseusClient.joinOrCreate('duel_room', {
        userId,
        username,
        mode: '1V1',
        puzzleType: puzzleType.toString(),
        nameColor,
        badges: badges ? badges.join(',') : '',
        rank,
        avatar,
        frame
      });
      console.log(`Successfully connected to game room: ${room.roomId}`);
      return room;
    } catch (e) {
      console.error('Failed to join matchmaking room:', e);
      throw e;
    }
  }

  /**
   * Joins or creates a private duel room with a 4-digit PIN.
   */
  static async joinPrivateRoom(
    userId: string,
    username: string,
    puzzleType: PuzzleType | undefined,
    privatePin: string,
    isCreate: boolean,
    nameColor?: string,
    badges?: string[],
    rank?: string,
    avatar?: string,
    frame?: string
  ): Promise<Room<any>> {
    try {
      if (isCreate) {
        console.log(`Creating private room with PIN ${privatePin} for ${puzzleType}...`);
        const room = await colyseusClient.create('private_room', {
          userId,
          username,
          mode: 'PRIVATE',
          puzzleType: puzzleType ? puzzleType.toString() : undefined,
          privatePin: privatePin,
          nameColor,
          badges: badges ? badges.join(',') : '',
          rank,
          avatar,
          frame
        });
        console.log(`Successfully created private room: ${room.roomId}`);
        return room;
      } else {
        console.log(`Joining private room with PIN ${privatePin}...`);
        const room = await colyseusClient.join('private_room', {
          userId,
          username,
          mode: 'PRIVATE',
          privatePin: privatePin,
          nameColor,
          badges: badges ? badges.join(',') : '',
          rank,
          avatar,
          frame
        });
        console.log(`Successfully joined private room: ${room.roomId}`);
        return room;
      }
    } catch (e) {
      console.error('Failed to connect to private room:', e);
      throw e;
    }
  }

  /**
   * Sends the current solve progress percentage (0 - 100).
   */
  static sendProgress(room: Room<any>, progress: number, correctAnswers?: number) {
    if (room) {
      if (correctAnswers !== undefined) {
        room.send('puzzle_progress', { progress, correctAnswers });
      } else {
        room.send('puzzle_progress', { progress });
      }
    }
  }

  /**
   * Sends a Wind Gust attack in 1v1 Arena.
   */
  static sendWindGust(room: Room<any>, attackerName: string) {
    if (room) {
      room.send('wind_gust', { attackerName });
    }
  }

  /**
   * Sends puzzle solved signal once completed.
   */
  static sendSolved(room: Room<any>, score: number, correctAnswers?: number) {
    if (room) {
      if (correctAnswers !== undefined) {
        room.send('puzzle_solved', { score, correctAnswers });
      } else {
        room.send('puzzle_solved', { score });
      }
    }
  }

  /**
   * Sends an emoji reaction during the match.
   */
  static sendEmoji(room: Room<any>, emoji: string) {
    if (room) {
      room.send('send_emoji', { emoji });
    }
  }

  /**
   * Sends a chat message during the match/lobby.
   */
  static sendChatMessage(room: Room<any>, text: string) {
    if (room) {
      room.send('chat_send', { text });
    }
  }
}
