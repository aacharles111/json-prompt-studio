@echo off
cd /d "C:\Users\Charles\Desktop\Projects\Prompt studio\prompt-studio"
echo STARTED > BUILD_LOG.txt

openclaude -p "You are building JSON Prompt Studio — a visual web app for creating structured JSON image prompts for Ideogram-4. This is a Next.js 16 + React 19 + TypeScript + Tailwind CSS project at C:\Users\Charles\Desktop\Projects\Prompt studio\prompt-studio. The project uses src/ directory, App Router.

## CRITICAL RULES
- NEVER delete or overwrite existing files unless explicitly instructed
- ALWAYS run 'npm run build' after making changes to verify they compile
- ALWAYS use TypeScript, never plain JS
- IMPORTANT: This is Next.js 16 with Tailwind CSS v4. The Tailwind setup uses @tailwindcss/postcss plugin, NOT the old postcss.config.js with tailwindcss plugin. Do NOT modify postcss.config.mjs or the @import 'tailwindcss' in globals.css. Use Tailwind v4 syntax (no @tailwind base/components/utilities directives).
- When using shadcn/ui patterns, manually create the components (do not run npx shadcn init — it conflicts with Tailwind v4)

## PACKAGES ALREADY INSTALLED
- zustand (state management)
- konva + react-konva (canvas)
- lucide-react (icons)
- uuid + @types/uuid (element IDs)

## ARCHITECTURE TO BUILD

Create the following file structure under src/:

### 1. src/lib/types.ts — All TypeScript interfaces
- ElementType: 'obj' | 'text'
- Element: { id, type, label, desc, text, x, y, w, h (0-1 fractions), palette: string[], enabled, ui: string (display color), variable: string[] | null }
- StyleMode: 'none' | 'photo' | 'art'
- StyleState: { mode, presetId: string | null, presetName, aesthetics, lighting, medium, photo, art_style, color_palette: string[] }
- StylePreset: { id, name, category: 'photography' | 'art' | 'cinematic', mode: StyleMode, aesthetics, lighting, medium, photo?, art_style?, color_palette }
- AppState: { aspectRatio, includeAspectRatio: boolean, highLevelDescription, background, style: StyleState, boxPrecision: boolean, elements: Element[], importHash, settings: Settings }
- Settings: { provider, apiKey, model, darkMode, outputFormat, importMode }
- CaptionElement, CompositionalDeconstruction, StyleDescription, IdeogramCaption (the output schema)

### 2. src/lib/store.ts — Zustand store
- Single normalized store with all AppState fields
- Actions: addElement(type, x, y, w, h), updateElement(id, partial), deleteElement(id), clearAll(), moveElement(id, x, y), resizeElement(id, w, h), reorderElements(fromIndex, toIndex), toggleElement(id), setVariable(id, values), selectElement(id | null), setAspectRatio(ratio), setStyleMode/StyleField/etc., setSettings(partial)
- Auto-save: subscribe to changes, debounce 500ms, save to localStorage key 'jps-project'
- Auto-load: on store creation, try to hydrate from localStorage
- selectedElementId: string | null (derived, not persisted)

### 3. src/lib/compile.ts — Pure compilation functions (ported from Deno Ideogram Director node)
- normBbox(el: Element): [number,number,number,number] — convert fractional 0-1 to 0-1000 grid [y1,x1,y2,x2], top-left origin, ensure y1<y2 and x1<x2
- expandVariables(elements: Element[]): Element[][] — Cartesian product of variables, capped at 10
- assembleCaption(state): IdeogramCaption — build final JSON
- minifyCaption(caption): string — single-line, ensure_ascii=false separators=',' ':'
- compile(state): string[] — full pipeline: expand → filter disabled → order by layer → normBbox if precision → assemble → conditionally omit aspect_ratio and style_description → minify → return array of strings (1-10)

### 4. src/lib/presets.ts — 55 style presets
Export an array of StylePreset objects. Include ALL 55 presets listed below (I will provide exact content for each). For now, create the array with AT LEAST these 10 presets fully detailed, and placeholder entries for the rest with proper category grouping. Make each preset self-contained with realistic, production-quality prose for aesthetics/lighting/medium/photo/art_style fields:

FULL PRESETS (provide complete prose for these 10):
1. Studio Product (photo) — Clean white background, softbox lighting, 85mm macro, product photography
2. Fashion Editorial (photo) — High contrast, dramatic shadows, 50mm f/1.2, fashion photography
3. Golden Hour Portrait (photo) — Warm natural light, rim lighting, 85mm f/1.4
4. Moody Cinematic (photo) — Low key, anamorphic lens flares, teal/orange grade
5. Digital Concept Art (art) — Matte painting, cinematic composition, photoreal digital art
6. Oil Painting (art) — Impasto texture, visible brushstrokes, classical oil painting
7. Anime/Manga (art) — Cel-shaded, clean lines, vibrant flat colours, anime style
8. Cyberpunk (art) — Neon, rain-slicked streets, high-tech low-life, digital art
9. Hollywood Blockbuster (photo) — Anamorphic, teal/orange, lens flares, 35mm cinematography
10. Fantasy Illustration (art) — MTG-style, rich colour, dramatic rim light, digital illustration

