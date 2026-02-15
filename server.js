const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let phoneConnection = null;

wss.on('connection', (ws, req) => {
    // Gunakan URL untuk membedakan peran
    if (req.url === '/phone') {
        console.log("HP Terhubung!");
        phoneConnection = ws;
    }

    ws.on('message', (data) => {
        // Jika data dari HP, kirim ke semua viewer di browser
        if (ws === phoneConnection) {
            wss.clients.forEach(client => {
                if (client !== phoneConnection && client.readyState === 1) {
                    client.send(data); // Teruskan data video mentah
                }
            });
        }
    });
});

// Endpoint untuk mengirim perintah START/STOP melalui HTTP
app.get('/control/:cmd', (req, res) => {
    const command = req.params.cmd.toUpperCase(); // START atau STOP
    if (phoneConnection) {
        phoneConnection.send(command); // Kirim perintah ke HP lewat WebSocket
        res.send(`Perintah ${command} dikirim!`);
    } else {
        res.status(404).send("HP tidak online.");
    }
});

server.listen(process.env.PORT || 3000, () => console.log("Server Ready!"));