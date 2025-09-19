import { Command, CompletionItem, CompletionItemKind, InsertTextFormat, Position, TextDocumentPositionParams, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AiFlagConstants, ShowdownSymbol, TrainerClassConstants, TrainerEncounterMusicConstants, TrainerPicConstants } from '../storage/cache';
import { GetDocumentLineRange } from '../document/document-util';

enum CompletionHintFill {
	COMPLETION_HINT_FILL_COLON,
	COMPLETION_HINT_FILL_STATS,
	COMPLETION_HINT_FILL_SLASH
};

const retriggerSuggestionCommand: Command = {
	title: 'Trigger Completion',
	command: 'editor.action.triggerSuggest'
};

function createBasicCompletionItem(label: string, fill?: CompletionHintFill, trigger: boolean = true, kind: CompletionItemKind = CompletionItemKind.Keyword): CompletionItem {
	let insertText = label;
	if (fill === CompletionHintFill.COMPLETION_HINT_FILL_COLON) {
		insertText = label + ": ";
	}
	else if (fill === CompletionHintFill.COMPLETION_HINT_FILL_STATS) {
		insertText = label + ": 0 HP / 0 Atk / 0 Def / 0 SpA / 0 SpD / 0 Spe";
	}

	return {
		label: label,
		kind: kind,
		insertText: insertText,
		command: trigger ? retriggerSuggestionCommand : undefined
	};
}

const BaseTrainerCompletions: CompletionItem[] = [];

BaseTrainerCompletions.push(createBasicCompletionItem("Class", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseTrainerCompletions.push(createBasicCompletionItem("Name", CompletionHintFill.COMPLETION_HINT_FILL_COLON, false));
BaseTrainerCompletions.push(createBasicCompletionItem("Pic", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseTrainerCompletions.push(createBasicCompletionItem("Gender", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseTrainerCompletions.push(createBasicCompletionItem("Music", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseTrainerCompletions.push(createBasicCompletionItem("Double Battle", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseTrainerCompletions.push(createBasicCompletionItem("AI", CompletionHintFill.COMPLETION_HINT_FILL_COLON));

const BaseMonCompletions: CompletionItem[] = [];

BaseMonCompletions.push(createBasicCompletionItem("Level", CompletionHintFill.COMPLETION_HINT_FILL_COLON, false));
BaseMonCompletions.push(createBasicCompletionItem("IVs", CompletionHintFill.COMPLETION_HINT_FILL_STATS, false));
BaseMonCompletions.push(createBasicCompletionItem("EVs", CompletionHintFill.COMPLETION_HINT_FILL_STATS, false));
BaseMonCompletions.push(createBasicCompletionItem("Ability", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseMonCompletions.push(createBasicCompletionItem("Happiness", CompletionHintFill.COMPLETION_HINT_FILL_COLON, false));
BaseMonCompletions.push(createBasicCompletionItem("Nature", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseMonCompletions.push(createBasicCompletionItem("Shiny", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseMonCompletions.push(createBasicCompletionItem("Dynamax Level", CompletionHintFill.COMPLETION_HINT_FILL_COLON, false));
BaseMonCompletions.push(createBasicCompletionItem("Gigantamax", CompletionHintFill.COMPLETION_HINT_FILL_COLON));
BaseMonCompletions.push(createBasicCompletionItem("Tera Type", CompletionHintFill.COMPLETION_HINT_FILL_COLON));

const YesNoSymbols: ShowdownSymbol[] = [
	{
		value: "Yes",
		friendlyName: "Yes"
	},
	{
		value: "No",
		friendlyName: "No"
	}
];

const GenderSymbols: ShowdownSymbol[] = [
	{
		value: "Male",
		friendlyName: "Male"
	},
	{
		value: "Female",
		friendlyName: "Female"
	}
]

function buildPrefixMappedCompletions(line: string, position: Position, document: TextDocument, prefix: string, symbols: ShowdownSymbol[]): CompletionItem[] {
	return symbols.map((symbol) => ({
		label: symbol.friendlyName,
		kind: CompletionItemKind.Constant,
		textEdit: {
			range: GetDocumentLineRange(position, document),
			newText: prefix + symbol.friendlyName
		},
		filterText: prefix + symbol.friendlyName,
		sortText: symbol.friendlyName,
		insertTextFormat: InsertTextFormat.PlainText
	}));
}

function buildContextAwareCompletions(line: string, position: Position, document: TextDocument): CompletionItem[] | null {
	if (line.startsWith("Class: ")) return buildPrefixMappedCompletions(line, position, document, "Class: ", Array.from(TrainerClassConstants.values()));
	if (line.startsWith("Pic: ")) return buildPrefixMappedCompletions(line, position, document, "Pic: ", Array.from(TrainerPicConstants.values()));
	if (line.startsWith("Music: ")) return buildPrefixMappedCompletions(line, position, document, "Music: ", Array.from(TrainerEncounterMusicConstants.values()));
	if (line.startsWith("Double Battle: ")) return buildPrefixMappedCompletions(line, position, document, "Double Battle: ", YesNoSymbols);
	if (line.startsWith("Gender: ")) return buildPrefixMappedCompletions(line, position, document, "Gender: ", GenderSymbols);
	if (line.startsWith("AI: ")) return buildPrefixMappedCompletions(line, position, document, "AI: ", Array.from(AiFlagConstants.values()));
	return null;
}

export async function HandleCompletionEvent(_textDocumentPosition: TextDocumentPositionParams, documents: TextDocuments<TextDocument>): Promise<CompletionItem[] | null> {
	const document = documents.get(_textDocumentPosition.textDocument.uri);
	if (!document) return null;
	const line = document.getText().split('\n')[_textDocumentPosition.position.line];

	const contextSensitiveCompletions = buildContextAwareCompletions(line, _textDocumentPosition.position, document);
	if (contextSensitiveCompletions !== null) return contextSensitiveCompletions;

	return BaseMonCompletions.concat(BaseTrainerCompletions);
}

export async function HandleCompletionResolveEvent(item: CompletionItem): Promise<CompletionItem> {
	return item;
}