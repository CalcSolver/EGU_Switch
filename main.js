const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// --- AUTO-SETUP BINARY CHECK ---
function verifyNativeBinaries() {
    const robotjsBinary = path.join(__dirname, 'node_modules', 'robotjs', 'build', 'Release', 'robotjs.node');
    if (!fs.existsSync(robotjsBinary)) {
        console.log("⚠️ Missing native dependencies! Running automated rebuild...");
        try {
            // Instantly unblocks scripts and compiles them directly inside node_modules
            execSync('npm install-scripts approve robotjs', { stdio: 'inherit' });
            execSync('npm install-scripts approve sharp', { stdio: 'inherit' });
            execSync('npm rebuild robotjs --build-from-source', { stdio: 'inherit' });
            console.log("✅ Rebuild complete!");
        } catch (error) {
            console.error("❌ Auto-rebuild failed. Make sure you have build tools installed:", error);
        }
    }
}

// Run the verification check before doing anything else
verifyNativeBinaries();

// Now safely load our server logic
const serverLogic = require('./server.js');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 250,
        resizable: false,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the control panel UI
    mainWindow.loadFile('control.html');
}

app.whenReady().then(createWindow);

// Handle toggle commands from the UI
ipcMain.on('toggle-server', (event, targetState) => {
    if (targetState === 'on') {
        serverLogic.startServer();
        event.reply('server-status', { running: true, link: 'http://localhost:3000' });
    } else {
        serverLogic.stopServer();
        event.reply('server-status', { running: false });
    }
});

app.on('window-all-closed', () => {
    serverLogic.stopServer();
    app.quit();
});
