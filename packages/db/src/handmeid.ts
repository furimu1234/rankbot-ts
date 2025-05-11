import type { Snowflake } from 'discord.js';

export type dbListType = 'black' | 'white';

interface roleType {
	roleId: Snowflake;
	listType: dbListType;
}

export interface rolesInChannel {
	roles: roleType[];
	listType: dbListType;
}
