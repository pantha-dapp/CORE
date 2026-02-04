import { generateTranslation } from "./lib/ai/engine";

let responseTime = Date.now();
const g = await generateTranslation({
	input:
		"TranslateGemma is a family of lightweight, state-of-the-art open translation models from Google, based on the Gemma 3 family of models. TranslateGemma models are designed to handle translation tasks across 55 languages. Their relatively small size makes it possible to deploy them in environments with limited resources such as laptops, desktops or your own cloud infrastructure, democratizing access to state of the art translation models and helping foster innovation for everyone.",
	sourceLanguage: "en",
	targetLanguage: "es",
});

console.log(g);
responseTime = Date.now() - responseTime;

console.log(`Response time: ${responseTime}ms`);
