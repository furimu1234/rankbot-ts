import {
	type DataStoreInterface,
	createMasterFilter,
	type dbListType,
	type getChannelFilter,
	getChannelsFilter,
	getMasterFilter,
	type getRoleFilter,
	getRolesFilter,
} from '@rankbot/db';
import type {
	channelFilterModel,
	masterFilterModel,
	roleFilterModel,
} from '@rankbot/db/src/schema';
import type {
	ButtonInteraction,
	CacheType,
	ChatInputCommandInteraction,
	SendableChannels,
} from 'discord.js';
import type { ContainerRef } from '../../types';
import { sendDeleteAfterMessage } from '../discord';

type InteractionArg = {
	interaction:
		| ButtonInteraction<CacheType>
		| ChatInputCommandInteraction<CacheType>;
	channel?: never;
};

type ChannelArg = {
	interaction?: undefined;
	channel: SendableChannels;
};

type SharedArgs = {
	container: ContainerRef;
	masterFilter: getMasterFilter;
	channelFilter: getChannelFilter | undefined;
	roleFilter: getRoleFilter | undefined;
};

type GetFiltersArgs = SharedArgs & (InteractionArg | ChannelArg);

export interface FiltersResponseType {
	masterFilter: masterFilterModel;
	channels: channelFilterModel[];
	roles: roleFilterModel[];
	inRolesListType: dbListType | null | undefined;
	store: DataStoreInterface;
}

async function getFilters({
	container,
	masterFilter,
	channelFilter,
	roleFilter,
	interaction,
	channel,
}: GetFiltersArgs): Promise<FiltersResponseType> {
	if (!container.current) {
		sendDeleteAfterMessage(
			{
				content:
					'BOTの準備が整ってませんでした。もう一度実行してみてください。',
				sleepSecond: 15,
			},
			interaction,
			channel,
		);

		throw new Error('BOTキャッシュ中');
	}

	const store = container.current.getDataStore();

	const filter = await store.do(async (db) => {
		let master = await getMasterFilter(db, masterFilter);

		if (!master) {
			master = await createMasterFilter(db, {
				guildId: masterFilter.guildId,
				categoryId: masterFilter.categoryId,
			});
		}

		let channelData = {
			channels: [] as channelFilterModel[],
		};
		let roles: roleFilterModel[] = [];

		if (channelFilter !== undefined) {
			channelData = await getChannelsFilter(db, channelFilter);
		}

		if (roleFilter !== undefined) {
			roles = await getRolesFilter(db, roleFilter);
		}
		return {
			channels: channelData.channels,
			inRolesListType:
				channelData.channels.length > 0
					? channelData.channels[0].listType
					: undefined,
			roles,
			masterFilter: master,
		};
	});

	if (!filter) {
		sendDeleteAfterMessage(
			{
				content:
					'BOTの準備が整ってませんでした。もう一度実行してみてください。',
				sleepSecond: 15,
			},
			interaction,
			channel,
		);

		throw new Error('BOTキャッシュ中');
	}

	return { ...filter, store };
}

export default getFilters;
