@echo off
title SoundX Router Installer
color 0b

echo ==========================================
echo       SoundX Router Installer
echo ==========================================
echo.

:: Python Check
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install Python 3.10 or higher and ensure it is added to PATH.
    echo Download Link: https://www.python.org/downloads/
    pause
    exit /b
)

echo [INFO] Python detected.
echo.

:: requirements.txt Check
if not exist requirements.txt (
    echo [ERROR] requirements.txt not found!
    echo Please ensure the file exists in this directory.
    pause
    exit /b
)

:: Installing Libraries
echo [INFO] Installing required libraries...
pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo [ERROR] An error occurred during installation.
    pause
    exit /b
)

echo.
echo ==========================================
echo [SUCCESS] Installation complete!
echo ==========================================
echo.
echo You can start the application using the following command:
echo python app.py
echo.
pause
