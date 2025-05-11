import { createRankRewards, getRankRewards } from '@rankbot/db';
import {
	ApplicationIntegrationType,
	type ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
	SlashCommandNumberOption,
	SlashCommandStringOption,
} from 'discord.js';
import { makeRankRewardsSetting } from '../components';
import { container } from '../container';
import { sendDeleteAfterMessage } from '../utils/discord';

export const data = new SlashCommandBuilder()
	.setName('ランク報酬設定')
	.setDescription('ランク報酬の設定をします')
	.setDefaultMemberPermissions(
		PermissionFlagsBits.ManageChannels & PermissionFlagsBits.ManageRoles,
	)
	.addNumberOption(
		new SlashCommandNumberOption()
			.setName('報酬を上げるレベル')
			.setDescription(
				'指定したレベルになったときに報酬を上げるように設定をします',
			)
			.setRequired(true),
	)
	.addStringOption(
		new SlashCommandStringOption()
			.addChoices(
				{
					name: 'vc',
					value: 'vc',
				},
				{
					name: 'tc',
					value: 'tc',
				},
			)
			.setName('vcレベル')
			.setDescription('vcレベルかtcレベルかの設定をします')
			.setRequired(true),
	)
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

export async function execute(interaction: ChatInputCommandInteraction) {
	try {
		await interaction.deferReply();
	} catch {}

	const guild = interaction.guild;

	if (!guild) return;
	if (!container.current) return;

	const targetLvl = interaction.options.get('報酬を上げるレベル');
	const stringIsVc = interaction.options.get('vcレベル');
	const store = container.current.getDataStore();

	if (targetLvl === null) {
		sendDeleteAfterMessage(
			{
				content: 'レベルが指定されてませんでした。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	if (targetLvl.value === undefined) {
		sendDeleteAfterMessage(
			{
				content: 'レベルが指定されてませんでした。',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const numberLvl = Number.parseInt(targetLvl.value.toString());

	let isVc = false;

	if (stringIsVc?.value === 'vc') {
		isVc = true;
	}

	const rewards = await store.do(async (db) => {
		let rewards = await getRankRewards(db, guild.id, numberLvl, isVc);

		if (!rewards) {
			rewards = await createRankRewards(db, {
				guildId: guild.id,
				lvl: numberLvl,
				isVc: isVc,
			});
		}
		return rewards;
	});

	const components = makeRankRewardsSetting(guild, rewards);

	await interaction.followUp({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
}
