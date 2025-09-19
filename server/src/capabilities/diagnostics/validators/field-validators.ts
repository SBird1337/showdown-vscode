import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { GetRangeFromDocumentAndMatch } from '../../../document/document-util';
import { ShowdownValidator } from '../diagnostics';
import { TrainerClassConstants, TrainerPicConstants } from '../../../storage/cache';
import { LspSettings, ResolveWorkspaceRelativePath } from '../../configuration/config-provider';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ConvertToTrainerProcConstant } from '../../../trainerproc/trainerproc-util';

function addClassNotFoundDiagnostic(diagnostics: Diagnostic[], match: RegExpExecArray, textDocument: TextDocument, settings: LspSettings) {
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Error,
		range: {
			start: textDocument.positionAt(match.index + match[0].indexOf(match[1])),
			end: textDocument.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length)
		},
		message: `Error: Trainer Class ${match[1]} [${ConvertToTrainerProcConstant("TRAINER_CLASS", match[1])}] was not found in trainers file ${ResolveWorkspaceRelativePath(settings.trainersFile)}.`,
		source: 'showdown lint'
	};
	diagnostics.push(diagnostic);
}

function addPicNotFoundDiagnostic(diagnostics: Diagnostic[], match: RegExpExecArray, textDocument: TextDocument, settings: LspSettings) {
	const diagnostic: Diagnostic = {
		severity: DiagnosticSeverity.Error,
		range: {
			start: textDocument.positionAt(match.index + match[0].indexOf(match[1])),
			end: textDocument.positionAt(match.index + match[0].indexOf(match[1]) + match[1].length)
		},
		message: `Error: Trainer Pic ${match[1]} [${ConvertToTrainerProcConstant("TRAINER_PIC", match[1])}] was not found in trainers file ${ResolveWorkspaceRelativePath(settings.trainersFile)}.`,
		source: 'showdown lint'
	};
	diagnostics.push(diagnostic);
}

export const ClassValidator: ShowdownValidator = {
	validate: (textDocument, diagnostics, settings) => {
		const content = textDocument.getText();
		const regex = /^Class:\s+([aA-zZ\d ]+)$/gm;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const className = match[1];
			const processedClassName = ConvertToTrainerProcConstant("TRAINER_CLASS", className);
			if (!TrainerClassConstants.has(processedClassName)) {
				addClassNotFoundDiagnostic(diagnostics, match, textDocument, settings);
			}
		}
	}
};

export const PicValidator: ShowdownValidator = {
	validate: (textDocument, diagnostics, settings) => {
		const content = textDocument.getText();
		const regex = /^Pic:\s+([aA-zZ\d ]+)$/gm;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(content)) !== null) {
			const picName = match[1];
			const processedPicName = ConvertToTrainerProcConstant("TRAINER_PIC", picName);
			if (!TrainerPicConstants.has(processedPicName)) {
				addPicNotFoundDiagnostic(diagnostics, match, textDocument, settings);
			}
		}
	}
};