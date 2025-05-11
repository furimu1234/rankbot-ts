import { setlastRunningTime } from '@rankbot/redis';
import type { ContainerRef } from '../types';

/**
 * 現在の時刻を10秒ごとにredisに保存する
 * 再起動したときにexpを計算するときに使用する
 * @param container DIコンテナ
 * @param interval　保存間隔
 */
export function setLastRunningTime(container?: ContainerRef, interval = 1000) {
	setInterval(async () => {
		if (!container?.current) return;
		const redis = container.current.getRedisClient(false, 'setLastRunningTime');

		await setlastRunningTime(redis);
		await redis.quit();
	}, 10 * interval);
}
