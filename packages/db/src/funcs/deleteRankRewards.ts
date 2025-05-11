import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { rankRewards } from '../schema.js';

interface FilterType {
	guildId: InferInsertModel<typeof rankRewards>['guildId'];
	lvl: InferInsertModel<typeof rankRewards>['lvl'];
	isVc: InferInsertModel<typeof rankRewards>['isVc'];
}

/**
 * ランク報酬を削除する
 * @param db transaction
 * @returns
 */
export async function deleteRankRewards(db: SchemaDB, filter: FilterType) {
	await db
		.delete(rankRewards)
		.where(
			and(
				eq(rankRewards.guildId, filter.guildId),
				eq(rankRewards.lvl, filter.lvl),
				eq(rankRewards.isVc, filter.isVc ?? true),
			),
		);
}
