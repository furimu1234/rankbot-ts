import type { dbListType } from '@rankbot/db';
import { type ButtonInteraction, Events, MessageFlags } from 'discord.js';
import { makeRankFilterSettingFromChannel } from '../../components/rankFilter';
import { container } from '../../container';

import { sendDeleteAfterMessage } from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('rankfilter_channel:')) return;

	const categoryId = interaction.customId.split(':')[1];
	console.log(interaction.customId);
	const targetChannelId = interaction.customId.split(':')[2];
	const targetChannel = guild.channels.cache.get(targetChannelId);
	await interaction.deferUpdate();
	if (!targetChannel) {
		sendDeleteAfterMessage(
			{
				content: `${targetChannelId}のチャンネルがサーバー内に見つかりませんでした。削除してなければ時間を空けてもう一度ボタンを押してみてください`,
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}

	const { channels, roles, inRolesListType, masterFilter } = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: categoryId },
		channelFilter: {
			channelId: targetChannelId,
		},
		roleFilter: {
			parentId: targetChannelId,
		},
		interaction,
	});

	if (!channels || channels.length === 0) {
		sendDeleteAfterMessage(
			{
				content: `${targetChannel.name}の設定が見つかりませんでした`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}
	const channelFilter = channels[0];

	const inRoles = roles.filter((x) => x.parentId === targetChannelId);
	if (!inRoles) return;

	const listType: dbListType =
		inRolesListType == null ? 'black' : inRolesListType;

	const components = makeRankFilterSettingFromChannel(
		targetChannel,
		channelFilter,
		inRoles
			.map((x) => {
				if (
					(listType === 'black' && x.isLvlUp) ||
					(listType === 'white' && !x.isLvlUp)
				)
					return undefined;

				const role = guild.roles.cache.get(x.roleId);

				return role;
			})
			.filter((x) => !!x),
	);

	await interaction.channel.send({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
}
