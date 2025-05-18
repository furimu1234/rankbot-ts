import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client';
import { userconnectHistory } from '../schema';

type updateUserHistory = Omit<
	InferInsertModel<typeof userconnectHistory>,
	'createdAt' | 'updatedAt'
>;

/**
 * ユーザのレベルを更新する
 * @param db drizzle
 * @param values values
 * @returns
 */
export async function updateUserHistory(
	db: SchemaDB,
	values: updateUserHistory,
) {
	const results = await db
		.update(userconnectHistory)
		.set({ ...values, updatedAt: new Date() })
		.where(
			and(
				eq(userconnectHistory.userId, values.userId),
				eq(userconnectHistory.guildId, values.guildId),
				values.id ? eq(userconnectHistory.id, values.id) : undefined,
			),
		)
		.returning();
	if (results.length === 0) throw new Error(`${values.userId} UPDATE FAILED`);

	return results[0];
}
