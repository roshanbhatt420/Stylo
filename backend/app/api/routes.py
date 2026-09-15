import json
import time
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings
from app.services.model_manager import model_manager
from app.services.adain_service import (
    preprocess_image,
    style_transfer,
    style_transfer_interpolate,
    maybe_preserve_color,
    tensor_to_base64_data_url,
)

logger = logging.getLogger("stylo.routes")
router = APIRouter()

ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def _preset_info(path: Path) -> dict:
    return {
        "id": path.name,
        "name": path.stem.replace("_", " ").title(),
        "url": f"/api/presets/{path.name}",
    }



@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "device": str(settings.DEVICE),
        "model_loaded": model_manager.is_ready,
        "models_dir": str(settings.MODELS_DIR),
    }


@router.get("/presets")
async def get_presets():
    """List preset style images available in the presets/ folder."""
    presets = []
    if settings.PRESETS_DIR.exists():
        for file in sorted(settings.PRESETS_DIR.iterdir()):
            if file.suffix.lower() in ALLOWED_EXTS:
                presets.append(_preset_info(file))
    return {"presets": presets, "presets_dir": str(settings.PRESETS_DIR)}


@router.get("/presets/{filename}")
async def get_preset_image(filename: str):
    file_path = settings.PRESETS_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Preset image not found")
    media_type = "image/png" if file_path.suffix.lower() == ".png" else "image/jpeg"
    return FileResponse(file_path, media_type=media_type)


@router.post("/presets")
async def upload_preset(file: UploadFile = File(...), name: Optional[str] = Form(None)):
    """Upload and save a new style preset."""
    settings.PRESETS_DIR.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "preset.jpg").suffix.lower()
    if suffix not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Only JPG, JPEG, PNG, and WEBP are allowed")

    stem = (
        "".join(c if c.isalnum() or c in "-_" else "_" for c in name.strip().lower().replace(" ", "_"))
        if name and name.strip()
        else Path(file.filename or f"preset_{int(time.time())}").stem
    )

    target_path = settings.PRESETS_DIR / f"{stem}{suffix}"
    counter = 1
    while target_path.exists():
        target_path = settings.PRESETS_DIR / f"{stem}_{counter}{suffix}"
        counter += 1

    target_path.write_bytes(await file.read())
    return {"success": True, "preset": _preset_info(target_path)}


@router.delete("/presets/{filename}")
async def delete_preset(filename: str):
    file_path = settings.PRESETS_DIR / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Preset image not found")
    file_path.unlink()
    return {"success": True, "deleted": filename}




@router.post("/stylize")
async def stylize_image(
    content_image: UploadFile = File(...),
    style_image: Optional[UploadFile] = File(None),
    preset_id: Optional[str] = Form(None),
    alpha: float = Form(1.0),
    preserve_color: bool = Form(False),
    content_size: int = Form(settings.DEFAULT_IMAGE_SIZE),
    style_size: int = Form(settings.DEFAULT_IMAGE_SIZE),
):
    """Apply single style transfer with AdaIN and optional CORAL color preservation."""
    start_time = time.perf_counter()
    vgg, decoder = model_manager.get_models()

    content_tensor = preprocess_image(await content_image.read(), size=content_size, device=settings.DEVICE)

    if style_image is not None and style_image.filename:
        style_bytes = await style_image.read()
    elif preset_id:
        preset_path = settings.PRESETS_DIR / preset_id
        if not preset_path.is_file():
            raise HTTPException(status_code=400, detail=f"Preset '{preset_id}' not found")
        style_bytes = preset_path.read_bytes()
    else:
        raise HTTPException(status_code=400, detail="Upload a style image or select a preset")

    style_tensor = preprocess_image(style_bytes, size=style_size, device=settings.DEVICE)
    style_tensor = maybe_preserve_color(style_tensor, content_tensor, preserve_color)

    output_tensor = style_transfer(
        vgg_enc=vgg, decoder=decoder,
        content=content_tensor, style=style_tensor, alpha=alpha,
    )

    return {
        "success": True,
        "image_data": tensor_to_base64_data_url(output_tensor),
        "inference_time_ms": round((time.perf_counter() - start_time) * 1000.0, 1),
        "alpha": alpha,
        "preserve_color": preserve_color,
        "device": str(settings.DEVICE),
        "output_shape": list(output_tensor.shape),
    }


@router.post("/interpolate")
async def interpolate_styles(content_image: UploadFile = File(...),style_images: List[UploadFile] = File(...),weights: str = Form(...),alpha: float = Form(1.0),preserve_color: bool = Form(False),content_size: int = Form(settings.DEFAULT_IMAGE_SIZE),style_size: int = Form(settings.DEFAULT_IMAGE_SIZE),):
    """Apply multi-style interpolation on a single content image.

    `weights` is a JSON array string e.g. "[0.5, 0.5]" or comma separated "0.5,0.5".
    """
    start_time = time.perf_counter()
    vgg, decoder = model_manager.get_models()

    parsed_weights = (
        [float(w) for w in json.loads(weights)]
        if weights.startswith("[")
        else [float(w.strip()) for w in weights.split(",") if w.strip()]
    )

    if len(style_images) != len(parsed_weights):
        raise HTTPException(
            status_code=400,
            detail=f"Mismatch: received {len(style_images)} styles but {len(parsed_weights)} weights",
        )

    content_tensor = preprocess_image(await content_image.read(), size=content_size, device=settings.DEVICE)

    style_tensors = []
    for s_file in style_images:
        s_tensor = preprocess_image(await s_file.read(), size=style_size, device=settings.DEVICE)
        s_tensor = maybe_preserve_color(s_tensor, content_tensor, preserve_color)
        style_tensors.append(s_tensor)

    output_tensor = style_transfer_interpolate(
        vgg_enc=vgg, decoder=decoder,
        content=content_tensor, styles=style_tensors,
        weights=parsed_weights, alpha=alpha,
    )

    return {
        "success": True,
        "image_data": tensor_to_base64_data_url(output_tensor),
        "inference_time_ms": round((time.perf_counter() - start_time) * 1000.0, 1),
        "alpha": alpha,
        "weights": parsed_weights,
        "preserve_color": preserve_color,
        "device": str(settings.DEVICE),
    }