import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	TextDocumentSyncKind,
	InitializeResult,
	DidChangeWatchedFilesNotification,
} from 'vscode-languageserver/node';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';
import { DeleteDocumentSettings, GetDocumentSettings, HandleDidChangeConfiguration, LspSettings } from './capabilities/configuration/config-provider';
import { HandleDiagnosticsRequest, ValidateTextDocument } from './capabilities/diagnostics/diagnostics';
import { HandleCompletionEvent, HandleCompletionResolveEvent } from './capabilities/completion';
import { HandleFoldingRangeEvent } from './capabilities/folding';
import { HandleDidChangeWatchedFiles, RegisterFileWatchers } from './capabilities/watch';
import { UpdateAllFiles } from './storage/cache';
import { HandleDefinition } from './capabilities/definition';

const connection = createConnection(ProposedFeatures.all);

const documents = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let workspaceRoot: string = "";

export { hasConfigurationCapability, hasWorkspaceFolderCapability, hasDiagnosticRelatedInformationCapability, workspaceRoot };

connection.onInitialize((params: InitializeParams) => {
	const capabilities = params.capabilities;

	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			completionProvider: {
				resolveProvider: true,
				triggerCharacters: [' ']
			},
			diagnosticProvider: {
				interFileDependencies: false,
				workspaceDiagnostics: false
			},
			definitionProvider: true,
			foldingRangeProvider: true,
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
		if (params.workspaceFolders) {
			workspaceRoot = params.workspaceFolders[0].uri;
		}

	}
	return result;
});

connection.onInitialized(async () => {
	if (hasConfigurationCapability) {
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
	const settings = await connection.workspace.getConfiguration("languageServerShowdown") as LspSettings;
	RegisterFileWatchers(settings, connection);
	UpdateAllFiles(connection, documents, settings);
});

connection.onDidChangeConfiguration(change => HandleDidChangeConfiguration(change, connection));

documents.onDidClose(e => {
	DeleteDocumentSettings(e.document.uri);
});

connection.languages.diagnostics.on(async (params) => {
	return await HandleDiagnosticsRequest(params, documents, connection);
});

documents.onDidChangeContent(async change => {
	//ValidateTextDocument(change.document, await GetDocumentSettings(change.document.uri, connection));
});

connection.onDidChangeWatchedFiles(_change => HandleDidChangeWatchedFiles(_change, documents, connection));
connection.onCompletion(async (position) => HandleCompletionEvent(position, documents));
connection.onCompletionResolve(HandleCompletionResolveEvent);

connection.onFoldingRanges(async (params) => HandleFoldingRangeEvent(params, documents));

connection.onDefinition(_params => HandleDefinition(_params, documents, connection));

documents.listen(connection);

connection.listen();
