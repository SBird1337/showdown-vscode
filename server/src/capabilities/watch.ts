import { _Connection, DidChangeWatchedFilesNotification, DidChangeWatchedFilesParams, TextDocuments } from 'vscode-languageserver';
import { LspSettings } from './configuration/config-provider';
import { Disposable } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { UpdateWatchedDirtyFiles } from '../storage/cache';

let disposableWatcher: Disposable | null = null;

export function UnregisterFileWatchers() {
	if (disposableWatcher) disposableWatcher.dispose();
}

export async function RegisterFileWatchers(settings: LspSettings, connection: _Connection) {
	disposableWatcher = await connection.client.register(DidChangeWatchedFilesNotification.type, {
		watchers: [
			{ globPattern: "**/*.h" },
		],
	})
}

export async function HandleDidChangeWatchedFiles(_change: DidChangeWatchedFilesParams, documents: TextDocuments<TextDocument>, connection: _Connection) {
	for (let change of _change.changes) {
		await UpdateWatchedDirtyFiles(change.uri, connection, documents);
	}
}

