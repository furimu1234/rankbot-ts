import { createUserLvl, getUserLvl, updateUserLvl } from '@rankbot/db';
import { getLastSendMessageTime, setLastSendMessageTime } from '@rankbot/redis';
import { Events, type Message } from 'discord.js';
import { container } from '../../container';
import { isLvlUpBlock } from '../../utils';
import getFilters from '../../utils/rankFilter/getInitialFilter';
import { updateRewards } from '../../utils/rankRewards';
export const name = Events.MessageCreate;
export const once = false;
export async function execute(message: Message): Promise<void> {
	if (!container.current) {
		return;
	}
	const guild = message.guild;

	if (!guild) return;
	const guildId = message.guildId;

	if (message.member === null) return;

	const author = message.member;
	if (message.author.bot) return;

	if (!message.channel.isSendable()) return;
	if (!('parentId' in message.channel)) return;
	const categoryId = message.channel.parentId;

	if (!categoryId) return;

	const store = await container.current.getDataStore();
	const lvlCalc = container.current.lvlCalc;

	const redis = await container.current.getRedisClient(true);

	if (!guildId) return;

	const lastSendMessageTime = await getLastSendMessageTime(
		redis,
		guildId,
		message.member.id,
	);

	//if (isMessageCoolDown(lastSendMessageTime)) return;

	const filter = await getFilters({
		container,
		masterFilter: { guildId: guildId, categoryId: categoryId },
		channelFilter: { channelId: message.channelId },
		roleFilter: { guildId: guildId },
		channel: message.channel,
	});
	if (await isLvlUpBlock(filter, author)) return;
	const userLvl = await store.do(async (db) => {
		if (!guildId) return;

		let userLvl = await getUserLvl(db, message.author.id, guildId);

		if (!userLvl) {
			userLvl = await createUserLvl(db, {
				userId: message.author.id,
				guildId: guildId,
			});
		}
		//レベル計算
		const { mexp, mlvl } = lvlCalc({
			connectSeconds: userLvl.vcTotalConnectSeconds,
			mexp: userLvl.mexp,
			mlvl: userLvl.mlvl,
		}).mes();

		userLvl.mexp = mexp || 0;
		userLvl.mlvl = mlvl || 0;

		await updateUserLvl(db, userLvl);
		await setLastSendMessageTime(redis, guildId, author.id);
		await redis.quit();
		return userLvl.mlvl;
	});

	if (userLvl === undefined) return;

	updateRewards(store, guild, author, userLvl, false);
}
