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
    username: 'appli-groupea@ttn', // Ajouté pour clarté
    password: 'NNSXS.X6HDWOXDUDEUXX3AKILSSRIKFP3GPRP6TOYY5JY.5YF6JUO5LKPNXTYBNLB2FUYQK62JGHKERD5TX5DKPW47U5A4TGLQ'
};

// Connexion au broker MQTT
const client = mqtt.connect(`mqtt://${mqttOptions.host}:${mqttOptions.port}`, mqttOptions);

client.on('connect', () => {
    console.log('Connected to TTN via MQTT');
    // Abonnement au topic TTN pour recevoir les données des périphériques
    client.subscribe('v3/appli-groupea@ttn/devices/my-end-device/up', (err) => {
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

// Gestion des messages MQTT
client.on('message', (topic, message) => {
    console.log(`Message received on topic: ${topic}`);
    try {
        const ttnData = JSON.parse(message.toString());
        console.log('Decoded message:', ttnData);

        if (ttnData.uplink_message) {
            // Décodage du payload
            const decodedPayload = Buffer.from(ttnData.uplink_message.frm_payload, 'base64').toString('utf-8');
            console.log('Decoded payload:', decodedPayload);

            // Récupération des coordonnées GPS et du statut de la poubelle
            const gpsData = ttnData.uplink_message.locations ? ttnData.uplink_message.locations.user : null;
            const isFull = decodedPayload.includes('full'); // Exemple de statut basé sur le payload

            if (gpsData) {
                const trashBinData = {
                    deviceId: ttnData.end_device_ids.device_id,
                    latitude: gpsData.latitude,
                    longitude: gpsData.longitude,
                    isFull
                };
                console.log('Trash bin data:', trashBinData);

                // Émission des données GPS au client via Socket.io
                io.emit('gps-data', trashBinData);
            }
        }
    } catch (err) {
        console.error('Error parsing message:', err);
    }
});

// Configuration du serveur web
app.use(express.static('public'));

// Route pour servir l'interface utilisateur
app.get('/data', (req, res) => {
    res.sendFile('/Users/abdelbadi/Desktop/IOT/public/index.html');
});

// Lancement du serveur
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});