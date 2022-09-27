const vscode = require("vscode");
const extension = require("./extension.js");



const CodelensProvider = {
	async provideCodeLenses(document, token) {
		const { getTree } = await extension.parseTreeExtension.activate()
		const tree = getTree(document)

		const codeLenses = []

		tree.rootNode.namedChildren.forEach(node => {
			if (node.type != 'label')
				return

			const range = extension.nodeToVscodeRange(node)
			const codeLens = new vscode.CodeLens(range)
			codeLens.document = document
			codeLens.text = node.text
			codeLenses.push(codeLens)
		});

		// vscode.window.showInformationMessage(JSON.stringify(codeLenses))
		return codeLenses
	},
	async resolveCodeLens(codeLens, token) {
		const document = codeLens.document
		const uri = document.uri

		const { getTree } = await extension.parseTreeExtension.activate()
		const tree = getTree(document)

		const text = codeLens.text

		const locations = []


		tree.rootNode.namedChildren.forEach(rootNode => {
			rootNode.namedChildren.forEach(node => {
				this.getAllChildren(node, locations, text, uri)
			})
		})

		const length = locations.length
		codeLens.command = {
			title: `${length} reference${length == 1 ? '' : 's'}`,
			tooltip: `Label: ${text}`,
			command: 'editor.action.showReferences',
			arguments: [
				uri,
				codeLens.range.start,
				locations
			]
		}

		// vscode.window.showInformationMessage(JSON.stringify(codeLens))
		return codeLens
	},
	async getAllChildren(node, locations, text, uri) {
		node.namedChildren.forEach(childNode => {
			this.getAllChildren(childNode, locations, text, uri)
		})

		if (node.type != 'label')
			return

		if (node.text != text)
			return

		const range = extension.nodeToVscodeRange(node)
		const location = new vscode.Location(uri, range)
		locations.push(location)
	}
}


exports.CodelensProvider = CodelensProvider