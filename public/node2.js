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
    password: 'NNSXS.X6HDWOXDUDEUXX3AKILSSRIKFP3GPRP6TOYY5JY.5YF6JUO5LKPNXTYBNLB2FUYQK62JGHKERD5TX5DKPW47U5A4TGLQ'
};

const client = mqtt.connect(`mqtt://${mqttOptions.host}:${mqttOptions.port}`, mqttOptions);

client.on('connect', () => {
    console.log('Connected to TTN via MQTT');
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

client.on('message', (topic, message) => {
    console.log(`Message received on topic: ${topic}`);
    const ttnData = JSON.parse(message.toString());
    console.log('Raw message:', message.toString());
    console.log('Decoded message:', ttnData);

    if (ttnData.uplink_message) {
        const decodedPayload = atob(ttnData.uplink_message.frm_payload);
        console.log('Decoded payload:', decodedPayload);
    }

    if (ttnData.name === 'as.up.join.forward') {
        console.log('Join request or join accept received for device:', ttnData.identifiers[0].device_ids.device_id);
        io.emit('ttn-join-data', ttnData);
    } else {
        console.log('Other message type received');
        io.emit('ttn-data', ttnData);
    }
});

app.use(express.static('public'));

app.get('/data', (req, res) => {
    res.sendFile('/Users/abdelbadi/Desktop/IOT/IOT/public/index.html');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
