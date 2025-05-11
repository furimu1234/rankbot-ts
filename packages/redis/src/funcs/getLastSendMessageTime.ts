import { sprintf } from 'sprintf-js';
import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * 最終メッセージ送信時刻取得
 * @param client redisクライアント
 * @param guildId サーバID
 * @param userId ユーザID
 * @returns
 */
export async function getLastSendMessageTime(
	client: RedisClient,
	guildId: string,
	userId: string,
) {
	const coolDownString = await client.get(
		sprintf(REDISKEYS.lastSendMessageTime, guildId, userId),
	);

	return new Date(coolDownString || '');
}
