import React from 'react';
import { Sliders, Sparkles, Droplet, Zap } from 'lucide-react';

export default function Controls({
  alpha,
  setAlpha,
  preserveColor,
  setPreserveColor,
  contentSize,
  setContentSize,
  isProcessing,
  onStylize,
  canStylize,
}) {
  return (
    <div className="bg-white border border-[#EAE5DB] rounded-2xl p-5 space-y-5 shadow-sm">
      <div className="flex items-center space-x-2 border-b border-[#EAE5DB] pb-3">
        <Sliders className="w-4 h-4 text-[#8A8271]" />
        <h3 className="text-xs font-bold text-[#474239] tracking-widest uppercase">
          Stylization Controls
        </h3>
      </div>

      {/* Stylization Strength (Alpha) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-[#474239]">
            Stylization Strength (&alpha;)
          </label>
          <span className="font-mono text-xs font-bold text-[#1F1C18] bg-[#F2EDE2] px-2 py-0.5 rounded border border-[#E2DDD0]">
            {Math.round(alpha * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={alpha}
          onChange={(e) => setAlpha(parseFloat(e.target.value))}
          className="w-full h-1.5 appearance-none cursor-pointer rounded-full bg-[#EAE5DB] accent-[#2E2B25]"
        />
        <div className="flex justify-between text-[10px] text-[#8A8271]">
          <span>0% (Content)</span>
          <span>50% (Balanced)</span>
          <span>100% (Full Style)</span>
        </div>
      </div>

      {/* Color Preservation Toggle (CORAL) */}
      <div className="flex items-start justify-between p-3 rounded-xl bg-[#FAF8F4] border border-[#EAE5DB]">
        <div className="space-y-0.5 pr-3">
          <div className="flex items-center space-x-1.5">
            <Droplet className="w-3.5 h-3.5 text-[#8A8271]" />
            <span className="text-xs font-semibold text-[#2E2B25]">Preserve Content Color</span>
          </div>
          <p className="text-[11px] text-[#8A8271]">
            CORAL alignment — transfers textures while keeping original photo colors.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={preserveColor}
            onChange={(e) => setPreserveColor(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-[#EAE5DB] peer-focus:outline-none rounded-full peer
            peer-checked:after:translate-x-full peer-checked:after:border-white
            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
            after:bg-white after:border-[#DDD7CC] after:border after:rounded-full
            after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E2B25]">
          </div>
        </label>
      </div>

      {/* Resolution Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#474239] flex items-center space-x-1.5">
          <Zap className="w-3.5 h-3.5 text-[#8A8271]" />
          <span>Inference Resolution</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { size: 256, label: 'Fast' },
            { size: 512, label: 'Standard' },
            { size: 768, label: 'High' },
          ].map((opt) => (
            <button
              key={opt.size}
              type="button"
              onClick={() => setContentSize(opt.size)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                contentSize === opt.size
                  ? 'bg-[#2E2B25] border-[#2E2B25] text-white'
                  : 'bg-[#FAF8F4] border-[#E2DDD0] text-[#696255] hover:border-[#C7BEAD] hover:bg-[#F5F1E8]'
              }`}
            >
              <span>{opt.label}</span>
              <span className="block text-[9px] opacity-60">{opt.size}px</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        disabled={!canStylize || isProcessing}
        onClick={onStylize}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-150 ${
          !canStylize || isProcessing
            ? 'bg-[#F2EDE2] text-[#C7BEAD] cursor-not-allowed border border-[#EAE5DB]'
            : 'bg-[#1F1C18] hover:bg-[#2E2B25] text-[#FAF8F4] shadow-sm active:scale-[0.99]'
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-[#FAF8F4]/30 border-t-[#FAF8F4] rounded-full animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Stylize Image</span>
          </>
        )}
      </button>
    </div>
  );
}
