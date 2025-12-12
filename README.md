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
   !npm install -g localtunnel
   !pip install flask flask-cors
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

7. **Expose the backend service with localtunnel**:
   ```python
   import threading
   import time
   import requests
   import json

   # Function to start localtunnel
   def start_local_tunnel(port=5000):
       import subprocess
       import time
       
       # Start localtunnel in a subprocess
       tunnel_process = subprocess.Popen([
           'lt', '-p', str(port)
       ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
       
       # Wait a moment and capture the URL
       time.sleep(3)
       
       # Check the process output for the URL
       outs, errs = tunnel_process.communicate(timeout=10)
       
       # If the process is still running, we'll monitor it in a non-blocking way
       print("LocalTunnel started - monitoring for URL...")
       return tunnel_process

   # Start the tunnel
   tunnel_process = start_local_tunnel(5000)
   print("Backend service tunnel process started!")
   
   # Wait a bit more for the URL to be generated
   time.sleep(5)
   
   # Note: With localtunnel, the URL will be printed to the console by the process
   # You can see the URL in the Colab output
   print("Check the output above for the localtunnel URL")
   ```

8. **Alternative approach for localtunnel in Colab**:
   ```python
   import subprocess
   import threading
   import time
   import re

   def create_tunnel():
       # Start the localtunnel command
       result = subprocess.run(['lt', '--port', '5000'], 
                              stdout=subprocess.PIPE, 
                              stderr=subprocess.PIPE, 
                              text=True)
       return result

   def create_tunnel_background():
       # Run localtunnel in the background and print the URL
       import os
       os.system('lt --port 5000 &')
       print("LocalTunnel started in background! Check output above for the URL")

   # Run localtunnel in the background
   create_tunnel_background()
   
   # Wait for URL to appear in output
   time.sleep(3)
   print("LocalTunnel should now be running! Look for the URL in the output above.")
   ```

9. **Setup and serve the frontend**:
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

10. **Serve the frontend and expose it with localtunnel**:
    ```python
    import http.server
    import socketserver
    from threading import Thread
    import subprocess
    import time

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

    # Expose the frontend with localtunnel
    frontend_tunnel = subprocess.Popen(['lt', '--port', str(PORT)])
    print(f"Frontend localtunnel started! Check output above for URL")
    ```

## LORA Weights Integration

This project includes fine-tuned LORA weights specifically trained for Japanese manga style comic generation:

- Located in the `models/weights/` directory
- Automatically loaded by both the API server and standalone generation scripts
- Enhances the base Stable Diffusion model for manga-style output
- Trained on thousands of manga/comic images for authentic results

## Open Router Story Generation

Comic Crafter now uses Open Router with the free meta-llama/llama-3.3-70b-instruct model for story generation:

1. **Get your free API key**:
   - Visit [https://openrouter.ai/keys](https://openrouter.ai/keys)
   - Create an account and generate an API key
   - Keep your API key secure

2. **Set your API key in the environment**:
   ```python
   import os
   os.environ['OPENROUTER_API_KEY'] = 'your-openrouter-api-key-here'
   ```

3. **Generate stories using the API endpoint**:
   - POST to `/story/generate` with your prompt
   - The endpoint returns generated stories with model information
   - Uses the meta-llama/llama-3.3-70b-instruct:free model

## Running in Background for Colab Sessions

To ensure services run in the background throughout your Colab session:

```python
import atexit
import subprocess
import time

# Define the processes
processes = []

# Function to start services
def start_services():
    # Start backend API
    %cd /content/comic-crafter/server
    backend = subprocess.Popen(['python', 'app.py'])
    processes.append(backend)
    
    time.sleep(3)  # Wait for backend to start
    
    print("Backend API running!")
    
    return backend

# Start all services
backend_process = start_services()

# Ensure processes are cleaned up on exit
def cleanup():
    for process in processes:
        try:
            process.terminate()
        except:
            pass

atexit.register(cleanup)

print("All services running in background!")
```

## Features

- **AI-Powered Image Generation**: Generate comic-style images using Stable Diffusion with LORA fine-tuning
- **Manga-Style Focusing**: Specialized model for Japanese manga style via included LORA weights
- **Interactive UI**: Step-by-step comic creation process
- **Image Editing Tools**: Crop, rotate, and adjust generated images
- **Export Functionality**: Download your created comics in various formats
- **Cloud Ready**: Optimized for deployment on Google Colab with port forwarding
- **Open Router Integration**: Support for story generation using free meta-llama/llama-3.3-70b-instruct model

## Configuration

### Environment Variables

For the frontend (client/.env):
```
VITE_API_BASE_URL=https://your-localtunnel-url.loca.lt
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

2. **LocalTunnel Connection**: If localtunnel fails, make sure you have installed it with `!npm install -g localtunnel`

3. **GPU Memory**: In Colab, use Runtime > Change runtime type > GPU for better performance

4. **Model Download**: The first run will take time as it downloads the base model

5. **LORA Weights**: Ensure the `pytorch_lora_weights.safetensors` file is in the `models/weights/` directory

6. **Backend Connection**: Make sure your frontend is configured to connect to the correct backend URL

7. **File Permissions**: If you encounter permission issues in Colab, use `!chmod +x` to make scripts executable

8. **Ollama Installation**: If Ollama installation fails, ensure you've installed lshw first and check available system resources

9. **Background Processes**: If background processes stop unexpectedly, check Colab's runtime logs for errors

10. **Ollama nohup**: If using nohup, check logs with `!cat ollama.log` to confirm the server is running

11. **LocalTunnel URLs**: LocalTunnel URLs are temporary and change each time you restart the tunnel

## License

This project is licensed under the MIT License - see the LICENSE file for details.