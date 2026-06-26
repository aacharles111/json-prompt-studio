'use client';

import { useStore } from '@/lib/store';
import { normBbox } from '@/lib/compile';
import { X, Eye, EyeOff, Variable } from 'lucide-react';
import { useState } from 'react';

export default function Inspector() {
  const elements = useStore((s) => s.elements);
  const selectedId = useStore((s) => s.selectedElementId);
  const selectElement = useStore((s) => s.selectElement);
  const updateElement = useStore((s) => s.updateElement);
  const deleteElement = useStore((s) => s.deleteElement);
  const setVariable = useStore((s) => s.setVariable);

  const el = elements.find((e) => e.id === selectedId);
  const [newVarValue, setNewVarValue] = useState('');

  if (!el) {
    return (
      <div className="p-4 text-slate-500 text-sm text-center">
        <p className="mt-8">Select an element on the canvas</p>
        <p className="mt-1 text-xs">to edit its properties here</p>
      </div>
    );
  }

  const bbox = normBbox(el);

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#0891B2', '#8B5CF6', '#EC4899', '#F97316', '#6366F1', '#14B8A6', '#E11D48', '#CA8A04', '#059669', '#0E7490', '#7C3AED', '#DB2777', '#EA580C', '#4F46E5', '#0D9488', '#DC2626', '#D97706'];

  function toggleColor(hex: string) {
    const palette = el!.palette || [];
    const next = palette.includes(hex)
      ? palette.filter((c) => c !== hex)
      : [...palette, hex].slice(0, 5);
    updateElement(el!.id, { palette: next });
  }

  return (
    <div className="p-3 space-y-3 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${el.type === 'text' ? 'bg-purple-500/20 text-purple-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
            {el.type}
          </span>
          {el.enabled ? (
            <Eye className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <EyeOff className="w-3.5 h-3.5 text-red-400" />
          )}
        </div>
        <button
          onClick={() => deleteElement(el.id)}
          className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
          title="Delete element"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Label */}
      <div>
        <label className="block text-[10px] uppercase text-slate-500 mb-1">Label</label>
        <input
          type="text"
          value={el.label}
          onChange={(e) => updateElement(el.id, { label: e.target.value })}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] uppercase text-slate-500 mb-1">Description</label>
        <textarea
          value={el.desc}
          onChange={(e) => updateElement(el.id, { desc: e.target.value })}
          rows={2}
          className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 resize-none"
          placeholder="Describe what appears in this box..."
        />
      </div>

      {/* Text (text-type only) */}
      {el.type === 'text' && (
        <div>
          <label className="block text-[10px] uppercase text-slate-500 mb-1">Verbatim Text</label>
          <input
            type="text"
            value={el.text}
            onChange={(e) => updateElement(el.id, { text: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-sm focus:outline-none focus:border-cyan-500 font-mono"
            placeholder="EXACT text to render..."
          />
          <p className="text-[10px] text-slate-600 mt-0.5">This text will never be translated or modified</p>
        </div>
      )}

      {/* Bbox readout */}
      <div>
        <label className="block text-[10px] uppercase text-slate-500 mb-1">Bounding Box</label>
        <code className="block bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-cyan-300 font-mono">
          [{bbox.join(', ')}]
        </code>
        <p className="text-[10px] text-slate-600 mt-0.5">[y1, x1, y2, x2] on 0-1000 grid</p>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-[10px] uppercase text-slate-500 mb-1">Color Palette</label>
        <div className="flex flex-wrap gap-1">
          {COLORS.map((hex) => {
            const active = (el.palette || []).includes(hex);
            return (
              <button
                key={hex}
                onClick={() => toggleColor(hex)}
                className={`w-6 h-6 rounded border-2 transition-all ${active ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                style={{ backgroundColor: hex }}
                title={hex}
              />
            );
          })}
        </div>
      </div>

      {/* Enabled toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateElement(el.id, { enabled: !el.enabled })}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${el.enabled ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}
        >
          {el.enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Variable */}
      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Variable className="w-3.5 h-3.5 text-amber-400" />
          <label className="text-[10px] uppercase text-slate-500">Variable</label>
        </div>

        {el.variable && el.variable.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {el.variable.map((v, i) => (
                <span key={i} className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-center gap-1">
                  {v}
                  <button
                    onClick={() => {
                      const next = el.variable!.filter((_, j) => j !== i);
                      setVariable(el.id, next.length > 0 ? next : null);
                    }}
                    className="text-amber-500 hover:text-amber-300"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <input
                type="text"
                value={newVarValue}
                onChange={(e) => setNewVarValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newVarValue.trim()) {
                    setVariable(el.id, [...(el.variable || []), newVarValue.trim()]);
                    setNewVarValue('');
                  }
                }}
                placeholder="Add value..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => {
                  if (newVarValue.trim()) {
                    setVariable(el.id, [...(el.variable || []), newVarValue.trim()]);
                    setNewVarValue('');
                  }
                }}
                className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-[11px] text-amber-300 hover:bg-amber-500/30"
              >
                +
              </button>
            </div>
            <button
              onClick={() => setVariable(el.id, null)}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              Remove variable
            </button>
          </div>
        ) : (
          <button
            onClick={() => setVariable(el.id, [el.desc || el.label || 'Variant 1'])}
            className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            + Make this a variable
          </button>
        )}
      </div>
    </div>
  );
}
