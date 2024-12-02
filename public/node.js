const axios = require('axios');
const atob = require('atob'); 

const API_URL = "https://eu1.cloud.thethings.network/api/v3/as/applications/appli-groupea/packages/storage/uplink_message";
const API_KEY = "NNSXS.X6HDWOXDUDEUXX3AKILSSRIKFP3GPRP6TOYY5JY.5YF6JUO5LKPNXTYBNLB2FUYQK62JGHKERD5TX5DKPW47U5A4TGLQ";

async function fetchData() {
    try {
        const response = await axios.get(API_URL, {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
            },
        });

        console.log("Réponse brute de l'API :", response.data);

        if (response.data.result && response.data.result.length > 0) {
            const formattedData = response.data.result.map(item => ({
                dev_id: item.end_device_ids.device_id,
                frm_payload: atob(item.uplink_message.frm_payload), 
            }));

            console.log("Données formatées :", formattedData);

            return formattedData;
        } else {
            console.log("Aucune donnée trouvée dans la réponse.");
            return [];
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error.response?.data || error.message);
        return [];
    }
}

const express = require('express');
const app = express();

app.get('/data', async (req, res) => {
    const data = await fetchData();
    res.json(data); 
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

