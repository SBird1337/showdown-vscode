import { _Connection, DidChangeConfigurationParams } from 'vscode-languageserver';
import { hasConfigurationCapability, hasWorkspaceFolderCapability, workspaceRoot } from '../../server';
import { RegisterFileWatchers, UnregisterFileWatchers } from '../watch';

export interface LspSettings {
	opponentsFile: string,
	trainersFile: string,
	battleAiFile: string
};

const defaultSettings: LspSettings = { 
	opponentsFile: "${workspaceRoot}/include/constants/opponents.h",
	trainersFile: "${workspaceRoot}/include/constants/trainers.h",
	battleAiFile: "${workspaceRoot}/include/constants/battle_ai.h"
};
let globalSettings: LspSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings = new Map<string, Thenable<LspSettings>>();

export function HandleDidChangeConfiguration(change: DidChangeConfigurationParams, connection: _Connection) {
	if (hasConfigurationCapability) {
		documentSettings.clear();
	} else {
		globalSettings = (
			(change.settings.languageServerExample || defaultSettings)
		);
	}
	UnregisterFileWatchers();
	RegisterFileWatchers(globalSettings, connection);

//  FIXME: Update Dirty Watched Files
	connection.languages.diagnostics.refresh();
}

export function GetDocumentSettings(resource: string, connection: _Connection): Thenable<LspSettings> {
	if (!hasConfigurationCapability) {
		return Promise.resolve(globalSettings);
	}
	let result = documentSettings.get(resource);
	if (!result) {
		result = connection.workspace.getConfiguration({
			scopeUri: resource,
			section: 'languageServerShowdown'
		});
		documentSettings.set(resource, result);
	}
	return result;
}

export function DeleteDocumentSettings(uri: string) {
	documentSettings.delete(uri);
}

export function ResolveWorkspaceRelativePath(path: string) {
	if (hasWorkspaceFolderCapability)
		return path.replace("${workspaceRoot}", workspaceRoot);
	else
		return path;
}