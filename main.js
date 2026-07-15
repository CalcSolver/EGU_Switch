const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const serverLogic = require('./server.js');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 420,
        height: 460,
        resizable: false,
        frame: true, // Standard window controls
        autoHideMenuBar: true, // Hides the ugly File/Edit menu
        title: "EGU Controller Engine",
        backgroundColor: "#0f172a",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Receive control commands from index.html UI
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

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    serverLogic.stopServer();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
