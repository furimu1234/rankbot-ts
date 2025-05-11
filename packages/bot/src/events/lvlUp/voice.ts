import { setLatestJoinTime } from '@rankbot/redis';
import { Events, type VoiceState } from 'discord.js';
import { container } from '../../container';
import { isLvlUpBlock, vcLvlUp } from '../../utils';
import getFilters from '../../utils/rankFilter/getInitialFilter';
import { updateRewards } from '../../utils/rankRewards';

export const name = Events.VoiceStateUpdate;
export const once = false;
export async function execute(
	before: VoiceState,
	after: VoiceState,
): Promise<void> {
	if (before.channelId === after.channelId) return;
	if (!container.current) throw new Error();

	const redis = container.current.getRedisClient(true);
	const store = await container.current.getDataStore();
	const lvlCalc = container.current.lvlCalc;

	if (before.channel && after.channel && before.member && after.member) {
		const beforeMember = before.member;
		const afterMember = after.member;
		const afterChannelId = after.channel.id;
		const parentId = after.channel.parentId ?? '0';
		const guild = after.guild;
		if (!afterChannelId) return;

		//退出処理
		const userLvl = await store.do(async (db) => {
			const userLvl = await vcLvlUp(
				db,
				redis,
				lvlCalc,
				before.guild,
				beforeMember,
			);
			return userLvl.vclvl;
		});

		updateRewards(store, guild, beforeMember, userLvl, true);

		const guildId = afterMember.guild.id;

		const filter = await getFilters({
			container,
			masterFilter: {
				guildId: guildId,
				categoryId: parentId,
			},
			channelFilter: { channelId: afterChannelId },
			roleFilter: { parentId: parentId },
			channel: after.channel,
		});
		if (await isLvlUpBlock(filter, afterMember)) {
			return;
		}

		//移動
		console.log('SET LATEST JOIN TIME');
		await setLatestJoinTime(redis, before.guild.id, afterMember.id);
	}
	//入室
	else if (after.channel && !before.channel && after.member) {
		const afterMember = after.member;
		const guildId = afterMember.guild.id;
		const afterChannelId = after.channel.id;
		const parentId = after.channel.parentId ?? '0';
		if (!afterChannelId) return;

		const filter = await getFilters({
			container,
			masterFilter: { guildId: guildId, categoryId: parentId },
			channelFilter: { channelId: afterChannelId },
			roleFilter: { guildId: guildId, parentId: parentId },
			channel: after.channel,
		});
		if (await isLvlUpBlock(filter, afterMember)) {
			return;
		}

		await setLatestJoinTime(redis, after.guild.id, afterMember.id);
	}

	//退出
	else if (before.channel && !after.channel && before.member) {
		const beforeMember = before.member;
		const guild = before.guild;

		const userLvl = await store.do(async (db) => {
			const userLvl = await vcLvlUp(
				db,
				redis,
				lvlCalc,
				before.guild,
				beforeMember,
			);
			return userLvl.vclvl;
		});

		if (userLvl === undefined) return;

		updateRewards(store, guild, beforeMember, userLvl, true);
	}

	await redis.quit();
}
