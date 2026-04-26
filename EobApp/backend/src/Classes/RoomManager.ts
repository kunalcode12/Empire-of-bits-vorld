import WebSocket from 'ws';
import { GameMessages, RoomMessages, ErrorMessages } from '../utils/messages';
import { Chess } from 'chess.js';
import { redis } from '../clients/redisClient';
import pc from '../clients/prismaClient';
import {
  handleRoomChat,
  handleRoomGameLeave,
  handleRoomLeave,
  handleRoomMove,
  handleRoomReconnection,
  handleRoomDrawOffer,
  handleRoomDrawAcceptance,
  handleRoomDrawRejection,
  handleRoomTakeback,
  validateRoomGamePayload,
} from '../Services/RoomGameServices';
import provideValidMoves, { parseChat, sendMessage } from '../utils/chessUtils';

interface RestoredGameState {
  user1: number;
  user2: number;
  fen: string;
  whiteTimer: number;
  blackTimer: number;
  moves: string[];
  moveCount: number;
  status: string;
  chat: string[];
  capturedPieces: string[];
  roomCode: string;
}

class RoomManager {
  public roomSocketManager: Map<number, WebSocket> = new Map();
  public globalRoomClock: NodeJS.Timeout | null = null;
  // public readonly MOVES_BEFORE_SAVE = 10;
  private readonly TIME_BUFFER_ON_CRASH = 10;

  async addRoomUser(userId: number, userSocket: WebSocket) {
    this.roomSocketManager.set(userId, userSocket);
    this.messageHandlerForRoom(userId, userSocket);

    userSocket.send(
      JSON.stringify({
        type: RoomMessages.ASSIGN_ID_FOR_ROOM,
        payload: {
          message: 'Id Assigned for room',
        },
      })
    );
    await this.checkAndRestoreActiveGame(userId, userSocket);
  }

