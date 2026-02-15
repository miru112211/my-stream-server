const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Tempat menyimpan HP yang aktif [ID -> Socket]
const activePhones = new Map();

app.use(express.static(path.join(__dirname, 'public')));

// 1. Menangkap Koneksi WebSocket
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const phoneId = url.searchParams.get('id');

    if (url.pathname === '/phone' && phoneId) {
        activePhones.set(phoneId, ws);
        console.log(`HP Terhubung: ${phoneId}`);

        ws.on('close', () => {
            activePhones.delete(phoneId);
            console.log(`HP Terputus: ${phoneId}`);
        });
    }
});

// 2. API untuk mendapatkan daftar HP yang sedang online
app.get('/list-phones', (req, res) => {
    res.json(Array.from(activePhones.keys()));
});

// 3. API untuk kirim perintah (START/STOP) ke ID tertentu
app.get('/control/:cmd', (req, res) => {
    const command = req.params.cmd.toUpperCase();
    const targetId = req.query.id;
    const targetSocket = activePhones.get(targetId);

    if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(command);
        res.send(`Perintah ${command} berhasil dikirim ke ${targetId}`);
    } else {
        res.status(404).send("HP tidak ditemukan atau sudah offline.");
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));