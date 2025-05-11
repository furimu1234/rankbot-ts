import type { RedisClient } from '../client';
import { REDISKEYS } from '../keys';

/**
 * REDISに存在するVC入室時刻を一括取得する
 * @param client  redisクライアント
 * @param guildId サーバーID
 * @returns
 */
export async function getNoSavedTimes(client: RedisClient, guildId: string) {
	const ConnectedTimes = await client.findKeysAndValues(
		REDISKEYS.sprintf(REDISKEYS.noSavedTimes, guildId),
	);

	return ConnectedTimes.map((x) => {
		return {
			origKey: x.key,
			userId: x.key.split('-').pop(),
			time: new Date(x.value || ''),
		};
	});
}
