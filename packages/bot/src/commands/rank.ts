import { createUserLvl, getUserLvl, updateUserLvl } from '@rankbot/db';
import { getLatestJoinTime, setLatestJoinTime } from '@rankbot/redis';
import {
	ApplicationIntegrationType,
	EmbedBuilder,
	type Interaction,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';
import { container } from '../container';
import { updateRewards } from '../utils/rankRewards';

export const data = new SlashCommandBuilder()
	.setName('ランク')
	.setDescription('自分のランクを確認します')
	.setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

export async function execute(interaction: Interaction) {
	if (!interaction.isChatInputCommand()) return;
	await interaction.deferReply();

	if (!container.current) return;
	if (!interaction.guild) return;

	const member = interaction.guild.members.cache.get(interaction.user.id);
	if (!member) return;

	const guild = member.guild;
	const guildId = interaction.guildId;
	const store = container.current.getDataStore();
	const redis = container.current.getRedisClient(true);

	const userLvl = await store.do(async (db) => {
		if (!container.current) return;
		if (!guildId) return;

		let userLvl = await getUserLvl(db, member.id, guildId);

		if (!userLvl) {
			userLvl = await createUserLvl(db, {
				userId: member.id,
				guildId: guildId,
			});
		}

		const memberVoiceJoinned = member.voice.channel;

		if (memberVoiceJoinned) {
			const lvlCalc = container.current.lvlCalc(userLvl);

			const { vcexp, vclvl } = lvlCalc.vc(
				new Date(),
				await getLatestJoinTime(redis, guildId, interaction.user.id),
			);

			userLvl.vcexp = vcexp || 0;
			userLvl.vclvl = vclvl || 0;

			await updateUserLvl(db, userLvl);
			await setLatestJoinTime(redis, guildId, interaction.user.id);
		}

		return userLvl;
	});

	if (userLvl !== undefined) {
		updateRewards(store, guild, member, userLvl.vclvl, true);
	}

	await redis.quit();

	if (!userLvl) {
		const embed = new EmbedBuilder().setDescription(
			'レベルが見つかりませんでした。\n\nVCに出入りしてレベルを上げてください。',
		);
		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		return;
	}
	const lvlCalc = container.current.lvlCalc(userLvl);

	const vclvlStr = `${userLvl.vcexp} / ${lvlCalc.getlevelMultiplier(userLvl.vclvl)}`;
	const tclvlStr = `${userLvl.mexp} / ${lvlCalc.getlevelMultiplier(userLvl.mlvl)}`;

	let description = `# VCレベル: ${userLvl.vclvl}\n`;
	description += `${vclvlStr}\n-# ${lvlCalc.getTotalRequiredExp(userLvl.vclvl, userLvl.vcexp)}秒接続\n\n`;

	description += `# TCレベル: ${userLvl.mlvl}\n`;
	description += `${tclvlStr}\n-# ${lvlCalc.getTotalRequiredExp(userLvl.mlvl, userLvl.mexp)}回送信\n\n`;

	const embed = new EmbedBuilder().setDescription(description);

	await interaction.followUp({
		embeds: [embed],
	});
}
