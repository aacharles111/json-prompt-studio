'use client';

import { useStore } from '@/lib/store';
import { Check, Plus } from 'lucide-react';

export default function TrueFalsePanel() {
  const elements = useStore((s) => s.elements);
  const toggleElement = useStore((s) => s.toggleElement);
  const boxPrecision = useStore((s) => s.boxPrecision);
  const setBoxPrecision = useStore((s) => s.setBoxPrecision);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase text-slate-500 font-semibold">True or False</h3>
        <span className="text-[10px] text-slate-600">{elements.length} item{elements.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Element toggles */}
      {elements.length > 0 ? (
        <div className="space-y-0.5">
          {elements.map((el) => (
            <button
              key={el.id}
              onClick={() => toggleElement(el.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors text-left"
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  el.enabled
                    ? 'bg-cyan-500 border-cyan-400'
                    : 'bg-slate-700 border-slate-600'
                }`}
              >
                {el.enabled && <Check className="w-3 h-3 text-white" />}
              </span>
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: el.ui, opacity: el.enabled ? 1 : 0.3 }}
              />
              <span className={`text-[11px] truncate ${el.enabled ? 'text-slate-300' : 'text-slate-600 line-through'}`}>
                {el.label || (el.type === 'text' ? 'Text' : 'Object')}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-slate-600 text-center py-2">
          Add objects or text to toggle them on/off
        </p>
      )}

      {/* Box Precision */}
      <div className="border-t border-slate-700 pt-2">
        <button
          onClick={() => setBoxPrecision(!boxPrecision)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-colors text-left"
        >
          <span
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              boxPrecision
                ? 'bg-cyan-500 border-cyan-400'
                : 'bg-slate-700 border-slate-600'
            }`}
          >
            {boxPrecision && <Check className="w-3 h-3 text-white" />}
          </span>
          <span className="text-[11px] text-slate-300">Box Precision</span>
        </button>
        <p className="text-[9px] text-slate-600 mt-1 px-2">
          When enabled, bounding box coordinates are included in the JSON output
        </p>
      </div>
    </div>
  );
}
