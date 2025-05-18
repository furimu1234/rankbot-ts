import {
	createUserHistory,
	createUserLvl,
	getUserHistory,
	getUserLvl,
	updateUserHistory,
	updateUserLvl,
} from '@rankbot/db';
import {
	ApplicationIntegrationType,
	EmbedBuilder,
	type Interaction,
	MessageFlags,
	SlashCommandBuilder,
} from 'discord.js';
import { container } from '../container';
import { vcLvlUp } from '../utils';
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
			userLvl = await vcLvlUp(db, container.current.lvlCalc, guild, member);
			const userHistory = await getUserHistory(db, member.id, guildId);

			if (userLvl && userHistory) {
				await updateUserLvl(db, userLvl);
				userHistory.removeTime = new Date();
				userHistory.resultSeconds = userLvl.vcTotalConnectSeconds;
				await updateUserHistory(db, userHistory);
			}

			await createUserHistory(db, {
				guildId: guildId,
				userId: member.id,
				joinedTime: new Date(),
			});
		}

		return userLvl;
	});

	if (userLvl !== undefined) {
		updateRewards(
			store,
			guild,
			member,
			container.current
				.lvlCalc({
					connectSeconds: userLvl.vcTotalConnectSeconds,
					mexp: userLvl.mexp,
					mlvl: userLvl.mlvl,
				})
				.vc().lvl,
			true,
		);
	}

	if (!userLvl) {
		const embed = new EmbedBuilder().setDescription(
			'レベルが見つかりませんでした。\n\nVCに出入りしてレベルを上げてください。',
		);
		await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		return;
	}
	const lvlCalc = container.current.lvlCalc({
		connectSeconds: userLvl.vcTotalConnectSeconds,
		mexp: userLvl.mexp,
		mlvl: userLvl.mlvl,
	});

	const userVcLvl = lvlCalc.vc();
	console.log(userVcLvl);

	const vclvlStr = `${userVcLvl.needExp} / ${lvlCalc.getlevelMultiplier(userVcLvl.lvl)}`;
	const tclvlStr = `${userLvl.mexp} / ${lvlCalc.getlevelMultiplier(userLvl.mlvl)}`;

	let description = `# VCレベル: ${userVcLvl.lvl}\n`;
	description += `${vclvlStr}\n-# ${lvlCalc.getTotalRequiredExp(userVcLvl.lvl, userVcLvl.needExp) * 10}秒接続\n\n`;

	description += `# TCレベル: ${userLvl.mlvl}\n`;
	description += `${tclvlStr}\n-# ${lvlCalc.getTotalRequiredExp(userLvl.mlvl, userLvl.mexp)}回送信\n\n`;

	const embed = new EmbedBuilder().setDescription(description);

	await interaction.followUp({
		embeds: [embed],
	});
}
