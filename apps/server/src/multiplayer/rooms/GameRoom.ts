import { Room, Client } from 'colyseus';
import { RoomState, PlayerState } from './GameRoomState';
import { ProfileService } from '../../profile/profile.service';
import { LobbyRoom } from './LobbyRoom';

export interface QueuedPlayer {
  userId: string;
  username: string;
  sessionId: string;
  joinedAt: number;
}

export class MatchmakingQueue {
  private static queues = new Map<string, Map<string, QueuedPlayer>>();

  static getQueue(puzzleType: string): Map<string, QueuedPlayer> {
    if (!MatchmakingQueue.queues.has(puzzleType)) {
      MatchmakingQueue.queues.set(puzzleType, new Map());
    }
    return MatchmakingQueue.queues.get(puzzleType)!;
  }

  static add(puzzleType: string, player: QueuedPlayer) {
    const q = MatchmakingQueue.getQueue(puzzleType);
    q.set(player.userId, player);
    console.log(`[Queue] Added ${player.username} (${player.userId}) to ${puzzleType} queue. Size: ${q.size}`);
  }

  static remove(puzzleType: string, userId: string) {
    const q = MatchmakingQueue.getQueue(puzzleType);
    if (q.delete(userId)) {
      console.log(`[Queue] Removed ${userId} from ${puzzleType} queue. Size: ${q.size}`);
    }
  }

  static clearUser(userId: string) {
    MatchmakingQueue.queues.forEach((q, puzzleType) => {
      if (q.delete(userId)) {
        console.log(`[Queue] Cleaned up ${userId} from ${puzzleType} queue on disconnect. Size: ${q.size}`);
      }
    });
  }

  static getCounts() {
    const counts: Record<string, number> = {
      SLIDING: 0,
      JIGSAW: 0,
      SUDOKU: 0,
      WORD: 0,
      LOGIC: 0,
      PHYSICS: 0,
      EIGHT_BALL_QUIZ: 0,
      BLOCK_BLUSTER: 0,
      WORD_SEARCH: 0,
      TOWER_BLOXX: 0,
      MENTAL_MATH: 0
    };
    MatchmakingQueue.queues.forEach((q, puzzleType) => {
      counts[puzzleType] = q.size;
    });
    return counts;
  }
}

export class GameRoom extends Room<RoomState> {
  static profileService: any;
  private lobbyTimer: any = null;
  private playersSnapshot: any[] = [];
  private hasRecordedHistory: boolean = false;

  static getQueueCounts() {
    return MatchmakingQueue.getCounts();
  }

  static broadcastQueueUpdate() {
    const counts = GameRoom.getQueueCounts();
    LobbyRoom.broadcastToAll(counts);
  }

