import * as dotenv from 'dotenv';

// .envファイルの環境変数をロード
dotenv.config({
	path: '../../.env',
});

function getEnvVariable(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Environment variable ${key} is missing`);
	}
	return value;
}

export const ENV = {
	TOKEN: getEnvVariable('TOKEN'),
	POST_URL: getEnvVariable('POST_URL'),
	REDIS_URL: getEnvVariable('REDIS_URL'),
};
