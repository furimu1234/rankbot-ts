import {
	ApplicationIntegrationType,
	type ChatInputCommandInteraction,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandChannelOption,
	SlashCommandUserOption,
	type User,
} from 'discord.js';
import { container } from '../container';
import { boolToOn, isLvlUpBlock, toJpListType } from '../utils';
import {
	memberHasroleIdsToString,
	sendDeleteAfterMessage,
} from '../utils/discord';
import getFilters from '../utils/rankFilter/getInitialFilter';

export const data = new SlashCommandBuilder()
	.setName('ランクフィルター確認')
	.setDescription('ランクフィルターのシミュレーションをします')
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageChannels & PermissionFlagsBits.ManageRoles,
	)
	.addChannelOption(
		new SlashCommandChannelOption()
			.setName('シミュレーションチャンネル')
			.setDescription('確認するチャンネル')
			.setRequired(true),
	)
	.addUserOption(
		new SlashCommandUserOption()

			.setName('対象ユーザ')
			.setDescription('確認するユーザ'),
	)
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		await interaction.deferReply();
	} catch {}

	const guild = interaction.guild;

	if (!guild) return;
	if (!container.current) return;

	const targetChannelOption = interaction.options.get(
		'シミュレーションチャンネル',
	);
	const targetUserOption = interaction.options.get('対象ユーザ');

	if (targetChannelOption === null) {
		sendDeleteAfterMessage(
			{
				content: 'シミュレーションチャンネルが指定されてませんでした。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const targetChannel = targetChannelOption.channel;
	let targetUser: User | undefined = interaction.user;

	if (targetUserOption) {
		targetUser = targetUserOption.user;
	}

	if (!targetChannel) {
		sendDeleteAfterMessage(
			{
				content: 'チャンネルが見つかりませんでした',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	if (!('parentId' in targetChannel)) {
		sendDeleteAfterMessage(
			{
				content: `${targetChannel}にカテゴリーが見つかりませんでした`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}
	const categoryId = targetChannel.parentId ?? '';

	if (!targetUser) {
		sendDeleteAfterMessage(
			{
				content: 'ユーザが見つかりませんでした',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const member = guild.members.cache.get(targetUser.id);

	if (!member) {
		sendDeleteAfterMessage(
			{
				content: `${targetUser.id}のユーザがこのサーバーに見つかりませんでした`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const filter = await getFilters({
		container,
		masterFilter: {
			guildId: guild.id,
			categoryId: categoryId,
		},
		channelFilter: {
			channelId: targetChannel.id,
		},
		roleFilter: {
			parentId: categoryId,
		},
		interaction: interaction,
	});

	const lvlUpOFFRoleIds = filter.roles
		.filter((x) => !x.isLvlUp)
		.map((x) => x.roleId);

	const isLvlUp = !(await isLvlUpBlock(filter, member));
	const channelBaseIsLvlUp = filter.masterFilter.channelBaseIsLvlUp;

	if (isLvlUp) {
		await interaction.followUp({
			content: '# レベルUP:  ON',
		});
	} else {
		if (filter.channels.length > 0) {
			const channelFilter = filter.channels[0];
			if (!channelFilter.isLvlUp) {
				await interaction.followUp({
					content: '# レベルUP:  OFF\n## チャンネル個別設定',
				});
				return;
			}
			const jpListType = toJpListType(channelFilter.listType);

			if (channelFilter.listType === 'black') {
				const ignoreRoles = memberHasroleIdsToString(
					channelFilter.ignoreRoleIds,
					member,
				);

				if (ignoreRoles.length !== 0) {
					await interaction.followUp({
						content: `# レベルUP:  OFF\n## チャンネル個別設定\n### リストタイプ: ${jpListType}\n${ignoreRoles}`,
					});
				}
			}
			const onlyRoles = memberHasroleIdsToString(
				channelFilter.onlyRoleIds,
				member,
			);
			if (onlyRoles.length !== 0) {
				await interaction.followUp({
					content: `# レベルUP:  OFF\n## チャンネル個別設定\n### リストタイプ: ${jpListType}\n${onlyRoles}`,
				});
			} else {
				await interaction.followUp({
					content: `# レベルUP:  OFF\n## チャンネル個別設定\n### リストタイプ: ${jpListType}\nホワイトロールのロール無`,
				});
			}
			return;
		}

		if (filter.roles.length > 0) {
			const memberHasRoles = member.roles.cache
				.filter((x) => lvlUpOFFRoleIds.includes(x.id))
				.map((x) => {
					return `- ${x}`;
				})
				.filter((x) => !!x);

			if (memberHasRoles.length !== 0) {
				await interaction.followUp({
					content: `# レベルUP:  OFF\n## レベルUP: OFFロール設定\n${memberHasRoles}`,
				});
			}
			return;
		}

		await interaction.followUp({
			content: `# レベルUP:  ${boolToOn(channelBaseIsLvlUp)}\n## レベルUP設定`,
		});
	}
}
