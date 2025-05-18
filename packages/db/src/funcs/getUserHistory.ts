import { and, desc, eq, isNull } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { userconnectHistory } from '../schema.js';

/**
 * ユーザのレベルを取得する
 * @param db drizzle
 * @param userId 設定を取得するユーザのID
 * @param guildId 設定を取得するサーバのID
 * @returns
 */
export async function getUserHistory(
	db: SchemaDB,
	userId: string,
	guildId: string,
) {
	const result = await db.query.userconnectHistory.findFirst({
		where: and(
			eq(userconnectHistory.userId, userId),
			eq(userconnectHistory.guildId, guildId),
		),
		orderBy: desc(userconnectHistory.createdAt),
	});

	if (result === undefined) return undefined;

	return result;
}

/**
 * ユーザのレベルを取得する
 * @param db drizzle
 * @param guildId 設定を取得するサーバのID
 * @returns
 */
export async function getGuildHistoryies(db: SchemaDB, guildId: string) {
	const results = await db.query.userconnectHistory.findMany({
		where: and(
			eq(userconnectHistory.guildId, guildId),
			isNull(userconnectHistory.removeTime),
		),
		orderBy: desc(userconnectHistory.createdAt),
	});

	return results;
}