  onCreate(options: any) {
    this.setState(new RoomState());
    console.log(`[GameRoom] Room created. ID: ${this.roomId}, Mode: ${options.mode}, PuzzleType: ${options.puzzleType}, PrivatePin: ${options.privatePin}`);
    
    // Set up basic attributes
    this.state.roomId = this.roomId;
    this.state.mode = options.mode || "1V1";
    this.state.puzzleType = options.puzzleType || "SLIDING";
    this.state.puzzleSeed = Math.random().toString(36).substring(2, 10).toUpperCase();
    this.state.status = "WAITING";

    this.setMetadata({
      puzzleType: options.puzzleType || "SLIDING",
      privatePin: options.privatePin || undefined
    });

    // Max players depend on mode
    this.maxClients = options.mode === "4_PLAYER" ? 4 : 2;

    // Listen for wind gust attack in 1v1 / multiplayer matches
    this.onMessage("wind_gust", (client, data: { attackerName?: string }) => {
      this.clients.forEach((c) => {
        if (c.sessionId !== client.sessionId) {
          c.send("wind_gust_received", { 
            attackerName: data?.attackerName || "Opponent"
          });
        }
      });
    });

    // Listen for player match start signal in 1v1 Mental Math
    this.onMessage("player_ready_match", (client, data: any) => {
      this.clients.forEach((c) => {
        if (c.sessionId !== client.sessionId) {
          c.send("opponent_ready_match", {
            username: data?.username || "Opponent",
            ...data
          });
        }
      });
    });

    // Listen for digit selection proposals in Mental Math Setup
    this.onMessage("propose_digits", (client, data: { digits: number; proposerName?: string }) => {
      this.clients.forEach((c) => {
        if (c.sessionId !== client.sessionId) {
          c.send("digits_proposed", {
            digits: data.digits,
            proposerName: data.proposerName || "Opponent"
          });
        }
      });
    });

    this.onMessage("respond_digits", (client, data: { accepted: boolean; digits: number }) => {
      this.clients.forEach((c) => {
        c.send("digits_responded", {
          accepted: data.accepted,
          digits: data.digits
        });
      });
    });



    // Listen for progress updates from players and relay to opponents
    this.onMessage("puzzle_progress", (client, data: { progress: number; correctAnswers?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.status === "PLAYING") {
        player.progress = Math.min(100, Math.max(0, data.progress));
        if (data.correctAnswers !== undefined) {
          player.correctAnswers = data.correctAnswers;
        }

        // Relay progress to all OTHER clients so they can update opponent bar
        this.clients.forEach((c) => {
          if (c.sessionId !== client.sessionId) {
            c.send("opponent_progress", { 
              progress: player.progress,
              correctAnswers: player.correctAnswers
            });
          }
        });
      }
    });

    // Listen for finished/solved puzzle signal
    this.onMessage("puzzle_solved", (client, data: { score: number; correctAnswers?: number; answer?: number; isCorrect?: boolean; distance?: number; timeTaken?: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.status === "PLAYING" && !player.hasFinished) {
        player.hasFinished = true;
        player.finishTime = Date.now();
        player.score = data.score;
        player.correctAnswers = data.correctAnswers || 0;
        player.progress = 100;

        (player as any).mathAnswer = data.answer;
        (player as any).mathIsCorrect = data.isCorrect;
        (player as any).mathDistance = data.distance;
        (player as any).mathTimeTaken = data.timeTaken;

        let shouldEnd = false;
        let winnerSessionId = "";

        if (this.state.puzzleType === "EIGHT_BALL_QUIZ" || this.state.puzzleType === "MENTAL_MATH") {
          // For Trivia/Quiz and Mental Math, wait for all players to finish
          const allFinished = Array.from(this.state.players.values()).every(p => p.hasFinished);
          if (allFinished) {
            if ((this as any).triviaInterval) {
              (this as any).triviaInterval.clear();
              (this as any).triviaInterval = null;
            }
            this.state.triviaPauseTimerLeft = -1;
            shouldEnd = true;
            if (this.state.puzzleType === "MENTAL_MATH") {
              const playerArray = Array.from(this.state.players.entries()).map(([sid, p]) => ({
                sid,
                p,
                isCorrect: (p as any).mathIsCorrect ?? false,
                timeTaken: (p as any).mathTimeTaken ?? 9999,
                distance: (p as any).mathDistance ?? 999999
              }));

              // Check if ALL players answered incorrectly → both defeated
              const anyCorrect = playerArray.some(e => e.isCorrect);
              if (!anyCorrect) {
                // Both wrong — nobody wins
                this.state.status = "FINISHED";
                this.recordGameHistoryEntry("", "No Winner");
                this.broadcast("game_over", {
                  winnerId: "",
                  winnerName: "",
                  bothDefeated: true,
                  scores: Array.from(this.state.players.values()).map(p => ({
                    userId: p.id,
                    score: p.score,
                    correctAnswers: p.correctAnswers,
                    submittedAnswer: (p as any).mathAnswer,
                    isCorrect: (p as any).mathIsCorrect,
                    distance: (p as any).mathDistance,
                    timeTaken: (p as any).mathTimeTaken
                  }))
                });
                return;
              }

              playerArray.sort((a, b) => {
                if (a.isCorrect && !b.isCorrect) return -1;
                if (!a.isCorrect && b.isCorrect) return 1;
                if (a.isCorrect && b.isCorrect) {
                  return a.timeTaken - b.timeTaken;
                }
                return a.distance - b.distance;
              });
              winnerSessionId = playerArray[0]?.sid || client.sessionId;
            } else {
              // Find player with highest score
              let maxScore = -1;
              this.state.players.forEach((p, sid) => {
                if (p.score > maxScore) {
                  maxScore = p.score;
                  winnerSessionId = sid;
                }
              });
            }
          } else if (this.state.puzzleType === "EIGHT_BALL_QUIZ") {
            // Find the opponent
            let opponent: PlayerState | undefined;
            this.state.players.forEach((p, sid) => {
              if (sid !== client.sessionId) {
                opponent = p;
              }
            });

            if (opponent && !opponent.hasStarted) {
              const targetOpponent = opponent;
              console.log(`[GameRoom] Trivia: Player ${player.username} finished before opponent ${targetOpponent.username} started. Starting 15s pause.`);
              this.state.triviaPauseTimerLeft = 15;
              this.state.triviaPauseFinisherId = player.id;

              const interval = this.clock.setInterval(() => {
                if (this.state.triviaPauseTimerLeft > 0) {
                  this.state.triviaPauseTimerLeft--;
                  
                  if (this.state.triviaPauseTimerLeft === 0) {
                    interval.clear();
                    if (targetOpponent && !targetOpponent.hasFinished) {
                      console.log(`[GameRoom] 15s pause expired. Opponent ${targetOpponent.username} failed to finish. Player ${player.username} wins.`);
                      
                      this.state.winnerId = player.id;
                      this.state.status = "FINISHED";
                      this.state.triviaPauseTimerLeft = -1;
                      this.recordGameHistoryEntry(player.id, player.username);
                      
                      this.broadcast("game_over", {
                        winnerId: player.id,
                        winnerName: player.username,
                        scores: Array.from(this.state.players.values()).map(p => ({
                          userId: p.id,
                          score: p.score,
                          correctAnswers: p.correctAnswers
                        }))
                      });

                      if (GameRoom.profileService) {
                        GameRoom.profileService.recordGameWin(player.id, this.state.puzzleType, 60, player.score, player.username, player.nameColor, player.badges, player.rank)
                          .catch((err: any) => console.error("Database win save failed:", err));
                      }
                    }
                  }
                } else {
                  interval.clear();
                }
              }, 1000);

              (this as any).triviaInterval = interval;
            }
          }
        } else if (this.state.puzzleType === "PHYSICS") {
          // Three rounds mode for PHYSICS in 1v1 Arena!
          player.roundWins = (player.roundWins || 0) + 1;
          
          const currentRound = this.state.currentRound || 1;
          const totalRounds = 3;
          
          // Check if this player has won best of 3 (2 round wins), or we completed all 3 rounds
          const hasWonMatch = player.roundWins >= 2 || currentRound >= totalRounds;
          
          if (hasWonMatch) {
            shouldEnd = true;
            winnerSessionId = client.sessionId;
          } else {
            // Move to the next round after a 3-second delay
            const roundWinnerName = player.username;
            
            // Broadcast round completion info
            this.broadcast("round_over", {
              winnerId: player.id,
              winnerName: roundWinnerName,
              round: currentRound
            });
            
            // Temporarily pause gameplay
            this.state.status = "PAUSED";
            
            setTimeout(() => {
              // Increment round
              this.state.currentRound = currentRound + 1;
              this.state.puzzleSeed = Math.random().toString(36).substring(2, 10).toUpperCase();
              
              // Reset player round flags for the next round
              this.state.players.forEach((p) => {
                p.hasFinished = false;
                p.progress = 0;
                p.score = 0;
              });
              
              this.state.status = "PLAYING";
              
              // Broadcast new round start with the new seed
              this.broadcast("new_round", {
                seed: this.state.puzzleSeed,
                round: this.state.currentRound
              });
            }, 3000);
          }
        } else {
          // For other speed puzzles, first to finish wins
          shouldEnd = true;
          winnerSessionId = client.sessionId;
        }

        if (shouldEnd) {
          const winner = this.state.players.get(winnerSessionId);
          if (winner) {
            this.state.winnerId = winner.id;
            this.state.status = "FINISHED";
            this.recordGameHistoryEntry(winner.id, winner.username);
            this.broadcast("game_over", { 
              winnerId: winner.id, 
              winnerName: winner.username,
              scores: Array.from(this.state.players.values()).map(p => ({
                userId: p.id,
                score: p.score,
                correctAnswers: p.correctAnswers,
                submittedAnswer: (p as any).mathAnswer,
                isCorrect: (p as any).mathIsCorrect,
                distance: (p as any).mathDistance,
                timeTaken: (p as any).mathTimeTaken
              }))
            });
            
            if (GameRoom.profileService) {
              GameRoom.profileService.recordGameWin(winner.id, this.state.puzzleType, 60, winner.score, winner.username, winner.nameColor, winner.badges, winner.rank)
                .catch((err: any) => console.error("Database win save failed:", err));
            }
          }
        }
      }
    });

    // Chat message relay handler
    this.onMessage("chat_message", (client, data: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("chat_message", {
          senderId: player.id,
          username: player.username,
          text: data.text
        });
      }
    });

