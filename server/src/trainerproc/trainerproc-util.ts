export enum TrainerFieldType {
	TRAINER_CLASS,
	TRAINER_PIC,
	TRAINER_ENCOUNTER_MUSIC,
	AI_FLAG
}

function IsConstant(prefix: string, text: string): boolean {
	for (let i = 0; ; i++) {
		if (i === text.length) return false;
		if (i === prefix.length) return text[i] === '_';
		if (prefix[i] !== text[i]) return false;
	}
}

export function ConvertToTrainerProcConstant(prefix: string, text: string): string {
	let result = "";
	if (!IsConstant(text, prefix)) result += (prefix + '_');
	if (text.length > 0) {
		for (let i = 0; i < text.length; ++i) {
			const c = text[i];
			if (c >= 'A' && c <= 'Z' || c >= '0' && c <= '9') {
				result += c;
			} else if (c >= 'a' && c <= 'z') {
				result += c.toUpperCase();
			} else if (c === '\'') {
				// skip
			} else {
				result += '_';
			}
		}
	} else {
		result += "NONE";
	}
	return result;
}

export function ConvertToTitleCase(text: string): string {
	return text.toLowerCase().split(' ').map((word: string) => {
		return word.charAt(0).toUpperCase() + word.slice(1);
	}).join(' ');
}

export function ConvertToFriendlyName(label: string, type: TrainerFieldType): string {
	switch (type) {
		case TrainerFieldType.TRAINER_CLASS:
			return ConvertToTitleCase(label.replace(/^TRAINER_CLASS_/, '').replace(/_/g, ' '));
		case TrainerFieldType.TRAINER_PIC:
			return ConvertToTitleCase(label.replace(/^TRAINER_PIC_/, '').replace(/_/g, ' '));
		case TrainerFieldType.TRAINER_ENCOUNTER_MUSIC:
			return ConvertToTitleCase(label.replace(/^TRAINER_ENCOUNTER_MUSIC_/, '').replace(/_/g, ' '));
		case TrainerFieldType.AI_FLAG:
			return ConvertToTitleCase(label.replace(/^AI_FLAG_/, '').replace(/_/g, ' '));
	}

}