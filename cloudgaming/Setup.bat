@echo off
cd /d "%~dp0"
echo 🧹 Cleaning out old module files...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del /f /q package-lock.json

echo 📦 Fetching clean Windows packages...
cmd /c npm install @lucyus/actionify@latest express socket.io

echo 🛠️ Compiling native Windows input drivers...
cmd /c npx actionify postinstall

echo --------------------------------------
echo ✅ Setup Complete! You can close this window and run run.bat now.
echo --------------------------------------
pause
