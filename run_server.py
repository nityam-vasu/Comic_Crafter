import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
env_file = os.path.join(os.path.dirname(__file__), '.env')
if os.path.exists(env_file):
    load_dotenv(env_file)

# Add the current directory to the path
sys.path.append(os.path.dirname(__file__))

def main():
    """Main function to start the Comic Crafter server."""
    print("Starting Comic Crafter Local Server...")
    
    # Check if Open Router API key is set
    if not os.getenv('OPENROUTER_API_KEY') or os.getenv('OPENROUTER_API_KEY') == 'your-openrouter-api-key-here':
        print("⚠️  Warning: OPENROUTER_API_KEY is not set or is using the default placeholder value.")
        print("Please set your Open Router API key in the environment variables.")
        print("Get your API key from: https://openrouter.ai/keys")
        api_key = input("Enter your Open Router API key (or press Enter to continue anyway): ").strip()
        if api_key:
            os.environ['OPENROUTER_API_KEY'] = api_key
    
    print("Loading models...")
    print("This may take a few moments on the first run...")
    
    # Import and run the server
    try:
        from server.app import load_model, app
        
        # Load the model on startup
        load_model()
        
        # Get port and host from environment variables
        port = int(os.getenv('SD_API_PORT', 5000))
        host = os.getenv('SD_API_HOST', '0.0.0.0')
        
        print(f"✅ Server is ready! Access it at: http://localhost:{port}")
        print("Press Ctrl+C to stop the server")
        
        # Run the Flask app
        app.run(host=host, port=port, debug=False)
        
    except ImportError as e:
        print(f"❌ Error importing server: {e}")
        print("Make sure you have installed the required dependencies:")
        print("pip install -r requirements.txt")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()