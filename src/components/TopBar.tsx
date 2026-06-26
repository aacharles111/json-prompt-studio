'use client';

import { useStore } from '@/lib/store';
import { compile } from '@/lib/compile';
import { Plus, Type, Moon, Sun, Download, Upload, Settings, Check, Loader2, Wand2 } from 'lucide-react';
import { useMemo } from 'react';

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', '3:2', '2:3', '4:3', '3:4', '21:9', '5:4'];

interface TopBarProps {
  onOpenImport: () => void;
  onOpenSettings: () => void;
  onProcess: () => void;
  processing: boolean;
}

export default function TopBar({ onOpenImport, onOpenSettings, onProcess, processing }: TopBarProps) {
  const aspectRatio = useStore((s) => s.aspectRatio);
  const setAspectRatio = useStore((s) => s.setAspectRatio);
  const includeAspectRatio = useStore((s) => s.includeAspectRatio);
  const setIncludeAspectRatio = useStore((s) => s.setIncludeAspectRatio);
  const boxPrecision = useStore((s) => s.boxPrecision);
  const setBoxPrecision = useStore((s) => s.setBoxPrecision);
  const darkMode = useStore((s) => s.settings.darkMode);
  const setSettings = useStore((s) => s.setSettings);
  const addElement = useStore((s) => s.addElement);
  const clearAll = useStore((s) => s.clearAll);
  const elements = useStore((s) => s.elements);
  const exportState = useStore((s) => s.getExportState);

  const state = useStore((s) => s);
  const comboCount = useMemo(() => compile(state).length, [state]);

  function handleAddBox() {
    addElement('obj', 0.15, 0.15, 0.3, 0.3);
  }

  function handleAddText() {
    addElement('text', 0.3, 0.45, 0.35, 0.1);
  }

  function handleExportProject() {
    const state = exportState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'json-prompt-studio-project.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLoadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const store = useStore.getState();
          store.loadProject(data);
        } catch {
          alert('Invalid project file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const overCap = comboCount > 10;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
      {/* Aspect Ratio */}
      <div className="flex items-center gap-1">
        <select
          value={aspectRatio}
          onChange={(e) => setAspectRatio(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <button
          onClick={() => setIncludeAspectRatio(!includeAspectRatio)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
            includeAspectRatio
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'bg-slate-900 border border-slate-700 text-slate-600 hover:text-slate-400'
          }`}
          title="Include aspect_ratio in JSON output"
        >
          AR
        </button>
      </div>

      <div className="w-px h-5 bg-slate-700" />

      {/* Box Precision */}
      <button
        onClick={() => setBoxPrecision(!boxPrecision)}
        className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
          boxPrecision
            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
            : 'bg-slate-900 border border-slate-700 text-slate-500'
        }`}
        title="Toggle bounding box precision"
      >
        Precision
      </button>

      {/* Combo counter */}
      <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
        overCap ? 'bg-red-500/20 text-red-300' : 'bg-slate-900 text-slate-400'
      }`}>
        {comboCount}/10
        {overCap && <span className="ml-1">⚠</span>}
      </div>

      <div className="flex-1" />

      {/* Tool buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleAddBox}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Object
        </button>
        <button
          onClick={handleAddText}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:border-purple-500/50 hover:text-purple-300 transition-colors"
        >
          <Type className="w-3 h-3" />
          Text
        </button>
        <button
          onClick={onProcess}
          disabled={processing}
          className="flex items-center gap-1 px-3 py-1 rounded bg-cyan-600 border border-cyan-500 text-xs text-white font-medium hover:bg-cyan-500 transition-colors disabled:opacity-50"
        >
          {processing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Wand2 className="w-3 h-3" />
          )}
          Process
        </button>
      </div>

      <div className="w-px h-5 bg-slate-700" />

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleExportProject}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Save project"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleLoadProject}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Load project"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onOpenImport}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Import JSON"
        >
          <Download className="w-3.5 h-3.5 rotate-180" />
        </button>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => {
            const newDM = !darkMode;
            setSettings({ darkMode: newDM });
          }}
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Auto-save indicator */}
      <div className="flex items-center gap-1 text-[10px] text-green-400">
        <Check className="w-3 h-3" />
        Saved
      </div>
    </div>
  );
}
