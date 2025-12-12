# Comic Crafter - Local Version

A local deployment of Comic Crafter with Stable Diffusion running locally and story generation via Open Router API.

## Features

- Local Stable Diffusion model with optional LORA weights for Japanese manga style
- Story generation using Open Router's free meta-llama/llama-3.3-70b-instruct model
- No cloud dependencies - runs entirely on your local machine
- API endpoints compatible with AUTOMATIC1111 Stable Diffusion WebUI

## Prerequisites

- Python 3.8+
- Git
- At least 8GB RAM (16GB recommended for better performance)
- At least 8GB free disk space for the model
- An Open Router API key (get it for free at [https://openrouter.ai/keys](https://openrouter.ai/keys))

## Quick Start

### 1. Install Dependencies

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r server/requirements.txt
```

### 2. Set Up the Model

```bash
# Run the setup script to download the base model
python utils/setup_model.py
```

### 3. Get Open Router API Key

1. Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
2. Create an account and generate an API key
3. Set the API key as an environment variable:

```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

### 4. Start the Server

```bash
# Run the server directly
python server/app.py

# Or use the start script (which handles virtual environment and API key setup)
./start_server.sh
```

The server will be available at: `http://localhost:5000`

## API Endpoints

### Image Generation
- `POST /sdapi/v1/txt2img` - Generate image from text prompt
- `POST /sdapi/v1/img2img` - Generate image from image and text prompt

### Story Generation
- `POST /story/generate` - Generate story using Open Router

### Utilities
- `GET /health` - Health check
- `GET /sdapi/v1/sd-models` - Get available models
- `POST /sdapi/v1/options` - Set options (stub implementation)

## Configuration

You can configure the application using environment variables:

```bash
# Model configuration
export SD_BASE_MODEL_ID="runwayml/stable-diffusion-v1-5"  # Base model
export SD_LORA_PATH="./models/weights"                     # Path to LORA weights
export SD_LORA_WEIGHT="pytorch_lora_weights.safetensors"  # LORA weight filename
export SD_CACHE_DIR="./cache"                             # Model cache directory
export SD_OUTPUT_DIR="./outputs"                          # Generated image directory

# Server configuration
export SD_API_PORT=5000                                   # API port
export SD_API_HOST="0.0.0.0"                             # API host
export OPENROUTER_API_KEY="your-api-key-here"            # Open Router API key
```

## Adding LORA Weights

To use LORA weights for specialized styles:

1. Place your LORA weights file in `./models/weights/`
2. Make sure the filename matches the `SD_LORA_WEIGHT` environment variable (default: `pytorch_lora_weights.safetensors`)
3. The server will automatically load the LORA weights on startup

## Example API Usage

### Generate an image from text:

```bash
curl -X POST http://localhost:5000/sdapi/v1/txt2img \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a samurai warrior in traditional armor",
    "width": 512,
    "height": 512,
    "steps": 20
  }'
```

### Generate a story:

```bash
curl -X POST http://localhost:5000/story/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short superhero story about a character who gains the power to control shadows.",
    "max_tokens": 300
  }'
```

## Troubleshooting

1. **Memory Issues**: If you encounter memory errors, try reducing the image dimensions or using a smaller model.

2. **Model Download**: The first run will take time as it downloads the base model (~5GB). Subsequent runs will use the local copy.

3. **API Key Issues**: Make sure your Open Router API key is correctly set in the environment variables.

4. **CUDA Issues**: If you have a GPU but encounter CUDA errors, ensure you have the correct PyTorch version for your CUDA version.

5. **Port Issues**: If port 5000 is already in use, you can change it with the SD_API_PORT environment variable.

## Directory Structure

```
comic_crafter_local/
├── server/                 # Backend API server
│   ├── app.py             # Main Flask application
│   └── requirements.txt   # Python dependencies
├── utils/                 # Utility scripts
│   └── setup_model.py     # Script to download and set up the model
├── models/                # Model files
│   ├── base_model/        # Downloaded base model
│   └── weights/           # LORA weights directory
├── start_server.sh        # Convenience script to start the server
├── README.md              # This file
└── .env.example           # Example environment file
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.