from flask import Flask, request, jsonify, send_file
from diffusers import AutoPipelineForText2Image
import torch
import os
import io
import base64
from PIL import Image
import uuid
import logging
import openai
import requests

app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BASE_MODEL_ID = os.getenv("SD_BASE_MODEL_ID", "runwayml/stable-diffusion-v1-5")  # Base model
LORA_MODEL_PATH = os.getenv("SD_LORA_PATH", "../models/weights")  # Path to LORA weights
LORA_WEIGHT_NAME = os.getenv("SD_LORA_WEIGHT", "pytorch_lora_weights.safetensors")  # LORA weight filename
CACHE_DIR = os.getenv("SD_CACHE_DIR", "./cache")
OUTPUT_DIR = os.getenv("SD_OUTPUT_DIR", "./outputs")

# Ensure directories exist
os.makedirs(CACHE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Global variables for model
pipe = None

def load_model():
    """Load the Stable Diffusion model with LORA weights"""
    global pipe

    logger.info(f"Loading base model: {BASE_MODEL_ID}")
    try:
        # Load the base model
        pipe = AutoPipelineForText2Image.from_pretrained(
            BASE_MODEL_ID,
            torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
            cache_dir=CACHE_DIR
        )

        # Load LORA weights if they exist
        lora_full_path = os.path.join(LORA_MODEL_PATH, LORA_WEIGHT_NAME)
        if os.path.exists(lora_full_path):
            logger.info(f"Loading LORA weights from {lora_full_path}")
            pipe.load_lora_weights(
                LORA_MODEL_PATH,
                weight_name=LORA_WEIGHT_NAME,
                adapter_name="comic_style"  # Named adapter for comic/manga style
            )
            logger.info("LORA weights loaded successfully")
        else:
            logger.warning(f"LORA weights not found at {lora_full_path}, loading base model only")

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

        # Enhance the prompt with specific Japanese manga style instructions
        enhanced_prompt = f"Japanese manga style, {prompt}, highly detailed, black and white style, sharp lines, manga art style, professional quality, clean lines, detailed character design"

        # Enhanced negative prompt with manga-specific elements to avoid
        enhanced_negative_prompt = f"{negative_prompt}, color image, western cartoon style, low detail, blurry, deformed, ugly, anime screencap, digital art that looks like a screenshot"

        # Generate the image
        generator = None
        if seed != -1:
            generator = torch.Generator(device=pipe.device).manual_seed(seed)

        with torch.no_grad():
            image = pipe(
                prompt=enhanced_prompt,
                negative_prompt=enhanced_negative_prompt,
                num_inference_steps=steps,
                guidance_scale=cfg_scale,
                width=width,
                height=height,
                generator=generator,
                cross_attention_kwargs={"scale": 0.8}  # Apply LORA scaling if available
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
            "info": "Image generated successfully with LORA weights"
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

        # Enhance the prompt with specific Japanese manga style instructions
        enhanced_prompt = f"Japanese manga style, {prompt}, highly detailed, black and white style, sharp lines, manga art style, professional quality, clean lines, detailed character design"

        # Enhanced negative prompt with manga-specific elements to avoid
        enhanced_negative_prompt = f"{negative_prompt}, color image, western cartoon style, low detail, blurry, deformed, ugly, anime screencap, digital art that looks like a screenshot"

        # Decode the first image
        img_data = base64.b64decode(init_images[0])
        init_image = Image.open(io.BytesIO(img_data)).convert("RGB")

        # Resize image to match dimensions
        init_image = init_image.resize((width, height))

        # Use img2img pipeline
        with torch.no_grad():
            image = pipe(
                prompt=enhanced_prompt,
                negative_prompt=enhanced_negative_prompt,
                image=init_image,
                num_inference_steps=int(steps / denoising_strength),  # Adjust steps based on denoising strength
                guidance_scale=cfg_scale,
                strength=denoising_strength,
                generator=torch.Generator(device=pipe.device).manual_seed(42),  # Fixed seed for consistency
                cross_attention_kwargs={"scale": 0.8}  # Apply LORA scaling if available
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
            "info": "Image transformed successfully with LORA weights"
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
        return jsonify([{
            "title": "Comic Style Model (with LORA)", 
            "model_name": "comic-style-lora", 
            "hash": "lora-enhanced"
        }])
    except Exception as e:
        logger.error(f"Error in get_models: {str(e)}")
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
        return jsonify([{
            "title": "Comic Style Model (with LORA)",
            "model_name": "comic-style-lora",
            "hash": "lora-enhanced"
        }])
    except Exception as e:
        logger.error(f"Error in get_models: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/story/generate", methods=["POST"])
def generate_story():
    """Generate a story using Open Router with Llama 3.3 70B model"""
    try:
        data = request.get_json()

        prompt = data.get("prompt", "")
        max_tokens = data.get("max_tokens", 500)
        temperature = data.get("temperature", 0.7)

        # Get Open Router API key from environment variable
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        if not openrouter_api_key:
            return jsonify({"error": "OPENROUTER_API_KEY environment variable not set"}), 500

        # Prepare the request to Open Router
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": os.getenv("APP_URL", "http://localhost:5000"),
            "X-Title": "Comic Crafter"
        }

        payload = {
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": [
                {"role": "system", "content": "You are a creative storyteller that specializes in generating engaging, imaginative stories for comic books. Your stories should be vivid, detailed, and perfect for adaptation into visual comics."},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            logger.error(f"Open Router API error: {response.text}")
            return jsonify({"error": f"Story generation failed with status {response.status_code}"}), 500

        result = response.json()
        story_text = result['choices'][0]['message']['content'].strip()

        return jsonify({
            "story": story_text,
            "model_used": "meta-llama/llama-3.3-70b-instruct:free",
            "tokens_used": result.get('usage', {}).get('total_tokens', 0)
        })

    except Exception as e:
        logger.error(f"Error in generate_story: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    # Check if LORA weights are loaded by checking if the adapter is active
    lora_loaded = False
    if hasattr(pipe, 'lora_manager') and pipe.lora_manager:
        lora_loaded = True
    elif hasattr(pipe, 'loaded_lora'):
        lora_loaded = pipe.loaded_lora is not None

    return jsonify({
        "status": "ok",
        "model_loaded": pipe is not None,
        "lora_loaded": lora_loaded,
        "story_generation_enabled": bool(os.getenv("OPENROUTER_API_KEY"))
    })

if __name__ == "__main__":
    # Load the model when starting the service
    load_model()

    # Get port from environment variable or default to 5000
    port = int(os.getenv("SD_API_PORT", 5000))
    host = os.getenv("SD_API_HOST", "0.0.0.0")

    logger.info(f"Starting Stable Diffusion API with LORA on {host}:{port}")
    app.run(host=host, port=port, debug=False)