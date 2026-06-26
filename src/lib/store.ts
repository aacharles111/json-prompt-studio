import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, Element, StyleState, StyleMode, Settings } from './types';

const COLORS = ['#0891B2', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#14B8A6'];

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

const DEFAULT_STYLE: StyleState = {
  mode: 'none',
  presetId: null,
  presetName: 'Custom',
  aesthetics: '',
  lighting: '',
  medium: '',
  photo: '',
  art_style: '',
  color_palette: [],
};

const DEFAULT_SETTINGS: Settings = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-3.0-flash',
  darkMode: true,
  outputFormat: 'minified',
  importMode: 'ask',
};

function getDefaultState(): AppState {
  return {
    aspectRatio: '1:1',
    includeAspectRatio: false,
    highLevelDescription: '',
    background: '',
    style: { ...DEFAULT_STYLE },
    boxPrecision: true,
    elements: [],
    selectedElementId: null,
    importHash: '',
    settings: { ...DEFAULT_SETTINGS },
  };
}

function loadFromStorage(): Partial<AppState> | null {
  try {
    const raw = localStorage.getItem('jps-project');
  // Merge settings from dedicated settings key if present
  try {
    const settingsRaw = localStorage.getItem('jps-settings');
    if (settingsRaw) {
      const settings = JSON.parse(settingsRaw);
      if (raw) {
        const data = JSON.parse(raw);
        data.settings = { ...data.settings, ...settings };
        return data;
      }
      return { settings };
    }
  } catch { /* ignore */ }
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data;
  } catch {
    return null;
  }
}

function saveToStorage(state: AppState) {
  try {
    const { selectedElementId, ...persistable } = state;
    localStorage.setItem('jps-project', JSON.stringify(persistable));
  } catch {
    // localStorage full or unavailable
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(state: AppState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveToStorage(state), 500);
}

interface StoreActions {
  addElement: (type: 'obj' | 'text', x: number, y: number, w: number, h: number) => void;
  updateElement: (id: string, partial: Partial<Element>) => void;
  deleteElement: (id: string) => void;
  clearAll: () => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, w: number, h: number) => void;
  reorderElements: (fromIndex: number, toIndex: number) => void;
  toggleElement: (id: string) => void;
  setVariable: (id: string, values: string[] | null) => void;
  selectElement: (id: string | null) => void;
  setAspectRatio: (ratio: string) => void;
  setIncludeAspectRatio: (include: boolean) => void;
  setHighLevelDescription: (desc: string) => void;
  setBackground: (bg: string) => void;
  setBoxPrecision: (precision: boolean) => void;
  setStyleMode: (mode: StyleMode) => void;
  setStyleField: <K extends keyof StyleState>(field: K, value: StyleState[K]) => void;
  applyPreset: (presetId: string | null, presetName: string, style: Partial<StyleState>) => void;
  setSettings: (partial: Partial<Settings>) => void;
  importCaption: (caption: any, importHash: string) => void;
  loadProject: (state: AppState) => void;
  getExportState: () => AppState;
}

export type AppStore = AppState & StoreActions;

