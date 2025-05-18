interface UserLevelData {
	connectSeconds: string;
	mlvl?: number;
	mexp?: number;
}

export function LevelCalc(value: UserLevelData) {
	const BASE = 30;

	let { connectSeconds, mexp, mlvl } = value;

	function getVcLvl(): { lvl: number; exp: number; needExp: number } {
		let connectSecondsNumber = Number.parseInt(connectSeconds);
		let level = 1;
		let expForNext = 30; // レベル1→2に必要な経験値

		if (connectSecondsNumber === 0)
			return { lvl: level, exp: 0, needExp: expForNext };

		// 残り経験値が次レベルに上がるための必要値を下回るまでループ

		while (connectSecondsNumber >= expForNext) {
			connectSecondsNumber -= expForNext; // 必要分消費して
			level += 1; // レベルアップ
			expForNext = level * 30; // 次に必要な量を「現在レベル×30」に更新
		}

		return {
			lvl: level,
			exp: expForNext,
			needExp: connectSecondsNumber,
		};
	}
	function mes_up(): { mlvl: number; mexp: number } {
		if (mlvl === undefined || mexp === undefined) {
			return { mlvl: 0, mexp: 0 };
		}

		if (mlvl === 0 && mexp === 0) {
			return { mlvl: 1, mexp: 1 };
		}

		mexp += 1;

		while (mexp >= mlvl * BASE) {
			mexp -= mlvl * BASE;
			mlvl += 1;
		}

		return { mlvl, mexp };
	}

	function getlevelMultiplier(lvl: number) {
		return lvl * BASE;
	}

	function getTotalRequiredExp(currentLevel: number, exp: number): number {
		const totalExp = (BASE * ((currentLevel - 1) * currentLevel)) / 2;
		return totalExp + exp;
	}

	return {
		vc: getVcLvl,
		mes: mes_up,
		getlevelMultiplier,
		getTotalRequiredExp,
	};
}
