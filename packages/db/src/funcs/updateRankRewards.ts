import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { rankRewards } from '../schema.js';

type updateRankRewards = Omit<
	InferInsertModel<typeof rankRewards>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ランク報酬を更新する
 * @param db drizzle
 * @param userid values
 * @returns
 */
export async function updateRankRewards(
	db: SchemaDB,
	values: updateRankRewards,
) {
	const results = await db
		.update(rankRewards)
		.set(values)
		.where(
			and(
				eq(rankRewards.lvl, values.lvl),
				values.isVc !== undefined
					? eq(rankRewards.isVc, values.isVc)
					: undefined,
			),
		)
		.returning();
	if (results.length === 0)
		throw new Error(`${values.guildId} ${values.lvl} INSERT FAILED`);

	return results[0];
}
