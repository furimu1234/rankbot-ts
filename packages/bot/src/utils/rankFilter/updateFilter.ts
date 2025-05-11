import {
	type DataStoreInterface,
	createChannelFilter,
	createRoleFilter,
	deleteChannelsFilter,
	deleteRolesFilter,
	updateChannelFilter as updateDBChannelFilter,
} from '@rankbot/db';
import type {
	channelFilterModel,
	roleFilterModel,
} from '@rankbot/db/src/schema';
import {
	type ButtonInteraction,
	type CacheType,
	type ChatInputCommandInteraction,
	type GuildBasedChannel,
	type Role,
	channelMention,
	roleMention,
} from 'discord.js';
import { sendDeleteAfterMessage } from '../discord';

export const FilterMaxSize = 5;

/**
 * チャンネルフィルターのレコード追加/削除する
 * @param selectedChannel レコードを追加/削除するチャンネル
 * @param store datastore
 * @param interaction interaction
 * @returns 追加しました/削除しました
 */
export async function updateChannelFilter(
	categoryId: string,
	guildId: string,
	selectedChannel: GuildBasedChannel | undefined,
	channelFilters: channelFilterModel[],
	store: DataStoreInterface,
	interaction:
		| ButtonInteraction<CacheType>
		| ChatInputCommandInteraction<CacheType>,
) {
	return await store.do(async (db) => {
		let newChannelFilter: channelFilterModel | undefined = undefined;

		const guildId = interaction.guildId;
		if (!guildId || !selectedChannel) return;

		if (!interaction.channel) return;
		if (!interaction.channel.isSendable()) return;
		//数確認

		const findOneChannel = channelFilters.find(
			(x) => x.channelId === selectedChannel.id,
		);

		//既にチャンネルが10個追加されていて、新規追加の場合はブロック
		if (channelFilters.length === FilterMaxSize && !findOneChannel) {
			sendDeleteAfterMessage(
				{
					content: `チャンネルは${FilterMaxSize}個まで設定できます。新規に追加するには既存の設定を削除してください。`,
					sleepSecond: 15,
				},
				interaction,
			);
			return;
		}

		//データ登録
		//リスト更新ボタンではチャンネルの追加/削除を行う
		let content = '';

		//追加
		if (!findOneChannel) {
			content = `${channelMention(selectedChannel.id)}を追加しました!`;
			newChannelFilter = await createChannelFilter(db, {
				channelId: selectedChannel.id,
				categoryId: categoryId,
				isLvlUp: true,
				guildId: guildId,
			});
			// 削除
		} else {
			content = `${channelMention(selectedChannel.id)}を削除しました!`;
			await deleteChannelsFilter(db, { channelId: selectedChannel.id });
		}

		return { content, newChannelFilter };
	});
}
/**
 * ロールフィルターのレコード追加/削除する
 * @param selectedRole レコードを追加/削除するロール
 * @param store datastore
 * @param interaction interaction
 * @returns 追加しました/削除しました
 */
export async function updateRoleFilter(
	categoryId: string,
	selectedRole: Role | undefined,
	roleFilters: roleFilterModel[],
	store: DataStoreInterface,
	interaction:
		| ButtonInteraction<CacheType>
		| ChatInputCommandInteraction<CacheType>,
) {
	return await store.do(async (db) => {
		let newRoleFilter: roleFilterModel | undefined = undefined;

		const guildId = interaction.guildId;

		if (!guildId || !selectedRole) return;

		if (!interaction.channel) return;
		if (!interaction.channel.isSendable()) return;

		//数確認

		const findOneRole = roleFilters.find((x) => x.roleId === selectedRole.id);

		//既にロールが10個追加されていて、新規追加の場合はブロック
		if (roleFilters.length === FilterMaxSize && !findOneRole) {
			sendDeleteAfterMessage(
				{
					content: `ロールは${FilterMaxSize}個まで設定できます。新規に追加するには既存の設定を削除してください。`,
					sleepSecond: 15,
				},
				interaction,
			);
			return;
		}

		//データ登録
		//リスト更新ボタンではロールの追加/削除を行う
		let content = '';
		//追加
		if (!findOneRole) {
			content = `${roleMention(selectedRole.id)}を追加しました!`;
			newRoleFilter = await createRoleFilter(db, {
				roleId: selectedRole.id,
				guildId: guildId,
				isLvlUp: false,
				parentId: categoryId,
			});
			// 削除
		} else {
			content = `${roleMention(selectedRole.id)}を削除しました!`;
			await deleteRolesFilter(db, { roleId: selectedRole.id, parentId: null });
		}

		return { content, newRoleFilter };
	});
}

