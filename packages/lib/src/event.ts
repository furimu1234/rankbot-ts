export class AsyncEvent {
	private _isSet = false;
	private _resolvers: (() => void)[] = [];

	// set()でイベントを立てる
	set() {
		this._isSet = true;
		for (const resolve of this._resolvers) {
			resolve();
		}
		this._resolvers = []; // 全解除
	}

	// wait()でイベントが立つのを待つ
	async wait(): Promise<void> {
		if (this._isSet) return;
		return new Promise((resolve) => {
			this._resolvers.push(resolve);
		});
	}

	// 状態確認用（オプション）
	isSet() {
		return this._isSet;
	}

	// クリアして再利用したいなら追加
	clear() {
		this._isSet = false;
	}
}
