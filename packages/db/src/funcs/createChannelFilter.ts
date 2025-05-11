import type { InferInsertModel } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { channelFilter } from '../schema.js';

type createchannelFilter = Omit<
	InferInsertModel<typeof channelFilter>,
	'id' | 'createdAt' | 'updatedAt'
> & { guildId?: string };

/**
 * チャンネルフィルタを作成する
 * @param db transaction
 * @param values model
 * @returns
 */
export async function createChannelFilter(
	db: SchemaDB,
	values: createchannelFilter,
) {
	const results = await db.insert(channelFilter).values(values).returning();
	if (results.length === 0)
		throw new Error(`${values.channelId} INSERT FAILED`);

	if (!values.guildId) throw new Error(`${values.channelId} GUILD IS NONE`);

	return results[0];
}
