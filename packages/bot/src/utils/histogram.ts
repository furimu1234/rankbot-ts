import { Canvas } from '@napi-rs/canvas';
import { Chart, type ChartConfiguration, registerables } from 'chart.js';

// 1) 使うスケール／要素を登録
Chart.register(...registerables);
Chart.defaults.font.family = 'IPAexGothic, sans-serif';
Chart.defaults.font.size = 12;
Chart.defaults.font.weight = 'normal';

function createHistogramCounts(
	values: number[],
	binSize: number,
	maxValue: number,
): { labels: string[]; counts: number[] } {
	const binCount = Math.ceil(maxValue / binSize);
	const counts = new Array<number>(binCount).fill(0);
	for (const v of values) {
		if (v >= 0) {
			const idx = Math.min(Math.floor(v / binSize), binCount - 1);
			counts[idx]++;
		}
	}
	const labels = Array.from({ length: binCount }, (_, i) =>
		(i * binSize).toString(),
	);
	return { labels, counts };
}

export async function generateLevelHistogram(
	lvlValues: number[],
): Promise<Buffer> {
	const canvas = new Canvas(1000, 600);
	const ctx = canvas.getContext('2d');

	const BIN_SIZE = 10;
	const MAX_VALUE = 200;
	const { labels, counts } = createHistogramCounts(
		lvlValues,
		BIN_SIZE,
		MAX_VALUE,
	);

	// 3. Chart.js 設定
	const config: ChartConfiguration<'bar', number[], string> = {
		type: 'bar',
		data: { labels, datasets: [{ label: '人数', data: counts }] },
		options: {
			plugins: {
				title: { display: true, text: 'レベル分布' },
				legend: { display: false },
			},
			scales: {
				x: {
					type: 'category',
					title: { display: true, text: 'レベル' },
					grid: { display: false },
					ticks: { callback: (t) => labels[Number(t)] },
				},
				y: {
					type: 'linear',
					title: { display: true, text: '人数' },
					grid: {},
					min: 0,
					max: 50,
					ticks: { stepSize: 5 },
					border: { dash: [5, 5] },
				},
			},
			layout: { padding: 10 },
		},
	};

	// 4. 描画
	// @ts-ignore: Chart.js はブラウザ向け API だが node-canvas 上でも動く
	new Chart(ctx, config);

	// 5. PNG Buffer を返す
	return await canvas.toBuffer('image/png');
}
