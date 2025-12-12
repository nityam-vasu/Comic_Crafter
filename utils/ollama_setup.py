import subprocess
import threading
import time
import os

def install_ollama():
    """
    Install Ollama in Google Colab environment.
    This function installs lshw first (required for Ollama) then installs Ollama.
    """
    print("Installing lshw (required for Ollama)...")
    result = subprocess.run(['apt-get', 'update'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error updating apt: {result.stderr}")
        return False
        
    result = subprocess.run(['apt-get', 'install', '-y', 'lshw'], capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error installing lshw: {result.stderr}")
        return False

    print("Installing Ollama...")
    result = subprocess.run(['curl', '-fsSL', 'https://ollama.ai/install.sh'], 
                            capture_output=True, text=True, shell=True)
    if result.returncode != 0:
        print(f"Error downloading Ollama installer: {result.stderr}")
        return False

    # Execute the installer
    install_result = subprocess.run('curl -fsSL https://ollama.ai/install.sh | sh', 
                                    capture_output=True, text=True, shell=True)
    if install_result.returncode != 0:
        print(f"Error installing Ollama: {install_result.stderr}")
        return False

    print("Ollama installation completed successfully!")
    return True


def start_ollama_server_nohup():
    """
    Start the Ollama server in the background using nohup for better persistence.
    Returns True if successful.
    """
    print("Starting Ollama server in background with nohup...")
    
    # Use nohup to ensure the process continues running even if the session disconnects
    result = subprocess.run(['nohup', 'ollama', 'serve', '>', 'ollama.log', '2>&1', '&'], 
                            shell=True, capture_output=True, text=True)
    
    # Alternative approach that's more reliable in Colab
    import os
    os.system("nohup ollama serve > ollama.log 2>&1 &")
    
    # Wait for the server to start
    time.sleep(5)
    print("Ollama server started with nohup!")
    print("Check status with: !cat ollama.log")
    
    return True


def start_ollama_server():
    """
    Start the Ollama server in the background using subprocess.
    Returns the subprocess object so it can be managed.
    """
    print("Starting Ollama server in background...")
    # Using preexec_fn=os.setsid to create a new process group
    ollama_process = subprocess.Popen(['ollama', 'serve'], 
                                      stdout=subprocess.DEVNULL, 
                                      stderr=subprocess.DEVNULL,
                                      preexec_fn=os.setsid)
    
    # Wait for the server to start
    time.sleep(5)
    print("Ollama server started!")
    
    return ollama_process


def pull_model_background(model_name):
    """
    Pull a model in the background.
    """
    print(f"Pulling model: {model_name}")
    result = subprocess.run(['ollama', 'pull', model_name], 
                            capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Successfully pulled model: {model_name}")
    else:
        print(f"Error pulling model {model_name}: {result.stderr}")


def pull_models_background(model_list):
    """
    Pull multiple models in the background using threads.
    """
    threads = []
    
    for model in model_list:
        thread = threading.Thread(target=pull_model_background, args=(model,))
        thread.daemon = True  # Dies when main process dies
        thread.start()
        threads.append(thread)
        print(f"Started pulling {model} in background...")
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    print("All model pulls completed!")


def pull_models_nohup(model_list):
    """
    Pull multiple models using nohup for better background execution.
    """
    for model in model_list:
        print(f"Starting to pull {model} with nohup...")
        # Run each pull in background using nohup
        os.system(f"nohup ollama pull {model} > pull_{model}.log 2>&1 &")
        print(f"Pulling {model} started in background, logs in pull_{model}.log")
        
    print("All model pulls started with nohup!")


def setup_ollama_with_models(model_list=['llama3', 'mistral'], use_nohup=True):
    """
    Complete Ollama setup: install, start server, and pull models.
    """
    # Install Ollama
    if not install_ollama():
        print("Failed to install Ollama, aborting setup.")
        return None

    # Start Ollama server
    if use_nohup:
        success = start_ollama_server_nohup()
        if not success:
            print("Failed to start Ollama with nohup, trying subprocess method...")
            ollama_process = start_ollama_server()
        else:
            print("Ollama server running with nohup!")
            return "nohup"  # Indicate that it's running via nohup
    else:
        ollama_process = start_ollama_server()
    
    # Pull models in background
    if use_nohup:
        pull_models_nohup(model_list)
    else:
        pull_models_background(model_list)
    
    print("Ollama setup complete with all models!")
    return ollama_process if not use_nohup else "nohup"


if __name__ == "__main__":
    # Example usage
    models_to_pull = ['llama3', 'mistral', 'codellama']
    result = setup_ollama_with_models(models_to_pull, use_nohup=True)
    
    if result:
        print("Ollama is running with models available.")
        print("You can now use Ollama for local LLM capabilities.")
        
        # Check status
        print("\nTo check Ollama status, run in a new cell:")
        print("!cat ollama.log")
        print("\nTo check if Ollama is running:")
        print("!ps aux | grep ollama")