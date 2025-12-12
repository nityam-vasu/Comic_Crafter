# Comic Crafter on Google Colab with LocalTunnel

This guide provides detailed instructions for running the Comic Crafter application on Google Colab using LocalTunnel for port exposure.

## Why LocalTunnel in Colab?

Google Colab has restrictions on network access, making traditional port exposure methods challenging. LocalTunnel provides a simple solution by creating a secure tunnel from a public endpoint to your local machine.

## Prerequisites

- A Google account to access Google Colab
- Basic understanding of Python and command line
- GitHub repository access

## Step-by-Step Setup

### 1. Create a New Colab Notebook

1. Go to https://colab.research.google.com/
2. Create a new notebook
3. Rename it to "Comic Crafter Setup"

### 2. Set up the Environment

```python
# Install Git LFS if needed and clone the repository
!git clone https://github.com/[your-username]/comic-crafter.git
%cd comic-crafter
```

### 3. Install Dependencies

```python
# Install Node.js and localtunnel
!curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
!sudo apt-get install -y nodejs
!npm install -g localtunnel

# Install Python dependencies
!pip install -r server/requirements.txt
```

### 4. Setup Models and Weights

```python
# Setup the base model with LORA weights
%cd utils
!python setup_sd.py
%cd ..
```

### 5. Start Backend Server

```python
import subprocess
import time
import os

# Start server in background
server_process = subprocess.Popen(["python", "server/app.py"])

# Wait for server to start
time.sleep(5)
print(f"Server started with PID: {server_process.pid}")
```

### 6. Expose with LocalTunnel

```python
# Expose the server with localtunnel
# Note: This command will print the public URL to the console
!lt --port 5000
```

### 7. Setup Ollama (Optional)

```python
# Optional: Setup Ollama for additional LLM capabilities
# Install lshw first
!apt-get install -y lshw

# Install Ollama
!curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama in background with nohup
!nohup ollama serve > ollama.log 2>&1 &
time.sleep(5)
print("Ollama server started in background")

# Pull a model in background
!nohup ollama pull llama3 > pull_llama3.log 2>&1 &
print("Started pulling llama3 model in background")
```

### 8. Build and Serve Frontend

```python
# Build the frontend
%cd client
!npm install
!npm run build
%cd ..

# Serve the frontend with localtunnel
import http.server
import socketserver
from threading import Thread

# Serve the built frontend
PORT_FRONTEND = 3000
DIRECTORY = "client/dist"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_frontend_server():
    with socketserver.TCPServer(("", PORT_FRONTEND), Handler) as httpd:
        httpd.serve_forever()

# Start frontend server in background
frontend_thread = Thread(target=start_frontend_server, daemon=True)
frontend_thread.start()
print(f"Frontend server started on port {PORT_FRONTEND}")

# Expose frontend with localtunnel
print("Exposing frontend with localtunnel...")
!lt --port 3000
```

## Using the Application

1. Once you have the localtunnel URLs:
   - Backend API URL (from step 6): Use this in frontend configuration
   - Frontend URL (from step 8): Access the UI at this URL

2. Update frontend environment if needed:
   ```bash
   cd client
   echo "VITE_API_BASE_URL=https://your-backend-url.loca.lt" > .env
   ```

## Troubleshooting

### Common Issues

**Issue:** "command not found: lt"
- **Solution:** Make sure you installed localtunnel: `!npm install -g localtunnel`

**Issue:** Service not accessible via localtunnel URL
- **Solution:** Ensure your local service is running before starting localtunnel

**Issue:** "Port already in use"
- **Solution:** Check if your service is already running: `!ps aux | grep python`

**Issue:** Kernel disconnects
- **Solution:** LocalTunnel will stop working; need to restart the tunnel

### LocalTunnel Specific Issues

- LocalTunnel URLs are temporary and will change each time you restart
- If a subdomain is taken, try another or use the random one
- For persistent access, consider setting up a proper server

### Colab-Specific Tips

- Save important URLs and tokens in Colab's local files
- Enable GPU runtime for better performance: Runtime > Change runtime type > GPU
- Local files persist during the session but not after disconnect
- Consider using Google Drive integration for file persistence

## Alternative: Using the Setup Script

You can also use the provided setup script:

```python
# Install and run the setup script
%cd utils
import localtunnel_setup
localtunnel_setup.colab_localtunnel_setup()
```

## Security Considerations

- LocalTunnel URLs are public and accessible to anyone who has them
- Do not put sensitive information in requests
- URLs are temporary and will change on restart
- For production, use proper authentication and HTTPS

## Performance Optimization

- Use GPU runtime in Colab for faster image generation
- Close unused tabs to conserve resources
- Consider using smaller models for initial testing
- Monitor Colab's resource usage to avoid running out of memory

## Limitations

- Colab session time limits (12 hours for free tier)
- LocalTunnel connection stability may vary
- GPU availability varies with Colab tier
- LocalTunnel URLs are temporary

## Next Steps

1. Test API endpoints with the exposed URL
2. Integrate frontend and backend
3. Experiment with different LORA weights
4. Optimize for your specific use case