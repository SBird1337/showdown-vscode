import { FoldingRange, FoldingRangeParams, TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

const FOLDABLE_TRAINERS_REGEX = /^===\s*[aA-zZ_0-9]+\s*===\s*$/

function getFoldableMatches(lines: string[], regex: RegExp): number[] {
	const output: number[] = [];

	lines.forEach((line, index) => {
		if (regex.test(line)) output.push(index);
	});
	return output;
}

export async function HandleFoldingRangeEvent(params: FoldingRangeParams, documents: TextDocuments<TextDocument>): Promise<FoldingRange[] | null> {
	const document = documents.get(params.textDocument.uri);
	if (!document) return null; 
	const text = document.getText();
	const lines = text.split("\n")
	const indices = getFoldableMatches(lines, FOLDABLE_TRAINERS_REGEX);
	const ranges: FoldingRange[] = [];

	for (let i = 0; i < indices.length; i += 1) {
		const start = indices[i];
		const end = (i + 1 < indices.length ? indices[i + 1] - 1 : lines.length - 1);
		ranges.push({startLine: start, endLine: end});
	}
	return ranges;
}