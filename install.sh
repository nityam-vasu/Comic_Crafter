#!/bin/bash

# Installation script for Comic Crafter Local

echo "==========================================="
echo "Installing Comic Crafter Local Dependencies"
echo "==========================================="

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

# Check if pip is available
if ! command -v pip &> /dev/null; then
    echo "❌ pip is not installed. Please install pip."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo "==========================================="
echo "Installation complete!"
echo "==========================================="
echo ""
echo "To run the server:"
echo "1. Make sure your Open Router API key is set:"
echo "   export OPENROUTER_API_KEY='your-api-key-here'"
echo "2. Run: python run_server.py"
echo ""
echo "Or use the start script: ./start_server.sh"