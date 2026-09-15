import React from 'react';
import { Layers, Plus, Trash2, Palette } from 'lucide-react';
import ImageDropzone from './ImageDropzone';

export default function InterpolationControls({
  styleFiles,
  weights,
  presets = [],
  onAddStyle,
  onRemoveStyle,
  onUpdateFile,
  onUpdateWeight,
  onSelectPresetForIndex,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[#8A8271]" />
          <h3 className="text-xs font-bold text-[#474239] uppercase tracking-widest">
            Blend Layers ({styleFiles.length})
          </h3>
        </div>
        {styleFiles.length < 4 && (
          <button
            type="button"
            onClick={onAddStyle}
            className="text-xs font-medium px-2.5 py-1 rounded-lg bg-[#F5F1E8] text-[#474239] border border-[#E2DDD0] hover:bg-[#EAE5DB] flex items-center space-x-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Layer</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {styleFiles.map((item, idx) => {
          const currentPercent = Math.round((weights[idx] ?? 0.5) * 100);

          return (
            <div
              key={item.id || idx}
              className="bg-white border border-[#EAE5DB] rounded-xl p-3.5 flex flex-col space-y-3 shadow-xs"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-[#2E2B25]">Style {idx + 1}</span>
                  {item.presetName && (
                    <span className="text-[10px] text-[#696255] bg-[#F2EDE2] px-1.5 py-0.5 rounded border border-[#E2DDD0]">
                      {item.presetName}
                    </span>
                  )}
                </div>
                {styleFiles.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveStyle(idx)}
                    className="text-[#C7BEAD] hover:text-[#9A2E2E] text-xs flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              {/* Dropzone */}
              <div className="flex-1">
                <ImageDropzone
                  label={`Style ${idx + 1}`}
                  file={item.file}
                  previewUrl={item.previewUrl}
                  onSelectFile={(f) => onUpdateFile(idx, f)}
                  onClear={() => onUpdateFile(idx, null)}
                  badge={`${currentPercent}%`}
                  minHeight="min-h-[130px]"
                />
              </div>

              {/* Quick Preset Selector */}
              {presets.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                  <Palette className="w-3 h-3 text-[#C7BEAD] shrink-0" />
                  {presets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => onSelectPresetForIndex && onSelectPresetForIndex(idx, p)}
                      className="px-2 py-0.5 rounded bg-[#FAF8F4] hover:bg-[#F2EDE2] text-[11px] text-[#696255] border border-[#EAE5DB] truncate shrink-0 transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Blend Weight Control */}
              <div className="pt-2.5 border-t border-[#EAE5DB] space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor={`weight-slider-${idx}`} className="text-xs font-semibold text-[#474239]">
                    Blend Weight
                  </label>
                  <div className="flex items-center space-x-0.5 bg-[#FAF8F4] border border-[#E2DDD0] rounded-lg px-2 py-0.5 focus-within:border-[#2E2B25]">
                    <input
                      id={`weight-input-${idx}`}
                      type="number"
                      min="0"
                      max="100"
                      value={currentPercent}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          onUpdateWeight(idx, Math.max(0, Math.min(100, val)) / 100.0);
                        }
                      }}
                      className="w-9 bg-transparent text-right font-mono font-bold text-[#1F1C18] text-xs focus:outline-none"
                    />
                    <span className="text-[#8A8271] text-xs">%</span>
                  </div>
                </div>
                <input
                  id={`weight-slider-${idx}`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={currentPercent}
                  onChange={(e) => onUpdateWeight(idx, parseFloat(e.target.value) / 100.0)}
                  className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-[#EAE5DB] accent-[#2E2B25] block"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
