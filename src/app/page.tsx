'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import TopBar from '@/components/TopBar';
import Canvas from '@/components/Canvas';
import StylePanel from '@/components/StylePanel';
import Inspector from '@/components/Inspector';
import Layers from '@/components/Layers';
import VariablesPanel from '@/components/VariablesPanel';
import TrueFalsePanel from '@/components/TrueFalsePanel';
import JsonPanel from '@/components/JsonPanel';
import ImportModal from '@/components/ImportModal';
import SettingsModal from '@/components/SettingsModal';
import { useStore } from '@/lib/store';

const COLORS_GRID = [
  '#FFFFFF', '#F5F5F0', '#E8E0D5', '#D4C9B8', '#C0B0A0', '#A09080',
  '#FFD700', '#F4A460', '#FF8C00', '#FF6347', '#FF4500', '#DC143C',
  '#FF69B4', '#FF1493', '#C71585', '#DDA0DD', '#9370DB', '#8A2BE2',
  '#4169E1', '#1E90FF', '#00BFFF', '#00CED1', '#20B2AA', '#3CB371',
  '#228B22', '#556B2F', '#8B4513', '#A0522D', '#696969', '#2F4F4F',
];

export default function Home() {
  const [importOpen, setImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processStatus, setProcessStatus] = useState('');
  const [canvasDims, setCanvasDims] = useState({ width: 800, height: 600 });
  const centerRef = useRef<HTMLDivElement>(null);

  const highLevelDescription = useStore((s) => s.highLevelDescription);
  const setHighLevelDescription = useStore((s) => s.setHighLevelDescription);
  const background = useStore((s) => s.background);
  const setBackground = useStore((s) => s.setBackground);
  const darkMode = useStore((s) => s.settings.darkMode);

  // Sync dark mode to <html> class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Track canvas container dimensions
  useEffect(() => {
    if (!centerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasDims({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(centerRef.current);
    return () => observer.disconnect();
  }, []);

  interface AIElement {
    type?: string;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    desc?: string;
    text?: string;
    color_palette?: string[];
  }

  interface AIResponse {
    aspect_ratio?: string;
    high_level_description?: string;
    background?: string;
    elements?: AIElement[];
  }

  const applyProcessedData = useCallback((data: AIResponse) => {
    const store = useStore.getState();

    if (data.aspect_ratio) {
      store.setAspectRatio(data.aspect_ratio);
    } else {
      const desc = (data.high_level_description || store.highLevelDescription).toLowerCase();
      if (desc.includes('portrait') || desc.includes('person') || desc.includes('fashion')) {
        store.setAspectRatio('3:4');
      } else if (desc.includes('landscape') || desc.includes('cinematic') || desc.includes('wide')) {
        store.setAspectRatio('21:9');
      } else if (desc.includes('square') || desc.includes('icon') || desc.includes('logo')) {
        store.setAspectRatio('1:1');
      }
    }

    if (data.high_level_description) store.setHighLevelDescription(data.high_level_description);
    if (data.background) store.setBackground(data.background);

    store.clearAll();

    if (Array.isArray(data.elements)) {
      const sorted = [...data.elements].sort((a, b) => (a.y || 0) - (b.y || 0));

      for (const el of sorted) {
        store.addElement(
          el.type === 'text' ? 'text' : 'obj',
          el.x || 0.1,
          el.y || 0.1,
          el.w || 0.25,
          el.h || 0.2
        );
        const currentElements = useStore.getState().elements;
        const added = currentElements[currentElements.length - 1];
        if (added) {
          store.updateElement(added.id, {
            desc: el.desc || '',
            text: el.text || '',
            palette: Array.isArray(el.color_palette) ? el.color_palette : [],
          });
        }
      }
    }
  }, []);

  const applySeedFallback = useCallback((desc: string) => {
    const store = useStore.getState();
    store.clearAll();

    const layouts = [
      [
        { type: 'obj' as const, label: 'Subject', x: 0.3, y: 0.1, w: 0.4, h: 0.7, desc: desc },
        { type: 'obj' as const, label: 'Left Detail', x: 0.05, y: 0.2, w: 0.2, h: 0.3, desc: 'Supporting detail on the left' },
        { type: 'obj' as const, label: 'Right Detail', x: 0.75, y: 0.5, w: 0.2, h: 0.3, desc: 'Supporting detail on the right' },
      ],
      [
        { type: 'obj' as const, label: 'Top Left', x: 0.05, y: 0.05, w: 0.42, h: 0.42, desc: desc },
        { type: 'obj' as const, label: 'Top Right', x: 0.53, y: 0.05, w: 0.42, h: 0.42, desc: 'Complementary element' },
        { type: 'obj' as const, label: 'Bottom Left', x: 0.05, y: 0.53, w: 0.42, h: 0.42, desc: 'Additional detail' },
        { type: 'obj' as const, label: 'Bottom Right', x: 0.53, y: 0.53, w: 0.42, h: 0.42, desc: 'Background element' },
      ],
    ];

    const layout = layouts[Math.floor(Math.random() * layouts.length)];
    for (const el of layout) {
      store.addElement(el.type, el.x, el.y, el.w, el.h);
      const currentElements = useStore.getState().elements;
      const added = currentElements[currentElements.length - 1];
      if (added) {
        store.updateElement(added.id, { desc: el.desc, label: el.label });
      }
    }

    store.setBackground('A natural environment matching the scene description.');
  }, []);

  const handleProcess = useCallback(async () => {
    const desc = highLevelDescription.trim();
    if (!desc) {
      setProcessStatus('Enter a scene description first');
      setTimeout(() => setProcessStatus(''), 3000);
      return;
    }

    setProcessing(true);
    setProcessStatus('Processing...');

    try {
      const settings = useStore.getState().settings;

      if (settings.apiKey) {
        let responseText = '';

        if (settings.provider === 'gemini') {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`;
          const systemPrompt = `You are a scene layout expert for Ideogram-4 image generation. Given a text description, produce a JSON object with:
- "aspect_ratio": the best aspect ratio for this scene (choose from: 16:9, 9:16, 1:1, 4:5, 3:2, 2:3, 4:3, 3:4, 21:9, 5:4)
- "high_level_description": a refined one-sentence description
- "background": the scene background only (walls, floor, sky, etc.)
- "elements": an array of 3-6 elements to place in the scene. Each element has:
  - "type": "obj" or "text"
  - "desc": what it is (10-30 words)
  - "x", "y", "w", "h": fractional position (0-1). Elements should NOT overlap. Distribute them sensibly across the frame.
  - "color_palette": 1-3 hex colors (uppercase) that suit the element

Return ONLY the JSON, no explanation. The JSON must be parseable.`;

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt + '\n\nScene description: ' + desc }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(`Gemini API error (${res.status}): ${errData?.error?.message || 'Unknown error'}`);
          }

          const data = await res.json();
          responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
          const endpoint = 'https://api.openai.com/v1/chat/completions';
          const systemPrompt = `You are a scene layout expert for Ideogram-4 image generation. Given a text description, produce a JSON object with:
- "aspect_ratio": the best aspect ratio for this scene (choose from: 16:9, 9:16, 1:1, 4:5, 3:2, 2:3, 4:3, 3:4, 21:9, 5:4)
- "high_level_description": a refined one-sentence description
- "background": the scene background only (walls, floor, sky, etc.)
- "elements": an array of 3-6 elements to place in the scene. Each element has:
  - "type": "obj" or "text"
  - "desc": what it is (10-30 words)
  - "x", "y", "w", "h": fractional position (0-1). Elements should NOT overlap.
  - "color_palette": 1-3 hex colors (uppercase)

Return ONLY the JSON, no explanation.`;

          const res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${settings.apiKey}`,
            },
            body: JSON.stringify({
              model: settings.model,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: desc },
              ],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(`OpenAI API error (${res.status}): ${errData?.error?.message || 'Unknown error'}`);
          }

          const data = await res.json();
          responseText = data.choices?.[0]?.message?.content || '';
        }

        if (responseText) {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            applyProcessedData(parsed);
            setProcessStatus('AI layout generated!');
          } else {
            throw new Error('AI response did not contain valid JSON');
          }
        } else {
          throw new Error('Empty response from AI');
        }
      } else {
        applySeedFallback(desc);
        setProcessStatus('No API key — using seed layout');
      }
    } catch (err: any) {
      console.error('Process failed, using fallback:', err);
      applySeedFallback(desc);
      setProcessStatus('API failed — using fallback layout. ' + (err?.message || ''));
    }

    setProcessing(false);
    setTimeout(() => setProcessStatus(''), 6000);
  }, [highLevelDescription, applyProcessedData, applySeedFallback]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <TopBar
        onOpenImport={() => setImportOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onProcess={handleProcess}
        processing={processing}
      />

      {/* Process status */}
      {processStatus && (
        <div className={`px-4 py-1.5 text-xs font-medium text-center ${
          processStatus.includes('failed') || processStatus.includes('error')
            ? 'bg-red-500/20 text-red-300 border-b border-red-500/30'
            : processStatus.includes('seed') || processStatus.includes('fallback')
            ? 'bg-amber-500/20 text-amber-300 border-b border-amber-500/30'
            : 'bg-cyan-500/20 text-cyan-300 border-b border-cyan-500/30'
        }`}>
          {processStatus}
        </div>
      )}

      {/* Main content: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — Main Prompt + Variables + True/False + Style */}
        <div className="w-64 flex-shrink-0 border-r border-slate-700 bg-slate-900 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
            {/* Main Prompt — combined scene + background */}
            <div className="space-y-2">
              <h3 className="text-[10px] uppercase text-slate-500 font-semibold">Main Prompt</h3>
              <textarea
                value={highLevelDescription}
                onChange={(e) => setHighLevelDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                placeholder="Image of an orange cat, sitting on a dining table and there is a large book shelf in the back and there is a flower vase in the bookshelf and a chair in the foreground, realistic, house interior."
              />
              <input
                type="text"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                placeholder="Background (walls, floor, sky...)"
              />
            </div>

            {/* Variables */}
            <div className="border-t border-slate-700 pt-3">
              <VariablesPanel />
            </div>

            {/* True or False */}
            <div className="border-t border-slate-700 pt-3">
              <TrueFalsePanel />
            </div>

            {/* Style */}
            <div className="border-t border-slate-700 pt-3">
              <StylePanel />
            </div>
          </div>
        </div>

        {/* CENTER — Canvas (Box Mode) */}
        <div ref={centerRef} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 bg-slate-950">
            <Canvas width={canvasDims.width} height={canvasDims.height} />
          </div>

          {/* Colors grid + Layers below canvas */}
          <div className="flex border-t border-slate-700 bg-slate-900" style={{ height: '160px' }}>
            {/* Colors */}
            <div className="w-48 flex-shrink-0 border-r border-slate-700 p-3 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] uppercase text-slate-500 font-semibold mb-2">Colors</h3>
              <div className="grid grid-cols-6 gap-1">
                {COLORS_GRID.map((hex) => (
                  <button
                    key={hex}
                    className="w-6 h-6 rounded border border-slate-600 hover:scale-110 hover:border-white transition-all"
                    style={{ backgroundColor: hex }}
                    title={hex}
                    onClick={() => {
                      const el = useStore.getState().elements.find((e) => e.id === useStore.getState().selectedElementId);
                      if (el) {
                        const palette = el.palette || [];
                        const next = palette.includes(hex)
                          ? palette.filter((c) => c !== hex)
                          : [...palette, hex].slice(0, 5);
                        useStore.getState().updateElement(el.id, { palette: next });
                      }
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Layers */}
            <div className="flex-1 p-3 overflow-y-auto custom-scrollbar">
              <h3 className="text-[10px] uppercase text-slate-500 font-semibold mb-2">Layers</h3>
              <Layers />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Inspector */}
        <div className="w-64 flex-shrink-0 border-l border-slate-700 bg-slate-900 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-2 border-b border-slate-800">
              <h3 className="text-[10px] uppercase text-slate-500 font-semibold px-1">Inspector</h3>
            </div>
            <Inspector />
          </div>
        </div>
      </div>

      {/* Bottom — JSON Panel */}
      <JsonPanel />

      {/* Modals */}
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
