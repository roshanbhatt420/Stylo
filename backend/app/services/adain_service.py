import io
import base64
from pathlib import Path
from typing import List, Tuple
from PIL import Image
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms

def calc_mean_std(feat: torch.Tensor, eps: float = 1e-5) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Calculate channel-wise mean and standard deviation for (N, C, H, W) tensor.
    """
    size = feat.size()
    assert len(size) == 4, f"Expected 4D tensor (N, C, H, W), got {size}"
    N, C = size[:2]
    feat_flat = feat.view(N, C, -1)
    feat_mean = feat_flat.mean(dim=2, keepdim=True)
    feat_var = ((feat_flat - feat_mean) ** 2).mean(dim=2, keepdim=True) + eps
    feat_std = feat_var.sqrt()
    return feat_mean.view(N, C, 1, 1), feat_std.view(N, C, 1, 1)



def adaptive_instance_normalization(content_feat: torch.Tensor, style_feat: torch.Tensor) -> torch.Tensor:
    """
    AdaIN layer: aligns content feature statistics with style feature statistics.
    AdaIN(x, y) = sigma(y) * ((x - mu(x)) / sigma(x)) + mu(y)
    """
    assert content_feat.size()[:2] == style_feat.size()[:2], "Content and style feature shapes mismatch"
    content_mean, content_std = calc_mean_std(content_feat)
    style_mean, style_std = calc_mean_std(style_feat)
    normalized_feat = (content_feat - content_mean) / content_std
    return normalized_feat * style_std + style_mean



def _flatten_mean_std(img: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor]:
    flat = img.reshape(3, -1)
    mean = flat.mean(dim=-1, keepdim=True)
    std = flat.std(dim=-1, keepdim=True) + 1e-5
    return flat, mean, std



def _mat_sqrt(x: torch.Tensor) -> torch.Tensor:
    U, S, Vh = torch.linalg.svd(x)
    return U @ torch.diag(S.clamp(min=0).sqrt()) @ Vh



def coral(source: torch.Tensor, target: torch.Tensor) -> torch.Tensor:
    """
    Correlation Alignment (CORAL):
    Transfers the color distribution of the target (content) to the source (style) image.
    """
    source_flat, source_mean, source_std = _flatten_mean_std(source)
    source_norm = (source_flat - source_mean) / source_std
    source_cov_eye = source_norm @ source_norm.t() + torch.eye(3, device=source.device)
    target_flat, target_mean, target_std = _flatten_mean_std(target)
    target_norm = (target_flat - target_mean) / target_std
    target_cov_eye = target_norm @ target_norm.t() + torch.eye(3, device=target.device)
    transferred_norm = _mat_sqrt(target_cov_eye) @ torch.inverse(_mat_sqrt(source_cov_eye)) @ source_norm
    transferred = transferred_norm * target_std + target_mean
    return transferred.reshape(source.size()).clamp(0.0, 1.0)



def maybe_preserve_color(style_batched: torch.Tensor, content_batched: torch.Tensor, preserve_color: bool) -> torch.Tensor:
    """
    If preserve_color is True, applies CORAL to match style colors to content colors.
    """
    if not preserve_color:
        return style_batched
    recolored = coral(style_batched.squeeze(0), content_batched.squeeze(0))
    return recolored.unsqueeze(0)



def style_transfer(vgg_enc: nn.Module,decoder: nn.Module,content: torch.Tensor,style: torch.Tensor,alpha: float = 1.0) -> torch.Tensor:
    """
    Performs single style transfer:
    content: (1, 3, H, W)
    style: (1, 3, H, W)
    alpha: stylization trade-off (0.0 = untouched content, 1.0 = full style)
    """
    alpha = max(0.0, min(1.0, float(alpha)))
    with torch.no_grad():
        content_f = vgg_enc(content)
        style_f = vgg_enc(style)
        feat = adaptive_instance_normalization(content_f, style_f)
        feat = feat * alpha + content_f * (1.0 - alpha)
        output = decoder(feat)
    return output.clamp(0.0, 1.0)



def style_transfer_interpolate(vgg_enc: nn.Module,decoder: nn.Module,content: torch.Tensor,styles: List[torch.Tensor],weights: List[float],alpha: float = 1.0) -> torch.Tensor:
    """
    Performs multi-style interpolation:
    weights should sum to 1.0.
    """
    assert len(styles) == len(weights), "Styles and weights count mismatch"
    alpha = max(0.0, min(1.0, float(alpha)))
    
    # Normalize weights if not perfectly summing to 1
    total_w = sum(weights)
    if total_w > 0:
        normalized_weights = [w / total_w for w in weights]
    else:
        normalized_weights = [1.0 / len(weights)] * len(weights)

    with torch.no_grad():
        content_f = vgg_enc(content)
        feat = torch.zeros_like(content_f)
        for style, w in zip(styles, normalized_weights):
            style_f = vgg_enc(style)
            adain_f = adaptive_instance_normalization(content_f, style_f)
            feat = feat + (w * adain_f)
        feat = feat * alpha + content_f * (1.0 - alpha)
        output = decoder(feat)
    return output.clamp(0.0, 1.0)



def preprocess_image(image_input, size: int = 512, device: torch.device = torch.device("cpu")) -> torch.Tensor:
    """
    Converts PIL Image or file bytes to (1, 3, H, W) Tensor on the target device.
    """
    if isinstance(image_input, (str, Path)):
        img = Image.open(str(image_input)).convert("RGB")
    elif isinstance(image_input, (bytes, bytearray)):
        img = Image.open(io.BytesIO(image_input)).convert("RGB")
    elif isinstance(image_input, Image.Image):
        img = image_input.convert("RGB")
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    tf_list = []
    if size and size > 0:
        # Resize shorter side to `size` while preserving aspect ratio
        w, h = img.size
        if min(w, h) > size:
            if w < h:
                new_w = size
                new_h = int(h * (size / w))
            else:
                new_h = size
                new_w = int(w * (size / h))
            img = img.resize((new_w, new_h), Image.Resampling.BILINEAR)

    tf_list.append(transforms.ToTensor())
    transform = transforms.Compose(tf_list)
    tensor = transform(img).unsqueeze(0).to(device)
    return tensor



def tensor_to_pil(tensor: torch.Tensor) -> Image.Image:
    """
    Converts (1, 3, H, W) or (3, H, W) PyTorch Tensor to PIL Image.
    """
    t = tensor.detach().cpu().clamp(0.0, 1.0)
    if t.dim() == 4:
        t = t.squeeze(0)
    arr = (t.permute(1, 2, 0).numpy() * 255.0).astype("uint8")
    return Image.fromarray(arr)




def tensor_to_base64_data_url(tensor: torch.Tensor, format: str = "JPEG", quality: int = 90) -> str:
    """
    Converts output tensor to a base64 Data URL for frontend display.
    """
    pil_img = tensor_to_pil(tensor)
    buf = io.BytesIO()
    pil_img.save(buf, format=format, quality=quality)
    b64_str = base64.b64encode(buf.getvalue()).decode("utf-8")
    mime = "image/jpeg" if format.upper() == "JPEG" else "image/png"
    return f"data:{mime};base64,{b64_str}"
