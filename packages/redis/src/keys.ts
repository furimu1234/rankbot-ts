import { sprintf as sprintF } from 'sprintf-js';

const redisKEYS = () => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	function sprintf(str: string, ...args: any[]) {
		return sprintF(str, ...args);
	}

	return {
		sprintf: sprintf,
		lastSendMessageTime: 'last_send_message_time:%s-%s', // last_send_message_time:guildId-userId
		latestJoinTime: 'latest_join_time:%s_%s', //latest_join_time:guildId_userId
		noSavedTimes: 'latest_join_time:%s-*', //ct_guildId
		lastRunningTime: 'lastRunningTime',
	};
};

export const REDISKEYS = redisKEYS();
