from pathlib import Path
import os
import torch

class Settings:
    PROJECT_NAME: str = "Stylo"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Real-time AI Arbitrary Style Transfer using Adaptive Instance Normalization (AdaIN)"
    BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DIP_DIR: Path = BACKEND_DIR.parent
    MODELS_DIR: Path = Path(os.getenv("STYLO_MODELS_DIR", DIP_DIR / "model"))
    VGG_WEIGHTS_NAME: str = "vgg_normalized.pth"
    DECODER_WEIGHTS_NAME: str = "decoder.pth"
    PRESETS_DIR: Path = Path(os.getenv("STYLO_PRESETS_DIR", DIP_DIR / "backend/presets"))
    DEVICE: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    DEFAULT_IMAGE_SIZE: int = 512
    MAX_IMAGE_SIZE: int = 1024
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()

