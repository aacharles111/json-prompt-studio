import type { IdeogramCaption, CaptionElement } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawCaption = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawElement = Record<string, any>;

/** FNV-1a 32-bit hash — identical to Deno node's _import_sig */
export function fnv1a32(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Coerce common LLM shortcuts to the official Ideogram caption shape */
function coerceCaptionSchema(cap: RawCaption): IdeogramCaption | null {
  if (!cap || typeof cap !== 'object') return null;

  const cd = cap.compositional_deconstruction || {};
  const style = cap.style_description;

  const out: IdeogramCaption = {
    high_level_description: '',
    compositional_deconstruction: {
      background: '',
      elements: [],
    },
  };

  // aspect_ratio
  if (cap.aspect_ratio) out.aspect_ratio = cap.aspect_ratio;

  // high_level_description (try multiple key names)
  out.high_level_description =
    cap.high_level_description ||
    cap.summary ||
    cap.prompt ||
    cap.description ||
    cap.scene ||
    cap.caption ||
    '';

  // style_description
  if (style && typeof style === 'object') {
    out.style_description = {
      aesthetics: style.aesthetics || '',
      lighting: style.lighting || '',
      medium: style.medium || '',
    };
    if (style.photo) out.style_description.photo = style.photo;
    if (style.art_style) out.style_description.art_style = style.art_style;
    if (Array.isArray(style.color_palette)) {
      out.style_description.color_palette = style.color_palette;
    }
  }

  // background
  const bg = cd.background || cd.bg || cd.setting || cd.scene_background || cap.background || cap.bg || '';
  out.compositional_deconstruction.background = bg;

  // elements
  const rawElements =
    cd.elements || cd.objects || cd.items || cd.bboxes || cd.boxes ||
    cap.elements || cap.objects || cap.items || [];
  const elements: CaptionElement[] = [];
  for (const raw of (Array.isArray(rawElements) ? rawElements : []) as RawElement[]) {
    if (!raw || typeof raw !== 'object') continue;
    const el: CaptionElement = {
      type: (raw.type === 'text' ? 'text' : 'obj') as CaptionElement['type'],
      desc: '',
    };

    // bbox
    const bbox = raw.bbox || raw.box || raw.bounds || raw.rect;
    if (Array.isArray(bbox) && bbox.length === 4) {
      let [y1, x1, y2, x2] = bbox.map(Number);
      if (y1 > y2) [y1, y2] = [y2, y1];
      if (x1 > x2) [x1, x2] = [x2, x1];
      el.bbox = [y1, x1, y2, x2] as [number, number, number, number];
    }

    if (el.type === 'text') {
      el.text = (typeof raw.text === 'string' ? raw.text : '') || '';
    }
    el.desc = (typeof raw.desc === 'string' && raw.desc) ||
      (typeof raw.description === 'string' && raw.description) ||
      (typeof raw.label === 'string' && raw.label) ||
      (typeof raw.name === 'string' && raw.name) ||
      (typeof raw.prompt === 'string' && raw.prompt) || '';

    const palette = raw.color_palette || raw.palette;
    if (Array.isArray(palette)) {
      el.color_palette = palette.map(String);
    }

    elements.push(el);
  }
  out.compositional_deconstruction.elements = elements;

  return out;
}

/** Lenient 3-strategy JSON parse: raw → fenced block → brace-span */
export function loadsCaption(raw: string): IdeogramCaption | null {
  if (!raw || !raw.trim()) return null;
  const text = raw.trim();

  // Strategy 1: raw JSON
  const candidates = [text];

  // Strategy 2: extract from ```json fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    candidates.push(fenceMatch[1].trim());
  }

  // Strategy 3: first '{' to last '}'
  const i = text.indexOf('{');
  const j = text.lastIndexOf('}');
  if (i >= 0 && j > i) {
    candidates.push(text.slice(i, j + 1));
  }

  for (const c of candidates) {
    try {
      const v = JSON.parse(c);
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        return coerceCaptionSchema(v);
      }
    } catch {
      continue;
    }
  }

  return null;
}

/** Hydrate app state from an imported caption (returns partial state to merge) */
export function hydrateFromCaption(caption: IdeogramCaption): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (caption.aspect_ratio) {
    updates.aspectRatio = caption.aspect_ratio;
  }
  if (caption.high_level_description) {
    updates.highLevelDescription = caption.high_level_description;
  }
  if (caption.compositional_deconstruction?.background) {
    updates.background = caption.compositional_deconstruction.background;
  }

  // Style
  if (caption.style_description) {
    updates.style = {
      mode: caption.style_description.art_style ? 'art' : 'photo',
      presetId: null,
      presetName: 'Custom',
      aesthetics: caption.style_description.aesthetics || '',
      lighting: caption.style_description.lighting || '',
      medium: caption.style_description.medium || '',
      photo: caption.style_description.photo || '',
      art_style: caption.style_description.art_style || '',
      color_palette: caption.style_description.color_palette || [],
    };
  }

  return updates;
}
