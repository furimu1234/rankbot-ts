import { type InferSelectModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { masterFilter } from '../schema.js';

export interface getMasterFilter {
	categoryId: InferSelectModel<typeof masterFilter>['categoryId'];
	guildId: InferSelectModel<typeof masterFilter>['guildId'];
}

/**
 * マスタフィルタを取得する
 * @param db transaction
 * @param guildId 設定を取得するサーバのID
 * @returns
 */
export async function getMasterFilter(db: SchemaDB, filter: getMasterFilter) {
	const results = await db
		.select()
		.from(masterFilter)

		.where(
			and(
				filter.categoryId
					? eq(masterFilter.categoryId, filter.categoryId)
					: undefined,
				filter.guildId ? eq(masterFilter.guildId, filter.guildId) : undefined,
			),
		)
		.limit(1);

	if (results.length === 0) return undefined;

	return results[0];
}
