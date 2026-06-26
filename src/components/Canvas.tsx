'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { Stage, Layer, Rect, Text, Transformer, Line } from 'react-konva';
import type Konva from 'konva';
import { useStore } from '@/lib/store';
import type { Element } from '@/lib/types';

const GRID_COLOR = '#1E293B';
const GRID_STROKE = 0.5;
const GRID_SIZE = 40;

interface CanvasProps {
  width: number;
  height: number;
}

export default function Canvas({ width, height }: CanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 800, h: 600 });

  const elements = useStore((s) => s.elements);
  const aspectRatio = useStore((s) => s.aspectRatio);
  const selectedElementId = useStore((s) => s.selectedElementId);
  const selectElement = useStore((s) => s.selectElement);
  const moveElement = useStore((s) => s.moveElement);
  const resizeElement = useStore((s) => s.resizeElement);

  // Parse aspect ratio into w:h
  const [aW, aH] = aspectRatio.split(':').map(Number);
  const ratio = (aW && aH) ? aW / aH : 1;

  // Calculate stage size to fit container while preserving aspect ratio
  useEffect(() => {
    if (!containerRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    let sw: number, sh: number;
    if (cw / ch > ratio) {
      sh = ch;
      sw = ch * ratio;
    } else {
      sw = cw;
      sh = cw / ratio;
    }
    setStageSize({ w: Math.floor(sw), h: Math.floor(sh) });
  }, [width, height, ratio]);

  // Convert fractional coords (0-1) to pixel coords
  const toPixel = useCallback((fx: number, fy: number) => ({
    x: fx * stageSize.w,
    y: fy * stageSize.h,
  }), [stageSize]);

  const toPixelSize = useCallback((fw: number, fh: number) => ({
    w: fw * stageSize.w,
    h: fh * stageSize.h,
  }), [stageSize]);

  // Convert pixel coords back to fractional (0-1) — clamped to canvas bounds
  const toFraction = useCallback((px: number, py: number) => ({
    x: Math.max(0, Math.min(1, px / stageSize.w)),
    y: Math.max(0, Math.min(1, py / stageSize.h)),
  }), [stageSize]);

  const toFractionSize = useCallback((pw: number, ph: number) => ({
    w: Math.max(0.01, Math.min(1, pw / stageSize.w)),
    h: Math.max(0.01, Math.min(1, ph / stageSize.h)),
  }), [stageSize]);

  // Handle selection
  const selectedEl = elements.find((el) => el.id === selectedElementId);

  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedElementId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
      } else {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedElementId, elements]);

  // Grid lines
  const gridLines = [];
  for (let x = 0; x <= stageSize.w; x += GRID_SIZE) {
    gridLines.push(
      <Line key={`gv${x}`} points={[x, 0, x, stageSize.h]} stroke={GRID_COLOR} strokeWidth={GRID_STROKE} listening={false} />
    );
  }
  for (let y = 0; y <= stageSize.h; y += GRID_SIZE) {
    gridLines.push(
      <Line key={`gh${y}`} points={[0, y, stageSize.w, y]} stroke={GRID_COLOR} strokeWidth={GRID_STROKE} listening={false} />
    );
  }

  // Get element label for display
  function elementLabel(el: Element): string {
    if (el.type === 'text' && el.text) return el.text.slice(0, 20);
    if (el.variable && el.variable.length > 0) return el.variable[0].slice(0, 20);
    if (el.label) return el.label.slice(0, 20);
    return el.type === 'obj' ? 'Object' : 'Text';
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
      <Stage
        ref={stageRef}
        width={stageSize.w}
        height={stageSize.h}
        onClick={(e) => {
          // Deselect when clicking empty canvas
          if (e.target === e.target.getStage()) {
            selectElement(null);
          }
        }}
        onTap={(e) => {
          if (e.target === e.target.getStage()) {
            selectElement(null);
          }
        }}
        style={{ background: '#0B1120' }}
      >
        <Layer>
          {/* Grid */}
          {gridLines}

          {/* Elements (in layer order) */}
          {elements.map((el) => {
            const pos = toPixel(el.x, el.y);
            const size = toPixelSize(el.w, el.h);
            const isSelected = el.id === selectedElementId;
            const isDisabled = !el.enabled;

            return (
              <Rect
                key={el.id}
                id={el.id}
                x={pos.x}
                y={pos.y}
                width={size.w}
                height={size.h}
                fill={el.ui + '33'}
                stroke={isSelected ? el.ui : el.ui + '80'}
                strokeWidth={isSelected ? 2 : 1}
                opacity={isDisabled ? 0.3 : 0.85}
                cornerRadius={2}
                draggable
                onDragStart={() => {
                  selectElement(el.id);
                }}
                onDragEnd={(e) => {
                  const node = e.target;
                  const frac = toFraction(node.x(), node.y());
                  moveElement(el.id, frac.x, frac.y);
                  // Reset position (Konva will re-render from state)
                  node.x(pos.x);
                  node.y(pos.y);
                }}
                onClick={() => {
                  selectElement(el.id);
                }}
                onTap={() => {
                  selectElement(el.id);
                }}
              />
            );
          })}

          {/* Labels (separate layer of Text nodes) */}
          {elements.map((el) => {
            const pos = toPixel(el.x, el.y);
            const size = toPixelSize(el.w, el.h);
            const label = elementLabel(el);

            return (
              <Text
                key={`lbl-${el.id}`}
                x={pos.x + 4}
                y={pos.y + Math.max(0, size.h / 2 - 8)}
                width={size.w - 8}
                height={20}
                text={label}
                fontSize={11}
                fontFamily="Inter, system-ui, sans-serif"
                fill={el.enabled ? '#F8FAFC' : '#64748B'}
                align="center"
                verticalAlign="middle"
                listening={false}
                ellipsis={true}
              />
            );
          })}

          {/* Transformer for selected element */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Constrain to canvas bounds
              if (newBox.x < 0) newBox.x = 0;
              if (newBox.y < 0) newBox.y = 0;
              if (newBox.x + newBox.width > stageSize.w) newBox.width = stageSize.w - newBox.x;
              if (newBox.y + newBox.height > stageSize.h) newBox.height = stageSize.h - newBox.y;
              // Minimum size
              if (newBox.width < 20) newBox.width = 20;
              if (newBox.height < 20) newBox.height = 20;
              return newBox;
            }}
            onTransformEnd={(e) => {
              const node = e.target;
              if (!node || !selectedEl) return;
              const scaleX = node.scaleX();
              const scaleY = node.scaleY();
              // Reset scale
              node.scaleX(1);
              node.scaleY(1);
              const frac = toFraction(node.x(), node.y());
              const fracSize = toFractionSize(node.width() * scaleX, node.height() * scaleY);
              moveElement(selectedEl.id, frac.x, frac.y);
              resizeElement(selectedEl.id, fracSize.w, fracSize.h);
            }}
            rotateEnabled={false}
            borderStroke="#0891B2"
            borderStrokeWidth={1.5}
            anchorFill="#0891B2"
            anchorStroke="#0F172A"
            anchorSize={8}
            anchorCornerRadius={2}
            enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
            keepRatio={false}
          />
        </Layer>
      </Stage>
    </div>
  );
}
