import { and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { userLevel } from '../schema.js';

/**
 * ユーザのレベルを取得する
 * @param db drizzle
 * @param userId 設定を取得するユーザのID
 * @param guildId 設定を取得するサーバのID
 * @returns
 */
export async function getUserLvl(
	db: SchemaDB,
	userId: string,
	guildId: string,
) {
	const results = await db
		.select()
		.from(userLevel)
		.where(and(eq(userLevel.userId, userId), eq(userLevel.guildId, guildId)));

	if (results.length === 0) return undefined;

	return results[0];
}
