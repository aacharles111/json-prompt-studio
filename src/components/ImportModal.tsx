'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { loadsCaption, fnv1a32, hydrateFromCaption } from '@/lib/import';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ImportModal({ open, onClose }: ImportModalProps) {
  const [rawJson, setRawJson] = useState('');
  const [mode, setMode] = useState<'ask' | 'always'>('ask');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const elements = useStore((s) => s.elements);
  const importHash = useStore((s) => s.importHash);
  const importCaption = useStore((s) => s.importCaption);

  if (!open) return null;

  function handleImport() {
    setError('');
    setSuccess(false);

    // Compute hash
    const hash = fnv1a32(rawJson);

    // Check change detection
    if (hash === importHash && elements.length > 0 && mode === 'ask') {
      setError('This JSON is identical to what already seeded the board. Your manual edits will not be overwritten.');
      return;
    }

    // Parse
    const caption = loadsCaption(rawJson);
    if (!caption) {
      setError('Could not parse JSON. Make sure it follows the Ideogram caption format.');
      return;
    }

    // Apply
    importCaption(caption, hash);
    setSuccess(true);
    setTimeout(() => {
      onClose();
      setRawJson('');
      setSuccess(false);
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-slate-200">Import Caption JSON</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Paste JSON caption</label>
            <textarea
              value={rawJson}
              onChange={(e) => { setRawJson(e.target.value); setError(''); }}
              rows={10}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 resize-none"
              placeholder='{"aspect_ratio":"16:9","high_level_description":"...","compositional_deconstruction":{...}}'
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Accepts raw JSON, markdown-fenced (```json), or brace-span extraction
            </p>
          </div>

          {/* Import mode */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Import mode</label>
            <div className="flex gap-2">
              <button
                onClick={() => setMode('ask')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  mode === 'ask' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                Ask Before Replacing
              </button>
              <button
                onClick={() => setMode('always')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  mode === 'always' ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-slate-900 border border-slate-700 text-slate-500'
                }`}
              >
                Always Replace
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <p className="text-xs text-green-300">Imported successfully!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!rawJson.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
