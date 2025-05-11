import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { roleFilter } from '../schema.js';

interface FilterType {
	roleId?: InferInsertModel<typeof roleFilter>['roleId'];
	guildId?: InferInsertModel<typeof roleFilter>['guildId'];
	parentId?: InferInsertModel<typeof roleFilter>['parentId'];
}

/**
 * ロールフィルタを削除する
 * @param db transaction
 * @param roleId 設定を削除するロールのID
 * @returns
 */
export async function deleteRolesFilter(db: SchemaDB, filter: FilterType) {
	await db
		.delete(roleFilter)
		.where(
			and(
				filter.roleId ? eq(roleFilter.roleId, filter.roleId) : undefined,
				filter.guildId ? eq(roleFilter.guildId, filter.guildId) : undefined,
				filter.parentId ? eq(roleFilter.parentId, filter.parentId) : undefined,
			),
		);
}
