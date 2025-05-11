import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { channelFilter } from '../schema.js';

interface FilterType {
	channelId?: InferInsertModel<typeof channelFilter>['channelId'];
	isLvlUp?: boolean;
}

/**
 * チャンネルフィルタを削除する
 * @param db transaction
 * @param channelId 設定を削除するチャンネルのID
 * @returns
 */
export async function deleteChannelsFilter(db: SchemaDB, filter: FilterType) {
	const results = await db
		.delete(channelFilter)
		.where(
			and(
				filter.channelId
					? eq(channelFilter.channelId, filter.channelId)
					: undefined,
				filter.isLvlUp !== undefined
					? eq(channelFilter.isLvlUp, filter.isLvlUp)
					: undefined,
			),
		);

	return results;
}
