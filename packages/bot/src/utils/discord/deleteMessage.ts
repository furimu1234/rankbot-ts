import { sleep } from '@rankbot/lib';
import type {
	ButtonInteraction,
	CacheType,
	ChatInputCommandInteraction,
	InteractionReplyOptions,
	Message,
	MessageCreateOptions,
	SendableChannels,
} from 'discord.js';

type createMessageOptions = (MessageCreateOptions | InteractionReplyOptions) & {
	sleepSecond: number;
};

function isInteractionReplyOptions(
	options: createMessageOptions,
): options is InteractionReplyOptions & { sleepSecond: number } {
	// 明確に InteractionReplyOptions にのみ存在するプロパティで判定する
	return 'ephemeral' in options;
}

/**
 * メッセージ送信後、送信したメッセージを一定秒後に削除する
 * @param options 送信メッセージオプション
 * @param interaction interaction : uiやスラコマのレスポンスの場合
 * @param channel　チャンネルの場合
 */
export async function sendDeleteAfterMessage(
	options: createMessageOptions,
	interaction?:
		| ButtonInteraction<CacheType>
		| ChatInputCommandInteraction<CacheType>,
	channel?: SendableChannels,
) {
	let message: Message | undefined = undefined;

	if (interaction) {
		try {
			const reply = await interaction.reply(options as InteractionReplyOptions);
			message = await reply.fetch();
		} catch {
			const reply = await interaction.followUp(
				options as InteractionReplyOptions,
			);
			message = await reply.fetch();
		}
	} else if (channel) {
		const reply = await channel.send(options as MessageCreateOptions);
		message = await reply.fetch();
	}

	if (message) {
		await sleep(options.sleepSecond);

		try {
			await message.delete();
		} catch {}
	}
}
