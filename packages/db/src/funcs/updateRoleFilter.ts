import { type InferInsertModel, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { roleFilter } from '../schema.js';

type updateroleFilter = Omit<
	InferInsertModel<typeof roleFilter>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ロールフィルタを更新する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function updateRoleFilter(db: SchemaDB, values: updateroleFilter) {
	const results = await db
		.update(roleFilter)
		.set(values)
		.where(eq(roleFilter.roleId, values.roleId))
		.returning();
	if (results.length === 0) throw new Error(`${values.roleId} INSERT FAILED`);

	return results[0];
}
