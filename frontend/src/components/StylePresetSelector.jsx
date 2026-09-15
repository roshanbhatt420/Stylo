import React, { useRef } from 'react';
import { Palette, Check, Plus, Trash2, FolderOpen } from 'lucide-react';

export default function StylePresetSelector({
  presets = [],
  selectedPresetId,
  onSelectPreset,
  onUploadPreset,
  onDeletePreset,
  presetsDir = 'DIP/presets',
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (onUploadPreset) {
        onUploadPreset(file);
      }
      e.target.value = '';
    }
  };

  return (
    <div className="mt-4 pt-3 border-t border-[#EAE5DB]">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center space-x-1.5">
          <Palette className="w-3.5 h-3.5 text-[#8A8271]" />
          <span className="text-xs font-semibold text-[#474239] uppercase tracking-wider">
            Style Presets ({presets.length})
          </span>
        </div>

        {/* Upload new preset button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs font-medium text-[#2E2B25] hover:text-[#1F1C18] bg-[#F5F2EB] hover:bg-[#EAE5DB] border border-[#DDD7CC] px-2.5 py-1 rounded-lg flex items-center space-x-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Style</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {presets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#DDD7CC] bg-[#FAF8F4] p-4 text-center">
          <FolderOpen className="w-6 h-6 text-[#8A8271] mx-auto mb-1.5 opacity-80" />
          <p className="text-xs font-medium text-[#474239]">No Presets Found</p>
          <p className="text-[11px] text-[#8A8271] mt-0.5">
            Drop your style images into <code className="bg-[#EAE5DB] px-1.5 py-0.5 rounded text-[#2E2B25] font-mono text-[10px]">{presetsDir}</code> or click <b>Add Style</b> above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div
                key={preset.id}
                className={`group relative rounded-xl border p-1.5 transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'border-[#2E2B25] bg-[#F5F1E8] ring-1 ring-[#2E2B25]'
                    : 'border-[#EAE5DB] bg-white hover:border-[#DDD7CC] hover:bg-[#FAF8F4]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectPreset(preset.id)}
                  className="flex items-center space-x-2 min-w-0 flex-1 text-left"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#EAE5DB] shrink-0 relative border border-[#EAE5DB]">
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#2E2B25]/40 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 pr-1 flex-1">
                    <p className="text-xs font-medium text-[#1F1C18] truncate">{preset.name}</p>
                    <p className="text-[10px] text-[#8A8271]">Preset</p>
                  </div>
                </button>

                {onDeletePreset && (
                  <button
                    type="button"
                    title={`Delete ${preset.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePreset(preset.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#F2D1D1] text-[#8A8271] hover:text-[#9A2E2E] transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
