import type { InferInsertModel } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { masterFilter } from '../schema.js';

type createMasterFilter = Omit<
	InferInsertModel<typeof masterFilter>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * マスタフィルタを作成する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function createMasterFilter(
	db: SchemaDB,
	values: createMasterFilter,
) {
	const results = await db.insert(masterFilter).values(values).returning();
	if (results.length === 0) throw new Error(`${values.guildId} INSERT FAILED`);

	return results[0];
}
