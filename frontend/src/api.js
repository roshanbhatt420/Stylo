const API_BASE = '/api';

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Health check failed:', err);
    return { status: 'offline', error: err.message };
  }
}

export async function fetchPresets() {
  try {
    const res = await fetch(`${API_BASE}/presets`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      presets: data.presets || [],
      presetsDir: data.presets_dir || '',
    };
  } catch (err) {
    console.error('Failed to fetch presets:', err);
    return { presets: [], presetsDir: '' };
  }
}

export async function uploadPreset(file, name) {
  const formData = new FormData();
  formData.append('file', file);
  if (name) {
    formData.append('name', name);
  }

  const res = await fetch(`${API_BASE}/presets`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Failed to upload preset');
  }

  return await res.json();
}

export async function deletePreset(filename) {
  const res = await fetch(`${API_BASE}/presets/${filename}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Failed to delete preset');
  }

  return await res.json();
}

export async function stylizeImage({
  contentFile,
  styleFile,
  presetId,
  alpha = 1.0,
  preserveColor = false,
  contentSize = 512,
  styleSize = 512,
}) {
  const formData = new FormData();
  formData.append('content_image', contentFile);
  if (styleFile) {
    formData.append('style_image', styleFile);
  }
  if (presetId) {
    formData.append('preset_id', presetId);
  }
  formData.append('alpha', alpha);
  formData.append('preserve_color', preserveColor);
  formData.append('content_size', contentSize);
  formData.append('style_size', styleSize);

  const res = await fetch(`${API_BASE}/stylize`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Stylization failed');
  }

  return await res.json();
}

export async function interpolateStyles({
  contentFile,
  styleFiles,
  weights,
  alpha = 1.0,
  preserveColor = false,
  contentSize = 512,
  styleSize = 512,
}) {
  const formData = new FormData();
  formData.append('content_image', contentFile);
  
  for (const file of styleFiles) {
    formData.append('style_images', file);
  }

  formData.append('weights', JSON.stringify(weights));
  formData.append('alpha', alpha);
  formData.append('preserve_color', preserveColor);
  formData.append('content_size', contentSize);
  formData.append('style_size', styleSize);

  const res = await fetch(`${API_BASE}/interpolate`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}` }));
    throw new Error(err.detail || 'Interpolation failed');
  }

  return await res.json();
}

