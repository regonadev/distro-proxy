const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/get-token', async (req, res) => {
  const { sp_dc } = req.body;

  console.log("📩 Gelen sp_dc:", sp_dc || "(boş)");

  if (!sp_dc) {
    return res.status(400).json({ error: "sp_dc is required" });
  }

  try {
    const tokenRes = await axios.get(
      "https://open.spotify.com/get_access_token?reason=transport&productType=web_player",
      {
        headers: {
          Cookie: `sp_dc=${sp_dc}`,
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept": "application/json",
          "Accept-Language": "en",
          "App-Platform": "WebPlayer"
        }
      }
    );

    const bearer = tokenRes.data.accessToken;

    if (!bearer) {
      console.log("❌ Bearer alınamadı, token null.");
      return res.status(500).json({ error: "Spotify token is null" });
    }

    console.log("✅ Bearer Token:", bearer.slice(0, 40) + "...");

    return res.json({ bearer });

  } catch (err) {
    console.log("❌ Spotify token alma hatası:", err.message);
    if (err.response) {
      console.log("🔎 Response status:", err.response.status);
      console.log("🔎 Response body:", err.response.data);
      return res.status(err.response.status).json({
        error: "Spotify response error",
        detail: err.response.data
      });
    } else {
      return res.status(500).json({ error: "Unknown error", message: err.message });
    }
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Spotify proxy running on port ${port}`);
});
