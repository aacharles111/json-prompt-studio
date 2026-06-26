'use client';

import { useStore } from '@/lib/store';
import { ChevronUp, ChevronDown, Type, Box, Check } from 'lucide-react';

export default function Layers() {
  const elements = useStore((s) => s.elements);
  const selectedId = useStore((s) => s.selectedElementId);
  const selectElement = useStore((s) => s.selectElement);
  const toggleElement = useStore((s) => s.toggleElement);
  const reorderElements = useStore((s) => s.reorderElements);

  if (elements.length === 0) {
    return (
      <div className="text-slate-600 text-[11px] text-center py-3">
        No elements yet. Add objects or text using the toolbar.
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {elements.map((el, i) => {
        const isSelected = el.id === selectedId;
        const isFirst = i === 0;
        const isLast = i === elements.length - 1;

        return (
          <div
            key={el.id}
            className={`flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer transition-colors ${
              isSelected ? 'bg-cyan-500/10 border border-cyan-500/30' : 'hover:bg-slate-800/50 border border-transparent'
            }`}
            onClick={() => selectElement(el.id)}
          >
            {/* Checkbox */}
            <span
              onClick={(e) => {
                e.stopPropagation();
                toggleElement(el.id);
              }}
              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${
                el.enabled
                  ? 'bg-cyan-500 border-cyan-400'
                  : 'bg-slate-700 border-slate-600'
              }`}
            >
              {el.enabled && <Check className="w-3 h-3 text-white" />}
            </span>

            {/* Type icon */}
            <span className="text-slate-500 flex-shrink-0">
              {el.type === 'text' ? (
                <Type className="w-3 h-3 text-purple-400" />
              ) : (
                <Box className="w-3 h-3 text-cyan-400" />
              )}
            </span>

            {/* Label */}
            <span
              className={`flex-1 text-[11px] truncate ${el.enabled ? 'text-slate-300' : 'text-slate-600 line-through'}`}
            >
              {el.label || (el.type === 'text' ? 'Text' : 'Object')}
            </span>

            {/* Variable marker */}
            {el.variable && el.variable.length > 0 && (
              <span className="text-[10px] text-amber-400 flex-shrink-0" title="Variable">✦</span>
            )}

            {/* Reorder buttons */}
            <div className="flex flex-col -space-y-0.5 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFirst) reorderElements(i, i - 1);
                }}
                disabled={isFirst}
                className="p-0 rounded hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLast) reorderElements(i, i + 1);
                }}
                disabled={isLast}
                className="p-0 rounded hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
