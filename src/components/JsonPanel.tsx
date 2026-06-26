'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { compile, compilePretty } from '@/lib/compile';
import { Copy, Download, ChevronDown, ChevronUp, FileJson } from 'lucide-react';

export default function JsonPanel() {
  const state = useStore((s) => s);
  const [tab, setTab] = useState<'minified' | 'pretty' | 'all'>('minified');
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const compiled = useMemo(() => {
    if (tab === 'minified') return compile(state);
    if (tab === 'pretty') return compilePretty(state);
    return compile(state); // all combos shown minified
  }, [state, tab]);

  const currentJson = tab === 'all'
    ? JSON.stringify(compiled.map((s: string) => { try { return JSON.parse(s); } catch { return s; } }), null, 2)
    : (compiled[0] || '{}') || '{}';

  const comboCount = compiled.length;

  function handleCopy() {
    navigator.clipboard.writeText(currentJson).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleExport() {
    const blob = new Blob(
      [tab === 'all' ? JSON.stringify(compiled.map((s: string) => { try { return JSON.parse(s); } catch { return s; } }), null, 2) : (compiled[0] || '{}')],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab === 'all' ? 'prompts.json' : 'prompt.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Simple syntax highlighting
  function highlight(json: string): React.ReactNode {
    return json.split('\n').map((line, i) => {
      const colored = line
        .replace(/(\"[^\"]*\")\s*:/g, '<span class="text-cyan-300">$1</span>:')
        .replace(/:\s*(\"[^\"]*\")/g, ': <span class="text-green-300">$1</span>')
        .replace(/:\s*(\d+)/g, ': <span class="text-orange-300">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-300">$1</span>');
      return <div key={i} dangerouslySetInnerHTML={{ __html: colored || ' ' }} />;
    });
  }

  const tabs = [
    { key: 'minified' as const, label: 'Minified' },
    { key: 'pretty' as const, label: 'Pretty' },
    { key: 'all' as const, label: `All (${comboCount})` },
  ];

  return (
    <div className="border-t border-slate-700 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileJson className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] uppercase text-slate-500 font-medium">JSON Output</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Tabs */}
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                tab === t.key ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="w-px h-4 bg-slate-700 mx-1" />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Copy to clipboard"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Export as .json"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-0.5 rounded text-slate-500 hover:text-slate-300"
          >
            {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="p-3 max-h-[200px] overflow-auto custom-scrollbar">
          <pre className="text-[11px] font-mono leading-relaxed text-slate-300 whitespace-pre-wrap break-all">
            {highlight(currentJson)}
          </pre>
          {tab === 'all' && compiled.length > 1 && (
            <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-600">
              Showing {compiled.length} combination{compiled.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
