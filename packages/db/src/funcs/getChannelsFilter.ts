import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { channelFilter } from '../schema.js';

export interface getChannelFilter {
	channelId?: string;
	categoryId?: InferInsertModel<typeof channelFilter>['categoryId'];
	isLvlUp?: InferInsertModel<typeof channelFilter>['isLvlUp'];
}

/**
 * チャンネルフィルタを取得する
 * @param db transaction
 * @param channelId 設定を取得するチャンネルのID
 * @returns
 */
export async function getChannelsFilter(
	db: SchemaDB,
	filter: getChannelFilter,
) {
	const channels = await db
		.select()
		.from(channelFilter)
		.where(
			and(
				filter.channelId
					? eq(channelFilter.channelId, filter.channelId)
					: undefined,
				filter.categoryId
					? eq(channelFilter.categoryId, filter.categoryId)
					: undefined,
				filter.isLvlUp !== undefined
					? eq(channelFilter.isLvlUp, filter.isLvlUp)
					: undefined,
			),
		);

	return {
		channels,
	};
}
