import express from 'express';
import puppeteer from 'puppeteer';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 3000;

let cachedTokens = null;
let lastFetched = 0;
const TOKEN_EXPIRY_MS = 55 * 60 * 1000;

async function fetchTokens() {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  const cookiesString = await fs.readFile('./cookies.json', 'utf8');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);

  let accessToken = null;
  let clientToken = null;

  page.on('response', async (response) => {
    const url = response.url();
    try {
      if (url.includes('get_access_token')) {
        const json = await response.json();
        accessToken = json.accessToken;
      }
      if (url.includes('clienttoken.spotify.com/v1/clienttoken')) {
        const json = await response.json();
        clientToken = json.granted_token?.token || null;
      }
    } catch (e) {}
  });

  await page.goto('https://open.spotify.com/track/6GyFP1nfCDB8lbD2bG0Hq9?si=f4fa63ba2f0c4b20', {
    waitUntil: 'networkidle2'
  });

  await browser.close();

  if (!accessToken || !clientToken) {
    throw new Error('Tokenlar alınamadı');
  }

  return { accessToken, clientToken };
}

app.get('/tokens', async (req, res) => {
  const now = Date.now();
  if (!cachedTokens || now - lastFetched > TOKEN_EXPIRY_MS) {
    try {
      cachedTokens = await fetchTokens();
      lastFetched = now;
    } catch (err) {
      return res.status(500).json({ error: 'Token fetch error', details: err.message });
    }
  }
  res.json(cachedTokens);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
