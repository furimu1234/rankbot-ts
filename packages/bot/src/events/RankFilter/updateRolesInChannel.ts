import {
	ActionRowBuilder,
	type ButtonInteraction,
	type CacheType,
	ChannelType,
	ComponentType,
	Events,
	MessageFlags,
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from 'discord.js';
import { makeRankFilterSettingFromChannel } from '../../components/rankFilter';
import { container } from '../../container';
import { getIdsToRoles, sendDeleteAfterMessage } from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';
import { updateRoleFilterInChannel } from '../../utils/rankFilter/updateFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('update_role_by_channel:')) return;

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

	const menu = new RoleSelectMenuBuilder()
		.setCustomId('role_select')
		.setPlaceholder('更新するロールを選んでください')
		.setMaxValues(1)
		.setMinValues(1);

	const row = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(menu);
	// セレクトメニューを送信
	const _reply = await interaction.reply({
		content: 'ロールを選んでください',
		components: [row],
	});
	const reply = await _reply.fetch();

	let selection: RoleSelectMenuInteraction<CacheType> | undefined = undefined;

	try {
		selection = await reply.awaitMessageComponent({
			componentType: ComponentType.RoleSelect,
			time: 3 * 60 * 1000,
		});
		await selection.deferUpdate();
		await selection.deleteReply();
	} catch (error) {}

	if (!selection) {
		reply.delete();
		sendDeleteAfterMessage(
			{
				content: '3分間ロールが選択されなかったためキャンセルしました。',
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}

	const selectedRoleId = selection.values[0];
	const role = guild.roles.cache.get(selectedRoleId);

	if (!role) {
		sendDeleteAfterMessage(
			{
				content: '不明なエラーが発生したためキャンセルしました。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}
	const filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: targetCategoryId },
		channelFilter: { channelId: targetChannelId },
		roleFilter: undefined,
		interaction,
	});

	const store = filter.store;
	const channels = filter.channels;
	const roles = filter.roles;
	let channelFilter =
		filter.channels.length > 0 ? filter.channels[0] : undefined;

	let listType = filter.inRolesListType;

	if (listType == null) {
		listType = 'black';
	}

	const effect = await updateRoleFilterInChannel({
		channelFilter: channels[0],
		selectedRole: role,
		store,
		interaction,
	});
	channelFilter = effect?.newChannelFilter;

	if (!effect || !channelFilter) {
		sendDeleteAfterMessage(
			{
				content: `${targetChannel.name}の設定が見つかりませんでした`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	let roleIds = channelFilter.onlyRoleIds;

	if (channelFilter.listType === 'black') {
		roleIds = channelFilter.ignoreRoleIds;
	}

	const components = makeRankFilterSettingFromChannel(
		targetChannel,
		channelFilter,
		getIdsToRoles(guild, roleIds),
	);
	sendDeleteAfterMessage(
		{
			content: effect.content,
			sleepSecond: 15,
		},
		interaction,
	);

	await interaction.message.edit({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
}
