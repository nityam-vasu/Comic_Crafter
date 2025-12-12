# Models Directory

This directory contains the trained models used by Comic Crafter, including the fine-tuned LORA weights for comic/manga style generation.

## Directory Structure

```
models/
└── weights/                 # LORA trained weights
    └── LORA/                # LORA weights directory
        └── pytorch_lora_weights.safetensors # Fine-tuned model weights
```

## LORA Weights

The `pytorch_lora_weights.safetensors` file contains the fine-tuned weights that specialize the base Stable Diffusion model for comic/manga-style generation. These weights were trained specifically on:

- Manga-style character designs
- Black and white comic art
- Panel layout elements
- Speech bubble integration
- Japanese art style elements

## Usage

The weights in this directory are automatically loaded by:
- The main API server (`server/app.py`)
- The image generation script (`utils/img_generate_sd.py`)
- The React frontend when making API calls

The system will use the LORA weights to enhance the base Stable Diffusion model for creating manga-style comic images from text prompts.

## Adding New Weights

To update or change the LORA weights:

1. Replace the `pytorch_lora_weights.safetensors` file with your new weights
2. Ensure your weights are in the correct format (safetensors)
3. Restart the server to load the new weights

## Training Information

These weights were trained using the following parameters:
- Base model: runwayml/stable-diffusion-v1-5
- Training steps: 4000
- Training data: Manga/comic artwork dataset
- LoRA rank: [rank used during training]
- Learning rate: [learning rate used]