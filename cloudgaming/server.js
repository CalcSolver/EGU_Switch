const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
    transports: ['websocket'],
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

let activeServerInstance = null;

io.on('connection', (socket) => {
    console.log('🎮 Client linked to host controller.');

    socket.on('mouse-move', (data) => {
        try {
            if (data && typeof data.x === 'number' && typeof data.y === 'number') {
                robot.moveMouse(data.x, data.y);
            }
        } catch (err) { /* Silent fallback */ }
    });

    socket.on('mouse-click', () => {
        try { robot.mouseClick(); } catch (err) {}
    });

    socket.on('key-down', (data) => {
        try { if (data && data.key) robot.keyToggle(data.key.toLowerCase(), "down"); } catch (err) {}
    });

    socket.on('key-up', (data) => {
        try { if (data && data.key) robot.keyToggle(data.key.toLowerCase(), "up"); } catch (err) {}
    });
});

function startServer() {
    if (!activeServerInstance) {
        activeServerInstance = server.listen(3000, () => {
            console.log('Server active.');
        });
    }
}

function stopServer() {
    if (activeServerInstance) {
        activeServerInstance.close();
        activeServerInstance = null;
    }
}

module.exports = { startServer, stopServer };
