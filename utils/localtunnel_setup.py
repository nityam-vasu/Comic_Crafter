import subprocess
import time
import threading
import os

def install_localtunnel():
    """
    Install localtunnel globally using npm.
    """
    print("Installing localtunnel globally...")
    result = subprocess.run(['npm', 'install', '-g', 'localtunnel'], 
                            capture_output=True, text=True)
    if result.returncode == 0:
        print("LocalTunnel installed successfully!")
        return True
    else:
        print(f"Error installing localtunnel: {result.stderr}")
        return False

def start_localtunnel(port=5000, subdomain=None):
    """
    Start localtunnel to expose a local port.
    """
    print(f"Starting localtunnel for port {port}...")
    
    cmd = ['lt', '--port', str(port)]
    if subdomain:
        cmd.extend(['--subdomain', subdomain])
    
    # Start localtunnel in subprocess 
    tunnel_process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Print the URL once it's available
    print("LocalTunnel started. Waiting for URL...")
    
    # Give it a moment to start
    time.sleep(3)
    
    return tunnel_process

def create_tunnel_with_callback(port=5000, on_url_ready=None):
    """
    Create a tunnel and optionally call a function when the URL is ready.
    """
    def run_tunnel():
        import subprocess
        import re
        
        cmd = ['lt', '--port', str(port)]
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Wait for the URL to appear in the output
        url_line = None
        while True:
            output = process.stderr.readline()
            if output == '' and process.poll() is not None:
                break
            if output:
                print(output.strip())
                if 'your url is:' in output.lower():
                    url_line = output.strip()
                    if on_url_ready:
                        on_url_ready(url_line)
                    break
    
    tunnel_thread = threading.Thread(target=run_tunnel)
    tunnel_thread.daemon = True
    tunnel_thread.start()
    
    print(f"LocalTunnel thread started for port {port}")
    return tunnel_thread

def setup_local_backend_with_tunnel(port=5000, backend_start_cmd=['python', 'app.py']):
    """
    Complete setup for backend with localtunnel exposure.
    """
    # Install localtunnel if not already installed
    install_success = install_localtunnel()
    if not install_success:
        print("Could not install localtunnel. Please install it manually with 'npm install -g localtunnel'")
        return None, None
    
    # Start the backend service
    print(f"Starting backend service on port {port}...")
    backend_process = subprocess.Popen(backend_start_cmd)
    
    # Wait a moment for the backend to start
    time.sleep(3)
    
    # Start localtunnel to expose the service
    tunnel_thread = create_tunnel_with_callback(port, 
        on_url_ready=lambda url: print(f"Service should be available at: {url}"))
    
    return backend_process, tunnel_thread

def colab_localtunnel_setup():
    """
    Special setup function for Google Colab environments.
    """
    print("Setting up Comic Crafter with localtunnel in Google Colab...")
    
    # Install localtunnel
    print("Installing localtunnel...")
    os.system('npm install -g localtunnel')
    
    print("Localtunnel setup complete!")
    print("Now you can use: !lt --port [PORT_NUMBER] to expose your services")

if __name__ == "__main__":
    # Example usage
    print("LocalTunnel Setup Script for Comic Crafter")
    print("=========================================")
    
    # For Colab
    colab_localtunnel_setup()
    
    print("\nFor backend service, run this in a separate cell:")
    print("!cd server && python app.py &")
    print("!lt --port 5000")