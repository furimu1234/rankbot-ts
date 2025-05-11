import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { channelFilter } from '../schema.js';

type updatechannelFilter = Omit<
	InferInsertModel<typeof channelFilter>,
	'id' | 'createdAt' | 'updatedAt'
> & { isWhereListType?: boolean };

/**
 * チャンネルフィルタを更新する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function updateChannelFilter(
	db: SchemaDB,
	values: updatechannelFilter,
) {
	const results = await db
		.update(channelFilter)
		.set(values)
		.where(
			and(
				eq(channelFilter.channelId, values.channelId),
				values.isWhereListType === true && values.isLvlUp
					? eq(channelFilter.isLvlUp, values.isLvlUp)
					: undefined,
			),
		)
		.returning();
	if (results.length === 0)
		throw new Error(`${values.channelId} UPDATE FAILED`);

	return results[0];
}
