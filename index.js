import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

let cachedTokens = null;
let lastFetched = 0;
const TOKEN_EXPIRY_MS = 55 * 60 * 1000; // 55 dakika cache

async function fetchTokens() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--single-process',
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();

  const cookiesString = await fs.promises.readFile('./cookies.json', 'utf8');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  let accessToken = null;
  let clientToken = null;

  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (url.includes('get_access_token')) {
        const json = await response.json();
        accessToken = json.accessToken || accessToken;
      }
      if (url.includes('clienttoken.spotify.com/v1/clienttoken')) {
        const json = await response.json();
        clientToken = json.granted_token?.token || clientToken;
      }
    } catch (e) {
      // JSON parse hatalarını yoksay
    }
  });

  // İlgili Spotify parça sayfasına git (tokenlar burada tetikleniyor)
  await page.goto('https://open.spotify.com/track/6GyFP1nfCDB8lbD2bG0Hq9?si=f4fa63ba2f0c4b20', { waitUntil: 'networkidle2' });

  // Eğer clientToken yakalanmadıysa manuel fetch yap
  if (!clientToken) {
    clientToken = await page.evaluate(async () => {
      const res = await fetch('https://clienttoken.spotify.com/v1/clienttoken', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://open.spotify.com',
          'Referer': 'https://open.spotify.com/',
        },
        body: JSON.stringify({
          client_data: {
            client_version: "1.2.18.564.g83d531e5",
            client_id: "d8a5ed958d274c2e8ee717e6a4b0971d",
            js_sdk_data: {
              device_brand: "unknown",
              device_model: "unknown",
              os: "windows",
              os_version: "NT 10.0",
              device_id: "puppeteer_generated",
              device_type: "computer"
            }
          }
        }),
      });
      const data = await res.json();
      return data.granted_token?.token || null;
    });
  }

  await browser.close();

  if (!accessToken || !clientToken) {
    throw new Error('Tokenlar alınamadı');
  }

  return { accessToken, clientToken };
}

app.get('/tokens', async (req, res) => {
  const now = Date.now();

  if (!cachedTokens || (now - lastFetched) > TOKEN_EXPIRY_MS) {
    try {
      cachedTokens = await fetchTokens();
      lastFetched = now;
    } catch (err) {
      return res.status(500).json({ error: 'Token fetch error', details: err.message });
    }
  }
  res.json(cachedTokens);
});

app.listen(PORT, () => console.log(`Token server listening on port ${PORT}`));
