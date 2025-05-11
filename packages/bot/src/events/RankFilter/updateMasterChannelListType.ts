import { updateMasterFilter } from '@rankbot/db';
import { sleep } from '@rankbot/lib';
import { type ButtonInteraction, Events, MessageFlags } from 'discord.js';
import { makeRankFilterSetting } from '../../components/rankFilter';
import { container } from '../../container';
import { boolToOn } from '../../utils';
import {
	getDiscordChannelsFromDB,
	getDiscordRolesFromDB,
	sendDeleteAfterMessage,
} from '../../utils/discord';
import getFilters from '../../utils/rankFilter/getInitialFilter';

export const name = Events.InteractionCreate;
export const once = false;
export async function execute(interaction: ButtonInteraction): Promise<void> {
	if (!container.current) return;

	const guild = interaction.guild;

	if (!guild) return;

	if (!interaction.channel || !interaction.channel.isSendable()) return;

	if (!interaction.customId) return;

	if (!interaction.customId.includes('update_master_channel_list_type:'))
		return;

	const categoryId = interaction.customId.split(':').slice(-1)[0];

	await interaction.deferUpdate();

	const filter = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: categoryId },
		channelFilter: undefined,
		roleFilter: undefined,
		interaction,
	});
	const store = filter.store;

	const { isLvlUp, db } = await store.do(async (db) => {
		const masterFilter = filter.masterFilter;
		const guild = interaction.guild;

		if (!guild) {
			return {
				db: undefined,
				isLvlUp: true,
			};
		}

		masterFilter.channelBaseIsLvlUp = !masterFilter.channelBaseIsLvlUp;

		const newMasterFilter = await updateMasterFilter(db, masterFilter);

		return {
			isLvlUp: masterFilter.channelBaseIsLvlUp,
			db: newMasterFilter,
		};
	});

	if (!db) {
		sendDeleteAfterMessage(
			{
				content: `${guild.name}の設定が見つかりませんでした`,
				ephemeral: false,
				sleepSecond: 15,
			},
			interaction,
		);

		return;
	}

	const { channels, roles, masterFilter } = await getFilters({
		container,
		masterFilter: { guildId: guild.id, categoryId: categoryId },
		channelFilter: { categoryId: categoryId },
		roleFilter: { guildId: guild.id, parentId: categoryId },
		interaction,
	});

	const components = makeRankFilterSetting(
		getDiscordChannelsFromDB(guild, channels),
		getDiscordRolesFromDB(guild, roles),
		masterFilter,
	);

	await interaction.editReply({
		components: [components],
		flags: MessageFlags.IsComponentsV2,
	});
	const message = await interaction.channel.send({
		content: `チャンネルのレベルUPを${boolToOn(masterFilter.channelBaseIsLvlUp)}にしました`,
	});
	await sleep(10);
	await message.delete();
}
