@echo off
REM Comic Crafter Local Setup Script for Windows

echo ===========================================
echo Comic Crafter Local Server Setup (Windows)
echo ===========================================

REM Check if virtual environment exists, if not create it
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r server\requirements.txt

REM Check if OPENROUTER_API_KEY is set
if "%OPENROUTER_API_KEY%"=="" (
    echo Please set your Open Router API key:
    echo Get your API key from: https://openrouter.ai/keys
    set /p OPENROUTER_API_KEY="Enter your Open Router API key: "
    set OPENROUTER_API_KEY=%OPENROUTER_API_KEY%
)

echo Starting Comic Crafter server...
echo Server will be available at: http://localhost:5000

REM Start the server
python server\app.py

pause