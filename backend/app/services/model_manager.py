import os
import shutil
import logging
from pathlib import Path
from typing import Optional, Tuple
import torch
import torch.nn as nn

from app.core.config import settings
from app.models.adain_net import build_vgg_encoder, build_decoder

logger = logging.getLogger("stylo.model_manager")

class ModelManager:
    _instance: Optional["ModelManager"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.device = settings.DEVICE
        self.models_dir = settings.MODELS_DIR
        self.vgg_encoder: Optional[nn.Sequential] = None
        self.decoder: Optional[nn.Sequential] = None
        self._is_loaded = False
        self._initialized = True

    def _ensure_weights(self) -> dict[str, Path]:
        self.models_dir.mkdir(parents=True, exist_ok=True)
        vgg_path = self.models_dir / settings.VGG_WEIGHTS_NAME
        dec_path = self.models_dir / settings.DECODER_WEIGHTS_NAME

        paths = {
            settings.VGG_WEIGHTS_NAME: vgg_path,
            settings.DECODER_WEIGHTS_NAME: dec_path,
        }

        # Check if local weights exist
        for fname, path in paths.items():
            if not path.is_file():
                logger.info(f"Model weight {fname} not found locally at {path}. Downloading from Hugging Face...")
                try:
                    from huggingface_hub import hf_hub_download
                    cached = hf_hub_download(repo_id="tidalove/adain",filename=fname,repo_type="space")
                    shutil.copy(cached, path)
                    logger.info(f"Successfully downloaded and saved {fname} to {path}")
                except Exception as e:
                    logger.error(f"Failed to download {fname}: {e}")
                    raise RuntimeError(f"Missing weights for {fname} at {path} and download failed: {e}")
            else:
                logger.info(f"Found cached weights for {fname} at {path}")
        return paths

    def load_models(self) -> Tuple[nn.Sequential, nn.Sequential]:
        if self._is_loaded and self.vgg_encoder is not None and self.decoder is not None:
            return self.vgg_encoder, self.decoder

        logger.info(f"Initializing Stylo AdaIN models on device: {self.device}...")
        weight_paths = self._ensure_weights()

        vgg = build_vgg_encoder()
        decoder = build_decoder()

        vgg_state = torch.load(weight_paths[settings.VGG_WEIGHTS_NAME], map_location=self.device)
        decoder_state = torch.load(weight_paths[settings.DECODER_WEIGHTS_NAME], map_location=self.device)

        # Load states with strict=False as in notebook
        vgg_res = vgg.load_state_dict(vgg_state, strict=False)
        dec_res = decoder.load_state_dict(decoder_state, strict=False)

        if vgg_res.missing_keys:
            raise RuntimeError(f"VGG missing required keys: {vgg_res.missing_keys}")
        if dec_res.missing_keys:
            raise RuntimeError(f"Decoder missing required keys: {dec_res.missing_keys}")

        vgg.eval().to(self.device)
        decoder.eval().to(self.device)

        for p in vgg.parameters():
            p.requires_grad_(False)
        for p in decoder.parameters():
            p.requires_grad_(False)

        self.vgg_encoder = vgg
        self.decoder = decoder
        self._is_loaded = True
        logger.info("Stylo AdaIN models successfully loaded into memory and ready for inference.")
        return self.vgg_encoder, self.decoder

    def get_models(self) -> Tuple[nn.Sequential, nn.Sequential]:
        if not self._is_loaded:
            return self.load_models()
        return self.vgg_encoder, self.decoder

    @property
    def is_ready(self) -> bool:
        return self._is_loaded and self.vgg_encoder is not None and self.decoder is not None

model_manager = ModelManager()

