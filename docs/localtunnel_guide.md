# LocalTunnel Setup Guide

This guide explains how to use localtunnel for exposing your Comic Crafter services in Google Colab and other environments.

## What is LocalTunnel?

LocalTunnel (lt) is a tool that allows you to easily share a local server with the world via a temporary public URL. This is particularly useful in Google Colab where traditional port exposure methods might face restrictions.

## Installation

To install localtunnel, you need Node.js. In Google Colab, you can install it with:

```bash
# Install Node.js (if not already installed)
!curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
!sudo apt-get install -y nodejs

# Install localtunnel globally
!npm install -g localtunnel
```

## Basic Usage

```bash
# Expose a local port (e.g., 5000)
!lt --port 5000

# This will output something like:
# your url is: https://abc123.loca.lt
```

## Python Implementation

You can also manage localtunnel from Python scripts:

```python
import subprocess
import threading
import time

def start_local_tunnel(port=5000):
    """
    Start localtunnel for a given port.
    """
    print(f"Starting localtunnel for port {port}...")
    
    # Start localtunnel as a subprocess
    tunnel_process = subprocess.Popen([
        'lt', 
        '--port', str(port)
    ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    
    # The URL will be printed by the process, so we don't need to capture it here
    print(f"LocalTunnel started for port {port}. Check output for URL.")
    
    return tunnel_process

# Example usage
tunnel_process = start_local_tunnel(5000)
```

## Complete Colab Setup with LocalTunnel

Here's a complete setup example for Google Colab:

```python
import subprocess
import time
import os

# 1. Install dependencies
!npm install -g localtunnel
!pip install flask flask-cors

# 2. Start your backend service in background
!cd server && python app.py > server.log 2>&1 &

# 3. Wait for the server to start
time.sleep(5)

# 4. Expose the server with localtunnel
!lt --port 5000
```

## Using with Comic Crafter

For the Comic Crafter application, follow these steps:

1. **Install localtunnel**:
   ```python
   !npm install -g localtunnel
   ```

2. **Start the backend**:
   ```python
   import subprocess
   import time
   
   # Start the server in background
   os.system("cd server && python app.py > server.log 2>&1 &")
   
   # Give it time to start
   time.sleep(5)
   print("Server started in background!")
   ```

3. **Expose with localtunnel**:
   ```python
   # Expose the server
   !lt --port 5000
   ```

4. **Update frontend configuration**:
   After getting the localtunnel URL, update your frontend configuration:
   ```bash
   # In the client directory, create or update .env
   cd client
   echo "VITE_API_BASE_URL=https://your-localetunnel-url.loca.lt" > .env
   ```

## LocalTunnel Options

Some useful localtunnel options:

```bash
# Specify a custom subdomain (if available)
!lt --port 5000 --subdomain my-comic-crafter

# Use a specific local host (if running on different interface)
!lt --port 5000 --local-host localhost

# Set a local certificate
!lt --port 5000 --local-https
```

## Troubleshooting

1. **"command not found" error**: Make sure you installed localtunnel globally with `npm install -g localtunnel`

2. **Port already in use**: Make sure the port you're trying to expose is actually running a service

3. **Connection timeouts**: LocalTunnel URLs are temporary and may expire. Just restart the tunnel if needed

4. **Colab kernel restarts**: You'll need to reinstall and restart services after a Colab kernel restart

5. **URL not accessible**: Check that your backend service is running on the specified port before starting localtunnel

## Advantages over ngrok

- No account required
- Simpler installation
- No rate limits for basic usage
- Better integration with some cloud environments

## Notes

- LocalTunnel URLs are temporary and will change each time you restart the tunnel
- The free version of localtunnel works well for development and experimentation
- For production use, consider setting up a proper web server and domain
- LocalTunnel works by creating a secure tunnel from a public endpoint to your local machine