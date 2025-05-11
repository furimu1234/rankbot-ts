import { getRankRewards, updateRankRewards } from '@rankbot/db';
import {
	ActionRowBuilder,
	type ButtonInteraction,
	type CacheType,
	ComponentType,
	Events,
	MessageFlags,
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
	roleMention,
} from 'discord.js';
import { makeRankRewardsSetting } from '../../components';
import { container } from '../../container';
import { sendDeleteAfterMessage } from '../../utils/discord';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('update_remove_roles:')) return;

	const targetLvlString = interaction.customId.split(':')[1];
	const targetlvl = Number.parseInt(targetLvlString);

	const targetIsVcString = interaction.customId.split(':')[2];
	const targetIsVc = targetIsVcString.toLowerCase() === 'vc';

	const store = container.current.getDataStore();

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

	const effect = await store.do(async (db) => {
		let rewards = await getRankRewards(db, guild.id, targetlvl, targetIsVc);

		if (!rewards) return;

		let content = `${roleMention(selectedRoleId)}を追加しました`;
		if (!rewards.removeRoles.includes(selectedRoleId)) {
			if (rewards.removeRoles.length === 10) return;
			rewards.removeRoles.push(selectedRoleId);
		} else {
			content = `${roleMention(selectedRoleId)}を削除しました`;
			rewards.removeRoles = rewards.removeRoles.filter(
				(x) => x !== selectedRoleId,
			);
		}

		rewards = await updateRankRewards(db, rewards);

		return { rewards, content };
	});

	if (!effect) {
		sendDeleteAfterMessage(
			{
				content: `${targetlvl}(${targetIsVcString})の剥奪ロールが既に10個設定されてるか、設定が見つからなかったためキャンセルしました`,
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const components = makeRankRewardsSetting(guild, effect.rewards);
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
