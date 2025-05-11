import {
	type InferInsertModel,
	type InferSelectModel,
	and,
	eq,
	isNull,
} from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { roleFilter } from '../schema.js';

export interface getRoleFilter {
	roleId?: InferInsertModel<typeof roleFilter>['roleId'];
	guildId?: InferInsertModel<typeof roleFilter>['guildId'];
	isLvlUp?: boolean;
	parentId?: InferSelectModel<typeof roleFilter>['parentId'];
}

/**
 * ロールフィルタを取得する
 * @param db transaction
 * @param roleId 設定を取得するロールのID
 * @returns
 */
export async function getRolesFilter(db: SchemaDB, filter: getRoleFilter) {
	const results = await db
		.select()
		.from(roleFilter)
		.where(
			and(
				filter.roleId ? eq(roleFilter.roleId, filter.roleId) : undefined,
				filter.guildId ? eq(roleFilter.guildId, filter.guildId) : undefined,
				filter.isLvlUp !== undefined
					? eq(roleFilter.isLvlUp, filter.isLvlUp)
					: undefined,
				filter.parentId !== undefined
					? filter.parentId === null
						? isNull(roleFilter.parentId)
						: eq(roleFilter.parentId, filter.parentId)
					: undefined,
			),
		);

	if (results.length === 0) return [];

	return results;
}
