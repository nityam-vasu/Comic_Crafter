#!/bin/bash

# Comic Crafter Local Setup Script
# This script starts the Comic Crafter server with local Stable Diffusion model
# and Open Router for story generation

echo "==========================================="
echo "Comic Crafter Local Server Setup"
echo "==========================================="

# Check if virtual environment exists, if not create it
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r server/requirements.txt

# Check if OPENROUTER_API_KEY is set, if not prompt user
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "Please set your Open Router API key:"
    echo "Get your API key from: https://openrouter.ai/keys"
    read -p "Enter your Open Router API key: " OPENROUTER_API_KEY
    export OPENROUTER_API_KEY=$OPENROUTER_API_KEY
fi

echo "Starting Comic Crafter server..."
echo "Server will be available at: http://localhost:5000"

# Start the server
python server/app.py