  async checkAndRestoreActiveGame(userId: number, userSocket: WebSocket) {
    try {
      const gameIdFromRedis = await redis.get(`user:${userId}:room-game`);
      if (gameIdFromRedis) {
        const gameData = await redis.hGetAll(`room-game:${gameIdFromRedis}`);

        // Only reconnect if game exists AND is not finished
        if (
          gameData &&
          Object.keys(gameData).length > 0 &&
          gameData.status !== RoomMessages.ROOM_GAME_OVER
        ) {
          console.log(
            `♻️ Reconnecting user ${userId} to active game ${gameIdFromRedis}`
          );
          await handleRoomReconnection(
            userId,
            userSocket,
            Number(gameIdFromRedis),
            this.roomSocketManager
          );
          return;
        } else {
          // Clean up stale Redis key if game is finished
          console.log(`🧹 Cleaning up stale game reference for user ${userId}`);
          await redis.del(`user:${userId}:room-game`);
        }
      }

      // Find the most recent active or waiting room (excluding finished/cancelled ones)
      const room = await pc.room.findFirst({
        where: {
          OR: [{ createdById: userId }, { joinedById: userId }],
          status: { in: ['WAITING', 'FULL', 'ACTIVE'] },
          NOT: { status: { in: ['FINISHED', 'CANCELLED'] } },
        },
        include: {
          game: {
            select: {
              id: true,
              winnerId: true,
              loserId: true,
              draw: true,
              endedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      console.log(room);
      if (!room) {
        console.log(`✅ No active/waiting room found for user ${userId}`);
        return;
      }

      if (room.status === 'ACTIVE' && room.game?.id) {
        const restored = await this.restoreGameFromDB(room.game.id);
        if (restored) {
          await handleRoomReconnection(
            userId,
            userSocket,
            room.game.id,
            this.roomSocketManager
          );

          const opponentId =
            userId === restored.user1 ? restored.user2 : restored.user1;
          const opponentSocket = this.roomSocketManager.get(opponentId);
          opponentSocket?.send(
            JSON.stringify({
              type: RoomMessages.OPP_ROOM_RECONNECTED,
              payload: { message: 'Opponent has reconnected!' },
            })
          );
        }
        return;
      }

      // Handle WAITING room (only creator, no joiner yet)
      if (room.status === 'WAITING') {
        const isCreator = userId === room.createdById;

        if (!isCreator) {
          console.log(
            `⚠️ User ${userId} tried to reconnect to WAITING room but is not creator`
          );
          return;
        }

        console.log(
          `🔄 Creator ${userId} reconnecting to WAITING room (roomCode: ${room.code})`
        );

        userSocket.send(
          JSON.stringify({
            type: GameMessages.USER_HAS_JOINED,
            payload: {
              message: 'Welcome back! Waiting for opponent to join.',
              opponentId: null,
              opponentName: null,
              roomCode: room.code,
              roomStatus: 'WAITING',
              isCreator: true,
              currentUserId: userId,
              playerCount: 1,
            },
          })
        );
        return;
      }

      // Handle FULL room (both players joined, game not started yet)
      if (room.status === 'FULL') {
        const isCreator = userId === room.createdById;
        const opponentId = isCreator ? room.joinedById : room.createdById;

        // Get both user info for complete room state
        const [currentUser, opponent] = await Promise.all([
          pc.user.findUnique({
            where: { id: userId },
            select: { name: true, chessLevel: true },
          }),
          pc.user.findUnique({
            where: { id: opponentId! },
            select: { name: true, chessLevel: true },
          }),
        ]);

        const opponentSocket = this.roomSocketManager.get(opponentId!);

        const lobbyChat = await parseChat(`room:${room.code}:lobby-chat`);

        userSocket.send(
          JSON.stringify({
            type: GameMessages.USER_HAS_JOINED,
            payload: {
              opponentId: opponentId,
              opponentName: opponent?.name || null,
              roomCode: room.code,
              roomStatus: 'FULL',
              isCreator: isCreator,
              currentUserId: userId,
              playerCount: 2,
              chat: lobbyChat,
            },
          })
        );

        // Notify opponent that this user has reconnected (if they're online)
        if (opponentSocket) {
          opponentSocket.send(
            JSON.stringify({
              type: RoomMessages.OPP_ROOM_RECONNECTED,
              payload: {
                message: `${currentUser?.name || 'Opponent'} has rejoined. Game can start now!`,
              },
            })
          );
        }
      }
    } catch (error) {
      console.error('Error checking for active or full game:', error);
    }
  }

  async roomJoined(createdById: number, opponentId: number) {
    try {
      const opponent = await pc.user.findUnique({
        where: { id: opponentId },
        select: { name: true },
      });

      const createdBySocket = this.roomSocketManager.get(createdById);

      if (createdBySocket) {
        createdBySocket.send(
          JSON.stringify({
            type: GameMessages.USER_HAS_JOINED,
            payload: {
              message: 'Opponent has joined!',
              opponentId,
              opponentName: opponent?.name || null,
            },
          })
        );
      } else {
        console.log(
          `⚠️ Creator ${createdById} not connected to WebSocket yet - will sync on connection`
        );
      }
    } catch (error) {
      console.error('Error in roomJoined:', error);
      const createdBySocket = this.roomSocketManager.get(createdById);
      createdBySocket?.send(
        JSON.stringify({
          type: GameMessages.USER_HAS_JOINED,
          payload: {
            message: 'Opponent has joined!',
            opponentId,
            opponentName: null,
          },
        })
      );
    }
  }

  async startRoomTimer() {
    if (this.globalRoomClock) {
      console.log('Room Timer Already Running');
      return;
    }
    console.log('Starting Room Timer');

    this.globalRoomClock = setInterval(async () => {
      try {
        const activeRoomGames = await redis.sMembers('room-active-games');
        if (!activeRoomGames || activeRoomGames.length === 0) {
          if (this.globalRoomClock) {
            clearInterval(this.globalRoomClock);
            this.globalRoomClock = null;
            console.log('No Active Games Stopping timer');
          }
          return;
        }

        for (const gameId of activeRoomGames) {
          const game = (await redis.hGetAll(`room-game:${gameId}`)) as Record<
            string,
            string
          >;

          if (!game || Object.keys(game).length === 0) {
            await redis.sRem('room-active-games', gameId);
            continue;
          }

          if (game.status === RoomMessages.ROOM_GAME_OVER) {
            await redis.sRem('room-active-games', gameId);
            continue;
          }

          let whiteTimer = Number(game.whiteTimer);
          let blackTimer = Number(game.blackTimer);
          const fen = String(game.fen);
          const turn = fen.split(' ')[1];

          if (turn === 'w') {
            const updatedWhiteTimer = await redis.hIncrBy(
              `room-game:${gameId}`,
              'whiteTimer',
              -1
            );
            whiteTimer = Math.max(0, Number(updatedWhiteTimer));
          } else {
            const updatedBlackTimer = await redis.hIncrBy(
              `room-game:${gameId}`,
              'blackTimer',
              -1
            );
            blackTimer = Math.max(0, Number(updatedBlackTimer));
          }

          const whitePlayerId = Number(game.user1);
          const blackPlayerId = Number(game.user2);

          const whitePlayerSocket = this.roomSocketManager.get(whitePlayerId);
          const blackPlayerSocket = this.roomSocketManager.get(blackPlayerId);

          if (whitePlayerSocket && blackPlayerSocket) {
            const timerMessage = {
              type: RoomMessages.ROOM_TIMER_UPDATE,
              payload: {
                whiteTimer,
                blackTimer,
              },
            };

            whitePlayerSocket.send(JSON.stringify(timerMessage));
            blackPlayerSocket.send(JSON.stringify(timerMessage));
          }

          if (whiteTimer <= 0 || blackTimer <= 0) {
            await this.handleRoomTimeExpired(
              game,
              gameId,
              whiteTimer,
              blackTimer
            );
          }
        }
      } catch (error) {
        console.error('Error in room timer:', error);
      }
    }, 1000);
  }

  async handleRoomTimeExpired(
    game: Record<string, string>,
    gameId: string,
    whiteTimer: number,
    blackTimer: number
  ) {
    try {
      let dbSaveSuccess = false;
      const winnerId =
        whiteTimer <= 0 ? Number(game.user2) : Number(game.user1);
      const loserId = whiteTimer <= 0 ? Number(game.user1) : Number(game.user2);
      const winnerColor = winnerId === Number(game.user1) ? 'w' : 'b';

      const winnerSocket = this.roomSocketManager.get(winnerId);
      const loserSocket = this.roomSocketManager.get(loserId);

      const moves = game.moves ? JSON.parse(game.moves) : [];
      const roomCode = game.roomCode;

      // Get chat messages from Redis using the util function
      const chatArr = await parseChat(`room-game:${gameId}:chat`);

      if (!roomCode) {
        console.error(
          `[handleRoomTimeExpired] Room code not found in Redis for game ${gameId}`
        );

        const errorMessage = JSON.stringify({
          type: RoomMessages.ROOM_GAME_OVER,
          payload: {
            result: 'error',
            reason: 'ROOM_CODE_MISSING',
            message: 'Game ended due to time, but room data is missing',
            gameId: gameId,
          },
        });

        winnerSocket?.send(errorMessage);
        loserSocket?.send(errorMessage);
        throw new Error(`Room Code missing of game: ${gameId}`);
      }
      try {
        await pc.$transaction([
          pc.game.update({
            where: { id: Number(gameId) },
            data: {
              winnerId,
              loserId,
              draw: false,
              moves,
              chat: chatArr,
              currentFen: game.fen,
              whiteTimeLeft: whiteTimer,
              blackTimeLeft: blackTimer,
              lastMoveAt: new Date(),
              lastMoveBy: whiteTimer <= 0 ? 'w' : 'b',
              endedAt: new Date(),
              status: 'FINISHED',
            },
          }),

          pc.room.update({
            where: { code: roomCode },
            data: { status: 'FINISHED' },
          }),
        ]);
        dbSaveSuccess = true;
        console.log(
          `⏱️ Game ${gameId} ended by time - Chat messages saved: ${chatArr.length}`
        );
      } catch (dbError) {
        console.error(`[DB Error] Failed to save game ${gameId}:`, dbError);

        winnerSocket?.send(
          JSON.stringify({
            type: RoomMessages.ROOM_GAME_OVER,
            payload: {
              result: 'error',
              message: 'Game ended but failed to save. Please refresh.',
            },
          })
        );
        loserSocket?.send(
          JSON.stringify({
            type: RoomMessages.ROOM_GAME_OVER,
            payload: {
              result: 'error',
              message: 'Game ended but failed to save. Please refresh.',
            },
          })
        );
        return;
      }

      if (dbSaveSuccess) {
        try {
          // ✅ Use redis.multi() for atomic deletion
          const result = await redis
            .multi()
            .hIncrBy(`stats`, 'roomGamesCount', 1)
            .hSet(`room-game:${gameId}`, {
              status: RoomMessages.ROOM_GAME_OVER,
              winner: winnerId.toString(),
            })
            .del(`user:${winnerId}:room-game`)
            .del(`user:${loserId}:room-game`)
            .del(`room-game:${gameId}`)
            .del(`room-game:${gameId}:moves`)
            .del(`room-game:${gameId}:chat`)
            .del(`room-game:${gameId}:capturedPieces`)
            .sRem('room-active-games', gameId)
            .exec();

          if (result && result.every((r) => r !== null)) {
            console.log(`✅ Game ${gameId} fully cleaned from Redis`);
          } else {
            console.warn(
              `⚠️ Some Redis operations failed for game ${gameId}, but DB is safe`
            );
          }
        } catch (redisError) {
          // Redis cleanup failed, but DB already saved ✅
          console.error(
            `[Redis Error] Failed to clean game ${gameId}:`,
            redisError
          );
        }
      }
      const winnerMessage = JSON.stringify({
        type: RoomMessages.ROOM_GAME_OVER,
        payload: {
          result: 'win',
          reason: RoomMessages.ROOM_TIME_EXCEEDED,
          winner: winnerColor,
          message: '🎉 You won! Your opponent ran out of time.',
          roomStatus: 'FINISHED',
          gameStatus: 'GAME_OVER',
        },
      });

      const loserMessage = JSON.stringify({
        type: RoomMessages.ROOM_GAME_OVER,
        payload: {
          result: 'lose',
          reason: RoomMessages.ROOM_TIME_EXCEEDED,
          winner: winnerColor,
          message: "⏱️ Time's up! You lost on time.",
          roomStatus: 'FINISHED',
          gameStatus: 'GAME_OVER',
        },
      });

      winnerSocket?.send(winnerMessage);
      loserSocket?.send(loserMessage);
    } catch (error) {
      console.error(
        '[handleRoomTimeExpired] Error handling time expiration:',
        error
      );

      const user1Id = Number(game.user1);
      const user2Id = Number(game.user2);
      const socket1 = this.roomSocketManager.get(user1Id);
      const socket2 = this.roomSocketManager.get(user2Id);

      const errorMessage = JSON.stringify({
        type: RoomMessages.ROOM_GAME_OVER,
        payload: {
          result: 'error',
          reason: 'TIME_HANDLER_ERROR',
          message:
            'Game ended due to time, but there was an error processing the result. Please refresh.',
          gameId: gameId,
        },
      });

      socket1?.send(errorMessage);
      socket2?.send(errorMessage);
    }
  }

  async messageHandlerForRoom(userId: number, userSocket: WebSocket) {
    userSocket.on('message', async (message: string) => {
      const msg = JSON.parse(message);
      const { type, payload } = msg;

      const validationError = validateRoomGamePayload(type, payload);
      if (validationError) {
        userSocket.send(
          JSON.stringify({
            type: ErrorMessages.PAYLOAD_ERROR,
            payload: { message: validationError },
          })
        );
        return;
      }

      if (type === RoomMessages.INIT_ROOM_GAME) {
        const chess = new Chess();

        const { roomCode } = msg.payload;
        const room = await pc.room.findUnique({
          where: { code: roomCode },
          select: { id: true, createdById: true, joinedById: true, game: true },
        });

        if (!room) {
          userSocket.send(
            JSON.stringify({
              type: RoomMessages.ROOM_NOT_FOUND,
              payload: { message: 'Invalid Code because Room Does not exist!' },
            })
          );
          return;
        }

        if (room.game) {
          userSocket.send(
            JSON.stringify({
              type: RoomMessages.ROOM_GAME_ACTIVE_ERROR,
              payload: { message: 'Room Game Already Active!' },
            })
          );
          return;
        }

        if (!room.joinedById) {
          userSocket.send(
            JSON.stringify({
              type: RoomMessages.ROOM_NOT_READY,
              payload: { message: 'Waiting for opponent to join' },
            })
          );
          return;
        }

        if (userId !== room.createdById) {
          userSocket.send(
            JSON.stringify({
              type: ErrorMessages.UNAUTHORIZED,
              payload: { message: 'Only the room creator can start the game' },
            })
          );
          return;
        }

        const creatorId = room.createdById;
        const joinerId = room.joinedById;

        const newGame = await pc.$transaction(async (tx) => {
          const game = await tx.game.create({
            data: {
              currentFen: chess.fen(),
              roomId: room.id,
              blackTimeLeft: 600,
              whiteTimeLeft: 30,
              lastMoveAt: new Date(),
              type: 'ROOM',
              status: 'ACTIVE',
            },
            select: { id: true },
          });

          await tx.room.update({
            where: { id: room.id },
            data: { status: 'ACTIVE' },
          });

          return game;
        });

        const gameId = newGame.id;
        const moves = provideValidMoves(chess.fen());

        // Store lobby chat messages to Redis if any exist
        // Check Redis for any pre-game lobby chat
        const lobbyChatKey = `room:${roomCode}:lobby-chat`;
        const lobbyChatExists = await redis.exists(lobbyChatKey);
        if (lobbyChatExists) {
          const lobbyChat = await redis.lRange(lobbyChatKey, 0, -1);
          if (lobbyChat.length > 0) {
            // Transfer lobby chat to game chat
            for (const chat of lobbyChat) {
              await redis.rPush(`room-game:${gameId}:chat`, chat);
            }
            console.log(
              `📝 Transferred ${lobbyChat.length} lobby chat messages to game ${gameId}`
            );
          }
          // Clean up lobby chat after transfer
          await redis.del(lobbyChatKey);
        }

        await redis
          .multi()
          .hSet(`room-game:${gameId}`, {
            user1: creatorId.toString(),
            user2: joinerId.toString(),
            status: RoomMessages.ROOM_GAME_ACTIVE,
            fen: chess.fen(),
            whiteTimer: '600',
            blackTimer: '600',
            moveCount: '0',
            roomCode: roomCode,
          })
          .setEx(`user:${creatorId}:room-game`, 86400, gameId.toString())
          .setEx(`user:${joinerId}:room-game`, 86400, gameId.toString())
          .exec();

        const whitePlayerSocket = this.roomSocketManager.get(creatorId);
        whitePlayerSocket?.send(
          JSON.stringify({
            type: RoomMessages.INIT_ROOM_GAME,
            payload: {
              color: 'w',
              fen: chess.fen(),
              whiteTimer: 600,
              blackTimer: 600,
              opponentId: joinerId,
              roomGameId: gameId,
              validMoves: moves,
            },
          })
        );

        const blackPlayerSocket = this.roomSocketManager.get(joinerId);
        blackPlayerSocket?.send(
          JSON.stringify({
            type: RoomMessages.INIT_ROOM_GAME,
            payload: {
              color: 'b',
              fen: chess.fen(),
              opponentId: creatorId,
              whiteTimer: 600,
              blackTimer: 600,
              roomGameId: gameId,
              validMoves: [],
            },
          })
        );

        await redis.sAdd('room-active-games', gameId.toString());
        await this.startRoomTimer();
        return;
      } else if (type === RoomMessages.ROOM_MOVE) {
        const { payload } = msg;
        const { to, from, promotion, roomGameId } = payload;
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          await this.restoreGameFromDB(roomGameId);
        }

        await handleRoomMove(
          userId,
          userSocket,
          { from, to, promotion },
          roomGameId,
          this.roomSocketManager
        );
        return;
      } else if (type === RoomMessages.ROOM_CHAT) {
        const { message, roomGameId, roomId } = payload;

        if (roomGameId) {
          const gameExists = await redis.exists(`room-game:${roomGameId}`);
          if (!gameExists) {
            await this.restoreGameFromDB(roomGameId);
          }
          await handleRoomChat(
            userId,
            userSocket,
            roomGameId,
            message,
            this.roomSocketManager
          );
        } else if (roomId) {
          const room = await pc.room.findUnique({
            where: { code: roomId },
            select: { createdById: true, joinedById: true, status: true },
          });

          if (!room) {
            userSocket.send(
              JSON.stringify({
                type: RoomMessages.ROOM_NOT_FOUND,
                payload: { message: 'Room not found' },
              })
            );
            return;
          }

          // Determine opponent
          const opponentId =
            userId === room.createdById ? room.joinedById : room.createdById;

          if (!opponentId) {
            userSocket.send(
              JSON.stringify({
                type: RoomMessages.ROOM_CHAT,
                payload: {
                  message: message,
                  sender: userId,
                  timestamp: Date.now(),
                },
              })
            );
            return;
          }

          const opponentSocket = this.roomSocketManager.get(opponentId);
          const timestamp = Date.now();

          // Store lobby chat in Redis for transfer to game later
          const chatPayload = {
            sender: userId,
            message: message,
            timestamp: timestamp,
          };
          await redis.rPush(
            `room:${roomId}:lobby-chat`,
            JSON.stringify(chatPayload)
          );
          await redis.expire(`room:${roomId}:lobby-chat`, 86400);

          opponentSocket?.send(
            JSON.stringify({
              type: RoomMessages.ROOM_CHAT,
              payload: {
                message: message,
                sender: userId,
                timestamp: timestamp,
              },
            })
          );

          userSocket.send(
            JSON.stringify({
              type: RoomMessages.ROOM_CHAT,
              payload: {
                message: message,
                sender: userId,
                timestamp: timestamp,
              },
            })
          );
        } else {
          userSocket.send(
            JSON.stringify({
              type: ErrorMessages.PAYLOAD_ERROR,
              payload: {
                message: 'Either roomGameId or roomId is required for chat',
              },
            })
          );
        }
        return;
      } else if (type === RoomMessages.ROOM_LEAVE_GAME) {
        const { roomGameId } = payload;
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          await this.restoreGameFromDB(roomGameId);
        }

        await handleRoomGameLeave(
          userId,
          userSocket,
          roomGameId,
          this.roomSocketManager
        );
        return;
      } else if (type === RoomMessages.ROOM_RECONNECT) {
        const gameId = payload.roomGameId;
        const gameExists = await redis.exists(`room-game:${gameId}`);

        if (!gameExists) {
          const restored = await this.restoreGameFromDB(gameId);
          if (!restored) {
            userSocket.send(
              JSON.stringify({
                type: RoomMessages.NO_ROOM_RECONNECTION,
                payload: {
                  message: 'Game reconnection not possible - game is finished',
                },
              })
            );
            return;
          }
        }

        await handleRoomReconnection(
          userId,
          userSocket,
          gameId,
          this.roomSocketManager
        );
      } else if (type === RoomMessages.LEAVE_ROOM) {
        const roomId = payload.roomId;
        await handleRoomLeave(
          userId,
          roomId,
          userSocket,
          this.roomSocketManager
        );
      } else if (type === GameMessages.OFFER_DRAW) {
        const { roomGameId } = payload;
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          const restored = await this.restoreGameFromDB(roomGameId);
          if (!restored) {
            userSocket.send(
              JSON.stringify({
                type: RoomMessages.NO_ROOM_RECONNECTION,
                payload: {
                  message: 'Game reconnection not possible - game is finished',
                },
              })
            );
            return;
          }
        }
        await handleRoomDrawOffer(
          userId,
          userSocket,
          roomGameId,
          this.roomSocketManager
        );
      } else if (type === GameMessages.ACCEPT_DRAW) {
        const { roomGameId } = payload;
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          await this.restoreGameFromDB(roomGameId);
        }
        await handleRoomDrawAcceptance(
          userId,
          userSocket,
          roomGameId,
          this.roomSocketManager
        );
      } else if (type === GameMessages.REJECT_DRAW) {
        const { roomGameId } = payload;
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          await this.restoreGameFromDB(roomGameId);
        }
        await handleRoomDrawRejection(
          userId,
          userSocket,
          roomGameId,
          this.roomSocketManager
        );
      } else if (type === RoomMessages.ROOM_TAKEBACK || type === 'room_takeback') {
        const roomGameId = payload?.roomGameId ?? payload?.gameId;
        if (roomGameId == null) {
          userSocket.send(
            JSON.stringify({
              type: ErrorMessages.PAYLOAD_ERROR,
              payload: { message: 'Missing roomGameId for takeback' },
            })
          );
          return;
        }
        const gameExists = await redis.exists(`room-game:${roomGameId}`);

        if (!gameExists) {
          await this.restoreGameFromDB(roomGameId);
        }
        await handleRoomTakeback(
          userId,
          userSocket,
          Number(roomGameId),
          this.roomSocketManager
        );
      } else if (type === RoomMessages.ROOM_ARENA_EVENT || type === 'room_arena_event') {
        const { roomCode, eventType, payload: eventPayload } = payload;
        const room = await pc.room.findUnique({
          where: { code: roomCode },
          select: { createdById: true, joinedById: true },
        });
        if (!room) {
          userSocket.send(
            JSON.stringify({
              type: RoomMessages.ROOM_NOT_FOUND,
              payload: { message: 'Room not found' },
            })
          );
          return;
        }
        if (room.createdById !== userId) {
          userSocket.send(
            JSON.stringify({
              type: ErrorMessages.UNAUTHORIZED,
              payload: { message: 'Only the room creator can relay arena events' },
            })
          );
          return;
        }
        const joinerId = room.joinedById;
        if (joinerId) {
          const joinerSocket = this.roomSocketManager.get(joinerId);
          joinerSocket?.send(
            JSON.stringify({
              type: RoomMessages.ROOM_ARENA_EVENT,
              payload: { eventType, payload: eventPayload ?? payload.payload ?? {} },
            })
          );
        }
      } else {
        userSocket.send(
          JSON.stringify({
            type: RoomMessages.WRONG_ROOM_MESSAGE,
            payload: { message: 'Invalid Action' },
          })
        );
      }
    });
  }

