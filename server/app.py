from flask import Flask, request, jsonify, send_file
from diffusers import StableDiffusionPipeline, StableDiffusionImg2ImgPipeline
import torch
import os
import io
import base64
from PIL import Image
import uuid
import logging

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_ID = os.getenv("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5")
CACHE_DIR = os.getenv("SD_CACHE_DIR", "./cache")
OUTPUT_DIR = os.getenv("SD_OUTPUT_DIR", "./outputs")

# Ensure directories exist
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Global variables for model
pipe = None

def load_model():
    """Load the Stable Diffusion model"""
    global pipe
    
    logger.info(f"Loading model: {MODEL_ID}")
    try:
        pipe = StableDiffusionPipeline.from_pretrained(
            MODEL_ID,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            cache_dir=CACHE_DIR
        )
        
        # Move to GPU if available, otherwise CPU
        if torch.cuda.is_available():
            pipe = pipe.to("cuda")
            logger.info("Model loaded on GPU")
        else:
            pipe = pipe.to("cpu")
            logger.info("Model loaded on CPU")
        
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise e

@app.route("/sdapi/v1/txt2img", methods=["POST"])
def txt2img():
    """Generate image from text prompt"""
    global pipe
    
    if pipe is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        
        # Extract parameters
        prompt = data.get("prompt", "")
        negative_prompt = data.get("negative_prompt", "")
        steps = data.get("steps", 20)
        width = data.get("width", 512)
        height = data.get("height", 512)
        cfg_scale = data.get("cfg_scale", 7.5)
        seed = data.get("seed", -1)
        sampler_name = data.get("sampler_name", "Euler a")
        
        # Generate the image
        generator = None
        if seed != -1:
            generator = torch.Generator(device=pipe.device).manual_seed(seed)
        
        with torch.no_grad():
            image = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                width=width,
                height=height,
                generator=generator
            ).images[0]
        
        # Save the image
        output_filename = f"{str(uuid.uuid4())}.png"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        image.save(output_path)
        
        # Convert to base64 for API response
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            "images": [img_str],
            "parameters": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": steps,
                "width": width,
                "height": height,
                "cfg_scale": cfg_scale,
                "seed": seed
            },
            "info": "Image generated successfully"
        })
    
    except Exception as e:
        logger.error(f"Error in txt2img: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/sdapi/v1/img2img", methods=["POST"])
def img2img():
    """Generate image from image and text prompt"""
    global pipe
    
    if pipe is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        data = request.get_json()
        
        # Extract parameters
        init_images = data.get("init_images", [])
        prompt = data.get("prompt", "")
        negative_prompt = data.get("negative_prompt", "")
        steps = data.get("steps", 20)
        denoising_strength = data.get("denoising_strength", 0.75)
        width = data.get("width", 512)
        height = data.get("height", 512)
        cfg_scale = data.get("cfg_scale", 7.5)
        
        if not init_images:
            return jsonify({"error": "No init_images provided"}), 400
        
        # Decode the first image
        img_data = base64.b64decode(init_images[0])
        init_image = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        # Resize image to match dimensions
        init_image = init_image.resize((width, height))
        
        # Use img2img pipeline
        with torch.no_grad():
            image = pipe(
                prompt=prompt,
                negative_prompt=negative_prompt,
                init_image=init_image,
                num_inference_steps=int(steps / denoising_strength),  # Adjust steps based on denoising strength
                guidance_scale=cfg_scale,
                strength=denoising_strength,
                generator=torch.Generator(device=pipe.device).manual_seed(42)  # Fixed seed for consistency
            ).images[0]
        
        # Convert to base64 for API response
        buffered = io.BytesIO()
        image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return jsonify({
            "images": [img_str],
            "parameters": {
                "prompt": prompt,
                "negative_prompt": negative_prompt,
                "steps": steps,
                "denoising_strength": denoising_strength,
                "width": width,
                "height": height,
                "cfg_scale": cfg_scale
            },
            "info": "Image transformed successfully"
        })
    
    except Exception as e:
        logger.error(f"Error in img2img: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/sdapi/v1/options", methods=["POST"])
def set_options():
    """Set Stable Diffusion options (stub implementation)"""
    try:
        data = request.get_json()
        logger.info(f"Setting options: {data}")
        return jsonify({"status": "options set"})
    except Exception as e:
        logger.error(f"Error in set_options: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/sdapi/v1/sd-models", methods=["GET"])
def get_models():
    """Get available models (stub implementation)"""
    try:
        return jsonify([{"title": "Default Model", "model_name": "default", "hash": "default"}])
    except Exception as e:
        logger.error(f"Error in get_models: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "model_loaded": pipe is not None})

if __name__ == "__main__":
    # Load the model when starting the service
    load_model()
    
    # Get port from environment variable or default to 7860
    port = int(os.getenv("SD_API_PORT", 7860))
    host = os.getenv("SD_API_HOST", "0.0.0.0")
    
    logger.info(f"Starting Stable Diffusion API on {host}:{port}")
    app.run(host=host, port=port, debug=False)