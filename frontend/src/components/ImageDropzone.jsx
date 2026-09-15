import React, { useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';

export default function ImageDropzone({
  label,
  description,
  file,
  previewUrl,
  onSelectFile,
  onClear,
  badge,
  badgeColor = 'neutral',
  minHeight = 'min-h-[190px]'
}) {
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('image/')) {
        onSelectFile(droppedFile);
      }
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onSelectFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-[#2E2B25] uppercase tracking-wider">{label}</label>
          {badge && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#F2EDE2] text-[#696255] border border-[#E2DDD0]">
              {badge}
            </span>
          )}
        </div>
        {previewUrl && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-[#8A8271] hover:text-[#9A2E2E] flex items-center space-x-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !previewUrl && inputRef.current?.click()}
        className={`relative flex-1 ${minHeight} rounded-xl border border-dashed transition-all duration-150 flex flex-col items-center justify-center p-4 text-center overflow-hidden group ${
          previewUrl
            ? 'border-[#DCD5C8] bg-white'
            : 'border-[#D5CDC0] hover:border-[#8A8271] bg-[#FAF8F4] hover:bg-[#F5F1E8] cursor-pointer'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        {previewUrl ? (
          <div className="relative w-full h-full min-h-[170px] flex items-center justify-center">
            <img
              src={previewUrl}
              alt={label}
              className="max-h-[230px] w-auto max-w-full object-contain rounded-lg"
            />
            <div className="absolute inset-0 bg-[#1F1C18]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg backdrop-blur-xs">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="px-3.5 py-1.5 bg-white hover:bg-[#F5F2EB] text-[#1F1C18] text-xs font-medium rounded-lg shadow-sm border border-[#EAE5DB] transition-all flex items-center space-x-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#696255]" />
                <span>Replace</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2.5 py-5">
            <div className="w-10 h-10 rounded-xl bg-white text-[#696255] group-hover:text-[#1F1C18] flex items-center justify-center transition-colors border border-[#EAE5DB] shadow-xs">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#2E2B25] group-hover:text-[#1F1C18] transition-colors">
                Drop image here, or <span className="underline underline-offset-2 text-[#1F1C18]">browse</span>
              </p>
              <p className="text-[11px] text-[#8A8271] mt-0.5">{description || 'JPG, PNG, WEBP'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
