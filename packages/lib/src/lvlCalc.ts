interface UserLevelData {
	vclvl?: number;
	vcexp?: number;
	mlvl?: number;
	mexp?: number;
}

export function LevelCalc(value: UserLevelData) {
	const BASE = 3;

	let { vclvl, vcexp, mexp, mlvl } = value;

	function vc_up(now: Date, latestJoinTime?: Date): UserLevelData {
		if (!latestJoinTime) return { vclvl, vcexp };

		if (vclvl === undefined || vcexp === undefined) {
			return { mlvl: 0, mexp: 0 };
		}

		let nowSeconds = now.getTime();
		const lastJoinTimeSeconds = latestJoinTime.getTime();

		if (lastJoinTimeSeconds === 0 || !lastJoinTimeSeconds) {
			return { vclvl, vcexp };
		}

		if (nowSeconds < lastJoinTimeSeconds) {
			nowSeconds = new Date().getTime();
		}

		vcexp += Math.round((nowSeconds - lastJoinTimeSeconds) / 10 / 1000);

		while (vcexp >= vclvl * BASE) {
			vcexp -= vclvl * BASE;
			vclvl += 1;
		}

		return { vclvl, vcexp };
	}
	function mes_up(): UserLevelData {
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
		vc: vc_up,
		mes: mes_up,
		getlevelMultiplier,
		getTotalRequiredExp,
	};
}
