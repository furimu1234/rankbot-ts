import { type InferInsertModel, and, eq } from 'drizzle-orm';
import type { SchemaDB } from '../client';
import { userLevel } from '../schema';

type updateUserLvl = Omit<
	InferInsertModel<typeof userLevel>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ユーザのレベルを更新する
 * @param db drizzle
 * @param values values
 * @returns
 */
export async function updateUserLvl(db: SchemaDB, values: updateUserLvl) {
	const results = await db
		.update(userLevel)
		.set({ ...values, updatedAt: new Date() })
		.where(
			and(
				eq(userLevel.userId, values.userId),
				eq(userLevel.guildId, values.guildId),
			),
		)
		.returning();
	if (results.length === 0) throw new Error(`${values.userId} UPDATE FAILED`);

	return results[0];
}
