import type {
	channelFilterModel,
	masterFilterModel,
} from '@rankbot/db/src/schema';
import {
	addSectionWithButtonBuilder,
	addSeparatorBuilder,
	addTextDisplay,
} from '@rankbot/lib';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	ContainerBuilder,
	type GuildBasedChannel,
	type MessageActionRowComponentBuilder,
	type Role,
	SectionBuilder,
	TextDisplayBuilder,
	channelMention,
	roleMention,
} from 'discord.js';
import type {
	GetDiscordChannelsResponse,
	GetDiscordRolesResponse,
} from '../../../bot/src/types';
import { boolToOn, toJpListType } from '../utils/convert';

const MAXROWSIZE = 5;

export interface SectionInterface {
	containerName: string;
	customId: string;
	listString: string;
	menuType: 'channel' | 'role';
}

const VCTypes = [ChannelType.GuildVoice, ChannelType.GuildStageVoice];
const CategoryTypes = [ChannelType.GuildCategory];

export function makeRankFilterSettingSection({
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

export function __makeRankFilterSetting(...sections: SectionInterface[]) {
	return new ContainerBuilder().addSectionComponents(
		sections.map((x) => makeRankFilterSettingSection(x)),
	);
}
export function makeRankFilterSetting(
	Channels: GetDiscordChannelsResponse[],
	Roles: GetDiscordRolesResponse[],
	masterFilter: masterFilterModel,
) {
	let row = 0;
	let tmpRow =
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents();
	const channelRows = [];
	const roleRows = [];

	for (const data of Channels) {
		if (row === MAXROWSIZE) {
			channelRows.push(tmpRow);
			tmpRow =
				new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents();
			row = 0;
		}
		tmpRow.components.push(
			new ButtonBuilder()
				.setCustomId(
					`rankfilter_channel:${masterFilter.categoryId}:${data.channel.id}`,
				)
				.setLabel(data.channel.name)
				.setStyle(ButtonStyle.Secondary),
		);
		row++;
	}
	if (row !== 0) {
		channelRows.push(tmpRow);
	}
	row = 0;
	tmpRow =
		new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents();

	// for (const data of Roles) {
	// 	if (row === MAXROWSIZE) {
	// 		roleRows.push(tmpRow);
	// 		tmpRow =
	// 			new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents();
	// 		row = 0;
	// 	}
	// 	tmpRow.components.push(
	// 		new ButtonBuilder()
	// 			.setCustomId(
	// 				`rankfilter_role:${masterFilter.categoryId}:${data.role.id}`,
	// 			)
	// 			.setLabel(data.role.name)
	// 			.setStyle(ButtonStyle.Secondary),
	// 	);
	// 	row++;
	// }
	// if (row !== 0) {
	// 	roleRows.push(tmpRow);
	// }

	let footerText =
		'- 【特定のVC】に【特定のロール】を持ったメンバーが入った時にレベルを上げない様な設定は、チャンネルのボタンを押して表示される画面で設定してください';
	footerText +=
		'\n- メイン画面で設定したロールのレベルUPがOFFになってる場合は、そのロールを持ってる限り、どのチャンネルでもレベルを計算しません。';
	footerText +=
		'\n- メイン画面で設定したチャンネルのレベルUPがOFFになってる場合は、そのチャンネルで個別設定がない限り、どのロールを持っててもレベルを計算しません。';
	footerText +=
		'\n\n- チャンネル個別設定の設定を反映するには再度コマンドを実行するか、切替を実行してください。';

	return (
		new ContainerBuilder()
			.addSectionComponents(
				addSectionWithButtonBuilder({
					contents: [
						`# メイン画面\n# ${channelMention(masterFilter.categoryId)} | レベルUP: ${boolToOn(masterFilter.channelBaseIsLvlUp)}`,
					],
					buttonCustomId: `update_master_channel_list_type:${masterFilter.categoryId}`,
					buttonLabel: 'チャンネルレベルUP切替',
					buttonStyle: ButtonStyle.Primary,
				}),

				makeRankFilterSettingSection({
					containerName:
						'# チャンネル個別設定一覧(5個まで)\n-# 下のボタンを押してチャンネル毎に設定できます。',
					customId: `master_update_channels:${masterFilter.categoryId}`,
					listString:
						Channels.length > 0
							? Channels.map((x, i) => {
									const listType = toJpListType(x.db.listType ?? 'black');
									let jpListType = '';

									if (x.db.isLvlUp) {
										jpListType = ` / ${listType}リスト`;
									}

									return `${i + 1} - ${channelMention(x.channel.id)}(レベルUP: ${boolToOn(x.db.isLvlUp ?? true)}${jpListType})`;
								}).join('\n')
							: '- 指定なし',
					menuType: 'channel',
				}),
			)
			.addActionRowComponents(channelRows)
			.addSeparatorComponents(addSeparatorBuilder())
			.addSectionComponents(
				makeRankFilterSettingSection({
					containerName: '# レベルUP:OFFのロール一覧(5個まで)',
					customId: `master_update_roles:${masterFilter.categoryId}`,
					listString:
						Roles.length > 0
							? Roles.map(
									(x, i) => `${i + 1} - ${roleMention(x.role.id)}`,
								).join('\n')
							: '- 指定なし',
					menuType: 'role',
				}),
			)
			// .addActionRowComponents(roleRows)
			.addSeparatorComponents(addSeparatorBuilder())
			.addTextDisplayComponents(
				new TextDisplayBuilder({
					content: footerText,
				}),
			)
	);
}

export function makeRankFilterSettingFromChannel(
	channel: GuildBasedChannel,
	channelFilter: channelFilterModel,
	roles: Role[],
) {
	let cnt = 1;

	let rolesToString = '';

	for (const data of roles) {
		rolesToString += `${cnt} - ${roleMention(data.id)}\n`;
		cnt++;
	}

	const prefixRole = channelFilter.listType === 'black' ? '除外' : '対象';
	// レベルUPが有効な場合はブラックリストを無効な場合はホワイトリストを
	const listType = toJpListType(channelFilter.listType ?? 'black');

	let footerText = '';

	if (!channelFilter.isLvlUp) {
		footerText = 'レベルの計算をしません。';
	} else {
		let jpChannelType = 'で書き込んだ人が';
		if (VCTypes.includes(channel.type)) {
			jpChannelType = 'に入った人が';
		} else if (CategoryTypes.includes(channel.type)) {
			jpChannelType = '内のTCに書き込むかVCに入った人が';
		}

		if (channelFilter.listType === 'black') {
			footerText = `${channelMention(channel.id)}${jpChannelType}${prefixRole}ロールを持って無ければレベルを計算する`;
		} else {
			footerText = `${channelMention(channel.id)}${jpChannelType}${prefixRole}ロールを持ってればレベルを計算する`;
		}
	}

	const headerSections = [
		addSectionWithButtonBuilder({
			contents: [
				`${channelMention(channel.id)} | レベルUP: ${boolToOn(channelFilter.isLvlUp)}`,
			],
			buttonCustomId: `update_lvl_up_by_channel:${channelFilter.categoryId}:${channel.id}`,
			buttonLabel: 'レベルUP切替',
			buttonStyle: ButtonStyle.Primary,
		}),
	];

	if (channelFilter.isLvlUp) {
		headerSections.push(
			addSectionWithButtonBuilder({
				contents: [`${channelMention(channel.id)} | リストタイプ: ${listType}`],
				buttonCustomId: `update_list_type_by_channel:${channelFilter.categoryId}:${channel.id}`,
				buttonLabel: 'リストタイプ切替',
				buttonStyle: ButtonStyle.Secondary,
			}),
		);
	}

	const container = new ContainerBuilder()
		.addSectionComponents(
			addSectionWithButtonBuilder({
				contents: [`${channelMention(channel.id)}の設定画面`],
				buttonCustomId: `delete_by_channel:${channelFilter.categoryId}:${channel.id}`,
				buttonLabel: '設定削除',
				buttonStyle: ButtonStyle.Danger,
			}),
		)
		.addSectionComponents(headerSections)
		.addSeparatorComponents(addSeparatorBuilder());

	if (channelFilter.isLvlUp) {
		container
			.addSectionComponents(
				addSectionWithButtonBuilder({
					contents: [`# ${prefixRole}ロール\n\n${rolesToString}`],
					buttonCustomId: `update_role_by_channel:${channelFilter.categoryId}:${channel.id}`,
					buttonLabel: `${prefixRole}ロール更新`,
					buttonStyle: ButtonStyle.Success,
				}),
			)
			.addSeparatorComponents(addSeparatorBuilder());
	}

	container.addTextDisplayComponents(addTextDisplay(footerText));

	return container;
}
