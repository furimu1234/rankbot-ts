import type { GuildMember, Role } from 'discord.js';

export function memberHasroleIdsToString(
	roleIds: string[],
	member: GuildMember,
): string {
	const memberHasRoleIds = member.roles.cache.map((x) => x.id);
	return roleIds
		.filter((x) => memberHasRoleIds.includes(x))
		.map((x) => {
			const role = member.roles.cache.get(x);
			if (!role) return;
			return `- ${role}`;
		})
		.filter((x) => !!x)
		.join('\n');
}

export function memberHasrolesToString(
	roles: Role[],
	member: GuildMember,
): string {
	const memberHasRoleIds = member.roles.cache.map((x) => x.id);
	return roles
		.filter((x) => memberHasRoleIds.includes(x.id))
		.map((x) => {
			return `- ${x}`;
		})
		.filter((x) => !!x)
		.join('\n');
}
