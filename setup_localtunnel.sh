#!/bin/bash

# Comic Crafter LocalTunnel Setup Script
# This script helps set up the Comic Crafter application with LocalTunnel
# for exposing services in Google Colab or other environments

set -e  # Exit on any error

echo "Comic Crafter LocalTunnel Setup"
echo "==============================="

# Function to install localtunnel
install_localtunnel() {
    echo "Installing localtunnel..."
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        echo "npm not found. Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # Install localtunnel globally
    npm install -g localtunnel
    
    if [ $? -eq 0 ]; then
        echo "✓ LocalTunnel installed successfully!"
    else
        echo "✗ Failed to install localtunnel"
        exit 1
    fi
}

# Function to start the backend server
start_backend() {
    PORT=${1:-5000}
    
    echo "Starting backend server on port $PORT..."
    
    # Start the server in background and redirect output to log file
    cd server
    python app.py > server.log 2>&1 &
    SERVER_PID=$!
    cd ..
    
    # Wait for server to start
    echo "Waiting for server to start..."
    sleep 5
    
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "✓ Backend server started with PID $SERVER_PID"
        echo "Server logs can be viewed with: tail -f server/server.log"
    else
        echo "✗ Failed to start backend server"
        exit 1
    fi
    
    # Return server PID for cleanup
    echo $SERVER_PID
}

# Function to start localtunnel
start_localtunnel() {
    PORT=${1:-5000}
    
    echo "Starting localtunnel for port $PORT..."
    echo "Your public URL will appear below:"
    echo ""
    
    # Start localtunnel - this will block and show the URL
    lt --port $PORT
}

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --install     Install localtunnel only"
    echo "  --start       Start backend server only" 
    echo "  --tunnel      Start localtunnel only"
    echo "  --all         Install, start server, and create tunnel (default)"
    echo "  --port PORT   Specify port to use (default: 5000)"
    echo "  -h, --help    Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                      # Full setup (default)"
    echo "  $0 --port 8080         # Use port 8080"
    echo "  $0 --install           # Install localtunnel only"
}

# Main script logic
PORT=5000
ACTION="all"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --install)
            ACTION="install"
            shift
            ;;
        --start)
            ACTION="start"
            shift
            ;;
        --tunnel)
            ACTION="tunnel"
            shift
            ;;
        --all)
            ACTION="all"
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Execute requested action
case $ACTION in
    install)
        install_localtunnel
        ;;
    start)
        start_backend $PORT
        ;;
    tunnel)
        start_localtunnel $PORT
        ;;
    all)
        install_localtunnel
        SERVER_PID=$(start_backend $PORT)
        echo "Server PID: $SERVER_PID"
        echo ""
        echo "Starting localtunnel..."
        echo "Make sure to note the public URL that will be displayed below:"
        echo ""
        start_localtunnel $PORT
        ;;
esac

echo ""
echo "Setup completed!"