import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * VC入室時刻取得
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 */
export async function getLatestJoinTime(
	client: RedisClient,
	guildId: string,
	userId: string,
) {
	const lastJoinTimeString = await client.get(
		REDISKEYS.sprintf(REDISKEYS.latestJoinTime, guildId, userId),
	);

	return lastJoinTimeString !== null ? new Date(lastJoinTimeString) : undefined;
}
