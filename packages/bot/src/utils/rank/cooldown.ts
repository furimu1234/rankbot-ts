export function isMessageCoolDown(targetTime: Date): boolean {
	const now = new Date();
	const diffMs = now.getTime() - targetTime.getTime();
	const diffMinutes = diffMs / (1000 * 60);

	return diffMinutes < 3;
}
