import torch
from diffusers import AutoPipelineForText2Image
import os

# --- Configuration ---
BASE_MODEL_ID = "runwayml/stable-diffusion-v1-5"
LOCAL_MODEL_DIR = "./local_base_model"  # Where we will save the model

def setup():
    print(f"--- Starting Model Setup ---")
    print(f"Downloading: {BASE_MODEL_ID}")
    print(f"Saving to:   {LOCAL_MODEL_DIR}")

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
    print(f"You can now run 'generate.py' and it will load from '{LOCAL_MODEL_DIR}'")

if __name__ == "__main__":
    setup()