  async restoreGameFromDB(gameId: number): Promise<RestoredGameState | null> {
    try {
      const gameFromDB = await pc.game.findUnique({
        where: { id: gameId },
        include: { room: true },
      });

      if (
        !gameFromDB ||
        !gameFromDB.room ||
        gameFromDB.room.status === 'FINISHED' ||
        gameFromDB.room.status === 'FULL'
      ) {
        return null;
      }

      let whiteTimeLeft = gameFromDB.whiteTimeLeft;
      let blackTimeLeft = gameFromDB.blackTimeLeft;

      if (gameFromDB.lastMoveAt && gameFromDB.lastMoveBy) {
        const elapsedSeconds = Math.floor(
          (Date.now() - gameFromDB.lastMoveAt.getTime()) / 1000
        );

        const chess = new Chess(gameFromDB.currentFen || undefined);
        const currentTurn = chess.turn();

        if (currentTurn === 'w' && gameFromDB.lastMoveBy === 'b') {
          whiteTimeLeft = Math.max(0, whiteTimeLeft - elapsedSeconds);
        } else if (currentTurn === 'b' && gameFromDB.lastMoveBy === 'w') {
          blackTimeLeft = Math.max(0, blackTimeLeft - elapsedSeconds);
        }

        if (elapsedSeconds > 10) {
          whiteTimeLeft += this.TIME_BUFFER_ON_CRASH;
          blackTimeLeft += this.TIME_BUFFER_ON_CRASH;
        } else {
          console.log('Quick Reconnection in restoreFromDb! No Buffer Added');
        }
      }

      const chatArray = (
        Array.isArray(gameFromDB.chat) ? gameFromDB.chat : []
      ) as string[];
      const movesArray = (
        Array.isArray(gameFromDB.moves) ? gameFromDB.moves : []
      ) as string[];
      const movesCountStr = movesArray.length.toString();

      await redis.hSet(`room-game:${gameId}`, {
        user1: gameFromDB.room.createdById.toString(),
        user2: gameFromDB.room.joinedById!.toString(),
        status: RoomMessages.ROOM_GAME_ACTIVE,
        fen: gameFromDB.currentFen || new Chess().fen(),
        whiteTimer: whiteTimeLeft.toString(),
        blackTimer: blackTimeLeft.toString(),
        moveCount: movesCountStr,
        roomCode: gameFromDB.room.code,
      });

      if (movesArray.length > 0) {
        await redis.del(`room-game:${gameId}:moves`);
        for (const move of movesArray) {
          await redis.rPush(`room-game:${gameId}:moves`, JSON.stringify(move));
        }
      }

      if (chatArray.length > 0) {
        await redis.del(`room-game:${gameId}:chat`);
        for (const chat of chatArray) {
          await redis.rPush(`room-game:${gameId}:chat`, JSON.stringify(chat));
        }
      }

      await redis.sAdd('room-active-games', gameId.toString());
      if (gameFromDB.capturedPieces.length > 0) {
        await redis.del(`room-game:${gameId}:capturedPieces`);
        //Use for of loop basically for async await becuase in
        //forEach the promises are not awaited which can crash the code
        for (const pieces of gameFromDB.capturedPieces) {
          await redis.rPush(`room-game:${gameId}:capturedPieces`, pieces);
        }
      }
      return {
        user1: gameFromDB.room.createdById,
        user2: gameFromDB.room.joinedById!,
        fen: gameFromDB.currentFen || new Chess().fen(),
        whiteTimer: whiteTimeLeft,
        blackTimer: blackTimeLeft,
        moves: movesArray,
        moveCount: movesArray.length,
        status: RoomMessages.ROOM_GAME_ACTIVE,
        chat: chatArray,
        capturedPieces: gameFromDB.capturedPieces,
        roomCode: gameFromDB.room.code,
      };
    } catch (error) {
      console.error('Failed to restore game from DB:', error);
      return null;
    }
  }

