'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { PRESETS, getPresetsByCategory } from '@/lib/presets';
import { Search, Palette, Camera, PaintBucket, Film } from 'lucide-react';
import type { StylePreset } from '@/lib/types';

const CATEGORIES = [
  { key: 'photography', label: 'Photography', icon: Camera, count: 25 },
  { key: 'art', label: 'Art & Illust.', icon: PaintBucket, count: 20 },
  { key: 'cinematic', label: 'Cinematic', icon: Film, count: 10 },
];

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#0891B2', '#8B5CF6', '#EC4899', '#F97316', '#6366F1', '#14B8A6', '#E11D48', '#CA8A04', '#059669', '#0E7490', '#7C3AED', '#DB2777', '#EA580C', '#4F46E5', '#0D9488', '#DC2626', '#D97706'];

export default function StylePanel() {
  const style = useStore((s) => s.style);
  const setStyleMode = useStore((s) => s.setStyleMode);
  const applyPreset = useStore((s) => s.applyPreset);
  const setStyleField = useStore((s) => s.setStyleField);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('photography');

  const filtered = getPresetsByCategory(activeCategory).filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStyleColor(hex: string) {
    const palette = style.color_palette || [];
    const next = palette.includes(hex)
      ? palette.filter((c) => c !== hex)
      : [...palette, hex].slice(0, 16);
    setStyleField('color_palette', next);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mode selector */}
      <div className="flex bg-slate-800 rounded-lg p-0.5 mb-3">
        {(['none', 'photo', 'art'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setStyleMode(mode)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              style.mode === mode
                ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            {mode === 'none' ? 'Neutral' : mode === 'photo' ? 'Photo' : 'Art'}
          </button>
        ))}
      </div>

      {style.mode === 'none' ? (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
          <div className="text-center">
            <Palette className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No style applied</p>
            <p className="text-xs mt-1">Switch to Photo or Art to pick a preset</p>
          </div>
        </div>
      ) : (
        <>
          {/* Preset browser */}
          <div className="mb-3">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search presets..."
                className="w-full bg-slate-800 border border-slate-700 rounded pl-7 pr-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 mb-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                    activeCategory === cat.key
                      ? 'bg-slate-700 text-slate-200'
                      : 'text-slate-500 hover:text-slate-400'
                  }`}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset grid */}
            <div className="grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
              {filtered.map((preset) => {
                const isActive = style.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.id, preset.name, {
                      mode: preset.mode,
                      aesthetics: preset.aesthetics,
                      lighting: preset.lighting,
                      medium: preset.medium,
                      photo: preset.photo || '',
                      art_style: preset.art_style || '',
                      color_palette: preset.color_palette,
                    })}
                    className={`text-left p-2 rounded border text-[10px] transition-all ${
                      isActive
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <div className="flex gap-0.5">
                        {(preset.color_palette || []).slice(0, 3).map((c, i) => (
                          <span key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <span className="font-medium text-slate-300 truncate">{preset.name}</span>
                    </div>
                    <p className="text-slate-500 leading-tight line-clamp-2">{preset.aesthetics}</p>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-2 text-center text-slate-600 text-xs py-4">No presets found</p>
              )}
            </div>
          </div>

          {/* Editable style fields */}
          <div className="space-y-2 border-t border-slate-700 pt-3">
            <p className="text-[10px] uppercase text-slate-500">
              {style.presetName} {style.presetId ? '' : '(Custom)'}
            </p>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Aesthetics</label>
              <input
                type="text"
                value={style.aesthetics}
                onChange={(e) => setStyleField('aesthetics', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Clean minimal product photography"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Lighting</label>
              <input
                type="text"
                value={style.lighting}
                onChange={(e) => setStyleField('lighting', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. Soft studio key light from left"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Medium</label>
              <input
                type="text"
                value={style.medium}
                onChange={(e) => setStyleField('medium', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="e.g. photography, digital painting, oil on canvas"
              />
            </div>

            {style.mode === 'photo' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Photo (Camera/Lens)</label>
                <input
                  type="text"
                  value={style.photo}
                  onChange={(e) => setStyleField('photo', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Sony A7III, 85mm f/1.4, ISO 100"
                />
              </div>
            )}

            {style.mode === 'art' && (
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Art Style</label>
                <input
                  type="text"
                  value={style.art_style}
                  onChange={(e) => setStyleField('art_style', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Oil on canvas, impasto technique"
                />
              </div>
            )}

            {/* Style-level color palette */}
            <div>
              <label className="block text-[10px] text-slate-500 mb-1">Style Palette (max 16)</label>
              <div className="flex flex-wrap gap-1">
                {COLORS.map((hex) => {
                  const active = (style.color_palette || []).includes(hex);
                  return (
                    <button
                      key={hex}
                      onClick={() => toggleStyleColor(hex)}
                      className={`w-5 h-5 rounded border transition-all ${active ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: hex }}
                      title={hex}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
