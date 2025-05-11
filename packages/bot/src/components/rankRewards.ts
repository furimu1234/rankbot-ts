import type { rankRewardsFilterModel } from '@rankbot/db/src/schema';
import { addSeparatorBuilder, addTextDisplay } from '@rankbot/lib';
import {
	ButtonBuilder,
	ButtonStyle,
	ContainerBuilder,
	type Guild,
	SectionBuilder,
	TextDisplayBuilder,
	roleMention,
} from 'discord.js';

interface SectionInterface {
	containerName: string;
	customId: string;
	listString: string;
	menuType: 'channel' | 'role';
}

export function makeRankRewardsSettingSection({
	containerName,
	customId,
	listString,
	menuType,
}: SectionInterface) {
	return new SectionBuilder()
		.addTextDisplayComponents([
			new TextDisplayBuilder({
				content: `${containerName}\n${listString}`,
			}),
		])
		.setButtonAccessory(
			new ButtonBuilder()
				.setCustomId(customId)
				.setLabel(menuType === 'channel' ? 'チャンネル更新' : 'ロール更新')
				.setStyle(ButtonStyle.Success),
		);
}

export function __makeRankRewardsSetting(...sections: SectionInterface[]) {
	return new ContainerBuilder().addSectionComponents(
		sections.map((x) => makeRankRewardsSettingSection(x)),
	);
}
export function makeRankRewardsSetting(
	guild: Guild,
	rewards: rankRewardsFilterModel,
) {
	const footerText =
		'- ロール更新ボタンで同じロールを指定すると削除ができます。';

	return new ContainerBuilder()
		.addTextDisplayComponents(
			addTextDisplay(
				`# レベル${rewards.lvl}(${rewards.isVc ? 'VC' : 'TC'})の設定画面`,
			),
		)
		.addSectionComponents(
			makeRankRewardsSettingSection({
				containerName: '# 付与ロール(10個まで)',
				customId: `update_append_roles:${rewards.lvl}:${rewards.isVc ? 'vc' : 'tc'}`,
				listString:
					rewards.appendRoles.length > 0
						? rewards.appendRoles
								.map((x, i) => {
									const role = guild.roles.cache.get(x);

									if (!role) return;

									return `${i + 1} - ${roleMention(x)}`;
								})
								.filter((x) => !!x)
								.join('\n')
						: '- 指定なし',
				menuType: 'channel',
			}),
		)
		.addSeparatorComponents(addSeparatorBuilder())
		.addSectionComponents(
			makeRankRewardsSettingSection({
				containerName: '# 剥奪ロール(10個まで)',
				customId: `update_remove_roles:${rewards.lvl}:${rewards.isVc ? 'vc' : 'tc'}`,
				listString:
					rewards.removeRoles.length > 0
						? rewards.removeRoles
								.map((x, i) => {
									const role = guild.roles.cache.get(x);

									if (!role) return;

									return `${i + 1} - ${roleMention(x)}`;
								})
								.filter((x) => !!x)
								.join('\n')
						: '- 指定なし',
				menuType: 'channel',
			}),
		)
		.addSeparatorComponents(addSeparatorBuilder())
		.addTextDisplayComponents(
			new TextDisplayBuilder({
				content: footerText,
			}),
		);
}
