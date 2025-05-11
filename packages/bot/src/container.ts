import { MakeDataStore, schema } from '@rankbot/db';
import { LevelCalc } from '@rankbot/lib';
import { RedisClient } from '@rankbot/redis';
import { drizzle } from 'drizzle-orm/node-postgres';
import Redis from 'ioredis';
import { Pool } from 'pg';
import pino from 'pino';
import { ENV } from './env.js';
import type { ContainerRef } from './types.js';
import { getCallerName } from './utils/getCallername.js';

export const Container = () => {
	const logger = pino({
		transport: {
			target: 'pino-pretty',
			level: 'info',
			options: {
				colorize: true,
				translateTime: 'yyyy-mm-dd HH:MM:ss',
				ignore: 'pid,hostname',
			},
		},
	});

	const lvlCalc = LevelCalc;

	const getDataStore = () => {
		const pool = new Pool({
			connectionString: ENV.POST_URL,
		});

		const client = drizzle<typeof schema>(pool, {
			schema: schema,
		});

		const dataStore = MakeDataStore(client);
		return dataStore;
	};

	const getRedisClient = (isShowLog: boolean, funcName?: string) => {
		const caller = funcName ?? getCallerName(3);

		const client = new RedisClient(
			new Redis(ENV.REDIS_URL),
			isShowLog,
			caller,
			logger,
		);
		return client;
	};

	return {
		logger,
		getDataStore,
		lvlCalc,
		getRedisClient,
	};
};

export const container: ContainerRef = { current: undefined };
