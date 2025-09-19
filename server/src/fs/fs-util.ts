import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver-textdocument';
import * as fs from 'fs/promises';

export async function ReadFileFromUri(uriString: string): Promise<TextDocument | null> {
	try {
		const uri = URI.parse(uriString);

		if (uri.scheme !== 'file') {
			return null;
		}

		const filePath = uri.fsPath;
		const content = await fs.readFile(filePath, 'utf-8');
		return TextDocument.create(uriString, "local", 1, content);
	} catch (err) {
		return null;
	}
}