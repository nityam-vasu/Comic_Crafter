import torch
from diffusers import AutoPipelineForText2Image
import os

# --- Configuration ---
BASE_MODEL_ID = os.getenv("SD_BASE_MODEL_ID", "runwayml/stable-diffusion-v1-5")
LOCAL_MODEL_DIR = "./models/base_model"  # Where we will save the model
LORA_MODEL_DIR = "./models/weights"  # Directory for LORA weights

def setup_local_model():
    print(f"--- Starting Local Model Setup ---")
    print(f"Base model ID: {BASE_MODEL_ID}")
    print(f"Base model save path: {LOCAL_MODEL_DIR}")
    print(f"LORA weights path: {LORA_MODEL_DIR}")

    # Create directories if they don't exist
    os.makedirs(LOCAL_MODEL_DIR, exist_ok=True)
    os.makedirs(LORA_MODEL_DIR, exist_ok=True)

    # Check if LORA weights exist
    lora_weight_path = os.path.join(LORA_MODEL_DIR, "pytorch_lora_weights.safetensors")
    if os.path.exists(lora_weight_path):
        print(f"✓ LORA weights found at: {lora_weight_path}")
    else:
        print(f"⚠ LORA weights not found at: {lora_weight_path}")
        print("  You need to place your LORA weights file in this location to enable fine-tuned generation")

    # Check if base model already exists
    if os.path.exists(LOCAL_MODEL_DIR) and os.listdir(LOCAL_MODEL_DIR):
        print(f"✓ Base model already exists at: {LOCAL_MODEL_DIR}")
        print("  Skipping download. To re-download, delete the directory first.")
        return

    print(f"Downloading base model: {BASE_MODEL_ID}")

    # 1. Download the model
    # We load it to CPU first to save GPU memory during the setup phase
    try:
        pipeline = AutoPipelineForText2Image.from_pretrained(
            BASE_MODEL_ID,
            torch_dtype=torch.float16,
            safety_checker=None
        )
    except Exception as e:
        print(f"Error downloading model: {e}")
        return

    # 2. Save it locally
    print("Saving model to local directory...")
    pipeline.save_pretrained(LOCAL_MODEL_DIR)

    print("------------------------------------------------")
    print("Setup Complete! The model is saved.")
    print(f"Base model location: {LOCAL_MODEL_DIR}")
    print(f"LORA weights location: {LORA_MODEL_DIR}")
    print(f"You can now run the server and it will use the local models.")

if __name__ == "__main__":
    setup_local_model()