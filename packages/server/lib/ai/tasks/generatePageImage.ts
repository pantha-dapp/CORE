const generatePageImagePrompt = `## 🎯 Core Requirements (Non-Negotiable)

1. **TRANSPARENT BACKGROUND** - No solid backgrounds, alpha channel required
2. **DARK MODE OPTIMIZED** - Bright, vibrant colors that pop on dark backgrounds (#1a1a1a to #2d2d2d)
3. **NO MASCOTS/CHARACTERS** - Focus on icons, diagrams, and abstract representations (only include if absolutely essential)
4. **SAFE FOR ALL AGES** - Zero tolerance for NSFW, inappropriate, offensive, or suggestive content
5. **DUOLINGO-STYLE** - Polished flat design, friendly, educational, modern

## Art Style Guidelines

Create educational illustrations in a **Duolingo-style flat design** - modern, friendly, and highly polished with the following characteristics:

### Visual Style
- **Flat design** with simple, clean geometric shapes
- **Minimal shadows** - use subtle drop shadows sparingly for depth
- **Smooth, rounded corners** on all shapes and objects (high border radius)
- **Clean lines** with consistent stroke weights (2-3px when needed)
- **Minimalist approach** - remove unnecessary details, focus on clarity
- **Isometric perspective** optional for technical diagrams when it adds clarity
- **NO MASCOTS OR CHARACTERS** - Focus on abstract representations, icons, and diagrams. Only include characters/mascots if absolutely essential to the educational content (e.g., teaching about people, social interactions)
- **TRANSPARENT BACKGROUND** - Always generate with transparent/alpha background so images work seamlessly in the app

### Color Palette (Dark Mode Optimized)
- **Vibrant, luminous colors** that pop on dark backgrounds
- **High contrast and saturation** - colors should be rich and visible against dark UI (#1a1a1a - #2d2d2d range)
- **Avoid pure black or very dark colors** in the illustration itself
- **Consistent color scheme**:
  - Primary: Bright, glowing colors (electric blues #4A9EFF, vibrant greens #58CC02, rich purples #CE82FF)
  - Accents: Warm, eye-catching highlights (golden yellows #FFC800, coral oranges #FF9600, hot pinks #FF4B9C)
  - Borders/outlines: Darker contrasting strokes to separate from dark backgrounds
- **Educational color coding**: Use consistent colors for similar concepts
  - Code elements: Bright syntax highlighting (avoid dim grays)
  - Success/correct: Bright green (#58CC02, #4CAF50)
  - Error/incorrect: Vibrant red/pink (#FF4B4B, #FF6B9D)
  - Info/neutral: Electric blue (#4A9EFF, #2196F3)
- **Color visibility test**: Every color must be clearly visible against both #1a1a1a and #2d2d2d dark backgrounds

### Typography & Text (when needed)
- **Sans-serif fonts** that are clean and highly legible
- **Bold for headlines**, regular weight for body text
- **Minimal text** - prefer visual communication over words
- Text should be **large enough to read on mobile devices**

### Educational Clarity
- **One primary focus** per illustration - avoid visual clutter
- **Clear visual hierarchy** - important elements should stand out
- **Use icons and symbols** that are universally recognizable
- **Consistent metaphors** - if using a metaphor (e.g., boxes for variables), keep it consistent
- **Annotated when helpful** - use arrows, labels, or callouts sparingly to highlight key points

### Technical Content Guidelines
- **Code snippets**: Display in clean, syntax-highlighted code blocks with proper formatting
- **Diagrams**: Use clear flowcharts, network diagrams, or system architecture illustrations
- **UI elements**: Show realistic but simplified interface components
- **Data structures**: Visualize with boxes, arrows, and clear labels (arrays as rows of boxes, trees as hierarchical structures, etc.)

### Composition
- **Centered or balanced** composition for visual stability
- **Generous whitespace** around main subject (minimum 10% padding)
- **Mobile-first mindset** - designs should work well on small screens
- **Square or 16:9 aspect ratio** for consistency across the app
- **Scalable** - should look good at various sizes

### Mood & Tone
- **Duolingo-inspired**: Friendly, polished, and motivating - the perfect balance of fun and educational
- **Friendly and approachable** - not intimidating or overly corporate
- **Playful but professional** - suitable for learners of all ages (must be universally appropriate)
- **Encouraging and positive** - celebrates learning and progress
- **Clean and modern** - feels current and well-designed
- **Icon-focused over character-focused** - use abstract symbols, diagrams, and interface elements rather than people or mascots

### What to Avoid
- ❌ Photorealistic or 3D rendered styles
- ❌ Excessive gradients, textures, or patterns
- ❌ Too many colors or visual elements competing for attention
- ❌ Overly cartoonish or childish styles (maintain Duolingo's polished aesthetic)
- ❌ Dark, dim, or muted color schemes that disappear on dark backgrounds
- ❌ Cluttered compositions with too much detail
- ❌ Tiny text or illegible elements
- ❌ Generic stock photo aesthetics
- ❌ **MASCOTS, CHARACTERS, OR ANTHROPOMORPHIC FIGURES** unless absolutely required for the educational content
- ❌ **WHITE OR SOLID COLOR BACKGROUNDS** - must be transparent
- ❌ **ANY NSFW, INAPPROPRIATE, OR OFFENSIVE CONTENT** - keep all content safe, educational, and appropriate for all ages
- ❌ Pale, pastel, or washed-out colors that won't show on dark backgrounds

---

## Usage Instructions

When generating an image, prepend or combine this base style guidance with the specific content requirement. **Always specify transparent background, Duolingo-style flat design, and dark mode optimized colors.**

**Example full prompts:**
- "Duolingo-style flat design illustration with transparent background and vibrant colors for dark mode: Python code showing a for loop iterating over a list"
- "Transparent background, bright colors on dark UI, Duolingo-style flat design: Network switches connected in a mesh topology"
- "Educational flat design with transparent background, dark mode optimized: Visual representation of an array data structure with 5 elements"
- "Duolingo-style icon illustration, transparent background, bright colors: Flowchart showing if-else conditional logic"

**These will be automatically styled according to the guidelines above to maintain visual consistency throughout the Pantha learning experience.**

-> The prompt follows
`;

export default { prompt: generatePageImagePrompt };
