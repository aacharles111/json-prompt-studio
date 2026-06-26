'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { X, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const [showKey, setShowKey] = useState(false);

  if (!open) return null;

  // Current models as of June 2026
  const geminiModels = [
    { value: 'gemini-3.0-flash', label: 'Gemini 3.0 Flash (fast)' },
    { value: 'gemini-3.0-pro', label: 'Gemini 3.0 Pro (powerful)' },
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  ];

  const openaiModels = [
    { value: 'gpt-4.1', label: 'GPT-4.1 (latest)' },
    { value: 'gpt-4o', label: 'GPT-4o (fast)' },
    { value: 'o4-mini', label: 'o4-mini (reasoning)' },
  ];

  const models = settings.provider === 'gemini' ? geminiModels : openaiModels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700 sticky top-0 bg-slate-800 rounded-t-xl">
          <h3 className="text-sm font-semibold text-slate-200">Settings</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* AI Provider */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">AI Provider</label>
            <select
              value={settings.provider}
              onChange={(e) => {
                const provider = e.target.value as 'gemini' | 'openai';
                // Reset model to a valid one for the new provider
                const defaultModel = provider === 'gemini' ? 'gemini-3.0-flash' : 'gpt-4.1';
                setSettings({ provider, model: defaultModel });
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="gemini">Gemini (Google)</option>
              <option value="openai">ChatGPT (OpenAI)</option>
            </select>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => setSettings({ apiKey: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 pr-9 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                placeholder={settings.provider === 'gemini' ? 'AIza...' : 'sk-...'}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              {settings.provider === 'gemini'
                ? 'Gemini keys start with AIza. Get one at aistudio.google.com'
                : 'OpenAI keys start with sk-. Get one at platform.openai.com'}
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Model</label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ model: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              {models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Output Format */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Default Output Format</label>
            <div className="flex gap-2">
              {(['minified', 'pretty'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSettings({ outputFormat: fmt })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                    settings.outputFormat === fmt
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}
                >
                  {fmt === 'minified' ? 'Minified' : 'Pretty'}
                </button>
              ))}
            </div>
          </div>

          {/* Import Mode */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Default Import Mode</label>
            <div className="flex gap-2">
              {(['ask', 'always'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setSettings({ importMode: mode })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                    settings.importMode === mode
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}
                >
                  {mode === 'ask' ? 'Ask First' : 'Always Replace'}
                </button>
              ))}
            </div>
          </div>

          {/* Dark Mode */}
          <div>
            <label className="block text-[10px] uppercase text-slate-500 mb-1">Theme</label>
            <div className="flex gap-2">
              {([true, false] as const).map((isDark) => (
                <button
                  key={String(isDark)}
                  onClick={() => setSettings({ darkMode: isDark })}
                  className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                    settings.darkMode === isDark
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-slate-900 border border-slate-700 text-slate-500'
                  }`}
                >
                  {isDark ? 'Dark' : 'Light'}
                </button>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-amber-400/80">
                Your API key is stored in browser localStorage and sent directly to the AI provider. For production use, proxy API calls through a backend to keep your key secure.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
