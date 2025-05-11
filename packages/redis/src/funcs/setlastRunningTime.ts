import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * 最終起動時刻保存
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 */
export async function setlastRunningTime(client: RedisClient) {
	await client.set(
		REDISKEYS.sprintf(REDISKEYS.lastRunningTime),
		new Date().toISOString(),
	);
}
