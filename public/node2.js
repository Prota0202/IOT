const express = require('express');
const mqtt = require('mqtt');
const http = require('http');
const socketio = require('socket.io');

// Configuration de l'application et des serveurs


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const mqttOptions = {
    host: 'eu1.cloud.thethings.network',
    port: 1883,
    username: 'appli-groupea@ttn',
    password: 'NNSXS.X6HDWOXDUDEUXX3AKILSSRIKFP3GPRP6TOYY5JY.5YF6JUO5LKPNXTYBNLB2FUYQK62JGHKERD5TX5DKPW47U5A4TGLQ'
};

// Connexion au broker MQTT
console.log('Tentative de connexion au broker MQTT...');
const client = mqtt.connect(`mqtt://${mqttOptions.host}:${mqttOptions.port}`, mqttOptions);

client.on('connect', () => {
    console.log('✅ Connecté à TTN via MQTT');
    console.log('Souscription au topic des dispositifs TTN...');
    client.subscribe('v3/appli-groupea@ttn/devices/+/up', (err) => {
        if (err) {
            console.error('❌ Erreur de souscription au topic:', err);
        } else {
            console.log('✅ Souscrit avec succès au topic des dispositifs TTN');
        }
    });
});

client.on('error', (err) => {
    console.error('❌ Erreur lors de la connexion au broker MQTT:', err);
});

let trashBins = []; // Stockage des données des poubelles

// Gestion des messages reçus depuis TTN
client.on('message', (topic, message) => {
    console.log(`📩 Message reçu sur le topic "${topic}"`);
    try {
        const ttnData = JSON.parse(message.toString());
        console.log('✅ Données JSON reçues:', JSON.stringify(ttnData, null, 2));

        if (ttnData.uplink_message) {
            console.log('ℹ️ Traitement du payload uplink_message...');
            
            const decodedPayload = ttnData.uplink_message.decoded_payload;
            if (!decodedPayload) {
                console.warn('⚠️ Aucune donnée décodée trouvée.');
                return;
            }

            console.log('✅ Payload décodé:', decodedPayload);

            // Vérification de l'état de la poubelle
            const isFull = decodedPayload.status === 'pleine';
            console.log(`ℹ️ État de la poubelle: ${isFull ? 'Pleine' : 'Vide'}`);

            // Récupération des coordonnées GPS
            const gpsData = decodedPayload.gps;
            if (gpsData) {
                console.log('✅ Coordonnées GPS trouvées:', gpsData);
                const updatedBin = {
                    id: ttnData.end_device_ids.device_id, // ID unique de la poubelle
                    location: [gpsData.longitude, gpsData.latitude], // Coordonnées GPS
                    isFull // État de la poubelle
                };

                // Mise à jour ou ajout de la poubelle dans la liste
                const existingBinIndex = trashBins.findIndex(bin => bin.id === updatedBin.id);
                if (existingBinIndex >= 0) {
                    trashBins[existingBinIndex] = updatedBin;
                    console.log('ℹ️ Poubelle mise à jour:', updatedBin);
                } else {
                    trashBins.push(updatedBin);
                    console.log('ℹ️ Nouvelle poubelle ajoutée:', updatedBin);
                }

                // Logs de la liste complète
                console.log('📤 Liste complète des poubelles (trashBins):', trashBins);

                // Envoi des données mises à jour aux clients via Socket.io
                console.log('📤 Envoi des données mises à jour aux clients...');
                io.emit('trash-bin-data', trashBins);
            } else {
                console.warn('⚠️ Aucune donnée GPS trouvée dans le message.');
            }
        } else {
            console.warn('⚠️ Aucune donnée "uplink_message" trouvée dans le message.');
        }
    } catch (err) {
        console.error('❌ Erreur lors du traitement des données MQTT:', err);
    }
});

// Middleware pour servir les fichiers statiques
app.use(express.static('public'));

// Route principale pour servir index.html
app.get('/', (req, res) => {
    res.sendFile('/Users/Samir/Desktop/IOT/public/index.html');
});

// Lancement du serveur
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
    console.log('🟢 Nouveau client connecté');
    console.log('📤 Envoi des données initiales au client...');
    socket.emit('trash-bin-data', trashBins);

    socket.on('disconnect', () => {
        console.log('🔴 Client déconnecté');
    });

});

