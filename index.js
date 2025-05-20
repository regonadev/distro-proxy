const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

app.post('/get-token', async (req, res) => {
  const { sp_dc } = req.body;
  if (!sp_dc) return res.status(400).json({ error: "sp_dc is required" });

  try {
    const r = await axios.get(
      "https://open.spotify.com/get_access_token?reason=transport&productType=web_player",
      {
        headers: {
          Cookie: `sp_dc=${sp_dc}`,
          "User-Agent": "Mozilla/5.0",
          Accept: "application/json"
        }
      }
    );
    return res.json({ bearer: r.data.accessToken });
  } catch (e) {
    return res.status(500).json({ error: "Token fetch failed", detail: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Spotify proxy running on port ${port}`));
