import type { Guild, Role } from 'discord.js';

export function getIdsToRoles(guild: Guild, roleIds: string[]): Role[] {
	return roleIds
		.map((x) => {
			const role = guild.roles.cache.get(x);

			if (!role) return;

			return role;
		})
		.filter((x) => !!x);
}
