import type { dbListType } from '@rankbot/db';
import type { channelFilter, roleFilterModel } from '@rankbot/db/src/schema';
import type { Guild, GuildMember } from 'discord.js';
import type { InferInsertModel } from 'drizzle-orm';
import type {
	GetDiscordChannelsResponse,
	GetDiscordRolesResponse,
} from '../../types';

export function getListTypeMemberHasRolesFromDB(
	member: GuildMember,
	roles: roleFilterModel[],
	listType: dbListType,
): GetDiscordRolesResponse[] {
	return roles
		.map((x) => {
			if (listType === 'black' && x.isLvlUp) return undefined;
			if (listType === 'white' && !x.isLvlUp) return undefined;

			const role = member.roles.cache.get(x.roleId);

			if (!role) return;

			return {
				role,
				db: x,
			};
		})
		.filter((x) => !!x);
}

export function getListTypeDiscordChannelsFromDB(
	guild: Guild,
	channels: InferInsertModel<typeof channelFilter>[],
	listType: dbListType,
): GetDiscordChannelsResponse[] {
	return channels
		.map((x) => {
			if (listType === 'black' && x.isLvlUp) return undefined;
			if (listType === 'white' && !x.isLvlUp) return undefined;

			const channel = guild.channels.cache.get(x.channelId);

			if (!channel) return;

			return { channel, db: x };
		})
		.filter((x) => !!x);
}
