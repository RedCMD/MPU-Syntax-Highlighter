'use strict'
Object.defineProperty(exports, "__esModule", { value: true })

const vscode = require("vscode")

// const DocumentFormattingEditProvider = require("./DocumentFormattingEditProvider.js").DocumentFormattingEditProvider
const DocumentSemanticTokensProvider = require("./DocumentSemanticTokensProvider.js").DocumentSemanticTokensProvider
const SemanticTokensLegend = require("./DocumentSemanticTokensProvider.js").SemanticTokensLegend
const DocumentSymbolProvider = require("./DocumentSymbolProvider.js").DocumentSymbolProvider
// const CompletionItemProvider = require("./CompletionItemProvider.js").CompletionItemProvider
const DefinitionProvider = require("./DefinitionProvider.js").DefinitionProvider
const ReferenceProvider = require("./ReferenceProvider.js").ReferenceProvider
const CodelensProvider = require("./CodelensProvider.js").CodelensProvider
const HoverProvider = require("./HoverProvider.js").HoverProvider
const DiagnosticCollection = require("./DiagnosticCollection.js").DiagnosticCollection



function nodeToVscodeRange(node) {
	const startPosition = node.startPosition
	const endPosition = node.endPosition

	return new vscode.Range(
		startPosition.row,
		startPosition.column,
		endPosition.row,
		endPosition.column
	)
}


function subscribeToDocumentChanges(context, callback, Disposable, ...args) {
	context.subscriptions.push(Disposable)

	// if (vscode.window.activeTextEditor)
	// 	if (vscode.languages.match(DocumentSelector, vscode.window.activeTextEditor.document))
	// 		callback(vscode.window.activeTextEditor.document, Disposable, ...param)

	vscode.window.visibleTextEditors.forEach(editor => {
		if (vscode.languages.match(DocumentSelector, editor.document))
			callback(editor.document, Disposable, ...args)
	})

	context.subscriptions.push(
		vscode.window.onDidChangeActiveTextEditor(editor => {
			if (editor)
				if (vscode.languages.match(DocumentSelector, editor.document))
					callback(editor.document, Disposable, ...args)
		})
	)

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(editor => {
			if (vscode.languages.match(DocumentSelector, editor.document))
				callback(editor.document, Disposable, ...args)
		})
	)

	context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(document => Disposable.delete(document.uri)))
}


const DocumentSelector = [
	{ language: 'mpu7' },
	{ language: 'mpu8' }
]

// main()
async function activate(context) {
	// vscode.window.showInformationMessage(JSON.stringify())

	const parseTreeExtension = vscode.extensions.getExtension("pokey.parse-tree")
	if (parseTreeExtension == null)
		throw new Error("Depends on pokey.parse-tree extension")
	exports.parseTreeExtension = parseTreeExtension

	const { registerLanguage } = await parseTreeExtension.activate() // functions() {...}; must be async!
	const wasm = context.extensionPath + '\\out\\tree-sitter\\tree-sitter-mpu.wasm'
	registerLanguage('mpu', wasm)
	registerLanguage('mpu7', wasm)
	registerLanguage('mpu8', wasm)



	// context.subscriptions.push(vscode.languages.registerHoverProvider(DocumentSelector, HoverProvider)) // debug tree-sitter rules
	context.subscriptions.push(vscode.languages.registerCodeLensProvider(DocumentSelector, CodelensProvider)); // overhead .label references
	context.subscriptions.push(vscode.languages.registerReferenceProvider(DocumentSelector, ReferenceProvider)) // ctrl+click
	context.subscriptions.push(vscode.languages.registerDefinitionProvider(DocumentSelector, DefinitionProvider)) // ctrl+click / right click => references
	// context.subscriptions.push(vscode.languages.registerCompletionItemProvider(DocumentSelector, CompletionItemProvider)) // intellisense
	context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(DocumentSelector, DocumentSymbolProvider)) // breadcrumbs
	// context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(DocumentSelector, DocumentFormattingEditProvider)) // right-click => format
	context.subscriptions.push(vscode.languages.registerDocumentSemanticTokensProvider(DocumentSelector, DocumentSemanticTokensProvider, SemanticTokensLegend)) // syntax highlighting
	
	subscribeToDocumentChanges(context, DiagnosticCollection, vscode.languages.createDiagnosticCollection("mpu")) // squiggle errors

}


exports.nodeToVscodeRange = nodeToVscodeRange

exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;