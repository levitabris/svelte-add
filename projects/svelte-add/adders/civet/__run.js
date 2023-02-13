import { updateSveltePreprocessArgs, updateViteConfig } from "../../adder-tools.js";
import { addImport, setDefault } from "../../ast-tools.js";

/** @type {import("../..").AdderRun<import("./__info.js").Options>} */
export const run = async ({ folderInfo, install, updateJavaScript }) => {
	await updateSveltePreprocessArgs({
		folderInfo,
		mutateSveltePreprocessArgs(sveltePreprocessArgs) {
			const civetOptions = setDefault({
				default: {
					type: "ObjectExpression",
					properties: [],
				},
				object: sveltePreprocessArgs,
				property: "civet",
			});
			if (civetOptions.type !== "ObjectExpression") throw new Error("Civet config in svelte-preprocess options must be an object");

			setDefault({
				default: {
					type: "Literal",
					value: true,
				},
				object: civetOptions,
				property: "bare",
			});
		},
		updateJavaScript,
	});

	await updateViteConfig({
		mutateViteConfig(viteConfig, containingFile, cjs) {
			let vitePluginCivetImportedAs = "civet";
			addImport({ require: vitePluginCivetImportedAs, cjs, default: vitePluginCivetImportedAs, package: "vite-plugin-civet", typeScriptEstree: containingFile });

			const pluginsList = setDefault({
				object: viteConfig,
				default: {
					type: "ArrayExpression",
					elements: [],
				},
				property: "plugins",
			});
			if (pluginsList.type !== "ArrayExpression") throw new Error("`plugins` in Vite config needs to be an array");

			/** @type {import("estree").CallExpression | undefined} */
			let vitePluginCivetFunctionCall;
			for (const element of pluginsList.elements) {
				if (!element) continue;
				if (element.type !== "CallExpression") continue;
				if (element.callee.type !== "Identifier") continue;
				if (element.callee.name !== vitePluginCivetImportedAs) continue;
				vitePluginCivetFunctionCall = element;
			}

			// Add an vite-plugin-civet() call to the Vite plugins list if missing
			if (!vitePluginCivetFunctionCall) {
				vitePluginCivetFunctionCall = {
					type: "CallExpression",
					callee: {
						type: "Identifier",
						name: vitePluginCivetImportedAs,
					},
					arguments: [
						{
							type: "ObjectExpression",
							properties: [],
						},
					],
					optional: false,
				};

				pluginsList.elements.push(vitePluginCivetFunctionCall);
			}

			let vitePluginCivetArgs = vitePluginCivetFunctionCall.arguments[0];
			if (!vitePluginCivetArgs) {
				vitePluginCivetArgs = {
					type: "ObjectExpression",
					properties: [],
				};

				vitePluginCivetFunctionCall.arguments.push(vitePluginCivetArgs);
			}
			if (vitePluginCivetArgs.type !== "ObjectExpression") throw new Error("vite-plugin-civet arguments must be an object");
			setDefault({
				object: vitePluginCivetArgs,
				property: "jsx",
				default: {
					type: "Literal",
					value: false,
				},
			});
		},
		updateJavaScript,
	});

	await install({ package: "svelte-preprocess" });
	await install({ package: "@danielx/civet" });
	await install({ package: "vite-plugin-civet" });
};
