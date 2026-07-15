const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const robot = require('robotjs');
const sharp = require('sharp');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { 
    transports: ['websocket'],
    cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname, 'public')));

// Screen capture configuration
const SCREEN_WIDTH = robot.getScreenSize().width;
const SCREEN_HEIGHT = robot.getScreenSize().height;
const STREAM_FPS = 30; // Target frames per second

function captureAndStream() {
    try {
        // Capture raw screen pixels via robotjs
        const img = robot.screen.capture(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
        
        // Convert raw bitmap to JPEG using sharp for high-performance compression
        sharp(img.image, {
            raw: {
                width: img.width,
                height: img.height,
                channels: 4 // RGBA
            }
        })
        .jpeg({ quality: 60 }) // 60% quality balances speed and clarity perfectly
        .toBuffer()
        .then(buffer => {
            // Broadcast the compressed frame to all connected players
            io.emit('screen-frame', buffer.toString('base64'));
        })
        .catch(err => {});
    } catch (err) {}
}

// Stream the desktop continuously when players are connected
let streamInterval = null;
io.on('connection', (socket) => {
    console.log('🎮 Client linked to host controller pipeline.');
    
    if (!streamInterval) {
        streamInterval = setInterval(captureAndStream, 1000 / STREAM_FPS);
    }

    // Capture incoming input controls
    socket.on('mouse-move', (data) => {
        try {
            if (data && typeof data.x === 'number' && typeof data.y === 'number') {
                // Map coordinates from the remote browser back to host screen dimensions
                const hostX = data.x * SCREEN_WIDTH;
                const hostY = data.y * SCREEN_HEIGHT;
                robot.moveMouse(hostX, hostY);
            }
        } catch (err) {}
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

    socket.on('disconnect', () => {
        if (io.engine.clientsCount === 0) {
            clearInterval(streamInterval);
            streamInterval = null;
            console.log('🔌 No players left. Streaming paused.');
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`\n====================================================`);
    console.log(`🚀 EGU CLOUD GAMING ENGINE IS LIVE`);
    console.log(`🌐 Local Link: http://localhost:${PORT}`);
    console.log(`====================================================\n`);
});
