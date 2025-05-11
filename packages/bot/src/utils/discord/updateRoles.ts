import type { GuildMember, Role } from 'discord.js';

export async function appendRoles(
	member: GuildMember,
	roles: Role[],
	processedRoleIds: string[] = [],
) {
	if (roles.length === 0) return processedRoleIds;

	for (const appendRole of roles) {
		if (processedRoleIds.includes(appendRole.id)) continue;
		await member.roles.add(appendRole);
		processedRoleIds.push(appendRole.id);
	}
	return processedRoleIds;
}

export async function removeRoles(
	member: GuildMember,
	roles: Role[],
	processedRoleIds: string[] = [],
) {
	if (roles.length === 0) return processedRoleIds;
	for (const removeRole of roles) {
		if (processedRoleIds.includes(removeRole.id)) continue;
		await member.roles.remove(removeRole);
		processedRoleIds.push(removeRole.id);
	}
	return processedRoleIds;
}
