export const PuzzleType = {
  SLIDING: 'SLIDING',
  SUDOKU: 'SUDOKU',
  WORD: 'WORD',
  LOGIC: 'LOGIC',
  JIGSAW: 'JIGSAW',
  PHYSICS: 'PHYSICS',
  EIGHT_BALL_QUIZ: 'EIGHT_BALL_QUIZ',
  BLOCK_BLUSTER: 'BLOCK_BLUSTER',
  WORD_SEARCH: 'WORD_SEARCH',
  TOWER_BLOXX: 'TOWER_BLOXX',
  MENTAL_MATH: 'MENTAL_MATH'
} as const;
export type PuzzleType = typeof PuzzleType[keyof typeof PuzzleType];

export const RankName = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  DIAMOND: 'DIAMOND',
  MASTER: 'MASTER',
  GRANDMASTER: 'GRANDMASTER',
  LEGEND: 'LEGEND'
} as const;
export type RankName = typeof RankName[keyof typeof RankName];

export const GameMode = {
  PRACTICE: 'PRACTICE',
  AI_OPPONENT: 'AI_OPPONENT',
  MATCH_1V1: '1V1',
  MATCH_4PLAYER: '4_PLAYER',
  TEAM_BATTLE: 'TEAM_BATTLE',
  RANKED: 'RANKED',
  CASUAL: 'CASUAL',
  TOURNAMENT: 'TOURNAMENT',
  PRIVATE_ROOM: 'PRIVATE_ROOM'
} as const;
export type GameMode = typeof GameMode[keyof typeof GameMode];

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  rank: RankName;
  nameColor?: string;
  status?: string;
  lobbyEntranceAnimation?: string;
  badges: string[]; // List of badge IDs
  inventory: string[]; // List of item IDs (cosmetics)
  statistics: PlayerStats;
  email?: string;
  avatar?: string;
  frame?: string;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalSolveTime: number; // in seconds
  highestStreak: number;
  puzzleSpecificStats: Record<PuzzleType, PuzzleStats>;
}

export interface PuzzleStats {
  played: number;
  solved: number;
  bestTime?: number; // in seconds
  timeSpent?: number; // in seconds
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  rank: RankName;
  score: number;
  puzzleType?: PuzzleType | 'GLOBAL';
  nameColor?: string;
  badges?: string; // Comma-separated string of badges, e.g. "⚡,👑,🎟️"
  avatar?: string;
  frame?: string;
}

export interface Tournament {
  id: string;
  title: string;
  puzzleType: PuzzleType;
  startTime: string; // ISO string
  endTime: string; // ISO string
  rewardCoins: number;
  rewardGems: number;
  playersCount: number;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  rewardType: 'COINS' | 'GEMS' | 'COSMETIC' | 'VIP';
  rewardValue: string; // amount or item ID
  isPremium: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  costGems: number;
  type: 'NAME_COLOR' | 'LOBBY_ANIMATION' | 'BADGE' | 'COSMETIC' | 'BATTLE_PASS' | 'VIP';
  value: string; // config details (e.g. Hex color, CSS animations)
}

// Multiplayer socket events
export const MultiplayerEvent = {
  ROOM_STATE_CHANGE: 'room_state_change',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  PUZZLE_START: 'puzzle_start',
  PUZZLE_PROGRESS: 'puzzle_progress',
  PUZZLE_SOLVED: 'puzzle_solved',
  GAME_OVER: 'game_over',
  CHAT_MESSAGE: 'chat_message',
  VOICE_SIGNAL: 'voice_signal',
} as const;
export type MultiplayerEvent = typeof MultiplayerEvent[keyof typeof MultiplayerEvent];

// Base schema structure for multi-player games
export interface GameRoomState {
  roomId: string;
  mode: GameMode;
  puzzleType: PuzzleType;
  puzzleSeed: string; // Seed to make sure all players solve the identical puzzle
  players: Record<string, RoomPlayer>;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  winnerId?: string;
  startTime?: number;
}

export interface RoomPlayer {
  id: string;
  username: string;
  progress: number; // 0 to 100 percentage solved
  score: number;
  isReady: boolean;
  hasFinished: boolean;
  finishTime?: number;
}
