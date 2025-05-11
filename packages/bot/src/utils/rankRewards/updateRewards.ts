import { type DataStoreInterface, getLteRankRewards } from '@rankbot/db';
import type { Guild, GuildMember } from 'discord.js';
import { appendRoles, removeRoles } from '../discord';

export async function updateRewards(
	store: DataStoreInterface,
	guild: Guild,
	member: GuildMember,
	userLvl: number,
	isVc: boolean,
) {
	await store.do(async (db) => {
		const rewards = await getLteRankRewards(db, guild.id, userLvl, isVc);
		if (!rewards) return;
		let processedRoleIds: string[] = [];

		for (const reward of rewards) {
			const appendTargetRoles = reward.appendRoles
				.map((x) => {
					if (processedRoleIds.includes(x)) return;
					const role = guild.roles.cache.get(x);

					return role;
				})
				.filter((x) => !!x);

			processedRoleIds = await appendRoles(
				member,
				appendTargetRoles,
				processedRoleIds,
			);

			const removeTargetRoles = reward.removeRoles
				.map((x) => {
					if (processedRoleIds.includes(x)) return;
					const role = member.roles.cache.get(x);
					return role;
				})
				.filter((x) => !!x);

			processedRoleIds = await removeRoles(
				member,
				removeTargetRoles,
				processedRoleIds,
			);
		}
	});
}
