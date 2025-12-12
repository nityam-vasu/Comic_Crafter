# Stable Diffusion API Service

This service provides a Stable Diffusion API that integrates with the KomaMaker AI React frontend, allowing image generation for comic panels.

## Features

- Compatible with Auto1111 API format (used by the React frontend)
- Supports text-to-image generation (`/sdapi/v1/txt2img`)
- Supports image-to-image generation (`/sdapi/v1/img2img`)
- Configurable model and parameters
- Base64 image responses

## Setup

1. Navigate to the service directory:
   ```bash
   cd services/stable_diffusion_api
   ```

2. Make the setup script executable and run it:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. Alternatively, install manually:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

## Configuration

The service can be configured using environment variables:

- `SD_MODEL_ID`: Model ID to use (default: `runwayml/stable-diffusion-v1-5`)
- `SD_CACHE_DIR`: Directory to cache models (default: `./cache`)
- `SD_OUTPUT_DIR`: Directory to save generated images (default: `./outputs`)
- `SD_API_PORT`: Port to run the API on (default: `7860`)
- `SD_API_HOST`: Host to bind to (default: `0.0.0.0`)

Example:
```bash
SD_MODEL_ID="stabilityai/stable-diffusion-2-1" SD_API_PORT=8000 python app.py
```

## Running the Service

After setup, simply run:
```bash
python app.py
```

The API will be available at `http://localhost:7860` (or the configured port).

## API Endpoints

- `POST /sdapi/v1/txt2img` - Generate image from text prompt
- `POST /sdapi/v1/img2img` - Generate image from image and text prompt
- `POST /sdapi/v1/options` - Set options
- `GET /sdapi/v1/sd-models` - Get available models
- `GET /health` - Health check

## Integration with React Frontend

The React frontend is configured to connect to this API by default. To ensure proper connection:

1. Make sure the API service is running
2. In your React environment, set the API endpoint:
   ```bash
   VITE_SD_API_ENDPOINT=http://localhost:7860
   ```
3. The frontend will automatically use this API for image generation in Step 3

## Models

You can use any text-to-image model from Hugging Face. Some recommended models:
- `runwayml/stable-diffusion-v1-5`
- `stabilityai/stable-diffusion-2-1`
- `prompthero/openjourney`
- Custom fine-tuned models

## Notes

- The first run will download the model, which may take some time
- GPU support is enabled automatically if available
- Generated images are saved to the output directory and returned as base64