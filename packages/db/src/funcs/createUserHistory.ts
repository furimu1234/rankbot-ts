import type { InferInsertModel } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { userconnectHistory } from '../schema.js';

type createUserHistory = Omit<
	InferInsertModel<typeof userconnectHistory>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ユーザのレベルを作成する
 * @param db drizzle
 * @param values values
 * @returns
 */
export async function createUserHistory(
	db: SchemaDB,
	values: createUserHistory,
) {
	const results = await db
		.insert(userconnectHistory)
		.values(values)
		.returning();
	if (results.length === 0) throw new Error(`${values.userId} INSERT FAILED`);

	return results[0];
}
