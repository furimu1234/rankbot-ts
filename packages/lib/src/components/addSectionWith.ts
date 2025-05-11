import { ButtonBuilder, ButtonStyle, SectionBuilder } from 'discord.js';
import { addTextDisplayBuilder } from './addTextDisplay';

interface sectionWithButtonType {
	contents: string[];
	buttonCustomId: string;
	buttonLabel: string;
	buttonStyle?: ButtonStyle;
}

export function addSectionWithTextBuilder({ contents }: sectionWithButtonType) {
	return new SectionBuilder().addTextDisplayComponents(
		contents.map((x) => addTextDisplayBuilder(x)),
	);
}

export function addSectionWithButtonBuilder({
	contents,
	buttonCustomId,
	buttonLabel,
	buttonStyle = ButtonStyle.Secondary,
}: sectionWithButtonType) {
	return new SectionBuilder()
		.addTextDisplayComponents(contents.map((x) => addTextDisplayBuilder(x)))
		.setButtonAccessory(
			new ButtonBuilder()
				.setCustomId(buttonCustomId)
				.setLabel(buttonLabel)
				.setStyle(buttonStyle),
		);
}
