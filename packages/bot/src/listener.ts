import type { Awaitable, ClientEvents } from 'discord.js';
import type { Container } from './container'; // あなたのDIコンテナ

export function createHandler<K extends keyof ClientEvents>(
	container: Awaited<ReturnType<typeof Container>>,
	listener: (
		container: Awaited<ReturnType<typeof Container>>,
		...args: ClientEvents[K]
	) => Awaitable<void>,
) {
	return (...args: ClientEvents[K]) => {
		return listener(container, ...args);
	};
}
