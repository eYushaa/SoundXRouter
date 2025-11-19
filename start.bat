@echo off
title SoundX Router
color 0b

echo Starting SoundX Router...
echo.

python app.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The application crashed or closed unexpectedly.
    pause
)
