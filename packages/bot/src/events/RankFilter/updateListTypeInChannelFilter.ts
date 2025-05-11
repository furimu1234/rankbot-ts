import { updateChannelFilter } from '@rankbot/db';
import { sleep } from '@rankbot/lib';
import {
	type ButtonInteraction,
	ChannelType,
	Events,
	MessageFlags,
} from 'discord.js';
import { makeRankFilterSettingFromChannel } from '../../components/rankFilter';
import { container } from '../../container';

import { toJpListType } from '../../utils/convert';
import { getIdsToRoles, sendDeleteAfterMessage } from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('update_list_type_by_channel:')) return;

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
	const targetChannelId = interaction.customId.split(':')[2];
	const targetChannel = targetCategory.children.cache.get(targetChannelId);
	if (!targetChannel) {
		sendDeleteAfterMessage(
			{
				content: `${targetChannelId}のチャンネルが${targetCategory.name}内に見つかりませんでした。削除してなければ、時間を空けてもう一度ボタンを押してみてください`,
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}

	await interaction.deferUpdate();

	const filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: targetCategoryId },
		channelFilter: {
			channelId: targetChannelId,
		},
		roleFilter: undefined,
		interaction,
	});
	const store = filter.store;

	if (filter.channels.length === 0) {
		sendDeleteAfterMessage(
			{
				content: '不明なエラーが発生したため処理をキャンセルしました',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}
	const channelFilter = filter.channels[0];

	const { newChannelFilter } = await store.do(async (db) => {
		channelFilter.listType =
			channelFilter.listType === 'black' ? 'white' : 'black';

		const newChannelFilter = await updateChannelFilter(db, channelFilter);

		return {
			newChannelFilter,
		};
	});

	let roleIds = newChannelFilter.onlyRoleIds;

	if (newChannelFilter.listType === 'black') {
		roleIds = newChannelFilter.ignoreRoleIds;
	}

	const components = makeRankFilterSettingFromChannel(
		targetChannel,
		newChannelFilter,
		getIdsToRoles(guild, roleIds),
	);

	await interaction.editReply({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
	const message = await interaction.channel.send({
		content: `${toJpListType(newChannelFilter.listType)}リストに変更しました`,
	});
	await sleep(10);
	await message.delete();
}
