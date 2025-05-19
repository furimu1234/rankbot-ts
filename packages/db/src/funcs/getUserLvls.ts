import type { SchemaDB } from '../client.js';
import { userLevel, type userLevelFilterModel } from '../schema.js';

type filter = Partial<userLevelFilterModel>;

/**
 * ユーザのレベルを取得する
 * @param db drizzle
 * @param userId 設定を取得するユーザのID
 * @param guildId 設定を取得するサーバのID
 * @returns
 */
export async function getUserLvls(db: SchemaDB, filter?: filter) {
	const results = await db.select().from(userLevel);
	//.where(and(eq(userLevel.userId, userId), eq(userLevel.guildId, guildId)));

	if (results.length === 0) return [];

	return results;
}
