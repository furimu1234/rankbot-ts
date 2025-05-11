import type { InferSelectModel } from 'drizzle-orm';
import {
	boolean,
	index,
	integer,
	pgSchema,
	serial,
	timestamp,
	varchar,
} from 'drizzle-orm/pg-core';
import type { dbListType } from './handmeid';

export const dbSchema = pgSchema('level');

export const userLevel = dbSchema.table(
	'user_level',
	{
		id: serial('id').primaryKey(),
		userId: varchar('user_id', { length: 19 }).notNull(),
		guildId: varchar('guild_id', { length: 19 }).notNull(),
		vclvl: integer().default(1).notNull(),
		vcexp: integer().default(1).notNull(),
		mlvl: integer().default(1).notNull(),
		mexp: integer().default(1).notNull(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('user_guild_idx').on(table.userId, table.guildId)],
);

export const channelFilter = dbSchema.table(
	'channel_filter',
	{
		id: serial('id').primaryKey(),
		categoryId: varchar('category_id', { length: 19 }).notNull(),
		channelId: varchar('channel_id', { length: 19 }).notNull(),
		isLvlUp: boolean('is_lvl_up').notNull().default(true),
		listType: varchar('list_type', { length: 5 })
			.$type<dbListType>()
			.default('black')
			.notNull(),
		ignoreRoleIds: varchar('ignore_role_ids', { length: 19 })
			.array()
			.default([])
			.notNull(),
		onlyRoleIds: varchar('only_role_ids', { length: 19 })
			.array()
			.default([])
			.notNull(),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('channel_idx').on(table.channelId)],
);

export const roleFilter = dbSchema.table(
	'role_filter',
	{
		id: serial('id').primaryKey(),
		guildId: varchar('guild_id', { length: 19 }).notNull(),
		roleId: varchar('role_id', { length: 19 }).notNull(),
		parentId: varchar('parent_id', { length: 19 }),
		isLvlUp: boolean('is_lvl_up').notNull().default(true),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('guild_role_idx').on(table.guildId, table.roleId)],
);

export const masterFilter = dbSchema.table(
	'master_filter',
	{
		id: serial('id').primaryKey(),
		guildId: varchar('guild_id', { length: 19 }).notNull(),
		categoryId: varchar('category_id', { length: 19 }).notNull(),
		channelBaseIsLvlUp: boolean('channel_base_is_lvl_up')
			.notNull()
			.default(true),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('guild_idx').on(table.guildId)],
);

export const rankRewards = dbSchema.table(
	'rank_rewards',
	{
		id: serial('id').primaryKey(),
		guildId: varchar('guild_id', { length: 19 }).notNull(),
		isVc: boolean('is_vc').notNull().default(true),
		lvl: integer().notNull(),
		appendRoles: varchar('append_roles', { length: 19 })
			.array()
			.notNull()
			.default([]),
		removeRoles: varchar('remove_roles', { length: 19 })
			.array()
			.notNull()
			.default([]),
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date()),
	},
	(table) => [index('guild_lvl_idx').on(table.guildId, table.lvl)],
);

export type userLevelFilterModel = InferSelectModel<typeof userLevel>;
export type channelFilterModel = InferSelectModel<typeof channelFilter>;
export type roleFilterModel = InferSelectModel<typeof roleFilter>;
export type masterFilterModel = InferSelectModel<typeof masterFilter>;
export type rankRewardsFilterModel = InferSelectModel<typeof rankRewards>;