  async handleDisconnection(userId: number) {
    try {
      this.roomSocketManager.delete(userId);

      const userRoom = await pc.room.findFirst({
        where: {
          OR: [{ createdById: userId }, { joinedById: userId }],
          status: { in: ['ACTIVE', 'FULL', 'WAITING'] },
        },
        select: {
          id: true,
          code: true,
          status: true,
          createdById: true,
          joinedById: true,
        },
      });

      if (!userRoom) {
        console.log(`⚠️ No active room found for user ${userId}`);
        return;
      }

      const opponentId =
        userRoom.createdById === userId
          ? userRoom.joinedById
          : userRoom.createdById;

      const isCreator = userId === userRoom.createdById;

      // ===== Handle each status =====
      if (userRoom.status === 'ACTIVE') {
        await this.handleActiveGameDisconnection(
          userId,
          userRoom.code,
          opponentId
        );
      } else if (userRoom.status === 'FULL') {
        await this.handleFullRoomDisconnection(
          userRoom.code,
          opponentId,
          isCreator
        );
      } else if (userRoom.status === 'WAITING') {
        await this.handleWaitingRoomDisconnection(
          userRoom.code,
          opponentId,
          isCreator
        );
      }
    } catch (error) {
      console.error(
        `❌ Error handling disconnection for user ${userId}:`,
        error
      );
    }
  }

