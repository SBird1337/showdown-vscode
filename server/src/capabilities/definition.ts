import { _Connection, DefinitionParams, LocationLink, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { LocatableShowdownSymbol, OpponentConstants, ShowdownSymbol, TrainerClassConstants, TrainerPicConstants } from '../storage/cache';
import { GetDocumentSettings, LspSettings, ResolveWorkspaceRelativePath } from './configuration/config-provider';
import { ConvertToTrainerProcConstant } from '../trainerproc/trainerproc-util';



interface ShowdownDefinitionProvider {
	handle(document: TextDocument, settings: LspSettings, params: DefinitionParams): Promise<LocationLink[] | null>
}

// todo: probably refactor to use a params interface and unify those 2 functions by using a nullable prefix in the interface

async function handleBasicRegexDefinition(document: TextDocument, params: DefinitionParams, regex: RegExp, symbols: Map<string, LocatableShowdownSymbol>, targetUri: string): Promise<LocationLink[] | null> {
	let line = document.getText().split('\n')[params.position.line];
	let match = regex.exec(line);
	if (!match) return null;
	let symbolMatch = match[1];
	if (symbols.has(symbolMatch)) {
		return [{
			targetUri: targetUri,
			targetRange: symbols.get(symbolMatch)!.range,
			targetSelectionRange: symbols.get(symbolMatch)!.range,
			originSelectionRange: {
				start: { line: params.position.line, character: match.index + match[0].indexOf(match[1]) },
				end: { line: params.position.line, character: match.index + match[0].indexOf(match[1]) + match[1].length }
			}
		}
		];
	}
	return null;
}

async function handleFieldRegexDefinition(document: TextDocument, params: DefinitionParams, regex: RegExp, symbols: Map<string, LocatableShowdownSymbol>, targetUri: string, prefix: string): Promise<LocationLink[] | null> {
	let line = document.getText().split('\n')[params.position.line];
	let match = regex.exec(line);
	if (!match) return null;
	let symbolMatch = match[1];
	let transformedMatch = ConvertToTrainerProcConstant(prefix, symbolMatch);
	if (symbols.has(transformedMatch)) {
		return [{
			targetUri: targetUri,
			targetRange: symbols.get(transformedMatch)!.range,
			targetSelectionRange: symbols.get(transformedMatch)!.range,
			originSelectionRange: {
				start: { line: params.position.line, character: match.index + match[0].indexOf(match[1]) },
				end: { line: params.position.line, character: match.index + match[0].indexOf(match[1]) + match[1].length }
			}
		}
		];
	}
	return null;
}

const opponentHeaderDefinitionProvider: ShowdownDefinitionProvider = {
	handle: async (document, settings, params) =>
		handleBasicRegexDefinition(
			document,
			params,
			/^===\s+([aA-zZ_0-9]+)\s+===\s*$/,
			OpponentConstants,
			ResolveWorkspaceRelativePath(settings.opponentsFile)
		)
};

const trainerClassDefinitionProvider: ShowdownDefinitionProvider = {
	handle: async (document, settings, params) =>
		handleFieldRegexDefinition(
			document,
			params,
			/^Class:\s+([aA-zZ\d ]+)$/,
			TrainerClassConstants,
			ResolveWorkspaceRelativePath(settings.trainersFile),
			"TRAINER_CLASS"
		)
};

const trainerPicDefinitionProvider: ShowdownDefinitionProvider = {
	handle: async (document, settings, params) =>
		handleFieldRegexDefinition(
			document,
			params,
			/^Pic:\s+([aA-zZ\d ]+)$/,
			TrainerPicConstants,
			ResolveWorkspaceRelativePath(settings.trainersFile),
			"TRAINER_PIC"
		)
};

const definitionProviders: ShowdownDefinitionProvider[] = [];

definitionProviders.push(opponentHeaderDefinitionProvider);
definitionProviders.push(trainerClassDefinitionProvider);
definitionProviders.push(trainerPicDefinitionProvider);

// FIXME: Refactor for multiple definition interrfaces
export async function HandleDefinition(params: DefinitionParams, documents: TextDocuments<TextDocument>, connection: _Connection): Promise<LocationLink[] | null> {

	let document = documents.get(params.textDocument.uri);
	if (!document) return null;
	let settings = await GetDocumentSettings(document.uri, connection);
	for (let provider of definitionProviders) {
		let result = await provider.handle(document, settings, params);
		if (result) return result;
	}
	return null;
}