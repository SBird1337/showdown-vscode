import { Position, Range } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export function GetRangeFromDocumentAndMatch(textDocument: TextDocument, match: RegExpExecArray) {
	return {
		start: textDocument.positionAt(match.index),
		end: textDocument.positionAt(match.index + match[0].length)
	};
}

export function GetDocumentLineRange(position: Position, document: TextDocument): Range {
	const line = position.line;
	const lineText = document.getText({
		start: { line, character: 0 },
		end: { line: line + 1, character: 0 }
	});

	const endCharacter = Math.max(position.character, lineText.length);

	return {
		start: { line, character: 0 },
		end: { line, character: endCharacter }
	};
}