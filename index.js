// index.js - Spotify token alıcı proxy (sp_dc gerekmez)

import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

// 1. Adım: client_token al
async function getClientToken() {
  const payload = {
    client_data: {
      client_version: '1.2.18.564.g83d531e5',
      client_id: 'd8a5ed958d274c2e8ee717e6a4b0971d',
      js_sdk_data: {
        device_brand: 'unknown',
        device_model: 'unknown',
        os: 'windows',
        os_version: 'NT 10.0',
        device_id: uuidv4(),
        device_type: 'computer',
      },
    },
  };

  const headers = {
    'Content-Type': 'application/json',
    'Origin': 'https://open.spotify.com',
    'Referer': 'https://open.spotify.com/',
    'accept-language': 'en',
  };

  const response = await axios.post(
    'https://clienttoken.spotify.com/v1/clienttoken',
    payload,
    { headers }
  );

  return response.data?.granted_token?.token;
}

// 2. Adım: bearer token al (client_token ile)
async function getAccessToken(clientToken) {
  const headers = {
    'Client-Token': clientToken,
    'App-Platform': 'WebPlayer',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'Accept': 'application/json',
  };

  const response = await axios.get(
    'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
    { headers }
  );

  return response.data?.accessToken;
}

// Proxy endpoint: Bearer token döner
app.get('/get-token', async (req, res) => {
  try {
    const clientToken = await getClientToken();
    if (!clientToken) {
      return res.status(500).json({ error: 'Spotify client_token alınamadı' });
    }

    const bearer = await getAccessToken(clientToken);
    if (!bearer) {
      return res.status(500).json({ error: 'Spotify bearer token alınamadı' });
    }

    console.log('✅ Bearer alındı:', bearer.slice(0, 50) + '...');
    res.json({ bearer });
  } catch (err) {
    console.error('❌ Hata:', err.message);
    res.status(500).json({ error: 'Token alma başarısız', detail: err.message });
  }
});

// Server başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy servisi çalışıyor: http://localhost:${PORT}`);
});
