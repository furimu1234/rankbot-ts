import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * VC入室時刻削除
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 */
export async function delLatestJoinTime(
	client: RedisClient,
	guildId: string,
	userId: string,
) {
	await client.delete(
		REDISKEYS.sprintf(REDISKEYS.latestJoinTime, guildId, userId),
	);
}