  private async handleActiveGameDisconnection(
    userId: number,
    userCode: string,
    opponentId: number | null
  ) {
    console.log(`User ${userId} disconnected mid-game from room ${userCode}`);

    if (!opponentId) return;

    const opponentSocket = this.roomSocketManager.get(opponentId);
    opponentSocket?.send(
      JSON.stringify({
        type: RoomMessages.ROOM_OPP_DISCONNECTED,
        payload: {
          message:
            'Opponent disconnected during game. Waiting for reconnection...',
        },
      })
    );
  }

  private async handleFullRoomDisconnection(
    roomCode: string,
    opponentId: number | null,
    isCreator: boolean
  ) {
    if (!opponentId) return;

    const opponentSocket = this.roomSocketManager.get(opponentId);

    if (isCreator) {
      await this.cancelRoom(roomCode, opponentSocket);
    } else {
      await this.revertRoomToWaiting(roomCode, opponentSocket);
    }
  }

  private async handleWaitingRoomDisconnection(
    roomCode: string,
    opponentId: number | null,
    isCreator: boolean
  ) {
    if (isCreator) {
      // Creator can disconnect from WAITING without issue
      console.log(`Creator disconnected from WAITING room ${roomCode}`);
      return;
    }

    if (!opponentId) return;

    await pc.room.update({
      where: { code: roomCode },
      data: { joinedById: null, status: 'WAITING' },
    });

    const opponentSocket = this.roomSocketManager.get(opponentId);
    sendMessage(
      opponentSocket,
      JSON.parse(
        JSON.stringify({
          type: RoomMessages.ROOM_OPPONENT_LEFT,
          payload: {
            message: 'Opponent disconnected. Waiting for new player...',
            roomStatus: 'WAITING',
          },
        })
      )
    );
  }

