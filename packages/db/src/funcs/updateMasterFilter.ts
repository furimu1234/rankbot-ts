import { type InferInsertModel, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { masterFilter } from '../schema.js';

type updateMasterFilter = Omit<
	InferInsertModel<typeof masterFilter>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * マスタフィルタを更新する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function updateMasterFilter(
	db: SchemaDB,
	values: updateMasterFilter,
) {
	const results = await db
		.update(masterFilter)
		.set(values)
		.where(eq(masterFilter.categoryId, values.categoryId))
		.returning();
	if (results.length === 0)
		throw new Error(`${values.categoryId} MASTER UPDATE FAILED`);

	return results[0];
}
