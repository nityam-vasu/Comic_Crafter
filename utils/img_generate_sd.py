import torch
import os
import argparse
from diffusers import AutoPipelineForText2Image

# --- Configuration ---
# Update these paths to match your folder structure
BASE_MODEL_PATH = "../utils/local_base_model"  # Path to the downloaded base model
LORA_PATH = "../models/weights"  # Path to LORA weights directory
LORA_WEIGHT_FILENAME = "pytorch_lora_weights.safetensors"

# --- Global Storage ---
# This variable holds the model in memory so we don't reload it every time
_pipeline = None

def load_model():
    """
    Loads the model into the global '_pipeline' variable.
    Call this once when your Flask app starts.
    """
    global _pipeline

    if _pipeline is not None:
        print("Model is already loaded. Skipping.")
        return

    print("--- Loading Model into Memory (One Time Setup) ---")
    try:
        # 1. Load Base Model
        pipe = AutoPipelineForText2Image.from_pretrained(
            BASE_MODEL_PATH,
            torch_dtype=torch.float16,
            safety_checker=None,
            local_files_only=True
        )

        # 2. Move to GPU
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
            print("Model moved to CUDA (GPU).")
        else:
            pipe = pipe.to("cpu")
            print("Warning: Running on CPU.")

        # 3. Load LoRA
        print(f"Loading LoRA weights from {LORA_PATH}...")
        lora_full_path = os.path.join(LORA_PATH, LORA_WEIGHT_FILENAME)
        if os.path.exists(lora_full_path):
            pipe.load_lora_weights(
                LORA_PATH,
                weight_name=LORA_WEIGHT_FILENAME,
                adapter_name="comic_style"
            )
            print(f"LoRA weights loaded successfully from {lora_full_path}")
        else:
            print(f"Warning: LoRA weights not found at {lora_full_path}")
            print("Proceeding with base model only...")

        # Assign to global variable
        _pipeline = pipe
        print("Model successfully loaded and ready for requests!")

    except Exception as e:
        print(f"CRITICAL ERROR loading model: {e}")
        raise e

def generate_image(prompt, negative_prompt, output_filename, num_inference_steps=35, guidance_scale=7.5, width=512, height=768):
    """
    Generates an image using the pre-loaded model with specific Japanese manga style guidance.
    """
    global _pipeline

    # Auto-load if it wasn't loaded manually (safety check)
    if _pipeline is None:
        load_model()

    print(f"Processing Request: {prompt[:30]}...")

    # Enhance the prompt with specific Japanese manga style instructions
    enhanced_prompt = f"Japanese manga style, {prompt}, highly detailed, black and white style, sharp lines, manga art style, professional quality, clean lines, detailed character design"

    # Enhanced negative prompt with manga-specific elements to avoid
    enhanced_negative_prompt = f"{negative_prompt}, color image, western cartoon style, low detail, blurry, deformed, ugly, anime screencap, digital art that looks like a screenshot"

    try:
        image = _pipeline(
            prompt=enhanced_prompt,
            negative_prompt=enhanced_negative_prompt,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            width=width,
            height=height,
            cross_attention_kwargs={"scale": 0.8}
        ).images[0]

        # Ensure directory exists
        os.makedirs(os.path.dirname(output_filename), exist_ok=True)

        image.save(output_filename)
        print(f"Saved: {output_filename}")
        return True

    except Exception as e:
        print(f"Error generating image: {e}")
        return False

# --- Command Line Interface ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate images from text prompts using Stable Diffusion")
    parser.add_argument("--prompt", type=str, required=True, help="The main prompt for image generation")
    parser.add_argument("--negative_prompt", type=str, default="bad quality, blurry, deformed, ugly", help="Negative prompt to avoid certain features")
    parser.add_argument("--output", type=str, required=True, help="Output filename")
    parser.add_argument("--steps", type=int, default=35, help="Number of inference steps (default: 35)")
    parser.add_argument("--cfg_scale", type=float, default=7.5, help="Guidance scale (default: 7.5)")
    parser.add_argument("--width", type=int, default=512, help="Width of the output image")
    parser.add_argument("--height", type=int, default=768, help="Height of the output image")

    args = parser.parse_args()

    # Load model and generate image
    load_model()
    success = generate_image(
        prompt=args.prompt,
        negative_prompt=args.negative_prompt,
        output_filename=args.output,
        num_inference_steps=args.steps,
        guidance_scale=args.cfg_scale,
        width=args.width,
        height=args.height
    )

    if success:
        print("Image generation completed successfully!")
    else:
        print("Image generation failed!")
        exit(1)