import { sleep } from '@rankbot/lib';
import {
	ActionRowBuilder,
	type ButtonInteraction,
	type CacheType,
	ComponentType,
	Events,
	MessageFlags,
	RoleSelectMenuBuilder,
	type RoleSelectMenuInteraction,
} from 'discord.js';
import { makeRankFilterSetting } from '../../components/rankFilter';
import { container } from '../../container';
import {
	getDiscordChannelsFromDB,
	getDiscordRolesFromDB,
	sendDeleteAfterMessage,
} from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';
import { updateRoleFilter } from '../../utils/rankFilter/updateFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;
	if (!interaction.customId) return;

	if (!interaction.customId.includes('master_update_roles:')) return;

	const categoryId = interaction.customId.split(':').slice(-1)[0];

	const menu = new RoleSelectMenuBuilder()
		.setCustomId('role_select')
		.setPlaceholder('ロールを選んでください')
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
		const message = await interaction.channel.send({
			content: '3分間ロールが選択されなかったためキャンセルしました。',
		});
		await sleep(15);
		await message.delete();
		return;
	}

	const selectedRoleId = selection.values[0];

	const selectedRole = guild.roles.cache.get(selectedRoleId);

	const filter = await getFilters({
		container,
		masterFilter: { categoryId: categoryId, guildId: guild.id },
		channelFilter: { categoryId: categoryId },
		roleFilter: { guildId: guild.id, parentId: categoryId },
		interaction,
	});

	const effect = await updateRoleFilter(
		categoryId,
		selectedRole,
		filter.roles,
		filter.store,
		interaction,
	);

	if (!effect) {
		sendDeleteAfterMessage(
			{
				content:
					'ロールの更新に失敗しました。時間をおいて再度実行してみてください',
				sleepSecond: 15,
			},
			interaction,
		);
		return;
	}

	const roleIds = filter.roles.map((x) => x.roleId);

	let roles = filter.roles;

	if (effect.newRoleFilter && !roleIds.includes(selectedRoleId)) {
		roles.push(effect.newRoleFilter);
	} else {
		roles = roles.filter((x) => x.roleId !== selectedRoleId);
	}

	const discordRoles = getDiscordRolesFromDB(guild, roles);

	const discordChannels = getDiscordChannelsFromDB(guild, filter.channels);

	const components = makeRankFilterSetting(
		discordChannels,
		discordRoles,
		filter.masterFilter,
	);

	await interaction.message.edit({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});

	const message = await interaction.channel.send({
		content: effect.content,
		components: [],
	});
	await sleep(10);
	await message.delete();
}
