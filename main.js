const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

// --- INTEGRATED DEPENDENCY RESOLVER ---
function autoRebuildNativeModules() {
    const robotjsBinary = path.join(__dirname, 'node_modules', 'robotjs', 'build', 'Release', 'robotjs.node');
    
    if (!fs.existsSync(robotjsBinary)) {
        console.log("⚙️ Native binary missing. Preparing offline compiler installation...");
        try {
            // Unblock scripts so robotjs & sharp can build
            execSync('npm install-scripts approve robotjs', { stdio: 'inherit' });
            execSync('npm install-scripts approve sharp', { stdio: 'inherit' });
            
            console.log("🔨 Compiling robotjs directly onto local computer environment...");
            execSync('npm rebuild robotjs --build-from-source', { stdio: 'inherit' });
            console.log("🎉 robotjs compiled successfully!");
        } catch (error) {
            console.error("❌ Critical compilation error. Ensure C++ compilers are installed.", error.message);
        }
    } else {
        console.log("✅ robotjs binaries found!");
    }
}

// Check native bindings prior to initializing server logic or GUI
autoRebuildNativeModules();

const serverLogic = require('./server.js');
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 380,
        height: 250,
        resizable: false,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        title: "EGU Host Manager",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('control.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

// Event Listeners interacting with control.html toggles
ipcMain.on('toggle-server', (event, targetState) => {
    if (targetState === 'on') {
        try {
            serverLogic.startServer();
            event.reply('server-status', { running: true, error: null });
        } catch (err) {
            event.reply('server-status', { running: false, error: err.message });
        }
    } else {
        serverLogic.stopServer();
        event.reply('server-status', { running: false, error: null });
    }
});

app.on('window-all-closed', () => {
    serverLogic.stopServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
