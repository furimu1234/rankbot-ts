import { deleteChannelsFilter, deleteRolesFilter } from '@rankbot/db';
import {
	ApplicationIntegrationType,
	ChannelType,
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	SlashCommandStringOption,
} from 'discord.js';
import { makeRankFilterSetting } from '../components/rankFilter';
import { container } from '../container';
import {
	getDiscordChannelsFromDB,
	getDiscordRolesFromDB,
	sendDeleteAfterMessage,
} from '../utils/discord';
import getFilters from '../utils/rankFilter/getInitialFilter';

export const data = new SlashCommandBuilder()
	.setName('ランク設定')
	.setDescription('サーバーのランクアップのフィルターを設定します')
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageChannels & PermissionFlagsBits.ManageRoles,
	)
	.addChannelOption(
		new SlashCommandChannelOption()
			.addChannelTypes(ChannelType.GuildCategory)
			.setName('対象カテゴリー')
			.setDescription('チャンネルフィルターのカテゴリー')
			.setRequired(true),
	)
	.addStringOption(
		new SlashCommandStringOption()
			.addChoices(
				{
					name: 'する',
					value: 'ON',
				},
				{
					name: 'しない',
					value: 'OFF',
				},
			)
			.setName('設定リフレッシュ')
			.setDescription(
				'チャンネルやロールを設定に残してしまったまま、discordから削除してしまった物を設定から削除する',
			),
	)
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		await interaction.deferReply();
	} catch {}

	const guild = interaction.guild;

	if (!guild) return;

	const categoryOption = interaction.options.get('対象カテゴリー');
	const isRefresh = interaction.options.get('設定リフレッシュ');
	if (!categoryOption) {
		sendDeleteAfterMessage(
			{
				content: 'カテゴリーが指定されてませんでした。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const targetChannel = categoryOption.channel;
	if (!targetChannel) {
		sendDeleteAfterMessage(
			{
				content: 'カテゴリーがDISCORDに見つかりませんでした。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	let filter = await getFilters({
		container,
		masterFilter: { categoryId: targetChannel.id, guildId: guild.id },
		channelFilter: {
			categoryId: targetChannel.id,
		},
		roleFilter: {
			guildId: guild.id,
			parentId: targetChannel.id,
		},
		interaction,
	});

	const store = filter.store;
	let roles = filter.roles;
	let channels = filter.channels;

	if (isRefresh && isRefresh.value === 'ON') {
		await store.do(async (db) => {
			const rolesRefresh = roles.map(async (x) => {
				const role = guild.roles.cache.get(x.roleId);

				if (role) return;

				await deleteRolesFilter(db, { roleId: x.roleId });
			});

			const channelsRefresh = channels.map(async (x) => {
				const channel = guild.channels.cache.get(x.channelId);

				if (channel) return;

				await deleteChannelsFilter(db, { channelId: x.channelId });
			});

			await Promise.all(rolesRefresh);
			await Promise.all(channelsRefresh);
		});
		filter = await getFilters({
			container,
			masterFilter: { categoryId: targetChannel.id, guildId: guild.id },
			channelFilter: {
				categoryId: targetChannel.id,
			},
			roleFilter: {
				guildId: guild.id,
				parentId: targetChannel.id,
			},
			interaction,
		});

		roles = filter.roles;
		channels = filter.channels;
	}

	const discordRoles = getDiscordRolesFromDB(guild, roles);

	const discordChannels = getDiscordChannelsFromDB(guild, channels);

	const components = makeRankFilterSetting(
		discordChannels,
		discordRoles,
		filter.masterFilter,
	);

	await interaction.followUp({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
}
