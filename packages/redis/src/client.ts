import { promises as fs } from 'node:fs';
import path from 'node:path';
import type Redis from 'ioredis';
import type { Logger } from 'pino';

export class RedisClient {
	// デフォルトは 127.0.0.1:6379 に接続する
	constructor(
		private redis: Redis,
		private isShowLog: boolean,
		private funcName: string,
		private logger: Logger,
	) {
		if (!this.isShowLog) return;

		this.getClientCount().then((clientCount) => {
			this.save(clientCount, true).then((x) => {
				this.logger.info(
					`${x.filePath} 接続 現在のredisクライアント数: ${x.payload.clientCount}:`,
					x.payload,
				);
			});
		});
	}

	/**
	 * Redis にキーと値を設定する。
	 * 既に重複したキーが存在する場合は、上書きする。
	 *
	 * @param key キー
	 * @param value 値
	 */
	public async set(
		key: string,
		value: string | Buffer | number,
	): Promise<void> {
		await this.redis.set(key, value);
	}

	/**
	 * 引数で指定したキーを削除する。
	 *
	 * @param key 削除対象のキー
	 * @returns 削除できた場合は 1, できなかった場合は 0
	 */
	public async delete(key: string): Promise<number> {
		return await this.redis.del(key);
	}

	/**
	 * Redis からキーに紐づく値を取得する。
	 * キーが存在しない場合は、null を返す。
	 *
	 * @param key 取得対象のキー
	 */
	public async get(key: string): Promise<string | null> {
		return await this.redis.get(key);
	}

	/**
	 * Redis へのコネクションを切断する。
	 */
	public async quit(): Promise<void> {
		const clientCount = (await this.getClientCount()) - 1;
		await this.redis.quit();

		if (this.funcName === 'Timeout._onTimeout') return;

		const { payload, filePath } = await this.save(clientCount, false);

		if (!this.isShowLog) return;
		this.logger.info(
			`${filePath} 切断 現在のredisクライアント数: ${payload.clientCount}`,
		);
	}

	private async save(clientCount: number, isConnect: boolean) {
		// 日付と時刻を整形
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0'); // 01–12
		const day = String(now.getDate()).padStart(2, '0'); // 01–31
		const time = now.toISOString(); // 例: "2025-05-08T09:15:30.000Z"

		// ディレクトリとファイルパス
		let data: Array<{ time: string; clientCount: number }> = [];

		const dir = path.join('redis', 'clientCount');
		await fs.mkdir(dir, { recursive: true });
		const filePath = path.join(dir, `${month}${day}.json`);
		try {
			const text = await fs.readFile(filePath, 'utf-8');
			data = JSON.parse(text);
		} catch {}

		// 書き込むデータ
		const payload = { time, clientCount, isConnect, funcName: this.funcName };
		data.push(payload);

		// JSON ファイルに書き込み
		await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
		return { payload, filePath };
	}

	/**
	 * コマンドを一括して送信する。
	 *
	 * @param params キーと値の配列
	 */
	public async pipeline(
		params: { key: string; value: string | Buffer | number }[],
	): Promise<void> {
		const pipeline = this.redis.pipeline();

		for (const param of params) {
			pipeline.set(param.key, param.value);
		}

		await pipeline.exec();
	}

	/**
	 * list型を追加する。
	 *
	 * @param key キー
	 * @param value 値
	 */
	public async listPush(
		key: string,
		value: (string | number | Buffer)[],
	): Promise<void> {
		await this.redis.rpush(key, ...value);
	}

	/**
	 * list型の値を取得する。
	 *
	 * @param key キー
	 * @param start 開始位置
	 * @param end 終了位置
	 */
	public async getList(key: string, start = 0, end = -1): Promise<string[]> {
		return await this.redis.lrange(key, start, end);
	}

	public async findKeysAndValues(pattern: string) {
		const keys: string[] = [];

		let cursor = '0';
		do {
			const [newCursor, foundKeys] = await this.redis.scan(
				cursor,
				'MATCH',
				pattern,
			);
			cursor = newCursor;
			keys.push(...foundKeys);
		} while (cursor !== '0');

		if (keys.length === 0) {
			return [];
		}

		// キー一覧が取れたら、まとめてMGET
		const values = await this.redis.mget(...keys);

		// キーと値をペアにまとめる
		return keys.map((key, index) => ({
			key,
			value: values[index],
		}));
	}

	/**
	 * すべてのキーを削除する。
	 */
	public async flushall(): Promise<void> {
		await this.redis.flushall();
	}

	private async getClientCount(): Promise<number> {
		const info = await this.redis.info('clients');

		const line = info
			.split('\r\n')
			.find((l) => l.startsWith('connected_clients:'));

		if (!line) {
			throw new Error('connected_clients 行が見つかりませんでした');
		}
		// "connected_clients:42" → ["connected_clients","42"]
		return Number(line.split(':')[1]);
	}
}
