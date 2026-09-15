import React, { useState } from 'react';
import { Download, Clock, Columns, Sparkles, Check } from 'lucide-react';

export default function ResultView({
  result,
  contentPreview,
  isProcessing,
}) {
  const [viewMode, setViewMode] = useState('side-by-side');
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    if (!result?.image_data) return;
    const a = document.createElement('a');
    a.href = result.image_data;
    a.download = `stylo_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  if (isProcessing) {
    return (
      <div className="min-h-[260px] rounded-2xl bg-white border border-[#EAE5DB] flex flex-col items-center justify-center p-8 text-center shadow-sm">
        <div className="relative mb-5">
          <div className="w-12 h-12 rounded-full border-2 border-[#EAE5DB] border-t-[#2E2B25] animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-[#1F1C18]">Generating artwork...</h3>
        <p className="text-xs text-[#8A8271] mt-1 max-w-xs">
          Normalizing content features and aligning style distributions.
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-[240px] rounded-2xl border border-dashed border-[#DDD7CC] bg-[#FAF8F4] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-white text-[#8A8271] flex items-center justify-center mb-3 border border-[#EAE5DB] shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-medium text-[#474239]">No artwork yet</h3>
        <p className="text-xs text-[#8A8271] mt-1 max-w-xs">
          Upload a content image and style, then click &ldquo;Stylize Image&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Result Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-[#EAE5DB] px-4 py-2.5 rounded-xl text-xs shadow-xs">
        <div className="flex items-center space-x-3 text-[#696255]">
          <div className="flex items-center space-x-1 font-medium text-[#2D5A27]">
            <Clock className="w-3.5 h-3.5" />
            <span>{result.inference_time_ms} ms</span>
          </div>
          <span className="text-[#DDD7CC]">|</span>
          <div>
            <span className="text-[#8A8271]">&alpha;: </span>
            <span className="font-mono font-semibold text-[#1F1C18]">{Math.round((result.alpha || 1.0) * 100)}%</span>
          </div>
          {result.preserve_color && (
            <>
              <span className="text-[#DDD7CC]">|</span>
              <span className="px-2 py-0.5 rounded-md bg-[#F2EDE2] text-[#696255] border border-[#E2DDD0] font-medium">
                Color Preserved
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {contentPreview && (
            <div className="flex bg-[#F5F2EB] rounded-lg p-0.5 border border-[#EAE5DB]">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  viewMode === 'single'
                    ? 'bg-[#1F1C18] text-white'
                    : 'text-[#696255] hover:text-[#1F1C18]'
                }`}
              >
                Output
              </button>
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center space-x-1 transition-colors ${
                  viewMode === 'side-by-side'
                    ? 'bg-[#1F1C18] text-white'
                    : 'text-[#696255] hover:text-[#1F1C18]'
                }`}
              >
                <Columns className="w-3 h-3" />
                <span>Compare</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 bg-[#1F1C18] hover:bg-[#2E2B25] text-[#FAF8F4] font-medium rounded-lg transition-all flex items-center space-x-1.5 text-xs"
          >
            {downloaded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#6FCF6F]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Image Showcase */}
      <div className="rounded-2xl bg-white border border-[#EAE5DB] p-4 shadow-xs">
        {viewMode === 'side-by-side' && contentPreview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-[#8A8271] uppercase tracking-wider">Original</p>
              <div className="rounded-xl overflow-hidden bg-[#FAF8F4] border border-[#EAE5DB] flex items-center justify-center p-2 min-h-[260px]">
                <img
                  src={contentPreview}
                  alt="Original content"
                  className="max-h-[340px] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-[#474239] uppercase tracking-wider">Stylized</p>
              <div className="rounded-xl overflow-hidden bg-[#FAF8F4] border border-[#2E2B25]/20 flex items-center justify-center p-2 min-h-[260px]">
                <img
                  src={result.image_data}
                  alt="Stylized Result"
                  className="max-h-[340px] w-auto max-w-full object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-2 min-h-[320px] bg-[#FAF8F4] rounded-xl border border-[#EAE5DB]">
            <img
              src={result.image_data}
              alt="Stylized Result"
              className="max-h-[480px] w-auto max-w-full object-contain rounded-lg"
            />
          </div>
        )}
      </div>
    </div>
  );
}
