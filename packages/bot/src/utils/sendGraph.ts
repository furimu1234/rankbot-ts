import { type Client, TextChannel } from 'discord.js';

export async function sendGraph(client: Client<boolean>, buf: Buffer) {
	const channelId = '1364832932509778011';

	// キャッシュにあれば TextChannel として取得、なければ fetch
	const raw =
		client.channels.cache.get(channelId) ??
		(await client.channels.fetch(channelId));
	if (!raw || !(raw instanceof TextChannel)) {
		console.error('TextChannel が見つかりませんでした:', channelId);
		return;
	}
	const channel = raw as TextChannel;

	// ファイルを送信
	await channel.send({
		files: [
			{
				attachment: buf,
				name: 'graph.png',
			},
		],
	});
}
