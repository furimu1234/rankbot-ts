import {
	ActionRowBuilder,
	type ButtonInteraction,
	ChannelType,
	Events,
	MessageFlags,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	channelMention,
} from 'discord.js';
import { makeRankFilterSetting } from '../../components/rankFilter';
import { container } from '../../container';
import {
	getDiscordChannelsFromDB,
	getDiscordRolesFromDB,
	sendDeleteAfterMessage,
} from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';
import { updateChannelFilter } from '../../utils/rankFilter/updateFilter';

export const name = Events.InteractionCreate;
export const once = false;

/**
 * ブラックリストの時にリスト更新ボタンが押された場合チャンネル選択画面を表示する
 * チャンネル選択が3分間されなかった場合はキャンセル
 * @param interaction interaction
 * @returns
 */
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;
	const interactionChannel = interaction.channel;

	const member = guild.members.cache.get(interaction.user.id);
	if (!member) return;

	if (!interaction.customId) return;
	if (!interaction.customId.includes('master_update_channels:')) return;
	console.log('RECIVED: ', interaction.customId);

	const categoryId = interaction.customId.split(':').slice(-1)[0];
	const category = guild.channels.cache
		.filter((x) => x.type === ChannelType.GuildCategory)
		.get(categoryId);

	if (!category) return;

	const randomString = generateRandomString();

	const inputChannelIdActionRow =
		new ActionRowBuilder<TextInputBuilder>().addComponents(
			new TextInputBuilder()
				.setLabel('チャンネルIDを3分以内に入力してください')
				.setCustomId(`get_channel_id_by${categoryId}:${randomString}`)
				.setStyle(TextInputStyle.Paragraph)
				.setMaxLength(19)
				.setMinLength(1)
				.setRequired(true),
		);

	await interaction.showModal(
		new ModalBuilder()
			.addComponents([inputChannelIdActionRow])
			.setTitle(`${category.name}`)
			.setCustomId('show_modal'),
	);

	const modal = await interaction.awaitModalSubmit({
		filter: (x) => x.channelId === interactionChannel.id,
		time: 180 * 1000,
	});

	try {
		await modal.deferUpdate();
	} catch {}

	try {
		const field = modal.fields.getField(
			`get_channel_id_by${categoryId}:${randomString}`,
		);
	} catch {
		return;
	}

	const channelId = modal.fields.getField(
		`get_channel_id_by${categoryId}:${randomString}`,
	).value;

	const channel = category.children.cache.get(channelId);

	if (!channel) {
		sendDeleteAfterMessage(
			{
				content: `${channelMention(categoryId)}に入ってないチャンネルのIDが指定されたためキャンセルしました。カテゴリー内にあるチャンネルのIDを入力してください。`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: categoryId },
		channelFilter: { categoryId: categoryId },
		roleFilter: { guildId: guild.id, parentId: categoryId },
		interaction,
	});
	const store = filter.store;
	let channels = filter.channels;
	const roles = filter.roles;
	const masterFilter = filter.masterFilter;

	const effect = await updateChannelFilter(
		categoryId,
		guild.id,
		channel,
		channels,
		store,
		interaction,
	);

	//エラー発生時
	if (!effect) return;

	const channelIds = channels.map((x) => x.channelId);
	if (!effect.newChannelFilter && channelIds.includes(channelId)) {
		channels = channels.filter((x) => x.channelId !== channelId);
	} else if (effect.newChannelFilter) {
		channels.push(effect.newChannelFilter);
	}

	const discordRoles = getDiscordRolesFromDB(guild, roles);

	const discordChannels = getDiscordChannelsFromDB(guild, channels);

	const components = makeRankFilterSetting(
		discordChannels,
		discordRoles,
		masterFilter,
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

/**
 * 指定長のランダム文字列を生成する
 * @param length 生成する文字数（デフォルトは 10）
 */
function generateRandomString(length = 10): string {
	const chars =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + // 大文字
		'abcdefghijklmnopqrstuvwxyz' + // 小文字
		'0123456789'; // 数字
	let result = '';
	for (let i = 0; i < length; i++) {
		// Math.random() 版（シンプルだが暗号論的には弱い）
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
