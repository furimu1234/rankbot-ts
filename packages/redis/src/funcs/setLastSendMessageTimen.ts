import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * 最終メッセージ送信時刻保存
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 * @returns
 */
export async function setLastSendMessageTime(
	client: RedisClient,
	guildId: string,
	userId: string,
) {
	await client.set(
		REDISKEYS.sprintf(REDISKEYS.lastSendMessageTime, guildId, userId),
		new Date().toISOString(),
	);
}
