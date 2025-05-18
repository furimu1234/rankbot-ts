import {
	createUserHistory,
	createUserLvl,
	getGuildHistoryies,
	getUserHistory,
	updateUserHistory,
	updateUserLvl,
} from '@rankbot/db';
import type { GuildManager, GuildMember } from 'discord.js';
import type { ContainerRef } from '../../types';
import { vcLvlUp } from './lvlup';

export async function initExp(container: ContainerRef, guilds: GuildManager) {
	if (!container.current) throw new Error();

	const store = await container.current.getDataStore();
	const lvlCalc = container.current.lvlCalc;

	const processedMemberIds: string[] = [];

	for (const guild of guilds.cache.values()) {
		await store.do(async (db) => {
			const noSavedTimes = await getGuildHistoryies(db, guild.id);

			for (const noSavedTime of noSavedTimes) {
				if (processedMemberIds.includes(noSavedTime.userId)) continue;

				let userLvl = await vcLvlUp(db, lvlCalc, guild, {
					id: noSavedTime.userId,
				} as GuildMember);
				const userHistory = await getUserHistory(
					db,
					noSavedTime.userId,
					guild.id,
				);

				if (!userLvl) {
					userLvl = await createUserLvl(db, {
						userId: noSavedTime.userId,
						guildId: guild.id,
					});
				}

				if (userHistory && userLvl) {
					userHistory.removeTime = new Date();
					userHistory.resultSeconds = userLvl.vcTotalConnectSeconds;
					await updateUserHistory(db, userHistory);
				}

				await updateUserLvl(db, userLvl);

				processedMemberIds.push(userLvl.userId);

				const member = await guild.members.cache.get(noSavedTime.userId);

				if (!member || !member.voice.channel) continue;

				await createUserHistory(db, {
					guildId: guild.id,
					userId: member.id,
					joinedTime: new Date(),
				});
			}
		});
	}
}
