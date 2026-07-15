const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverLogic;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 400,
        height: 480,
        resizable: false,
        autoHideMenuBar: true,
        title: "EGU Controller Console",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

// Handle the explicit compilation routine safely when user clicks the button
ipcMain.on('run-setup', (event) => {
    console.log("Starting script installation phase...");
    
    // Command sequence to authorize permissions and force native module structural builds
    const command = 'npm install-scripts approve robotjs && npm install-scripts approve sharp && npm rebuild robotjs --build-from-source';
    
    exec(command, { cwd: __dirname }, (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            event.reply('setup-finished', { success: false, error: error.message });
            return;
        }
        
        // Dynamically import server logic once building operations complete safely
        try {
            serverLogic = require('./server.js');
            event.reply('setup-finished', { success: true });
        } catch (loadErr) {
            event.reply('setup-finished', { success: false, error: loadErr.message });
        }
    });
});

ipcMain.on('toggle-server', (event, targetState) => {
    if (!serverLogic) {
        event.reply('server-status', { running: false, error: "Setup must be run successfully first." });
        return;
    }

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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (serverLogic) serverLogic.stopServer();
    if (process.platform !== 'darwin') app.quit();
});
