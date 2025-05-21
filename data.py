import requests

# Verilen bilgiler
track_id = "7JhuMcs6o0cloamT1T4OXn"
bearer_token = "BQDwaEjPwoetzECReKuzR-_RQGmFBg-8kOhgTdwzg6BEX9vOzK6hnDuSTy1On3CBfPgU6wPapSgSJVneeg3_i-faCtR4IUdqJwWKpWImk6r6J-0B0Irahqxu4N6i4J4vFk-sVNpGFCmFKTioemAwOfuKJOenBAMEE7GfTppmikt0BSPGIzSmgYvUYflIk_s1Q2zh6fkWdRSchbSaykN_Z28MGZe7IgaQwGMLKUEEdrQ1cJ6jKStmLaKCMlguyvm6BEU04wcAxRjcZKcBrmrZOpMS6Ed18e1FYArLsgay4MevJpRBrrn_xUSDfMoBFlnPDSi0MDFDBoZcwCoI_Np0vJXJyVLl7u6VnSapn0qdNfH0bF92km4H0y5VkryX_TSaFA"
client_token = "AAAagBhjmJizG4H1tjkWhKRXSOAEEu47nNLOyz+iwWPfSRTP8GoHXTbUK9kTuQ/RLElanVyN8Ie6r7uQWAWKWHwZ/p/fW5xz2Opc4FEtoprzGY9rEB22MGW6NoQdB98Klc8AVsf2+3jokPWzQj4+SXnEzvjw0JFgOdRzULQRVXN1J8MdlaSsp/61R3ekSV8ONRgQm1VoyUSjdtivDkwNfIBxxBRzplkFK9lv5onDDjh3DmBX3ttsKrJP++BCu/Nm7RYXYdFu7Qg+YP019BZirhcCr5WhRGzxmPHvCdYDtD5z"

url = f"https://spclient.wg.spotify.com/metadata/4/track/{track_id}?market=from_token"

headers = {
    "Authorization": f"Bearer {bearer_token}",
    "Client-Token": client_token,
    "App-Platform": "WebPlayer",
    "Accept": "application/json",
    "Accept-Language": "en",
    "Referer": "https://open.spotify.com/",
    "Spotify-App-Version": "1.2.65.46.gda73cbb6",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
}

try:
    response = requests.get(url, headers=headers)
    print("🔄 HTTP Durum:", response.status_code)

    if response.status_code == 200:
        data = response.json()
        print("✅ GID:", data.get("gid"))
        print("✅ Label:", data.get("label"))
        print("✅ ISRC:", data.get("external_id", {}).get("isrc"))
        print("📄 Tüm JSON:", data)
    else:
        print("❌ Spotify metadata alınamadı")
        print("🔎 Response:", response.text)

except Exception as e:
    print("❌ Hata oluştu:", str(e))
