import { updateRoleFilter } from '@rankbot/db';
import { sleep } from '@rankbot/lib';
import {
	type ButtonInteraction,
	ChannelType,
	Events,
	MessageFlags,
} from 'discord.js';
import { container } from '../../container';

import { makeRankFilterSetting } from '../../components/rankFilter';
import { boolToOn } from '../../utils/convert';
import {
	getDiscordChannelsFromDB,
	getDiscordRolesFromDB,
	sendDeleteAfterMessage,
} from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('rankfilter_role:')) return;

	const targetCategoryId = interaction.customId.split(':')[1];
	const targetCategory = guild.channels.cache
		.filter((x) => x.type === ChannelType.GuildCategory)
		.get(targetCategoryId);
	if (!targetCategory) {
		sendDeleteAfterMessage(
			{
				content: `${targetCategoryId}のカテゴリがサーバー内に見つかりませんでした。削除してなければ、時間を空けてもう一度ボタンを押してみてください`,
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}
	const targetRoleId = interaction.customId.split(':')[2];
	const targetRole = guild.roles.cache.get(targetRoleId);
	if (!targetRole) {
		sendDeleteAfterMessage(
			{
				content: `${targetRoleId}ロールが${guild.name}内に見つかりませんでした。削除してなければ、時間を空けてもう一度ボタンを押してみてください`,
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}

	await interaction.deferUpdate();

	let filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: targetCategoryId },
		channelFilter: { categoryId: targetCategoryId },
		roleFilter: { parentId: targetCategoryId, roleId: targetRoleId },
		interaction,
	});
	const store = filter.store;

	if (filter.roles.length === 0) {
		sendDeleteAfterMessage(
			{
				content: '不明なエラーが発生したため処理をキャンセルしました',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}
	const roleFilter = filter.roles[0];

	const { newRoleFilter } = await store.do(async (db) => {
		roleFilter.isLvlUp = !roleFilter.isLvlUp;

		const newRoleFilter = await updateRoleFilter(db, roleFilter);

		return {
			newRoleFilter,
		};
	});

	filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: targetCategoryId },
		channelFilter: { categoryId: targetCategoryId },
		roleFilter: { parentId: targetCategoryId },
		interaction,
	});

	const components = makeRankFilterSetting(
		getDiscordChannelsFromDB(guild, filter.channels),
		getDiscordRolesFromDB(guild, filter.roles),
		filter.masterFilter,
	);

	await interaction.editReply({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
	const message = await interaction.channel.send({
		content: `${targetRole.name}のレベルUPを${boolToOn(newRoleFilter.isLvlUp)}に変更しました`,
	});
	await sleep(10);
	await message.delete();
}