export const useStore = create<AppStore>()((set, get) => ({
  ...getDefaultState(),
  ...(loadFromStorage() || {}),

  addElement: (type, x, y, w, h) => {
    const id = uuidv4();
    const el: Element = {
      id,
      type,
      label: type === 'obj' ? 'Object' : 'Text',
      desc: '',
      text: type === 'text' ? 'Text' : '',
      x, y, w, h,
      palette: [],
      enabled: true,
      ui: randomColor(),
      variable: null,
    };
    set((s) => {
      const newState = { ...s, elements: [...s.elements, el], selectedElementId: id };
      debouncedSave(newState);
      return newState;
    });
  },

  updateElement: (id, partial) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? { ...el, ...partial } : el)),
      };
      debouncedSave(newState);
      return newState;
    });
  },

  deleteElement: (id) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.filter((el) => el.id !== id),
        selectedElementId: s.selectedElementId === id ? null : s.selectedElementId,
      };
      debouncedSave(newState);
      return newState;
    });
  },

  clearAll: () => {
    set((s) => {
      const newState = {
        ...s,
        elements: [],
        selectedElementId: null,
        highLevelDescription: '',
        background: '',
        style: { ...DEFAULT_STYLE },
        importHash: '',
      };
      debouncedSave(newState);
      return newState;
    });
  },

  moveElement: (id, x, y) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? { ...el, x, y } : el)),
      };
      debouncedSave(newState);
      return newState;
    });
  },

  resizeElement: (id, w, h) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? { ...el, w, h } : el)),
      };
      debouncedSave(newState);
      return newState;
    });
  },

  reorderElements: (fromIndex, toIndex) => {
    set((s) => {
      const elems = [...s.elements];
      const [moved] = elems.splice(fromIndex, 1);
      elems.splice(toIndex, 0, moved);
      const newState = { ...s, elements: elems };
      debouncedSave(newState);
      return newState;
    });
  },

  toggleElement: (id) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? { ...el, enabled: !el.enabled } : el)),
      };
      debouncedSave(newState);
      return newState;
    });
  },

  setVariable: (id, values) => {
    set((s) => {
      const newState = {
        ...s,
        elements: s.elements.map((el) => (el.id === id ? { ...el, variable: values } : el)),
      };
      debouncedSave(newState);
      return newState;
    });
  },

  selectElement: (id) => set({ selectedElementId: id }),

  setAspectRatio: (ratio) => {
    set((s) => {
      const newState = { ...s, aspectRatio: ratio };
      debouncedSave(newState);
      return newState;
    });
  },

  setIncludeAspectRatio: (include) => {
    set((s) => {
      const newState = { ...s, includeAspectRatio: include };
      debouncedSave(newState);
      return newState;
    });
  },

  setHighLevelDescription: (desc) => {
    set((s) => {
      const newState = { ...s, highLevelDescription: desc };
      debouncedSave(newState);
      return newState;
    });
  },

  setBackground: (bg) => {
    set((s) => {
      const newState = { ...s, background: bg };
      debouncedSave(newState);
      return newState;
    });
  },

  setBoxPrecision: (precision) => {
    set((s) => {
      const newState = { ...s, boxPrecision: precision };
      debouncedSave(newState);
      return newState;
    });
  },

  setStyleMode: (mode) => {
    set((s) => {
      const newStyle: StyleState =
        mode === 'none'
          ? { ...DEFAULT_STYLE }
          : { ...s.style, mode };
      const newState = { ...s, style: newStyle };
      debouncedSave(newState);
      return newState;
    });
  },

  setStyleField: (field, value) => {
    set((s) => {
      const newStyle = { ...s.style, [field]: value, presetId: null, presetName: 'Custom' };
      const newState = { ...s, style: newStyle };
      debouncedSave(newState);
      return newState;
    });
  },

  applyPreset: (presetId, presetName, style) => {
    set((s) => {
      const newStyle: StyleState = {
        ...DEFAULT_STYLE,
        ...style,
        presetId,
        presetName,
      };
      const newState = { ...s, style: newStyle };
      debouncedSave(newState);
      return newState;
    });
  },

  setSettings: (partial) => {
    set((s) => {
      const newSettings = { ...s.settings, ...partial };
      const newState = { ...s, settings: newSettings };
      try {
        localStorage.setItem('jps-settings', JSON.stringify(newSettings));
      } catch { /* ignore */ }
      debouncedSave(newState);
      return newState;
    });
  },

  importCaption: (caption, importHash) => {
    set((s) => {
      const updates: Partial<AppState> = { importHash };
      if (caption.aspect_ratio) updates.aspectRatio = caption.aspect_ratio;
      if (caption.high_level_description) updates.highLevelDescription = caption.high_level_description;
      if (caption.compositional_deconstruction?.background) {
        updates.background = caption.compositional_deconstruction.background;
      }
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
      if (caption.compositional_deconstruction?.elements) {
        const elements: Element[] = caption.compositional_deconstruction.elements.map((el: any, i: number) => ({
          id: uuidv4(),
          type: el.type || 'obj',
          label: el.type === 'text' ? (el.text?.slice(0, 12) || 'Text') : (el.desc?.slice(0, 20) || `Element ${i + 1}`),
          desc: el.desc || '',
          text: el.text || '',
          x: el.bbox ? el.bbox[1] / 1000 : 0.1 + i * 0.05,
          y: el.bbox ? el.bbox[0] / 1000 : 0.1 + i * 0.05,
          w: el.bbox ? (el.bbox[3] - el.bbox[1]) / 1000 : 0.2,
          h: el.bbox ? (el.bbox[2] - el.bbox[0]) / 1000 : 0.15,
          palette: el.color_palette || [],
          enabled: true,
          ui: randomColor(),
          variable: null,
        }));
        updates.elements = elements;
      }
      const newState = { ...s, ...updates };
      debouncedSave(newState);
      return newState;
    });
  },

  loadProject: (state) => {
    set({ ...state, selectedElementId: null });
    debouncedSave(state);
  },

  getExportState: () => {
    const s = get();
    const { selectedElementId, ...exportable } = s;
    return exportable as unknown as AppState;
  },
}));
