import { type InferInsertModel, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { roleFilter } from '../schema.js';

type createroleFilter = Omit<
	InferInsertModel<typeof roleFilter>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ロールフィルタを作成する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function createRoleFilter(db: SchemaDB, values: createroleFilter) {
	const results = await db.insert(roleFilter).values(values).returning();

	if (values.parentId) {
		const roleIds = (
			await db
				.select()
				.from(roleFilter)
				.where(eq(roleFilter.guildId, values.guildId))
		).map((x) => x.roleId);
	}

	if (results.length === 0) throw new Error(`${values.roleId} INSERT FAILED`);

	return results[0];
}
