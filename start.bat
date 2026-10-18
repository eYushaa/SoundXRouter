@echo off
title SoundX Router
color 0b

echo Starting SoundX Router...
echo.

if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe app.py
) else (
    python app.py
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The application crashed or closed unexpectedly.
    pause
)
