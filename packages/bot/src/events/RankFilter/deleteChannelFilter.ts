import { deleteChannelsFilter } from '@rankbot/db';
import {
	ActionRowBuilder,
	ButtonBuilder,
	type ButtonInteraction,
	ButtonStyle,
	ChannelType,
	ComponentType,
	Events,
	channelMention,
} from 'discord.js';
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

	if (!interaction.customId.includes('delete_by_channel:')) return;

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

	const okButton = new ButtonBuilder()
		.setCustomId('confirm_ok')
		.setLabel('削除する')
		.setStyle(ButtonStyle.Success);
	const cancelButton = new ButtonBuilder()
		.setCustomId('confirm_cancel')
		.setLabel('キャンセル')
		.setStyle(ButtonStyle.Danger);

	const confirmRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		okButton,
		cancelButton,
	);

	// セレクトメニューを送信
	const _reply = await interaction.reply({
		content: `本当に${targetChannel.name}の設定を削除しますか？`,
		components: [confirmRow],
	});
	const reply = await _reply.fetch();

	try {
		const confirmButton = await reply.awaitMessageComponent({
			componentType: ComponentType.Button,
			time: 3 * 60 * 1000,
		});
		confirmButton.deferUpdate();
		reply.delete();
		if (confirmButton.customId === 'confirm_cancel') {
			sendDeleteAfterMessage(
				{
					content: '設定削除をキャンセルしました',
					sleepSecond: 15,
				},
				interaction,
			);
			return;
		}
	} catch {}

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

	await store.do(async (db) => {
		await deleteChannelsFilter(db, { channelId: channelFilter.channelId });
	});

	//サブパネル削除
	interaction.message.delete();

	sendDeleteAfterMessage(
		{
			content: `${channelMention(targetChannelId)}の設定を削除しました`,
			sleepSecond: 15,
		},
		interaction,
	);
}
