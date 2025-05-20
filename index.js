import express from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(express.json());

app.get('/get-token', async (req, res) => {
  try {
    const clientPayload = {
      client_data: {
        client_version: '1.2.18.564.g83d531e5',
        client_id: 'd8a5ed958d274c2e8ee717e6a4b0971d',
        js_sdk_data: {
          device_brand: 'unknown',
          device_model: 'unknown',
          os: 'windows',
          os_version: 'NT 10.0',
          device_id: uuidv4(),
          device_type: 'computer'
        }
      }
    };

    const clientResp = await axios.post(
      'https://clienttoken.spotify.com/v1/clienttoken',
      clientPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://open.spotify.com',
          'Referer': 'https://open.spotify.com/'
        }
      }
    );

    console.log("📥 clientResp.data:", JSON.stringify(clientResp.data, null, 2));

    const clientToken = clientResp.data?.granted_token?.token;

    if (!clientToken) {
      return res.status(500).json({ error: "Spotify client_token alınamadı", raw: clientResp.data });
    }

    const accessResp = await axios.get(
      'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
      {
        headers: {
          'Client-Token': clientToken,
          'App-Platform': 'WebPlayer',
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json'
        }
      }
    );

    const bearer = accessResp.data.accessToken;

    if (!bearer) {
      return res.status(500).json({ error: 'Token alınamadı' });
    }

    console.log('✅ Bearer alındı:', bearer.slice(0, 40) + '...');
    return res.json({ bearer });

  } catch (e) {
    if (e.response) {
      console.log('🔴 Spotify hata cevabı:', e.response.status, e.response.data);
      return res.status(500).json({ error: 'Spotify cevabı hata verdi', detail: e.response.data });
    } else {
      console.log('❌ Hata:', e.message);
      return res.status(500).json({ error: 'İstek başarısız', detail: e.message });
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Spotify mobile proxy ayakta: http://localhost:${PORT}`);
});
