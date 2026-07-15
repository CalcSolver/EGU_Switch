@echo off
title EGU_Switch Automated Installer
cls
echo ====================================================================
echo 🎮 WELCOME TO THE EGU_SWITCH AUTOMATED SETUP 🎮
echo ====================================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel%==0 (
    echo ✅ Node.js is already installed!
) else (
    echo ❌ Node.js was NOT found on your system.
    echo 🔗 Opening the official Node.js download page...
    start https://nodejs.org/
    echo Please download and install the LTS version, then restart this script.
    pause
    exit
)

echo.
echo ⏳ Installing dependencies (express, robotjs, sharp, socket.io)...
call npm install
echo ✅ Dependencies installed successfully!

echo.
echo 🎥 Checking for FFmpeg video engine...
where ffmpeg >nul 2>nul
if %errorlevel%==0 (
    echo ✅ FFmpeg is ready to go!
) else (
    echo ⚠️ FFmpeg is missing. Attempting automatic installation...
    winget install Gyan.FFmpeg
    echo.
    echo Please CLOSE this window and run Setup.bat again to refresh your system paths!
    pause
    exit
)

echo.
echo ====================================================================
echo 🎉 ALL SYSTEM CHECKS PASSED!
echo ====================================================================
echo.
echo 👉 To START the server: type 'npm start' or 'node server.js'
echo 👉 To STOP the server at any time: Press [Ctrl + C]
echo 👉 To UPDATE later: type 'npm run update'
echo.
pause
