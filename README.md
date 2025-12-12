# Comic Crafter

A web application for creating comics with AI-generated images, built with React frontend and Python backend services. Features fine-tuned LORA weights for Japanese manga style generation.

## Project Structure

```
├── client/                 # React frontend application
│   ├── components/         # React components for the UI
│   ├── services/           # API service utilities
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   ├── package.json        # Dependencies and scripts
│   └── ...
├── server/                 # Backend API services
│   ├── app.py              # Main Flask application with LORA integration
│   ├── requirements.txt    # Python dependencies
│   └── ...
├── utils/                  # Python utility scripts
│   ├── setup_sd.py         # Script to download and set up the base model
│   ├── img_generate_sd.py  # Script for image generation with LORA weights
│   ├── ollama_setup.py     # Script for Ollama setup in Google Colab
│   └── ...
├── models/                 # Trained models including LORA weights
│   └── weights/            # LORA fine-tuned weights for comic generation
│       └── pytorch_lora_weights.safetensors # Fine-tuned model weights
├── docs/                   # Documentation files
├── README.md               # This file
└── package.json            # Root package configuration
```

## Prerequisites

- Node.js (for the frontend)
- Python 3.8+ (for the backend)
- Git
- Access to Google Colab (for cloud deployment)

## Deployment Options

### Option 1: Local Development

#### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with API configuration:
   ```
   VITE_API_BASE_URL=http://localhost:5000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

#### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Download the base model and ensure LORA weights are in place:
   ```bash
   cd ../utils
   python setup_sd.py
   ```
   This will check for and use the LORA weights in the models directory.

5. Start the backend server:
   ```bash
   cd ../server
   python app.py
   ```

### Option 2: Google Colab Deployment

This setup is optimized for running in Google Colab with port exposure:

1. **Open Google Colab** and create a new notebook

2. **Clone the repository**:
   ```python
   !git clone https://github.com/[your-username]/comic-crafter.git
   %cd comic-crafter
   ```

3. **Install required packages**:
   ```python
   !pip install pyngrok flask flask-cors
   ```

4. **Setup backend dependencies**:
   ```python
   %cd server
   !pip install -r requirements.txt
   ```

5. **Setup the Stable Diffusion model with LORA weights**:
   ```python
   %cd ../utils
   !python setup_sd.py
   ```
   This step downloads the base model and checks for LORA weights. The LORA weights should already be in the `../models/weights/` directory.

6. **Start the backend service in the background**:
   ```python
   import subprocess
   import time
   from pyngrok import ngrok
   import nest_asyncio

   # This is needed for running async operations in Colab
   nest_asyncio.apply()

   # Start the Flask backend service in the background
   %cd ../server
   backend_process = subprocess.Popen(['python', 'app.py'])

   # Wait a moment for the server to start
   time.sleep(3)
   print("Backend service started with LORA weights!")
   ```

7. **Expose the backend service with ngrok**:
   ```python
   # Create a tunnel to the backend service running on port 5000
   public_url = ngrok.connect(5000)
   print(f"Backend service exposed at: {public_url}")
   ```

8. **Setup and serve the frontend**:
   ```python
   # Install Node.js in Colab (if needed)
   !curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   !sudo apt-get install -y nodejs

   # Navigate to client directory and install dependencies
   %cd ../client
   !npm install

   # Build the React app
   !npm run build
   ```

9. **Serve the frontend and expose it** (alternative approach):
   ```python
   import http.server
   import socketserver
   from threading import Thread

   # Serve the built frontend using Python's http.server
   PORT = 3000
   DIRECTORY = "dist"  # The built React app directory

   class Handler(http.server.SimpleHTTPRequestHandler):
       def __init__(self, *args, **kwargs):
           super().__init__(*args, directory=DIRECTORY, **kwargs)

   # Start server in a separate thread
   def start_server():
       with socketserver.TCPServer(("", PORT), Handler) as httpd:
           httpd.serve_forever()

   server_thread = Thread(target=start_server, daemon=True)
   server_thread.start()

   # Expose the frontend with ngrok
   from pyngrok import ngrok
   frontend_url = ngrok.connect(PORT, "http")
   print(f"Frontend exposed at: {frontend_url}")
   ```

## LORA Weights Integration

This project includes fine-tuned LORA weights specifically trained for Japanese manga style comic generation:

- Located in the `models/weights/` directory
- Automatically loaded by both the API server and standalone generation scripts
- Enhances the base Stable Diffusion model for manga-style output
- Trained on thousands of manga/comic images for authentic results

## Ollama Setup in Google Colab

If you want to use Ollama for local LLM capabilities in your Comic Crafter project:

1. **Install lshw before Ollama**:
   ```python
   # First install lshw (required for Ollama installation)
   !apt-get install -y lshw
   ```

2. **Install Ollama**:
   ```python
   # Download and install Ollama
   !curl -fsSL https://ollama.ai/install.sh | sh
   ```

3. **Set up Ollama to run in the background with nohup** (Recommended):
   ```python
   import os
   import time

   # 1. Install lshw (if not already done)
   !apt-get update && apt-get install -y lshw

   # 2. Run Ollama server in the background
   # We use nohup to keep it running and redirect output to a file
   !nohup ollama serve > ollama.log 2>&1 &

   # 3. Wait a moment for the server to start up
   time.sleep(5)

   print("Ollama server started in background with nohup!")
   print("Check status with: !cat ollama.log")
   ```

4. **Pull required models in the background** (Recommended approach):
   ```python
   # Pull models in the background with nohup
   models_to_pull = ['llama3', 'mistral', 'codellama']

   for model in models_to_pull:
       print(f"Pulling {model} in background with nohup...")
       command = f"nohup ollama pull {model} > pull_{model}.log 2>&1 &"
       os.system(command)
       print(f"Started pulling {model}, check progress with: !cat pull_{model}.log")

   print("All model pulls started in background!")
   ```

5. **Complete Ollama setup using the provided script**:
   ```python
   # Use the provided setup script for a complete installation
   %cd utils
   import ollama_setup
   
   # Run the setup with nohup (recommended)
   models_to_pull = ['llama3', 'mistral', 'codellama']
   ollama_setup.setup_ollama_with_models(models_to_pull, use_nohup=True)
   ```

## Running in Background for Colab Sessions

To ensure services run in the background throughout your Colab session:

```python
import atexit
import subprocess
import time
from pyngrok import ngrok

