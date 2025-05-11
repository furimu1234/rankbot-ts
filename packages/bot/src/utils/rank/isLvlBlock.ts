import type { GuildMember } from 'discord.js';
import type { FiltersResponseType } from '../rankFilter';

export async function isLvlUpBlock(
	filter: FiltersResponseType,
	member: GuildMember,
): Promise<boolean> {
	const channelBaseIsLvlUp = filter.masterFilter.channelBaseIsLvlUp;

	const lvlUpOFFRoleIds = filter.roles
		.filter((x) => !x.isLvlUp)
		.map((x) => x.roleId);
	const memberHasRoleIds = member.roles.cache.map((x) => x.id);

	if (filter.channels.length > 0) {
		const channelFilter = filter.channels[0];
		if (!channelFilter.isLvlUp) return true;
		if (channelFilter.listType === 'black') {
			return channelFilter.ignoreRoleIds.some((x) =>
				memberHasRoleIds.includes(x),
			);
		}
		return channelFilter.onlyRoleIds.every(
			(x) => !memberHasRoleIds.includes(x),
		);
	}

	if (filter.roles.length > 0) {
		const memberHasRoles = member.roles.cache
			.filter((x) => lvlUpOFFRoleIds.includes(x.id))
			.map((x) => x);

		if (memberHasRoles.length > 0) return true;
	}

	return !channelBaseIsLvlUp;
}
