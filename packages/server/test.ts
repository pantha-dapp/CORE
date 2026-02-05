import { generateTranslation } from "./lib/ai/engine";

let responseTime = Date.now();
const g = await generateTranslation({
	input:
		"Hello, My name is foxie, I am a software engineer and I love coding. I have been working in the industry for over 10 years and I have experience with a wide range of programming languages and technologies. In my free time, I enjoy hiking, traveling, and spending time with my family.",
	sourceLanguage: "en",
	targetLanguage: "es-AR",
});

console.log(g);
responseTime = Date.now() - responseTime;

console.log(`Response time: ${responseTime}ms`);
