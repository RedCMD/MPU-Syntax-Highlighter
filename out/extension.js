'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");


function tokenizeDoc(document) {
	const text = document.getText()
	let tokens = []
	let match = []
	let regex = new RegExp([
		/(?<comment_line>\/\/.*$)/,
		/(?<comment_block>\/\*[\S\s]*?\*\/)/,	// match everything including newlines \r\n
		/(?<char>'[^'\r\n]*')/,
		/(?<=^\s*)(?<label_define>\.\w*)/,
		/(?<label>\.\w*)/,
	].map(function (r) { return r.source }).join('|'), 'dgim');
		// 'd' enables `indices`; which allows extracting which named capture group matched the input
		// 'g' enables global; which is required for how Im using `.exec()`
		// 'i' enables case-insensitive `minheap` == `mINhEap` == `MINHEAP`
		// 'm' enables multiline mode; allowing `^` to match the start of a line and `$` to match the end of a line
		// ~~'s' enables the dot `.` to match new lines \r\n~~		// used `\r?\n` instead

	// vscode.window.showInformationMessage(regex.toString())
	while (match = regex.exec(text)) {
		const captureGroups = Object.entries(match.indices.groups)
		// find the name and matched text of the first (and only) matching capture group
		for (var index = 0; index < captureGroups.length; index++)
			if (captureGroups[index][1] != null)
				break
		// vscode.window.showInformationMessage(captureGroups[index][0])
		const name = captureGroups[index][0]
		const positionStart = document.positionAt(match.index)
		const positionEnd = document.positionAt(match.index + match[0].length)
		const range = new vscode.Range(positionStart, positionEnd)
		const token = { name: name, symbol: match[0], range: range }
		// vscode.window.showInformationMessage(JSON.stringify(token))
		tokens.push(token)
	}
	
	// vscode.window.showInformationMessage(JSON.stringify(tokens))
	return tokens
}


function getLabels(document, option) {
	let labels = []
	const tokens = tokenizeDoc(document)
	let token
	
	// option:0 all .labels
	// option:1 only reference .labels
	// option:2 only definition .labels
	while (token = tokens.pop())
		if ((option ^ 2 && token.name == 'label') || (option ^ 1 && token.name == 'label_define'))
			labels.push({ document: document, range: token.range, symbol: token.symbol })


	// vscode.window.showInformationMessage(JSON.stringify(labels))
	return labels
}


const CodelensProvider = {
	provideCodeLenses(document, token) {
		const labels = getLabels(document, 2)
		// vscode.window.showInformationMessage(JSON.stringify(labels))
		return labels

		// tokenizeDoc(document)

	},
	resolveCodeLens(codeLens, token) {
		const document = codeLens.document
		const position = codeLens.range.start
		const symbol = codeLens.symbol
		let labels = getLabels(document, 1)
		let label
		let locations = []
		let i = 0

		while (label = labels.pop()) {
			if (label.symbol == symbol) {
				const location = new vscode.Location(document.uri, label.range)
				locations.push(location)
				i++
			}
		}
		// if (i == 0) {
		// 	while (label = codeLens.pop()) {
		// 		if (label.symbol == symbol) {
		// 			const location = new vscode.Location(document.uri, label.range)
		// 			locations.push(location)
		// 			i++
		// 		}
		// 	}
		// 	if (i == 1)
		// 		locations.pop()
		// }
		
		codeLens.command = {
			title: `Refs: ${i}`,
			tooltip: `${codeLens.symbol}`,
			command: 'editor.action.showReferences',
			arguments: [
				document.uri,
				position,
				locations
			]
		}
		return codeLens
	}
}


const ReferenceProvider = {
	provideReferences(document, position, context, token) {
		const range = document.getWordRangeAtPosition(position);	//`Word` is defined by "wordPattern" in `urcl.language-configuration.json`
		const hoveredWord = document.getText(range);
		const regexlabel = new RegExp(/^\.\w+$/m); // .label
		if (regexlabel.test(hoveredWord)) {	// test if selected word is a .label
			const tokens = tokenizeDoc(document)
			let locations = []
			
			while (token = tokens.pop())
				if (token.name.startsWith('label'))
					if (token.symbol == hoveredWord)
						locations.push(new vscode.Location(document.uri, token.range))
			
			if (!locations)
				locations.push(new vscode.Location(document.uri, range))

			return locations;
		}
	}
}


const DefinitionProvider = {
	provideDefinition(document, position, token) {
		const range = document.getWordRangeAtPosition(position);	//`Word` is defined by "wordPattern" in `urcl.language-configuration.json`
		const hoveredWord = document.getText(range);
		const regexlabel = new RegExp(/^\.\w+$/m); // .label
		
		if (regexlabel.test(hoveredWord)) {	// test if selected word is a .label
			let labels = getLabels(document, 2)	// get a list of all labels in doc
			let label
			let locations = []
			
			while (label = labels.pop())
				if (hoveredWord == label.symbol)	// test if .label in doc is same as selected .label
					locations.push(new vscode.Location(document.uri, label.range))
			
			if (!locations)
				locations.push(new vscode.Location(document.uri, range))

			return locations;
		}
	}
}


const fileSelector = [
	{ scheme: 'file', language:	'.mpu7'			},
	{ scheme: 'file', pattern:	'**/*mpu?'		}
];
// main()
function activate(context) {
	context.subscriptions.push(vscode.languages.registerCodeLensProvider(fileSelector, CodelensProvider)); // overhead .label references
	context.subscriptions.push(vscode.languages.registerReferenceProvider(fileSelector, ReferenceProvider)); // shift+F12 .label locations
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(fileSelector, DefinitionProvider)); // ctrl+click .label definition(s)

	// vscode.window.showInformationMessage(JSON.stringify(context));s
}


exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;