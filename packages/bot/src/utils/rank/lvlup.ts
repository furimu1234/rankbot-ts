import {
	type SchemaDB,
	createUserLvl,
	getUserLvl,
	updateUserLvl,
} from '@rankbot/db';
import {
	type RedisClient,
	delLatestJoinTime,
	getLatestJoinTime,
} from '@rankbot/redis';
import type { Guild, GuildMember } from 'discord.js';
import type { Container } from '../../types';

export async function vcLvlUp(
	db: SchemaDB,
	redis: RedisClient,
	lvlCalc: Container['lvlCalc'],
	guild: Guild,
	member: GuildMember,
) {
	const lastJoinTime = await getLatestJoinTime(redis, guild.id, member.id);

	let userLvl = await getUserLvl(db, member.id, guild.id);

	if (!userLvl) {
		userLvl = await createUserLvl(db, {
			userId: member.id,
			guildId: guild.id,
		});
	}

	if (lastJoinTime) {
		//レベル計算
		const { vcexp, vclvl } = lvlCalc(userLvl).vc(new Date(), lastJoinTime);

		userLvl.vcexp = vcexp || 0;
		userLvl.vclvl = vclvl || 0;

		await updateUserLvl(db, userLvl);
	}

	await delLatestJoinTime(redis, guild.id, member.id);

	return userLvl;
}
