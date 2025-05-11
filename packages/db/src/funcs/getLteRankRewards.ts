import { and, desc, eq, lte } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { rankRewards } from '../schema.js';

/**
 * ランク報酬取得する
 * @param db drizzle
 * @param guildId 設定を取得するサーバのID
 * @param lvl 設定を取得するレベル
 * @param isVc VC?
 * @returns
 */
export async function getLteRankRewards(
	db: SchemaDB,
	guildId: string,
	lvl: number,
	isVc: boolean,
) {
	const results = await db
		.select()
		.from(rankRewards)
		.where(
			and(
				lte(rankRewards.lvl, lvl),
				eq(rankRewards.guildId, guildId),
				eq(rankRewards.isVc, isVc),
			),
		)
		.orderBy(desc(rankRewards.lvl));

	if (results.length === 0) return undefined;

	return results;
}
