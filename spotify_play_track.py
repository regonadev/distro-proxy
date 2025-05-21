import json
import asyncio
import aiohttp
from selenium_driverless import webdriver
from selenium_driverless.types.by import By
import os

TRACK_ID = "7JhuMcs6o0cloamT1T4OXn"
SPOTIFY_URL = f"https://open.spotify.com/track/{TRACK_ID}"
COOKIES_PATH = "./cookies.json"

AUTHORIZATION = "Bearer BQCwJfSFOKTPWaTIskRtrVcO6fLbLq0-8N8pR_CE92zWLzcmZOVlJ42QEYfnl4fAMjKzzQ547OebPSJSHo4s8OvQUx56gzVAjLkrKySlQfHGoyAydTzr6LFgZwKCXH4mePkM4BWTRlyA43SF3ngklPCocggtLkrbmY__Rx-hr2Gry2tt4xN-3CLOe-GHSVFbquGco1xsFV4bfCCmqGxcN621FETr-5kCp9kA8jVW-vHBBoD3guFNw-5ZznzGb2hOkMW4euB-5_aNkF1RY2MpCV07MhGVxFyjGpecC-Acma2QuQ5LErCxunJIDweejLj85V2euvOQsux1msS7EBEMEw6mda2sj-iJ6KW1O0Ro2zqgnrKtiWOWW084-uTIf6IBKg"
CLIENT_TOKEN = "AAAagBhjmJizG4H1tjkWhKRXSOAEEu47nNLOyz+iwWPfSRTP8GoHXTbUK9kTuQ/RLElanVyN8Ie6r7uQWAWKWHwZ/p/fW5xz2Opc4FEtoprzGY9rEB22MGW6NoQdB98Klc8AVsf2+3jokPWzQj4+SXnEzvjw0JFgOdRzULQRVXN1J8MdlaSsp/61R3ekSV8ONRgQm1VoyUSjdtivDkwNfIBxxBRzplkFK9lv5onDDjh3DmBX3ttsKrJP++BCu/Nm7RYXYdFu7Qg+YP019BZirhcCr5WhRGzxmPHvCdYDtD5z"

def configure_browser():
    options = webdriver.ChromeOptions()
    options.add_argument("--mute-audio")
    options.add_argument("--window-size=1400,900")
    return options

async def load_cookies(driver):
    if not os.path.exists(COOKIES_PATH):
        print("❌ cookies.json bulunamadı.")
        return False
    with open(COOKIES_PATH, "r", encoding="utf-8") as f:
        cookies = json.load(f)
    await driver.get("https://open.spotify.com/")
    for cookie in cookies:
        try:
            if 'sameSite' in cookie and cookie['sameSite'] not in ['Strict', 'Lax', 'None']:
                del cookie['sameSite']
            await driver.add_cookie(cookie)
        except:
            pass
    await driver.refresh()
    print("✅ Çerezler yüklendi.")

async def wait_and_click(driver, selector, timeout=10):
    for _ in range(timeout):
        try:
            el = await driver.find_element(By.CSS_SELECTOR, selector)
            if await el.is_displayed():
                await el.click()
                return True
        except:
            await asyncio.sleep(1)
    return False

async def fetch_metadata(track_id):
    url = f"https://spclient.wg.spotify.com/metadata/4/track/{track_id}?market=from_token"
    headers = {
        "Authorization": AUTHORIZATION,
        "Client-Token": CLIENT_TOKEN,
        "App-Platform": "WebPlayer",
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status == 200:
                data = await resp.json()
                print("🎧 Track Name:", data.get("name"))
                print("🧠 GID:", data.get("gid"))
                print("📛 Licensor:", data.get("licensor", {}).get("name"))
            else:
                print("❌ Metadata çekilemedi:", resp.status)

async def main():
    options = configure_browser()
    async with webdriver.Chrome(options=options) as driver:
        await load_cookies(driver)
        await driver.get(SPOTIFY_URL)
        await asyncio.sleep(3)
        clicked = await wait_and_click(driver, "button[data-testid='play-button']")
        if clicked:
            print("▶️ Şarkı çalıyor.")
        else:
            print("❌ Play bulunamadı.")
        await asyncio.sleep(5)  # Şarkının başlamasını bekle
        await fetch_metadata(TRACK_ID)

if __name__ == "__main__":
    asyncio.run(main())
