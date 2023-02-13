export const name = "Civet";

export const emoji = "🦫";

export const usageMarkdown = ['You can write CoffeeScript syntax in the `script lang="civet"` blocks in Svelte files.', "You can write CoffeeScript syntax in `.civet` files and import them elsewhere."];

/** @typedef {{}} Options */

/** @type {import("../..").Gatekeep} */
export const gatekeep = async () => {
	return { able: true };
};

/** @type {import("../..").AdderOptions<Options>} */
export const options = {};

/** @type {import("../..").Heuristic[]} */
export const heuristics = [
	{
		description: "`civet` is installed",
		async detector({ folderInfo }) {
			return "@danielx/civet" in folderInfo.allDependencies;
		},
	},
	{
		description: "`svelte-preprocess` is set up for CoffeeScript in `svelte.config.js`",
		async detector({ readFile }) {
			/** @param {string} text */
			const sveltePreprocessIsProbablySetup = (text) => {
				if (!text.includes("svelte-preprocess")) return false;
				if (!text.includes("civet")) return false;
				if (!text.includes("bare")) return false;
				return true;
			};

			const js = await readFile({ path: "/svelte.config.js" });
			const cjs = await readFile({ path: "/svelte.config.cjs" });

			if (js.exists) return sveltePreprocessIsProbablySetup(js.text);
			else if (cjs.exists) return sveltePreprocessIsProbablySetup(cjs.text);

			return false;
		},
	},
	{
		description: "The Vite Civet plugin is set up",
		async detector({ readFile }) {
			/** @param {string} text */
			const vitePluginIsProbablySetup = (text) => {
				if (!text.includes("vite-plugin-civet")) return false;
				if (!text.includes("civet(")) return false;

				return true;
			};

			const vite = await readFile({ path: "/vite.config.js" });

			if (vitePluginIsProbablySetup(vite.text)) return true;

			return false;
		},
	},
];
