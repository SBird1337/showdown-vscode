import { Diagnostic, DiagnosticSeverity, Range } from 'vscode-languageserver';
import { OpponentConstants } from '../../../storage/cache';
import { ShowdownValidator } from '../diagnostics';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { LspSettings, ResolveWorkspaceRelativePath } from '../../configuration/config-provider';
import { GetRangeFromDocumentAndMatch } from '../../../document/document-util';

interface FoundTrainer {
	symbol: string,
	range: Range
};

function addFirstDeclarationNote(diagnostics: Diagnostic[], trainer: FoundTrainer, textDocument: TextDocument) {
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Information,
		range: trainer.range,
		message: `Note: First definition for opponent ${trainer.symbol} is here.`,
		source: 'showdown lint'
	};
	diagnostics.push(diagnostic);
}

function addDuplicateOpponentDiagnostic(diagnostics: Diagnostic[], match: RegExpExecArray, textDocument: TextDocument) {
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Error,
		range: GetRangeFromDocumentAndMatch(textDocument, match),
		message: `Error: Multiple definitions for opponent ${match[1]}`,
		source: 'showdown lint'
	};
	diagnostics.push(diagnostic);
}

function addOpponentNotFoundDiagnostic(diagnostics: Diagnostic[], match: RegExpExecArray, textDocument: TextDocument, settings: LspSettings) {
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Error,
		range: GetRangeFromDocumentAndMatch(textDocument, match),
		message: `Error: Opponent ${match[1]} was not found in opponents file ${ResolveWorkspaceRelativePath(settings.opponentsFile)}.`,
		source: 'showdown lint'
	};
	diagnostics.push(diagnostic);
}

export const OpponentsValidator: ShowdownValidator = {
	validate: (textDocument, diagnostics, settings) => {
		const content = textDocument.getText();
		const regex = /^===\s+([aA-zZ_0-9]+)\s+===\s*$/gm;
		const foundOpponents: FoundTrainer[] = [];
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const opponent = match[1];
			if (foundOpponents.some(t => t.symbol === opponent)) {
				addDuplicateOpponentDiagnostic(diagnostics, match, textDocument)
				addFirstDeclarationNote(diagnostics, foundOpponents.find(t => t.symbol === opponent)!, textDocument);
			} else {
				foundOpponents.push({symbol: opponent, range: GetRangeFromDocumentAndMatch(textDocument, match)});
			}
			if (!OpponentConstants.has(opponent)) {
				addOpponentNotFoundDiagnostic(diagnostics, match, textDocument, settings);
			}
		}
	}
};