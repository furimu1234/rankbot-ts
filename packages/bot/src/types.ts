import type { channelFilter, roleFilter } from '@rankbot/db/src/schema';
import type {
	GuildBasedChannel,
	Interaction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	Role,
} from 'discord.js';
import type { InferInsertModel } from 'drizzle-orm';
import type { Container as ContainerInstance } from './container';

export type Container = Awaited<ReturnType<typeof ContainerInstance>>;
export type Ref<T> = { current: T };
export type ContainerRef = Ref<
	Awaited<ReturnType<typeof ContainerInstance> | undefined>
>;

export type commandExecute = (interaction: Interaction) => Promise<void>;
export type slashCommands = RESTPostAPIChatInputApplicationCommandsJSONBody[];

export interface GetDiscordRolesResponse {
	role: Role;
	db: InferInsertModel<typeof roleFilter>;
}

export interface GetDiscordChannelsResponse {
	channel: GuildBasedChannel;
	db: InferInsertModel<typeof channelFilter>;
}

export type jpListType = 'ブラック' | 'ホワイト';
