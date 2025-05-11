import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * VC入室時刻保存
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 */
export async function setLatestJoinTime(
	client: RedisClient,
	guildId: string,
	userId: string,
) {
	await client.set(
		REDISKEYS.sprintf(REDISKEYS.latestJoinTime, guildId, userId),
		new Date().toISOString(),
	);
}
