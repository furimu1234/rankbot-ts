import type { InferInsertModel } from 'drizzle-orm';
import type { SchemaDB } from '../client.js';
import { userLevel } from '../schema.js';

type createUserLvl = Omit<
	InferInsertModel<typeof userLevel>,
	'id' | 'createdAt' | 'updatedAt'
>;

/**
 * ユーザのレベルを作成する
 * @param db drizzle
 * @param values values
 * @returns
 */
export async function createUserLvl(db: SchemaDB, values: createUserLvl) {
	const results = await db.insert(userLevel).values(values).returning();
	if (results.length === 0) throw new Error(`${values.userId} INSERT FAILED`);

	return results[0];
}
