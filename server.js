    // server.js
    const express = require('express');
    const http = require('http');
    const WebSocket = require('ws');
    const path = require('path');

    const app = express();
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server });

    let deviceSocket = null; // Variabel untuk menyimpan koneksi dari ponsel Android

    // Sajikan halaman web untuk viewer
    app.use(express.static(path.join(__dirname, 'public')));

    wss.on('connection', (ws, req) => {
        // Bedakan antara device dan viewer berdasarkan URL koneksi
        if (req.url === '/device') {
            console.log('Android device connected!');
            deviceSocket = ws; // Simpan koneksi device

            ws.on('close', () => {
                console.log('Android device disconnected.');
                deviceSocket = null;
            });

        } else { // Ini adalah koneksi dari viewer (browser)
            console.log('Viewer connected!');
        }

        // Tangani pesan yang masuk
        ws.on('message', message => {
            // Jika pesan datang dari device, teruskan ke semua viewer
            if (ws === deviceSocket) {
                wss.clients.forEach(client => {
                    if (client !== deviceSocket && client.readyState === WebSocket.OPEN) {
                        client.send(message); // Mengirim frame video ke viewer
                    }
                });
            }
        });
    });

    // Buat endpoint HTTP sederhana untuk mengirim perintah
    app.post('/command/:action', (req, res) => {
        const { action } = req.params;

        if (!deviceSocket) {
            return res.status(404).send('Device not connected.');
        }

        if (action === 'start' || action === 'stop') {
            console.log(`Sending command to device: ${action.toUpperCase()}_STREAMING`);
            // Kirim pesan perintah ke ponsel Android melalui WebSocket
            deviceSocket.send(`${action.toUpperCase()}_STREAMING`);
            res.status(200).send(`Command '${action}' sent to device.`);
        } else {
            res.status(400).send('Invalid action.');
        }
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
    