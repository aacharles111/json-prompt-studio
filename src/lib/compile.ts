import type { AppState, Element, IdeogramCaption, CaptionElement, StyleDescription } from './types';

/** Convert 0-1 fractional bbox to 0-1000 grid [y1, x1, y2, x2], top-left origin */
export function normBbox(el: { x: number; y: number; w: number; h: number }): [number, number, number, number] {
  const c = (v: number) => Math.max(0, Math.min(1000, Math.round(v * 1000)));
  let y1 = c(el.y);
  let x1 = c(el.x);
  let y2 = c(el.y + el.h);
  let x2 = c(el.x + el.w);
  if (y1 > y2) [y1, y2] = [y2, y1];
  if (x1 > x2) [x1, x2] = [x2, x1];
  return [y1, x1, y2, x2];
}

/** Normalize palette: uppercase, drop empties, cap length */
export function normalizePalette(colors: string[], cap: number = 5): string[] {
  return (colors || [])
    .filter((c) => typeof c === 'string' && c.trim())
    .map((c) => c.trim().toUpperCase())
    .slice(0, cap);
}

/** Cartesian product of variable elements, capped at 10 combinations */
export function expandVariables(elements: Element[]): Element[][] {
  // Group variable lengths
  const varElements = elements.filter((el) => el.variable && el.variable.length > 0);
  if (varElements.length === 0) return [elements];

  // Build Cartesian product
  let combos: Element[][] = [[]];
  for (const el of elements) {
    if (el.variable && el.variable.length > 0) {
      const next: Element[][] = [];
      for (const combo of combos) {
        for (const value of el.variable) {
          const variant: Element = { ...el, desc: value, variable: null };
          next.push([...combo, variant]);
          if (next.length >= 10) break;
        }
        if (next.length >= 10) break;
      }
      combos = next.slice(0, 10);
    } else {
      combos = combos.map((combo) => [...combo, { ...el }]);
    }
  }
  return combos.slice(0, 10);
}

/** Build style_description block if style mode is active */
function buildStyleDescription(state: AppState): StyleDescription | undefined {
  if (state.style.mode === 'none') return undefined;
  const sd: StyleDescription = {
    aesthetics: state.style.aesthetics,
    lighting: state.style.lighting,
    medium: state.style.medium,
  };
  if (state.style.mode === 'photo' && state.style.photo) {
    sd.photo = state.style.photo;
  }
  if (state.style.mode === 'art' && state.style.art_style) {
    sd.art_style = state.style.art_style;
  }
  const pal = normalizePalette(state.style.color_palette, 16);
  if (pal.length > 0) sd.color_palette = pal;
  return sd;
}

/** Assemble a single combination into a full IdeogramCaption */
export function assembleCaption(
  state: AppState,
  elements: Element[]
): IdeogramCaption {
  const caption: IdeogramCaption = {
    high_level_description: state.highLevelDescription || '',
    compositional_deconstruction: {
      background: state.background || '',
      elements: [],
    },
  };

  if (state.includeAspectRatio) {
    caption.aspect_ratio = state.aspectRatio;
  }

  const styleDesc = buildStyleDescription(state);
  if (styleDesc) {
    caption.style_description = styleDesc;
  }

  const enabledElements = elements.filter((el) => el.enabled);

  const captionElements: CaptionElement[] = enabledElements.map((el) => {
    const ce: CaptionElement = {
      type: el.type,
      desc: el.desc || '',
    };
    if (state.boxPrecision) {
      ce.bbox = normBbox(el);
    }
    if (el.type === 'text' && el.text) {
      ce.text = el.text;
    }
    const pal = normalizePalette(el.palette, 5);
    if (pal.length > 0) {
      ce.color_palette = pal;
    }
    return ce;
  });

  caption.compositional_deconstruction.elements = captionElements;
  return caption;
}

/** Minify a caption to single-line JSON, preserving non-ASCII */
export function minifyCaption(caption: IdeogramCaption): string {
  return JSON.stringify(caption, null, 0);  // JS JSON.stringify with no space is equivalent to separators=(",",":")
}

/** Pretty-print a caption */
export function prettyCaption(caption: IdeogramCaption): string {
  return JSON.stringify(caption, null, 2);
}

/** Full compile pipeline: returns array of minified JSON strings (1-10) */
export function compile(state: AppState): string[] {
  const combos = expandVariables(state.elements);
  return combos.map((elements) => {
    const caption = assembleCaption(state, elements);
    return minifyCaption(caption);
  });
}

/** Full compile pipeline returning pretty-printed JSON strings */
export function compilePretty(state: AppState): string[] {
  const combos = expandVariables(state.elements);
  return combos.map((elements) => {
    const caption = assembleCaption(state, elements);
    return prettyCaption(caption);
  });
}
