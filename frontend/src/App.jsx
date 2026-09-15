import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageDropzone from './components/ImageDropzone';
import StylePresetSelector from './components/StylePresetSelector';
import Controls from './components/Controls';
import InterpolationControls from './components/InterpolationControls';
import ResultView from './components/ResultView';
import { fetchHealth, fetchPresets, stylizeImage, interpolateStyles, uploadPreset, deletePreset } from './api';
import { Wand2, Layers, AlertCircle, Image as ImageIcon } from 'lucide-react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [presets, setPresets] = useState([]);
  const [presetsDir, setPresetsDir] = useState('');
  const [mode, setMode] = useState('single');

  // Content image state
  const [contentFile, setContentFile] = useState(null);
  const [contentPreview, setContentPreview] = useState(null);

  // Single style state
  const [styleFile, setStyleFile] = useState(null);
  const [stylePreview, setStylePreview] = useState(null);
  const [selectedPresetId, setSelectedPresetId] = useState(null);

  // Multi-style interpolation state
  const [interpStyles, setInterpStyles] = useState([
    { id: '1', file: null, previewUrl: null },
    { id: '2', file: null, previewUrl: null },
  ]);
  const [weights, setWeights] = useState([0.5, 0.5]);

  // Parameters
  const [alpha, setAlpha] = useState(1.0);
  const [preserveColor, setPreserveColor] = useState(false);
  const [contentSize, setContentSize] = useState(512);

  // Processing & Result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Initial load
  const loadInitialData = async () => {
    const [h, presetsData] = await Promise.all([fetchHealth(), fetchPresets()]);
    setHealth(h);
    // fetchPresets now returns { presets, presetsDir }
    setPresets(presetsData.presets || []);
    setPresetsDir(presetsData.presetsDir || '');
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Content File handler
  const handleSelectContent = (file) => {
    setContentFile(file);
    setContentPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleClearContent = () => {
    setContentFile(null);
    setContentPreview(null);
  };

  // Single Style File handler
  const handleSelectStyle = (file) => {
    setStyleFile(file);
    setStylePreview(URL.createObjectURL(file));
    setSelectedPresetId(null);
    setError(null);
  };

  const handleClearStyle = () => {
    setStyleFile(null);
    setStylePreview(null);
    setSelectedPresetId(null);
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    setStyleFile(null);
    const preset = presets.find((p) => p.id === presetId);
    if (preset) setStylePreview(preset.url);
    setError(null);
  };

  const handleUploadPreset = async (file) => {
    try {
      await uploadPreset(file, file.name.replace(/\.[^.]+$/, ''));
      await loadInitialData();
    } catch (err) {
      setError(`Failed to upload preset: ${err.message}`);
    }
  };

  const handleDeletePreset = async (filename) => {
    try {
      await deletePreset(filename);
      if (selectedPresetId === filename) {
        setSelectedPresetId(null);
        setStylePreview(null);
      }
      await loadInitialData();
    } catch (err) {
      setError(`Failed to delete preset: ${err.message}`);
    }
  };

  // Multi-style interpolation handlers
  const handleAddInterpStyle = () => {
    if (interpStyles.length >= 4) return;
    const newStyles = [...interpStyles, { id: String(Date.now()), file: null, previewUrl: null }];
    setInterpStyles(newStyles);
    setWeights(newStyles.map(() => 1.0 / newStyles.length));
  };

  const handleRemoveInterpStyle = (index) => {
    if (interpStyles.length <= 2) return;
    const newStyles = interpStyles.filter((_, i) => i !== index);
    setInterpStyles(newStyles);
    setWeights(newStyles.map(() => 1.0 / newStyles.length));
  };

  const handleUpdateInterpFile = (index, file) => {
    const updated = [...interpStyles];
    updated[index] = {
      ...updated[index],
      file,
      previewUrl: file ? URL.createObjectURL(file) : null,
    };
    setInterpStyles(updated);
  };

  const handleUpdateInterpWeight = (index, val) => {
    const n = weights.length;
    const clamped = Math.max(0, Math.min(1.0, val));
    if (n <= 1) { setWeights([1.0]); return; }

    const oldWeight = weights[index];
    const remaining = 1.0 - clamped;
    const oldRemaining = 1.0 - oldWeight;
    const newWeights = [...weights];
    newWeights[index] = clamped;

    if (oldRemaining > 0.001) {
      for (let i = 0; i < n; i++) {
        if (i !== index) newWeights[i] = (weights[i] / oldRemaining) * remaining;
      }
    } else {
      const equalShare = remaining / (n - 1);
      for (let i = 0; i < n; i++) {
        if (i !== index) newWeights[i] = equalShare;
      }
    }
    setWeights(newWeights);
  };

  const handleSelectPresetForIndex = async (index, preset) => {
    try {
      const res = await fetch(preset.url);
      const blob = await res.blob();
      const file = new File([blob], preset.id, { type: blob.type || 'image/jpeg' });
      const updated = [...interpStyles];
      updated[index] = { ...updated[index], file, previewUrl: preset.url, presetName: preset.name };
      setInterpStyles(updated);
    } catch (err) {
      console.error('Failed to load preset for layer:', err);
    }
  };

  // Stylize execution
  const canStylize =
    mode === 'single'
      ? Boolean(contentFile && (styleFile || selectedPresetId))
      : Boolean(contentFile && interpStyles.every((s) => s.file));

  const handleStylize = async () => {
    if (!canStylize) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (mode === 'single') {
        const res = await stylizeImage({ contentFile, styleFile, presetId: selectedPresetId, alpha, preserveColor, contentSize, styleSize: contentSize });
        setResult(res);
      } else {
        const files = interpStyles.map((s) => s.file);
        const res = await interpolateStyles({ contentFile, styleFiles: files, weights, alpha, preserveColor, contentSize, styleSize: contentSize });
        setResult(res);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during style transfer.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1F1C18] flex flex-col">
      <Header backendHealth={health} onRefreshHealth={loadInitialData} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#EAE5DB] pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1F1C18]">
              Artistic Style Transfer
            </h1>
            <p className="text-[#8A8271] text-sm mt-1 max-w-2xl">
              Transform any photo into a work of art using Adaptive Instance Normalization.
              Adjust style intensity and preserve original colors in real time.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-white p-1 rounded-xl border border-[#EAE5DB] self-start md:self-auto shadow-xs">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'single'
                  ? 'bg-[#1F1C18] text-[#FAF8F4] shadow-xs'
                  : 'text-[#8A8271] hover:text-[#474239]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Single Style</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('interpolate')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'interpolate'
                  ? 'bg-[#1F1C18] text-[#FAF8F4] shadow-xs'
                  : 'text-[#8A8271] hover:text-[#474239]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Multi-Style Blend</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-[#FCF2F2] border border-[#F2D1D1] text-[#7A2424] text-sm flex items-start space-x-3">
            <AlertCircle className="w-4 h-4 text-[#C24141] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs">Operation Failed</p>
              <p className="text-xs text-[#9A2E2E] mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Image Selection */}
          <div className="lg:col-span-7 space-y-5">

            {/* Content Image */}
            <div className="bg-white border border-[#EAE5DB] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[#474239]">
                  1 — Content Image
                </h2>
              </div>
              <div className="h-56">
                <ImageDropzone
                  label="Content"
                  description="Your photo — structure and content will be preserved"
                  file={contentFile}
                  previewUrl={contentPreview}
                  onSelectFile={handleSelectContent}
                  onClear={handleClearContent}
                  badge="Source"
                />
              </div>
            </div>

            {/* Style Selection */}
            <div className="bg-white border border-[#EAE5DB] rounded-2xl p-5 shadow-xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#474239]">
                2 — Artistic Style
              </h2>

              {mode === 'single' ? (
                <>
                  <div className="h-56">
                    <ImageDropzone
                      label="Style"
                      description="Painting, texture, or artwork whose style will be applied"
                      file={styleFile}
                      previewUrl={stylePreview}
                      onSelectFile={handleSelectStyle}
                      onClear={handleClearStyle}
                      badge="Style"
                    />
                  </div>

                  <StylePresetSelector
                    presets={presets}
                    selectedPresetId={selectedPresetId}
                    onSelectPreset={handleSelectPreset}
                    onUploadPreset={handleUploadPreset}
                    onDeletePreset={handleDeletePreset}
                    presetsDir={presetsDir}
                  />
                </>
              ) : (
                <InterpolationControls
                  styleFiles={interpStyles}
                  weights={weights}
                  presets={presets}
                  onAddStyle={handleAddInterpStyle}
                  onRemoveStyle={handleRemoveInterpStyle}
                  onUpdateFile={handleUpdateInterpFile}
                  onUpdateWeight={handleUpdateInterpWeight}
                  onSelectPresetForIndex={handleSelectPresetForIndex}
                />
              )}
            </div>
          </div>

          {/* Right: Controls + Result */}
          <div className="lg:col-span-5 space-y-5">
            <Controls
              alpha={alpha}
              setAlpha={setAlpha}
              preserveColor={preserveColor}
              setPreserveColor={setPreserveColor}
              contentSize={contentSize}
              setContentSize={setContentSize}
              isProcessing={isProcessing}
              onStylize={handleStylize}
              canStylize={canStylize}
            />
            <ResultView
              result={result}
              contentPreview={contentPreview}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-[#EAE5DB] py-5 mt-12 text-center text-xs text-[#C7BEAD]">
        Stylo &bull; Arbitrary Style Transfer using Adaptive Instance Normalization
      </footer>
    </div>
  );
}
