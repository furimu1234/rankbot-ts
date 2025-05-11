import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * BOT起動時刻取得
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 */
export async function getLastRunningTime(client: RedisClient) {
	const lastRunningTimeString = await client.get(
		REDISKEYS.sprintf(REDISKEYS.lastRunningTime),
	);

	return new Date(lastRunningTimeString || '');
}