PLACEHOLDER PRESETS (create with name, category, mode, and brief placeholder prose — we will fill details later):
Photography: Minimalist Flat Lay, Luxury Jewelry, Food Photography, Real Estate Interior, Night Street, Vintage Film, High Fashion B&W, Sports Action, Macro Nature, Architectural, Underwater, Aerial Drone, Documentary, Cosmetics Beauty, Automotive, Wedding, Astrophotography, Wildlife, Candid Street, Fine Art Nude, Product on White
Art: Watercolor, Comic Book, Pencil Sketch, 3D Render, Pixel Art, Art Nouveau, Art Deco, Steampunk, Ukiyo-e, Pop Art, Impressionist, Surrealism, Bauhaus, Vaporwave, Charcoal Drawing, Stained Glass
Cinematic: Indie Film, Noir, Wes Anderson, Documentary Film, Music Video, Period Drama, Sci-Fi Epic, Ghibli-Inspired

### 5. src/components/Canvas.tsx — Konva canvas component
- 'use client' component
- Receives: elements, aspectRatio, selectedElementId, onSelectElement, onMoveElement, onResizeElement
- Renders a Stage with a Layer
- Aspect ratio is maintained: the canvas container is sized to fit within its parent while preserving the ratio
- Draw background grid (subtle lines)
- Each element rendered as a Konva Rect with:
  - Position from x,y (fractional → pixel conversion based on canvas size)
  - Size from w,h
  - Fill color from element.ui (semi-transparent)
  - Stroke color darker when selected
  - Text label inside (element.label or first variable value or element.text)
  - Disabled elements at 30% opacity
- Draggable: on drag end, convert pixel position back to 0-1 fractions and call onMoveElement
- Transformer: when selected, show transformer with resize handles
- Click empty canvas → deselect

### 6. src/components/Inspector.tsx — Element inspector panel
- Shows when an element is selected
- Editable fields: label, desc, text (only for text type), color_palette (swatch picker), enabled toggle
- Live bbox readout [y1,x1,y2,x2]
- Type badge (OBJECT/TEXT)
- Delete element button
- 'Make this a variable' button → opens variable editor

### 7. src/components/Layers.tsx — Layer panel
- List all elements with drag-to-reorder (up/down buttons for v1)
- Click to select
- Visibility toggle per element
- Variable marker (✦) and text marker (T)

### 8. src/components/StylePanel.tsx — Style preset browser
- Mode selector: Neutral / Photo / Art (segmented control)
- When Photo or Art selected: show preset grid (3 categories as tabs)
- Clicking a preset fills all style fields
- Editable style fields below: aesthetics, lighting, medium, photo (photo mode), art_style (art mode), color_palette
- Editing any field changes preset to 'Custom'
- Neutral mode clears all style fields

### 9. src/components/JsonPanel.tsx — JSON output panel
- Tabs: Minified / Pretty / All Combinations
- Live updates on any state change
- Copy button + Export button
- Syntax highlighting (simple: keys in blue, strings in green, numbers in orange)

### 10. src/components/TopBar.tsx — Top bar
- Aspect ratio dropdown (16:9, 9:16, 1:1, 4:5, 3:2, 2:3, 4:3, 3:4, 21:9, 5:4)
- Aspect ratio output toggle (include in JSON on/off)
- Combination counter (n/10)
- Box Precision toggle
- Tool buttons: Add Object, Add Text
- Dark mode toggle
- Auto-save indicator
- Import button (opens modal)
- Settings button (opens modal)

### 11. src/app/layout.tsx — Root layout
- Wrap in StoreProvider (Zustand context)
- Dark mode class on html element
- Metadata: title 'JSON Prompt Studio', description about Ideogram prompt building

### 12. src/app/page.tsx — Main page
- Three-column layout: Left (StylePanel + controls), Center (Canvas), Right (Inspector + Layers)
- Bottom: JsonPanel (collapsible dock)
- Top: TopBar
- Responsive: minimum 1280px for full layout (mobile fast-follow)
- Import modal
- Settings modal

### 13. src/app/globals.css — Tailwind + custom styles
- Keep existing Tailwind v4 setup
- Add: canvas container styles, dark mode variables, custom scrollbar, preset card styles

## DESIGN SYSTEM
- Colors: Primary teal (#0891B2 / cyan-600), dark bg (#0F172A / slate-900), panel bg (#1E293B / slate-800), borders (#334155 / slate-700), text (#F8FAFC / slate-50), muted text (#94A3B8 / slate-400)
- Dark mode by default, light mode toggle
- Font: Inter (system font stack via Tailwind)
- Spacing: consistent 4px scale
- Rounded corners: lg for panels, md for buttons, full for toggles

## VERIFICATION
After creating all files, run: npm run build
Fix ALL TypeScript and build errors. The build must pass with zero errors.
Log any errors to BUILD_LOG.txt.

IMPORTANT: Start by creating ALL files, then run the build. Fix errors iteratively until it passes."

echo DONE > DONE.txt
