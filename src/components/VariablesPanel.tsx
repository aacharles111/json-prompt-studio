'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { X, Plus } from 'lucide-react';

export default function VariablesPanel() {
  const elements = useStore((s) => s.elements);
  const setVariable = useStore((s) => s.setVariable);
  const [newGroupValues, setNewGroupValues] = useState('');

  // Collect all elements that have variables
  const variableElements = elements.filter((el) => el.variable && el.variable.length > 0);

  function handleAddGroup() {
    if (!newGroupValues.trim()) return;
    // Find first element without a variable to attach to
    const target = elements.find((el) => !el.variable || el.variable.length === 0);
    if (target) {
      const values = newGroupValues.split(',').map((v) => v.trim()).filter(Boolean);
      setVariable(target.id, values);
      setNewGroupValues('');
    }
  }

  function handleRemoveValue(elId: string, valueIndex: number) {
    const el = elements.find((e) => e.id === elId);
    if (!el?.variable) return;
    const next = el.variable.filter((_, i) => i !== valueIndex);
    setVariable(elId, next.length > 0 ? next : null);
  }

  function handleAddValue(elId: string, value: string) {
    const el = elements.find((e) => e.id === elId);
    if (!el) return;
    setVariable(elId, [...(el.variable || []), value]);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase text-slate-500 font-semibold">Variables</h3>
        <span className="text-[10px] text-slate-600">{variableElements.length} group{variableElements.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Existing variable groups */}
      {variableElements.map((el) => {
        const values = el.variable || [];
        return (
          <div key={el.id} className="bg-slate-800/50 border border-slate-700 rounded p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: el.ui }}
              />
              <span className="text-[11px] text-slate-400 truncate">{el.label}</span>
              <button
                onClick={() => setVariable(el.id, null)}
                className="ml-auto p-0.5 rounded text-slate-600 hover:text-red-400"
                title="Remove variable group"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {values.map((v, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-[11px] text-slate-300"
                >
                  {v}
                  <button
                    onClick={() => handleRemoveValue(el.id, i)}
                    className="text-slate-500 hover:text-red-400"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <button
                onClick={() => {
                  const input = prompt('Add variable value:');
                  if (input?.trim()) handleAddValue(el.id, input.trim());
                }}
                className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px] text-slate-400 hover:text-slate-200 hover:border-slate-500"
              >
                +
              </button>
            </div>
          </div>
        );
      })}

      {variableElements.length === 0 && (
        <p className="text-[10px] text-slate-600 text-center py-2">
          No variables yet. Bind a variable to an element in the Inspector, or add one below.
        </p>
      )}

      {/* Add new variable group */}
      <div className="flex gap-1">
        <input
          type="text"
          value={newGroupValues}
          onChange={(e) => setNewGroupValues(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAddGroup();
          }}
          placeholder="Cat, Bulldog, Falcon..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500 placeholder:text-slate-600"
        />
        <button
          onClick={handleAddGroup}
          disabled={!newGroupValues.trim() || elements.length === 0}
          className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-[11px] text-slate-300 hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <p className="text-[9px] text-slate-600">Separate values with commas. Adds to first available element.</p>
    </div>
  );
}
