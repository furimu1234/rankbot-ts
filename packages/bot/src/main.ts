import { Client, Events, GatewayIntentBits } from 'discord.js';

import type { Logger } from 'pino';
import { Container, container } from './container';
import { ENV } from './env';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCommands } from './commands/main';
import { setLastRunningTime } from './intervals';
import { loadEvents } from './loadEvents';
import { initExp } from './utils';

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
	],
});
client.setMaxListeners(30);

let logger: Logger<never, boolean>;

const __filename = fileURLToPath(import.meta.url);
await loadEvents(client, path.resolve(path.dirname(__filename), './events'));

//動作確認時刻保存
setLastRunningTime(container);

client.once(Events.ClientReady, async () => {
	container.current = Container();
	logger = container.current.logger;

	if (client.user) {
		logger.info('=============BOT START=============');
		logger.info(client.user?.displayName);
		const commands = await loadCommands();
		//await slashCommandRegister(client.user, commands);

		//再起動前からVCに入ってた場合、最後に保存された起動時間と保存されてるVC入室時間をもとにexpとレベルを計算する
		await initExp(container, client.guilds);
	}
});

client.on(Events.Error, async (error) => {
	console.error(error);
});

client.login(ENV.TOKEN);
