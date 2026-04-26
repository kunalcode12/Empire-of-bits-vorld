import { redis } from '../clients/redisClient';
import { GUEST_MATCHMAKING_KEY } from '../utils/chessUtils';

export async function insertPlayerInQueue(playerId: string) {
  try {
    const timeStamp = Date.now();
    const is_player_in_queue = await redis.zScore(
      GUEST_MATCHMAKING_KEY,
      playerId
    );
    if (is_player_in_queue) {
      console.log(`PlayerId:${playerId} already in queue`);
      return null;
    }
    const inserted = await redis.zAdd(GUEST_MATCHMAKING_KEY, {
      value: playerId,
      score: timeStamp,
    });
    if (inserted) {
      console.log(`added ${playerId} in queue`);
      return true;
    } else {
      console.log(`insertion in queue operation failed:${playerId}`);
      return false;
    }
  } catch (error) {
    console.error('Error inserting player in queue:', error);
    return false;
  }
}

export async function matchingPlayer(currentPlayerId: string) {
  // Get the first player in queue (longest waiting)
  const result = await redis.zRange(GUEST_MATCHMAKING_KEY, 0, 0);

  if (!result || result.length === 0) {
    console.log('No opponent found in queue');
    return null;
  }

  const opponentId = result[0];

  // Check if the opponent is the same as current player
  if (opponentId === currentPlayerId) {
    console.log('No opponent found (only current player in queue)');
    return null;
  }

  await redis.zRem(GUEST_MATCHMAKING_KEY, opponentId);
  await redis.zRem(GUEST_MATCHMAKING_KEY, currentPlayerId);
  // Clear notification flags since they're now matched (using sorted set)
  await redis.zRem('guest:notified:players', opponentId);
  await redis.zRem('guest:notified:players', currentPlayerId);
  console.log(`Match found: ${currentPlayerId} vs ${opponentId}`);
  return { opponentId };
}

export async function removePlayerFromQueue(
  playerId: string
): Promise<boolean> {
  try {
    const removed = await redis.zRem(GUEST_MATCHMAKING_KEY, playerId);
    await redis.zRem('guest:notified:players', playerId);
    if (removed) {
      console.log(`Player ${playerId} removed from matchmaking queue`);
      return true;
    } else {
      console.log(`Player ${playerId} was not in queue`);
      return false;
    }
  } catch (error) {
    console.error('Error removing player from queue:', error);
    return false;
  }
}
export async function clearQueue() {
  try {
    await redis.del(GUEST_MATCHMAKING_KEY);
    return true;
  } catch (error) {
    console.error('Error in removing queue:', error);
    return false;
  }
}
