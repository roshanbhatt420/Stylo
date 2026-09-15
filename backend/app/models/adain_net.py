import torch
import torch.nn as nn

def build_vgg_encoder() -> nn.Sequential:
    """
    Builds the VGG-19 encoder truncated up to relu4_1,
    exactly matching the AdaIN paper and notebook architecture.
    """
    return nn.Sequential(
        nn.Conv2d(3, 3, (1, 1)),                        
        nn.Conv2d(3, 64, (3, 3), padding=1),            
        nn.ReLU(),                                       
        nn.Conv2d(64, 64, (3, 3), padding=1),           
        nn.ReLU(),                                       
        nn.MaxPool2d((2, 2), (2, 2), (0, 0), ceil_mode=True),  
        nn.Conv2d(64, 128, (3, 3), padding=1),          
        nn.ReLU(),                                       
        nn.Conv2d(128, 128, (3, 3), padding=1),         
        nn.ReLU(),                                     
        nn.MaxPool2d((2, 2), (2, 2), (0, 0), ceil_mode=True),  
        nn.Conv2d(128, 256, (3, 3), padding=1),         
        nn.ReLU(),                                      
        nn.Conv2d(256, 256, (3, 3), padding=1),         
        nn.ReLU(),                                     
        nn.Conv2d(256, 256, (3, 3), padding=1),         
        nn.ReLU(),                                      
        nn.Conv2d(256, 256, (3, 3), padding=1),       
        nn.ReLU(),                                       
        nn.MaxPool2d((2, 2), (2, 2), (0, 0), ceil_mode=True),  
        nn.Conv2d(256, 512, (3, 3), padding=1),         
        nn.ReLU(),                                       
    )

def build_decoder() -> nn.Sequential:
    """
    Builds the Decoder network matching the trained weights in decoder.pth.
    Inverts 512-channel feature representations back to 3-channel RGB image.
    """
    return nn.Sequential(
        nn.Conv2d(512, 256, (3, 3), padding=1),
        nn.ReLU(),
        nn.Upsample(scale_factor=2, mode="nearest"),
        nn.Conv2d(256, 256, (3, 3), padding=1),
        nn.ReLU(),
        nn.Conv2d(256, 256, (3, 3), padding=1),
        nn.ReLU(),
        nn.Conv2d(256, 256, (3, 3), padding=1),
        nn.ReLU(),
        nn.Conv2d(256, 128, (3, 3), padding=1),
        nn.ReLU(),
        nn.Upsample(scale_factor=2, mode="nearest"),
        nn.Conv2d(128, 128, (3, 3), padding=1),
        nn.ReLU(),
        nn.Conv2d(128, 64, (3, 3), padding=1),
        nn.ReLU(),
        nn.Upsample(scale_factor=2, mode="nearest"),
        nn.Conv2d(64, 64, (3, 3), padding=1),
        nn.ReLU(),
        nn.Conv2d(64, 3, (3, 3), padding=1),
    )