# Define the processes
processes = []

# Function to start services
def start_services():
    # Start backend API
    %cd /content/comic-crafter/server
    backend = subprocess.Popen(['python', 'app.py'])
    processes.append(backend)
    
    time.sleep(3)  # Wait for backend to start
    
    # Expose backend via ngrok
    backend_tunnel = ngrok.connect(5000)
    print(f"Backend API running at: {backend_tunnel}")
    
    return backend_tunnel

# Start all services
api_url = start_services()

# Ensure processes are cleaned up on exit
def cleanup():
    for process in processes:
        try:
            process.terminate()
        except:
            pass

atexit.register(cleanup)

print("All services running in background!")
print(f"API Base URL: {api_url}")
```

## Features

- **AI-Powered Image Generation**: Generate comic-style images using Stable Diffusion with LORA fine-tuning
- **Manga-Style Focusing**: Specialized model for Japanese manga style via included LORA weights
- **Interactive UI**: Step-by-step comic creation process
- **Image Editing Tools**: Crop, rotate, and adjust generated images
- **Export Functionality**: Download your created comics in various formats
- **Cloud Ready**: Optimized for deployment on Google Colab with port forwarding
- **Ollama Integration**: Support for local LLM models via Ollama

## Configuration

### Environment Variables

For the frontend (client/.env):
```
VITE_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

For the server (environment variables):
```
SD_BASE_MODEL_ID=runwayml/stable-diffusion-v1-5  # Base model
SD_LORA_PATH=../models/weights                   # Path to LORA weights
SD_LORA_WEIGHT=pytorch_lora_weights.safetensors # LORA weight filename
SD_API_PORT=5000                                # API port
SD_API_HOST=0.0.0.0                             # API host
```

### API Endpoints

The backend server provides the following endpoints:
- `GET /` - Health check
- `POST /generate` - Generate image from prompt
- `POST /edit` - Edit existing image
- `POST /export` - Export comic in various formats
- `GET /health` - Model loading status with LORA check

## Troubleshooting

1. **Port Issues**: If you get port binding errors, try different ports (5001, 5002, etc.)

2. **ngrok Connection**: If ngrok fails, ensure you have an active internet connection

3. **GPU Memory**: In Colab, use Runtime > Change runtime type > GPU for better performance

4. **Model Download**: The first run will take time as it downloads the base model

5. **LORA Weights**: Ensure the `pytorch_lora_weights.safetensors` file is in the `models/weights/` directory

6. **Backend Connection**: Make sure your frontend is configured to connect to the correct backend URL

7. **File Permissions**: If you encounter permission issues in Colab, use `!chmod +x` to make scripts executable

8. **Ollama Installation**: If Ollama installation fails, ensure you've installed lshw first and check available system resources

9. **Background Processes**: If background processes stop unexpectedly, check Colab's runtime logs for errors

10. **Ollama nohup**: If using nohup, check logs with `!cat ollama.log` to confirm the server is running

## License

This project is licensed under the MIT License - see the LICENSE file for details.