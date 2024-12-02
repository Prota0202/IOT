const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const socketio = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const mqttOptions = {
    clientId: 'unique-client-id',
    host: 'eu1.cloud.thethings.network',
    port: 1883,
    username: 'appli-groupea@ttn',
    password: 'NNSXS.X6HDWOXDUDEUXX3AKILSSRIKFP3GPRP6TOYY5JY.5YF6JUO5LKPNXTYBNLB2FUYQK62JGHKERD5TX5DKPW47U5A4TGLQ'
};

// Connexion au broker MQTT
const client = mqtt.connect(`mqtt://${mqttOptions.host}:${mqttOptions.port}`, mqttOptions);

client.on('connect', () => {
    console.log('Connected to TTN via MQTT');
    client.subscribe('v3/appli-groupea@ttn/devices/+/up', (err) => {
        if (err) {
            console.error('Subscription error:', err);
        } else {
            console.log('Subscribed to TTN device uplink topic');
        }
    });
});

client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});

// Exemple de poubelles avec état (plein ou non)
let trashBins = [
    { id: 1, location: [4.3525, 50.8467], isFull: false }, // Grand-Place
    { id: 2, location: [4.3416, 50.8949], isFull: true },  // Atomium
    { id: 3, location: [4.3925, 50.8419], isFull: false }, // Parc du Cinquantenaire
    { id: 4, location: [4.3497, 50.8449], isFull: true },  // Manneken Pis
    { id: 5, location: [4.3612, 50.8425], isFull: false }  // Palais Royal
];

client.on('message', (topic, message) => {
    console.log(`Message received on topic: ${topic}`);
    try {
        const ttnData = JSON.parse(message.toString());
        console.log('Decoded message:', ttnData);

        if (ttnData.uplink_message) {
            const decodedPayload = Buffer.from(ttnData.uplink_message.frm_payload, 'base64').toString('utf-8');
            console.log('Decoded payload:', decodedPayload);

            const gpsData = ttnData.uplink_message.locations ? ttnData.uplink_message.locations.user : null;
            const isFull = decodedPayload.includes('full'); // Exemple : "full" pour indiquer que la poubelle est pleine

            if (gpsData) {
                const updatedTrashBin = {
                    deviceId: ttnData.end_device_ids.device_id,
                    latitude: gpsData.latitude,
                    longitude: gpsData.longitude,
                    isFull
                };

                console.log('Updated trash bin data:', updatedTrashBin);

                // Mise à jour de l'état de la poubelle dans le tableau
                trashBins.forEach(bin => {
                    if (bin.id === updatedTrashBin.deviceId) {
                        bin.isFull = updatedTrashBin.isFull;
                    }
                });

                io.emit('trash-bin-data', trashBins); // Envoi des données mises à jour aux clients
            } else {
                console.warn('No GPS data found in the message.');
            }
        } else {
            console.warn('No uplink_message found in the message.');
        }
    } catch (err) {
        console.error('Error parsing message:', err);
    }
});

app.use(express.static('public'));

// Route pour servir l'interface utilisateur
app.get('/data', (req, res) => {
    res.sendFile('/Users/Samir/Desktop/IOT/public/index.html');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.emit('trash-bin-data', trashBins); // Envoi de la liste initiale des poubelles
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});
