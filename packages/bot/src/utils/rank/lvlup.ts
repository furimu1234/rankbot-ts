import {
	type SchemaDB,
	createUserLvl,
	getUserHistory,
	getUserLvl,
	updateUserLvl,
} from '@rankbot/db';
import type { Guild, GuildMember } from 'discord.js';
import type { Container } from '../../types';

export async function vcLvlUp(
	db: SchemaDB,
	lvlCalc: Container['lvlCalc'],
	guild: Guild,
	member: GuildMember,
) {
	const lastJoinTimeData = await getUserHistory(db, member.id, guild.id);

	if (!lastJoinTimeData) return;

	let userLvl = await getUserLvl(db, member.id, guild.id);

	if (!userLvl) {
		userLvl = await createUserLvl(db, {
			userId: member.id,
			guildId: guild.id,
		});
	}

	//レベル計算

	const oldConnectSeconds = Number.parseInt(userLvl.vcTotalConnectSeconds);

	const resultSeconds = Math.round(
		(new Date().getTime() - lastJoinTimeData.joinedTime.getTime()) / 10 / 1000,
	);
	userLvl.vcTotalConnectSeconds = (
		oldConnectSeconds + resultSeconds
	).toString();

	await updateUserLvl(db, userLvl);
	return userLvl;
}
