export type ElementType = 'obj' | 'text';
export type StyleMode = 'none' | 'photo' | 'art';
export type PresetCategory = 'photography' | 'art' | 'cinematic';

export interface Element {
  id: string;
  type: ElementType;
  label: string;
  desc: string;
  text: string; // verbatim rendered text, text-type only
  x: number; y: number; w: number; h: number; // 0-1 fractions
  palette: string[];
  enabled: boolean;
  ui: string; // display color on canvas
  variable: string[] | null;
}

export interface StyleState {
  mode: StyleMode;
  presetId: string | null;
  presetName: string;
  aesthetics: string;
  lighting: string;
  medium: string;
  photo: string;
  art_style: string;
  color_palette: string[];
}

export interface StylePreset {
  id: string;
  name: string;
  category: PresetCategory;
  mode: StyleMode;
  aesthetics: string;
  lighting: string;
  medium: string;
  photo?: string;
  art_style?: string;
  color_palette: string[];
}

export interface Settings {
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  darkMode: boolean;
  outputFormat: 'minified' | 'pretty';
  importMode: 'ask' | 'always';
}

export interface AppState {
  aspectRatio: string;
  includeAspectRatio: boolean;
  highLevelDescription: string;
  background: string;
  style: StyleState;
  boxPrecision: boolean;
  elements: Element[];
  selectedElementId: string | null;
  importHash: string;
  settings: Settings;
}

// Output schema types
export interface CaptionElement {
  type: ElementType;
  bbox?: [number, number, number, number]; // [y1,x1,y2,x2] 0-1000
  text?: string;
  desc: string;
  color_palette?: string[];
}

export interface CompositionalDeconstruction {
  background: string;
  elements: CaptionElement[];
}

export interface StyleDescription {
  aesthetics: string;
  lighting: string;
  medium: string;
  photo?: string;
  art_style?: string;
  color_palette?: string[];
}

export interface IdeogramCaption {
  aspect_ratio?: string;
  high_level_description: string;
  style_description?: StyleDescription;
  compositional_deconstruction: CompositionalDeconstruction;
}
