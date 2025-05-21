// spotify_gid_scraper.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import extract from 'extract-zip';
import { createReadStream, createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cookiesPath = './cookies.json';
const trackId = '7JhuMcs6o0cloamT1T4OXn';
const url = `https://open.spotify.com/track/${trackId}`;

async function uncrx(crxPath, outputZipPath) {
  const fd = await fs.open(crxPath, 'r');
  const header = Buffer.alloc(16);
  await fd.read(header, 0, 16, 0);

  const magicNumber = header.readUInt32LE(0);
  if (magicNumber !== 0x34327243) {
    throw new Error(`${crxPath} geçerli bir CRX dosyası değil`);
  }

  const headerSize = header.readUInt32LE(8);
  const zipStartOffset = 16 + headerSize;
  const stats = await fd.stat();
  const zipSize = stats.size - zipStartOffset;

  await fd.close();

  const input = createReadStream(crxPath, { start: zipStartOffset });
  const output = createWriteStream(outputZipPath);
  return new Promise((resolve, reject) => {
    input.pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

async function extractExtensions() {
  const unpackedDir = resolve(__dirname, './extensions/unpacked'); // değiştirildi
  const subdirs = await fs.readdir(unpackedDir, { withFileTypes: true });
  return subdirs
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(unpackedDir, entry.name));
}


async function scrapeTrackMetadata() {
  console.log('🌐 Sayfa açılıyor...');
  const extensionPaths = await extractExtensions();

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
args: [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-features=SameSiteByDefaultCookies,CookiesWithoutSameSiteMustBeSecure',
  '--autoplay-policy=no-user-gesture-required',
  '--window-size=1400,900'
]


  });

  const page = await browser.newPage();

  try {
    const cookiesString = await fs.readFile(cookiesPath);
    const cookies = JSON.parse(cookiesString);
    await page.setCookie(...cookies);
    console.log('🍪 Cookie yüklendi');
  } catch {
    console.log('⚠️ Cookie yüklenemedi, login gerekebilir');
  }

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('⏳ Play butonunu bekliyoruz...');
  try {
    await page.waitForSelector('button[data-testid="play-button"]', { timeout: 10000 });
    const playButton = await page.$('button[data-testid="play-button"]');
    await playButton.click();
    console.log('▶️ Şarkı çalınıyor...');
  } catch (err) {
    console.log('❌ Play tıklama hatası:', err.message);
  }

  let metadataJson = null;

  page.on('response', async (response) => {
    const reqUrl = response.url();
    if (reqUrl.includes('https://spclient.wg.spotify.com/metadata/4/track/')) {
      try {
        const data = await response.json();
        metadataJson = {
          id: data.gid,
          name: data.name,
          isrc: data.external_id?.find(x => x.type === 'isrc')?.id || null,
          artist: data.artist?.[0]?.name || null,
          label: data.album?.label || null,
          licensor: data.licensor?.uuid || null
        };
        console.log('\n🎧 Metadata bulundu:\n', metadataJson);
        await browser.close();
      } catch (err) {
        console.log('❌ JSON parse hatası:', err.message);
      }
    }
  });

  await new Promise(resolve => setTimeout(resolve, 10000));

  if (!metadataJson) {
    console.log('❌ Metadata alınamadı. Play sonrası istek yakalanamadı.');
    await browser.close();
  }
}

scrapeTrackMetadata();