interface updateRoleFilterInChannelProps {
	channelFilter: channelFilterModel;
	selectedRole: Role;
	store: DataStoreInterface;
	interaction:
		| ButtonInteraction<CacheType>
		| ChatInputCommandInteraction<CacheType>;
}

interface updateRoleFilterInChannelResponse {
	content: string;
	newChannelFilter?: channelFilterModel;
}

/**
 * 指定したチャンネルのロールフィルターのレコード追加/削除する
 * @param channelFilter 親チャンネルフィルタ
 * @param selectedRole レコードを追加/削除するロール
 * @param roleFilters ロールフィルタ
 * @param store datastore
 * @param interaction interaction
 * @returns 追加しました/削除しました
 */
export async function updateRoleFilterInChannel({
	channelFilter,
	selectedRole,
	store,
	interaction,
}: updateRoleFilterInChannelProps): Promise<
	updateRoleFilterInChannelResponse | undefined
> {
	return await store.do(async (db) => {
		const guildId = interaction.guildId;

		if (!guildId) return;

		if (!interaction.channel) return;
		if (!interaction.channel.isSendable()) return;

		//数確認
		let ignoreRoleIds = channelFilter.ignoreRoleIds;
		let onlyRoleIds = channelFilter.onlyRoleIds;
		let isUpdateBlock = false;

		let content = '';
		if (channelFilter.listType === 'black') {
			if (ignoreRoleIds.includes(selectedRole.id)) {
				content = `${roleMention(selectedRole.id)}をブラックリストから削除しました!`;
				ignoreRoleIds = ignoreRoleIds.filter((x) => x !== selectedRole.id);
			} else {
				if (ignoreRoleIds.length === FilterMaxSize) {
					isUpdateBlock = true;
				}
				content = `${roleMention(selectedRole.id)}をブラックリストに追加しました!`;
				ignoreRoleIds.push(selectedRole.id);
			}
		} else if (channelFilter.listType === 'white') {
			if (onlyRoleIds.includes(selectedRole.id)) {
				content = `${roleMention(selectedRole.id)}をホワイトリストから削除しました!`;
				onlyRoleIds = onlyRoleIds.filter((x) => x !== selectedRole.id);
			} else {
				if (ignoreRoleIds.length === FilterMaxSize) {
					isUpdateBlock = true;
				}
				content = `${roleMention(selectedRole.id)}をホワイトリストに追加しました!`;
				onlyRoleIds.push(selectedRole.id);
			}
		}

		//既にロールが10個追加されていて、新規追加の場合はブロック
		if (isUpdateBlock) {
			sendDeleteAfterMessage(
				{
					content: `ロールは${FilterMaxSize}個まで設定できます。新規に追加するには既存の設定を削除してください。`,
					sleepSecond: 15,
				},
				interaction,
			);
			return;
		}

		channelFilter.ignoreRoleIds = ignoreRoleIds;
		channelFilter.onlyRoleIds = onlyRoleIds;

		//データ登録
		//リスト更新ボタンではロールの追加/削除を行う

		const newChannelFilter = await updateDBChannelFilter(db, channelFilter);

		return { content, newChannelFilter };
	});
}