    // Emoji relay handler
    this.onMessage("send_emoji", (client, data: { emoji: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("emoji_receive", {
          senderId: player.id,
          username: player.username,
          emoji: data.emoji
        });

        // Save to chat_history.json
        const playersList: { id: string; username: string }[] = [];
        this.state.players.forEach((p) => {
          playersList.push({ id: p.id, username: p.username });
        });
        ProfileService.saveChatMessage(this.roomId, this.state.puzzleType, playersList, {
          senderId: player.id,
          username: player.username,
          text: "",
          emoji: data.emoji,
          timestamp: Date.now()
        });
      }
    });

    // Chat message handler
    this.onMessage("chat_send", (client, data: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.text.trim()) {
        const msg = {
          senderId: player.id,
          username: player.username,
          text: data.text.trim(),
          timestamp: Date.now()
        };
        this.broadcast("chat_receive", msg);

        // Save to chat_history.json
        const playersList: { id: string; username: string }[] = [];
        this.state.players.forEach((p) => {
          playersList.push({ id: p.id, username: p.username });
        });
        ProfileService.saveChatMessage(this.roomId, this.state.puzzleType, playersList, {
          senderId: player.id,
          username: player.username,
          text: data.text.trim(),
          emoji: null,
          timestamp: Date.now()
        });
      }
    });

    // Opponent block relay handler
    this.onMessage("block_opponent", (client, data: { blockerId: string; blockedId: string; isBlocked: boolean }) => {
      this.broadcast("opponent_blocked_status", {
        blockerId: data.blockerId,
        blockedId: data.blockedId,
        isBlocked: data.isBlocked
      });
    });

    // 4x4 Sliding Block Mode proposals
    this.onMessage("propose_4x4", (client, data: { username: string }) => {
      this.broadcast("propose_4x4_received", { senderId: client.sessionId, senderUsername: data.username });
    });

    this.onMessage("accept_4x4", (client) => {
      this.broadcast("apply_4x4_mode");
    });

    this.onMessage("decline_4x4", (client) => {
      this.broadcast("decline_4x4_received");
    });

    // 6x6 Sliding Block Mode proposals
    this.onMessage("propose_6x6", (client, data: { username: string }) => {
      this.broadcast("propose_6x6_received", { senderId: client.sessionId, senderUsername: data.username });
    });

    this.onMessage("accept_6x6", (client) => {
      this.broadcast("apply_6x6_mode");
    });

    this.onMessage("decline_6x6", (client) => {
      this.broadcast("decline_6x6_received");
    });

    this.onMessage("puzzle_started", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.status === "PLAYING") {
        player.hasStarted = true;
        console.log(`[GameRoom] Player ${player.username} has started the puzzle.`);
      }
    });
  }

  onJoin(client: Client, options: any) {
    console.log(`[GameRoom] Client joined: SessionID: ${client.sessionId}, Username: ${options.username}, UserId: ${options.userId}`);
    
    const userId = options.userId || client.sessionId;
    const clientIp = (client.ref as any)?.headers?.['x-forwarded-for'] || (client.ref as any)?.socket?.remoteAddress || (client as any).ip;
    if (clientIp && ProfileService.bannedIps && ProfileService.bannedIps.has(clientIp)) {
      console.warn(`[GameRoom] Connection rejected: Banned IP ${clientIp} tried to join`);
      throw new Error("Your IP address has been banned.");
    }

    if (ProfileService.bannedUserIds.has(userId) || ProfileService.bannedProfileIds.has(userId)) {
      console.warn(`[GameRoom] Connection rejected: Banned player ${options.username} (${userId}) tried to join`);
      throw new Error("Your account has been banned.");
    }

    if (ProfileService.deletedProfileIds && ProfileService.deletedProfileIds.has(userId)) {
      console.warn(`[GameRoom] Connection rejected: Deleted player ${options.username} (${userId}) tried to join`);
      throw new Error("Your account has been deleted.");
    }

    const player = new PlayerState();
    player.id = userId;
    player.username = options.username || `Player_${client.sessionId.substring(0, 4)}`;
    player.progress = 0;
    player.isReady = false;
    player.hasFinished = false;
    player.hasStarted = false;
    player.nameColor = options.nameColor || "";
    player.badges = options.badges || "";
    player.rank = options.rank || "BRONZE";
    player.avatar = options.avatar || "👤";
    player.avatarFrame = options.frame || "none";

    this.state.players.set(client.sessionId, player);

    if (this.state.mode === "1V1") {
      MatchmakingQueue.add(this.state.puzzleType, {
        userId: userId,
        username: player.username,
        sessionId: client.sessionId,
        joinedAt: Date.now()
      });
      GameRoom.broadcastQueueUpdate();
    }

    // If lobby becomes full, start pre-match countdown
    if (this.state.players.size >= this.maxClients) {
      this.state.status = "LOBBY";

      if (this.state.mode === "1V1") {
        this.state.players.forEach((p) => {
          MatchmakingQueue.remove(this.state.puzzleType, p.id);
        });
        GameRoom.broadcastQueueUpdate();
      }

      const isPrivate = this.metadata && this.metadata.privatePin;

      // Send each player their specific opponent's info via direct message
      this.clients.forEach((c) => {
        let opponentData: any = null;
        this.state.players.forEach((p, sid) => {
          if (sid !== c.sessionId) {
            opponentData = {
              id: p.id,
              username: p.username,
              rank: p.rank || 'BRONZE',
              progress: 0,
              nameColor: p.nameColor,
              badges: p.badges ? p.badges.split(',') : [],
              avatar: p.avatar,
              frame: p.avatarFrame
            };
          }
        });
        c.send("match_found", {
          opponent: opponentData,
          countdown: isPrivate ? 0 : 6
        });
      });

      if (isPrivate) {
        console.log(`[GameRoom] Private room match starts instantly! Room: ${this.roomId}`);
        this.startMatch();
      } else {
        console.log(`[GameRoom] Match found! Starting 6-second lobby countdown. Room: ${this.roomId}`);
        let countdown = 6;
        this.lobbyTimer = this.clock.setInterval(() => {
          countdown--;
          this.broadcast("lobby_countdown", { countdown });

          if (countdown <= 0) {
            if (this.lobbyTimer) {
              this.lobbyTimer.clear();
              this.lobbyTimer = null;
            }
            this.startMatch();
          }
        }, 1000);
      }
    }
  }

  private startMatch() {
    this.state.status = "PLAYING";
    this.state.startTime = Date.now();
    this.state.currentRound = 1;
    this.state.players.forEach((p) => {
      p.roundWins = 0;
    });

    this.playersSnapshot = Array.from(this.state.players.entries()).map(([sessionId, p]) => ({
      id: p.id,
      username: p.username,
      sessionId: sessionId,
      score: p.score,
      nameColor: p.nameColor,
      badges: p.badges,
      rank: p.rank
    }));

    // Create a preliminary/pending game history entry in both players' records the moment match starts
    try {
      const playersList = this.playersSnapshot.map(p => ({ id: p.id, username: p.username }));
      ProfileService.createPendingGameRecord(this.roomId, this.state.puzzleType, playersList, this.state.startTime);
    } catch (e) {
      console.error('[GameRoom] Error creating pending game record:', e);
    }

    // Send puzzle_start to all clients to initiate puzzle board loading
    this.clients.forEach((c, index) => {
      let opponentData: any = null;
      this.state.players.forEach((p, sid) => {
        if (sid !== c.sessionId) {
          opponentData = {
            id: p.id,
            username: p.username,
            rank: p.rank || 'BRONZE',
            progress: 0,
            nameColor: p.nameColor,
            badges: p.badges ? p.badges.split(',') : [],
            avatar: p.avatar,
            frame: p.avatarFrame
          };
        }
      });
      c.send("puzzle_start", {
        seed: this.state.puzzleSeed,
        puzzleType: this.state.puzzleType,
        opponent: opponentData,
        playerColor: index === 0 ? 'w' : 'b'
      });
    });

    console.log(`[GameRoom] Match started! Room: ${this.roomId}, Players: ${this.state.players.size}`);
  }

  onLeave(client: Client, consented: boolean) {
    if (this.lobbyTimer) {
      this.lobbyTimer.clear();
      this.lobbyTimer = null;
    }

    if ((this as any).triviaInterval) {
      (this as any).triviaInterval.clear();
      (this as any).triviaInterval = null;
    }
    this.state.triviaPauseTimerLeft = -1;

    const player = this.state.players.get(client.sessionId);
    if (player) {
      if (this.state.mode === "1V1") {
        MatchmakingQueue.remove(this.state.puzzleType, player.id);
        GameRoom.broadcastQueueUpdate();
      }

      // Only capture snapshot if it hasn't been captured yet (e.g. at match start)
      if (!this.playersSnapshot || this.playersSnapshot.length === 0) {
        this.playersSnapshot = Array.from(this.state.players.entries()).map(([sessionId, p]) => ({
          id: p.id,
          username: p.username,
          sessionId: sessionId,
          score: p.score,
          nameColor: p.nameColor,
          badges: p.badges,
          rank: p.rank
        }));
      }

      // Capture remaining players before removing the leaving player
      const remainingPlayers: PlayerState[] = [];
      this.state.players.forEach((p, sid) => {
        if (sid !== client.sessionId) {
          remainingPlayers.push(p);
        }
      });

      this.state.players.delete(client.sessionId);
      
      // If playing/paused and opponent leaves, handle forfeiting
      if (this.state.status === "PLAYING" || this.state.status === "PAUSED") {
        // Declare remaining player as winner
        const remainingPlayer = remainingPlayers[0];
        if (remainingPlayer) {
          this.state.winnerId = remainingPlayer.id;
          this.state.status = "FINISHED";
          this.recordGameHistoryEntry(remainingPlayer.id, remainingPlayer.username);
          this.broadcast("game_over", { winnerId: remainingPlayer.id, winnerName: remainingPlayer.username, forfeit: true });

          // Record the forfeit win in the database for the remaining (winning) player
          if (GameRoom.profileService) {
            const elapsedSec = this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 60;
            GameRoom.profileService.recordGameWin(
              remainingPlayer.id,
              this.state.puzzleType,
              elapsedSec,
              remainingPlayer.score,
              remainingPlayer.username,
              remainingPlayer.nameColor,
              remainingPlayer.badges,
              remainingPlayer.rank
            ).catch((err: any) => console.error("Database forfeit win save failed:", err));
          }
        } else {
          // No players remaining, match is finished with no winner
          this.state.status = "FINISHED";
          this.recordGameHistoryEntry("", "No Winner");
        }
      }
    }
  }

  onDispose() {
    GameRoom.broadcastQueueUpdate();

    // Ensure recordGameHistoryEntry runs in ALL exit paths (e.g. room timeout/dispose mid-game)
    if ((this.state.status === "PLAYING" || this.state.status === "PAUSED") && !this.hasRecordedHistory) {
      this.state.status = "FINISHED";

      // Compute winner based on score if possible
      let winnerId = "";
      let winnerName = "No Winner";
      let maxScore = -1;

      const players = this.playersSnapshot.length > 0 ? this.playersSnapshot : Array.from(this.state.players.values());
      players.forEach((p) => {
        if (p.score > maxScore) {
          maxScore = p.score;
          winnerId = p.id;
          winnerName = p.username;
        }
      });

      this.recordGameHistoryEntry(winnerId, winnerName);
    }

    // Always ensure chat record duration is updated even if match ended early
    const elapsedSec = this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 0;
    try {
      ProfileService.updateRoomDuration(this.roomId, elapsedSec);
    } catch (e) {
      console.error('[GameRoom] Error updating room duration on dispose:', e);
    }
  }

  private recordGameHistoryEntry(winnerId: string, winnerName: string) {
    if (this.hasRecordedHistory) return;
    this.hasRecordedHistory = true;

    let playersList: { id: string; username: string }[] = [];
    if (this.playersSnapshot && this.playersSnapshot.length > 0) {
      playersList = this.playersSnapshot.map(p => ({ id: p.id, username: p.username }));
    } else {
      this.state.players.forEach((p) => {
        playersList.push({ id: p.id, username: p.username });
      });
    }

    try {
      const elapsedSec = this.state.startTime ? Math.floor((Date.now() - this.state.startTime) / 1000) : 0;
      ProfileService.completeGameRecord(this.roomId, winnerId, winnerName, elapsedSec, this.state.puzzleType, playersList);

      // Save match duration to chat history
      ProfileService.updateRoomDuration(this.roomId, elapsedSec);
    } catch (e) {
      console.error('[GameRoom] Error recording game history:', e);
    }
  }
}
