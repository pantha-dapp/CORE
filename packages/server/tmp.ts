const API_KEY = "";
export async function image(args: { prompt: string }) {
	const resp = await fetch("https://api.openai.com/v1/images/generations", {
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${API_KEY}`,
		},
		method: "POST",
		body: JSON.stringify({
			model: "gpt-image-1-mini",
			prompt: args.prompt,
			n: 1,
			size: "1024x1024",
			quality: "low",
			background: "transparent",
		}),
	});

	if (!resp.ok) {
		const error = await resp.json();
		throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
	}

	const data = (await resp.json()) as { data: [{ b64_json: string }] };
	const b64 = data.data[0].b64_json;
	const imageBuffer = Buffer.from(b64, "base64");
	Bun.file("./generated_image.png").write(imageBuffer);
	return { imageUrl: "./generated_image.png" };
}

const fr = await image({
	prompt: `# Icon Generation Base Prompt

**Requirements:** Transparent background, Duolingo-style flat design, bright colors for dark mode (#1a1a1a-#2d2d2d), 256x256px base, 15-20% padding, 3-5px strokes, 2-3 colors max, simple & recognizable at 24px+, rounded shapes, safe for all ages.

## Colors (Vibrant, Dark Mode Optimized)
Blue #4A9EFF (tech/code), Green #58CC02 (success), Purple #CE82FF (creative), Yellow #FFC800 (basics), Orange #FF9600 (action), Pink #FF4B9C (social), Red #FF4B4B (errors), Cyan #00E5FF (data). Accents: White #FFFFFF, Light Yellow #FFF59D. Strokes: Dark #2d2d2d or match primary color.

## Icon Types

**Course Icons:** Rounded square/circle, 2-3 colors, metaphorical symbols (e.g., </> for code, atom for science, palette for design).

**Chapter Icons:** Circular/square, single concept, playful (e.g., labeled box for variables, circular arrows for loops, connected boxes for arrays).

**UI Icons:** Ultra-simple, monochrome/duo-tone, standard conventions (home, settings, check, etc.).

## Avoid
Realism, thin lines, dim colors, mascots, text, solid backgrounds, too much detail, inappropriate content.
Avoid frames / borders or unnecesary elements that reduce clarity at small sizes.
Avoid adding any background or squircle / rounded backgrounds, only keep the icon itself with transparent background

## Quick Reference Checklist

Before finalizing any icon, verify:

- [ ] Transparent background (alpha channel)
- [ ] Bright colors that pop on dark backgrounds (#1a1a1a - #2d2d2d)
- [ ] Recognizable at 24px, 48px, and 96px
- [ ] 15-20% padding around the icon
- [ ] Thick enough strokes (3-5px minimum)
- [ ] Flat design with optional subtle depth
- [ ] Rounded, friendly shapes (high border radius)
- [ ] Simple composition (2-3 colors max)
- [ ] Universally appropriate content
- [ ] Matches Duolingo's friendly, polished aesthetic
- [ ] Distinct from other icons in the set
- [ ] Purpose is immediately clear

---

**These icons will create a cohesive, professional, and engaging visual experience throughout the Pantha learning platform.**

Prompt Follows:

protein structures`,
});

console.log("Generated image URL:", fr.imageUrl);
