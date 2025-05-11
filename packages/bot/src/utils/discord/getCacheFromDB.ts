import type { channelFilter, roleFilter } from '@rankbot/db/src/schema';
import type { Guild } from 'discord.js';
import type { InferInsertModel } from 'drizzle-orm';
import type {
	GetDiscordChannelsResponse,
	GetDiscordRolesResponse,
} from '../../types';

export function getDiscordRolesFromDB(
	guild: Guild,
	roles: InferInsertModel<typeof roleFilter>[],
): GetDiscordRolesResponse[] {
	return roles
		.map((x) => {
			const role = guild.roles.cache.get(x.roleId);

			if (!role) return;

			let channel = null;
			if (x.parentId) {
				channel = guild.channels.cache.get(x.parentId);
			}

			if (!channel) {
				channel = null;
			}

			return {
				role,
				db: x,
				channel,
			};
		})
		.filter((x) => !!x);
}

export function getDiscordChannelsFromDB(
	guild: Guild,
	channels: InferInsertModel<typeof channelFilter>[],
): GetDiscordChannelsResponse[] {
	return channels
		.map((x) => {
			const channel = guild.channels.cache.get(x.channelId);

			if (!channel) return;

			return { channel, db: x };
		})
		.filter((x) => !!x);
}
