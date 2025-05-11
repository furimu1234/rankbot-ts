import type { InferInsertModel } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { rankRewards } from '../schema.js';

type createRankRewards = Omit<
	InferInsertModel<typeof rankRewards>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ランク報酬を作成
 * @param db drizzle
 * @param values values
 * @returns
 */
export async function createRankRewards(
	db: SchemaDB,
	values: createRankRewards,
) {
	const results = await db.insert(rankRewards).values(values).returning();
	if (results.length === 0)
		throw new Error(`${values.guildId} ${values.lvl} INSERT FAILED`);

	return results[0];
}
