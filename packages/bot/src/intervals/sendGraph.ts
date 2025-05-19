import { getUserLvls } from '@rankbot/db';
import type { Client } from 'discord.js';
import type { ContainerRef } from '../types';
import { generateLevelHistogram } from '../utils/histogram';
import { sendGraph as sendGraohToDiscord } from '../utils/sendGraph';

/**
 * 現在の時刻を10秒ごとにredisに保存する
 * 再起動したときにexpを計算するときに使用する
 * @param container DIコンテナ
 * @param interval　保存間隔
 */
export function sendGraph(
	client: Client<boolean>,
	container: ContainerRef,
	interval = 1000,
) {
	setInterval(
		async () => {
			if (!container?.current) return;

			const store = container.current.getDataStore();
			await store.do(async (db) => {
				const userLvls = await getUserLvls(db);

				if (!userLvls) return;

				const lvlValues = userLvls
					.map((x) => {
						if (!container.current) return;

						const lvlCalc = container.current.lvlCalc({
							connectSeconds: x.vcTotalConnectSeconds,
							mexp: x.mexp,
							mlvl: x.mlvl,
						});

						return lvlCalc.vc().lvl;
					})
					.filter((x) => x !== undefined);

				const buf = await generateLevelHistogram(lvlValues);

				await sendGraohToDiscord(client, buf);
			});
		},
		60 * 60 * interval,
	);
}
