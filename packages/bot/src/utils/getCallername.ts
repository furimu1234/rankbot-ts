export function getCallerName(depth = 3): string {
	// depth=0 → this function、1 → getRedisClient、2 → その呼び出し元… という具合
	const err = new Error();
	const stack = err.stack?.split('\n') ?? [];
	if (stack.length > depth) {
		const line = stack[depth].trim();
		// "at 関数名 (ファイルパス:行:列)" を取り出す
		const m = line.match(/^at (\S+)/);

		if (!m) return '<anonymous>';

		if (m[1] === 'execute') {
			// biome-ignore lint/complexity/useLiteralKeys:
			const fp = m['input'] ?? 'folderUndefined/fileUndefined';

			const fpsplit = fp.split('/').slice(-2);
			return `${fpsplit[0]}/${fpsplit[1]}`;
		}

		if (m) return m[1];
	}
	return '<anonymous>';
}
