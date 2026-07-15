const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ['websocket']
});
const robot = require('robotjs');
const { spawn } = require('child_process');
const path = require('path'); // Built-in helper for universal paths

// DYNAMIC PATH: Works on any computer, any username
app.use(express.static(path.join(__dirname, 'public')));

let streamingProcess = null;
robot.setMouseDelay(0);

function startStreaming() {
    if (streamingProcess) return;

    console.log('🚀 Detecting OS and launching Hardware Mirror...');
    
    // Detects if the host is a Mac or a Windows PC
    const isMac = process.platform === 'darwin';

    if (isMac) {
        // macOS screen capture engine (AVFoundation)
        streamingProcess = spawn('ffmpeg', [
            '-f', 'avfoundation',
            '-framerate', '30',
            '-i', '1:none', // Captures primary screen, no audio
            '-f', 'mjpeg',
            '-q:v', '6',
            '-'
        ]);
    } else {
        // Windows screen capture engine (GDIGrab)
        streamingProcess = spawn('ffmpeg', [
            '-f', 'gdigrab',
            '-framerate', '30',
            '-i', 'desktop',
            '-f', 'mjpeg',
            '-q:v', '6',
            '-an',
            '-'
        ]);
    }

    let buffer = Buffer.alloc(0);

    streamingProcess.stdout.on('data', (data) => {
        buffer = Buffer.concat([buffer, data]);
        let startIndex = buffer.indexOf(Buffer.from([0xff, 0xd8]));
        let endIndex = buffer.indexOf(Buffer.from([0xff, 0xd9]));

        while (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            const frame = buffer.slice(startIndex, endIndex + 2);
            io.volatile.emit('screen-frame', frame); 

            buffer = buffer.slice(endIndex + 2);
            startIndex = buffer.indexOf(Buffer.from([0xff, 0xd8]));
            endIndex = buffer.indexOf(Buffer.from([0xff, 0xd9]));
        }
    });
}

function stopStreaming() {
    if (streamingProcess) {
        streamingProcess.kill();
        streamingProcess = null;
        console.log('🛑 Stream Idle');
    }
}

io.on('connection', (socket) => {
    console.log('⚡ Client connected to universal pipeline');
    startStreaming();

    socket.on('mouse-move', (data) => {
        try { 
            // DYNAMIC RESOLUTION: Automatically grabs host monitor size
            const screenSize = robot.getScreenSize();
            const targetX = Math.round((data.x / 1920) * screenSize.width);
            const targetY = Math.round((data.y / 1080) * screenSize.height);
            robot.moveMouse(targetX, targetY); 
        } catch (e) {}
    });
    
    socket.on('mouse-click', () => {
        try { robot.mouseClick(); } catch (e) {}
    });
    
    // ... (Keep the rest of your standard key-down and key-up event listeners here) ...

    socket.on('disconnect', () => {
        if (io.engine.clientsCount === 0) stopStreaming();
    });
});

http.listen(3000, () => {
    console.log('⚡ Universal Server Live on Port 3000');
});
