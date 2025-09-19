import { _Connection, Position, Range, TextDocuments } from 'vscode-languageserver';
import { GetDocumentSettings, LspSettings, ResolveWorkspaceRelativePath } from '../capabilities/configuration/config-provider';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ReadFileFromUri as ReadLocalDocumentFromUri } from '../fs/fs-util';
import { GetRangeFromDocumentAndMatch } from '../document/document-util';
import { ConvertToFriendlyName, TrainerFieldType } from '../trainerproc/trainerproc-util';

let OpponentConstants: Map<string, LocatableShowdownSymbol> = new Map();
let TrainerClassConstants: Map<string, LocatableShowdownSymbol> = new Map();
let TrainerPicConstants: Map<string, LocatableShowdownSymbol> = new Map();
let TrainerEncounterMusicConstants: Map<string, LocatableShowdownSymbol> = new Map();
let AiFlagConstants: Map<string, LocatableShowdownSymbol> = new Map();

export { OpponentConstants, TrainerClassConstants, TrainerPicConstants, TrainerEncounterMusicConstants, AiFlagConstants};

export interface ShowdownSymbol {
	value: string,
	friendlyName: string
};

export interface LocatableShowdownSymbol extends ShowdownSymbol {
	document: TextDocument,
	range: Range
}

interface ShowdownFileParser {
	shouldUpdateIfWatchedChange(dirtyUri: string, settings: LspSettings): boolean,
	parse(settings: LspSettings, documents: TextDocuments<TextDocument>): Promise<void>
}

const parsers: ShowdownFileParser[] = [];

const opponentsParser: ShowdownFileParser = {
	shouldUpdateIfWatchedChange: (dirty, settings) => ResolveWorkspaceRelativePath(settings.opponentsFile) === dirty,
	parse: async (settings, _) => {
		const document = await ReadLocalDocumentFromUri(ResolveWorkspaceRelativePath(settings.opponentsFile));
		if (!document) return;
		const content = document.getText();

		OpponentConstants.clear();
		const regex = /#define\s+([aA-zZ_0-9]+)\s+(\d+)$/gm;
		let match;
		while ((match = regex.exec(content)) !== null) {
			const ident = match[1];
			const value = match[2];
			if (ident === "TRAINERS_COUNT" || ident === "MAX_TRAINERS_COUNT" || ident === "TRAINER_PARTNER") continue;
			OpponentConstants.set(ident, {
				document: document,
				range: GetRangeFromDocumentAndMatch(document, match),
				value: value,
				friendlyName: ident
			});
		}
	}
};

const trainersParser: ShowdownFileParser = {
	shouldUpdateIfWatchedChange: (dirty, settings) => ResolveWorkspaceRelativePath(settings.trainersFile) === dirty,
	parse: async (settings, _) => {
		const document = await ReadLocalDocumentFromUri(ResolveWorkspaceRelativePath(settings.trainersFile));
		if (!document) return;
		const content = document.getText();

		TrainerClassConstants.clear();
		TrainerPicConstants.clear();

		const classRegex = /#define\s+(TRAINER_CLASS_[aA-zZ_\d]+)\s+(.+)$/gm;
		let match;
		while ((match = classRegex.exec(content)) !== null) {
			const ident = match[1];
			const value = match[2];
			if (ident === "TRAINER_CLASS_COUNT") continue;
			TrainerClassConstants.set(ident, {
				document: document,
				range: GetRangeFromDocumentAndMatch(document, match),
				value: value,
				friendlyName: ConvertToFriendlyName(ident, TrainerFieldType.TRAINER_CLASS)
			});
		}

		const picRegex = /#define\s+(TRAINER_PIC_[aA-zZ_\d]+)\s+(.+)$/gm;
		while ((match = picRegex.exec(content)) !== null) {
			const ident = match[1];
			const value = match[2];
			if (ident === "TRAINER_PIC_COUNT") continue;
			TrainerPicConstants.set(ident, {
				document: document,
				range: GetRangeFromDocumentAndMatch(document, match),
				value: value,
				friendlyName: ConvertToFriendlyName(ident, TrainerFieldType.TRAINER_PIC)
			});
		}

		const encounterMusicRegex = /#define\s+(TRAINER_ENCOUNTER_[aA-zZ_\d]+)\s+(.+)$/gm;
		while ((match = encounterMusicRegex.exec(content)) !== null) {
			const ident = match[1];
			const value = match[2];
			TrainerEncounterMusicConstants.set(ident, {
				document: document,
				range: GetRangeFromDocumentAndMatch(document, match),
				value: value,
				friendlyName: ConvertToFriendlyName(ident, TrainerFieldType.TRAINER_ENCOUNTER_MUSIC)
			});
		}
	}
};

const battleAiParser: ShowdownFileParser = {
	shouldUpdateIfWatchedChange: (dirty, settings) => ResolveWorkspaceRelativePath(settings.battleAiFile) === dirty,
	parse: async (settings, _) => {
		const document = await ReadLocalDocumentFromUri(ResolveWorkspaceRelativePath(settings.battleAiFile));
		if (!document) return;
		const content = document.getText();

		const aiFlagRegex = /#define\s+(AI_FLAG_[aA-zZ_\d]+)\s+(.+)$/gm;
		let match;
		while ((match = aiFlagRegex.exec(content)) !== null) {
			const ident = match[1];
			const value = match[2];
			if (ident === "AI_FLAG_COUNT") continue;
			AiFlagConstants.set(ident, {
				document: document,
				range: GetRangeFromDocumentAndMatch(document, match),
				value: value,
				friendlyName: ConvertToFriendlyName(ident, TrainerFieldType.AI_FLAG)
			});
		}
	}
};

parsers.push(opponentsParser);
parsers.push(trainersParser);
parsers.push(battleAiParser);

export async function UpdateWatchedDirtyFiles(dirtyUri: string, connection: _Connection, documents: TextDocuments<TextDocument>) {
	const settings = await GetDocumentSettings(dirtyUri, connection);
	let haveDirty: boolean = false;
	for (let parser of parsers) {
		if (parser.shouldUpdateIfWatchedChange(dirtyUri, settings)) {
			await parser.parse(settings, documents);
			haveDirty = true;
		}
	}
	if (haveDirty) {
		connection.languages.diagnostics.refresh();
	}
}

export async function UpdateAllFiles(connection: _Connection, documents: TextDocuments<TextDocument>, settings: LspSettings) {
	for (let parser of parsers) {
		await parser.parse(settings, documents);
	}
	connection.languages.diagnostics.refresh();
}