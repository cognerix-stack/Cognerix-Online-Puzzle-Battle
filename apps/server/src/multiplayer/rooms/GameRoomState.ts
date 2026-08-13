import { Schema, type, MapSchema } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type("string") id: string = "";
  @type("string") username: string = "";
  @type("number") progress: number = 0; // 0 to 100 percentage solved
  @type("number") score: number = 0;
  @type("boolean") isReady: boolean = false;
  @type("boolean") hasFinished: boolean = false;
  @type("boolean") hasStarted: boolean = false;
  @type("number") finishTime: number = 0;
  @type("number") correctAnswers: number = 0;
  @type("string") nameColor: string = "";
  @type("string") badges: string = "";
  @type("number") roundWins: number = 0;
  @type("string") rank: string = "BRONZE";
  @type("string") avatar: string = "👤";
  @type("string") avatarFrame: string = "none";
}

export class RoomState extends Schema {
  @type("string") roomId: string = "";
  @type("string") mode: string = ""; // "1V1", "4_PLAYER", etc.
  @type("string") puzzleType: string = ""; // "SLIDING", "WORD", "EIGHT_BALL_QUIZ"
  @type("string") puzzleSeed: string = ""; // Seed generated for identical puzzle generation
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type("string") status: string = "WAITING"; // "WAITING", "PLAYING", "FINISHED"
  @type("string") winnerId: string = "";
  @type("number") startTime: number = 0;
  @type("number") currentRound: number = 1;
  @type("number") triviaPauseTimerLeft: number = -1;
  @type("string") triviaPauseFinisherId: string = "";
}
