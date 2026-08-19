@echo off
set APP_NAME=AgentStudio
title %APP_NAME% - Local Python Launcher
cd /d "%~dp0"

echo ================================================================
echo           %APP_NAME% - Local Environment
echo ================================================================
echo.

echo [*] Onceki calisan oturumlar kontrol ediliyor...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000"') do (
    echo [*] Eski oturum sonlandiriliyor [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
)

echo [*] %APP_NAME% masaustu uygulamasi baslatiliyor...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\launcher.ps1"

if %ERRORLEVEL% NEQ 0 (
    pause
)
