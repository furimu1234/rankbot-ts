import { createUserLvl, getUserLvl, updateUserLvl } from '@rankbot/db';
import {
	getLastRunningTime,
	getNoSavedTimes,
	setLatestJoinTime,
} from '@rankbot/redis';
import type { GuildManager } from 'discord.js';
import type { ContainerRef } from '../../types';

export async function initExp(container: ContainerRef, guilds: GuildManager) {
	if (!container.current) throw new Error();

	const redis = container.current.getRedisClient(true);

	const LastRunningTime = await getLastRunningTime(redis);

	const store = await container.current.getDataStore();
	const lvlCalc = container.current.lvlCalc;

	for (const guild of guilds.cache.values()) {
		const noSavedTimes = await getNoSavedTimes(redis, guild.id);

		await store.do(async (db) => {
			for (const noSavedTime of noSavedTimes) {
				if (!noSavedTime.userId) continue;

				let userLvl = await getUserLvl(db, noSavedTime.userId, guild.id);

				if (!userLvl) {
					userLvl = await createUserLvl(db, {
						userId: noSavedTime.userId,
						guildId: guild.id,
					});
				}

				//レベル計算
				const { vcexp, vclvl } = lvlCalc(userLvl).vc(
					LastRunningTime,
					noSavedTime.time,
				);

				userLvl.vcexp = vcexp || 0;
				userLvl.vclvl = vclvl || 0;

				await updateUserLvl(db, userLvl);

				await redis.delete(noSavedTime.origKey);
				const member = await guild.members.cache.get(noSavedTime.userId);

				if (!member || !member.voice.channel) continue;

				await setLatestJoinTime(redis, guild.id, noSavedTime.userId);
			}
		});
	}
	await redis.quit();
}
