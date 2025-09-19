import { _Connection, Diagnostic, DocumentDiagnosticParams, DocumentDiagnosticReport, DocumentDiagnosticReportKind, TextDocuments } from 'vscode-languageserver';
import {
	TextDocument
} from 'vscode-languageserver-textdocument';

import { GetDocumentSettings, LspSettings } from '../configuration/config-provider';
import { OpponentsValidator } from './validators/oppoents-validator';
import { ClassValidator, PicValidator } from './validators/field-validators';

export async function HandleDiagnosticsRequest(params: DocumentDiagnosticParams, documents: TextDocuments<TextDocument>, connection: _Connection) {
	const document = documents.get(params.textDocument.uri);
	if (document !== undefined) {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: await ValidateTextDocument(document, await GetDocumentSettings(document.uri, connection))
		} satisfies DocumentDiagnosticReport;
	} else {
		return {
			kind: DocumentDiagnosticReportKind.Full,
			items: []
		} satisfies DocumentDiagnosticReport;
	}
}

export interface ShowdownValidator {
	validate(textDocument: TextDocument, diagnostics: Diagnostic[], settings: LspSettings): void
}

const validators: ShowdownValidator[] = [
	OpponentsValidator,
	ClassValidator,
	PicValidator
];

export async function ValidateTextDocument(textDocument: TextDocument, settings: LspSettings): Promise<Diagnostic[]> {
	const diagnostics: Diagnostic[] = [];

	for (const validator of validators) {
		validator.validate(textDocument, diagnostics, settings);
	}
	return diagnostics;
}