  private async cancelRoom(
    roomCode: string,
    opponentSocket: WebSocket | undefined
  ) {
    console.log(`🔴 Room ${roomCode} cancelled due to creator disconnect`);

    await pc.room.update({
      where: { code: roomCode },
      data: { joinedById: null, status: 'CANCELLED' },
    });

    await redis.del(`room:${roomCode}:lobby-chat`);

    sendMessage(
      opponentSocket,
      JSON.parse(
        JSON.stringify({
          type: RoomMessages.ROOM_OPPONENT_LEFT,
          payload: {
            message: 'Room creator disconnected. Room cancelled.',
            roomStatus: 'CANCELLED',
          },
        })
      )
    );
  }

  private async revertRoomToWaiting(
    roomCode: string,
    opponentSocket: WebSocket | undefined
  ) {
    console.log(`Room ${roomCode} reverted to WAITING`);

    await pc.room.update({
      where: { code: roomCode },
      data: { joinedById: null, status: 'WAITING' },
    });

    await redis.del(`room:${roomCode}:lobby-chat`);

    sendMessage(
      opponentSocket,
      JSON.parse(
        JSON.stringify({
          type: RoomMessages.ROOM_OPPONENT_LEFT,
          payload: {
            message: 'Opponent disconnected. Waiting for new player...',
            roomStatus: 'WAITING',
          },
        })
      )
    );
  }
}

export const roomManager = new RoomManager();
