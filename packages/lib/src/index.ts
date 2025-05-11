export * from './lvlCalc';
export * from './event';
export * from './components';

export function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms * 1000));
}
