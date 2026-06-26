'use client';

import { useStore } from '@/lib/store';
import { Eye, EyeOff, ChevronUp, ChevronDown, Type, Box } from 'lucide-react';

export default function Layers() {
  const elements = useStore((s) => s.elements);
  const selectedId = useStore((s) => s.selectedElementId);
  const selectElement = useStore((s) => s.selectElement);
  const toggleElement = useStore((s) => s.toggleElement);
  const reorderElements = useStore((s) => s.reorderElements);

  if (elements.length === 0) {
    return (
      <div className="p-4 text-slate-500 text-sm text-center">
        <p className="mt-4">No elements yet</p>
        <p className="mt-1 text-xs">Add objects or text using the toolbar</p>
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
            onClick={() => selectElement(el.id)}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded text-xs ${
              isSelected
                ? 'bg-cyan-500/10 border border-cyan-500/30'
                : 'hover:bg-slate-800/50 border border-transparent'
            }`}
          >
            {/* Type icon */}
            <span className="text-slate-500">
              {el.type === 'text' ? (
                <Type className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Box className="w-3.5 h-3.5 text-cyan-400" />
              )}
            </span>

            {/* Color swatch */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: el.ui, opacity: el.enabled ? 1 : 0.3 }}
            />

            {/* Label */}
            <span className={`flex-1 truncate ${el.enabled ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
              {el.label || (el.type === 'text' ? 'Text' : 'Object')}
            </span>

            {/* Variable marker */}
            {el.variable && el.variable.length > 0 && (
              <span className="text-[10px] text-amber-400" title="Variable">✦</span>
            )}

            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleElement(el.id);
              }}
              className="p-0.5 rounded hover:bg-slate-700"
              title={el.enabled ? 'Hide' : 'Show'}
            >
              {el.enabled ? (
                <Eye className="w-3 h-3 text-slate-500" />
              ) : (
                <EyeOff className="w-3 h-3 text-red-400" />
              )}
            </button>

            {/* Reorder buttons */}
            <div className="flex flex-col -space-y-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isFirst) reorderElements(i, i - 1);
                }}
                disabled={isFirst}
                className="p-0 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronUp className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isLast) reorderElements(i, i + 1);
                }}
                disabled={isLast}
                className="p-0 rounded hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>
            </div>
          </div>
        );
      })}
      <p className="text-[10px] text-slate-600 px-3 pt-1">
        Elements earlier in the list are drawn behind later ones
      </p>
    </div>
  );
}
