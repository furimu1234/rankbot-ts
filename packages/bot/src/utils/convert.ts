import type { dbListType } from '@rankbot/db';
import type { jpListType } from '../types';

/**
 * DBに保存されてるリストタイプを日本語に変換する
 * @param listType dbリストタイプ
 * @returns ブラック / ホワイト
 */
export function toJpListType(listType: dbListType): jpListType {
	return listType === 'black' ? 'ブラック' : 'ホワイト';
}

/**
 * Bool To On/OFF
 * @param enable boolean
 * @returns ON / OFF
 */
export function boolToOn(enable: boolean) {
	return enable ? 'ON' : 'OFF';
}
