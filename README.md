# Playstore More Apps - Parser & Dual-Cache Generator (GitHub)

Project parser halaman developer Google Play Store otomatis berbasis GitHub Actions yang menghasilkan **Dual-Cache (Global/English & Indonesia)**, memilah kategori **Games di atas & Apps di bawah**, memformat judul dengan standar Title Case (preservasi akronim), serta menyediakan referensi visual tampilan UI output.

## Referensi Visual Output UI

Visual antarmuka (UI/UX) akhir yang harus diterapkan pada client **Flutter** maupun **Kotlin/Android** mengacu pada file referensi:

📄 **[demo_preview.html](file:///e:/002_Android_2026/006_APK/01_PLAYSTORE-DEVPAGE/demo_preview.html)**

### Fitur Tampilan UI Output:
1. **Pengurutan Kategori**:
   - 🎮 **Games**: Selalu berada di urutan **ATAS**.
   - 📱 **Apps**: Selalu berada di urutan **BAWAH**.
2. **Badge Tipe**: Badge visual membedakan `GAME` (gradien indigo/purple) dan `APP` (gradien emerald/cyan).
3. **Lokalisasi Bahasa**:
   - Menggunakan judul & ringkasan bahasa Indonesia untuk device dengan locale `id`.
   - Menggunakan judul & ringkasan bahasa English untuk device dengan locale `en` / Global.
4. **Interaksi Native**: Tap/klik pada card membuka intent halaman Play Store resmi (`https://play.google.com/store/apps/details?id=...`).

---

## Arsitektur Dual-Cache

Parser menghasilkan 2 file JSON statis di folder `cache/`:

1. **`cache/apps.json`** ➡️ Bahasa English / Global (`lang: 'en'`, `country: 'us'`)
2. **`cache/apps-id.json`** ➡️ Bahasa Indonesia (`lang: 'id'`, `country: 'id'`)

---

## Struktur Setting (`config/settings.json`)

Semua setting non-rahasia ada terpusat di `config/settings.json`:

```json
{
  "developerId": "7833833743949360412",
  "notifyEmails": ["bekti.playstore@gmail.com"],
  "frequencyDays": 7,
  "maxApps": 200,
  "appIds": [
    "id.livumedia.ttsseru",
    "id.livumedia.fruitblast",
    "id.livumedia.parkingescape",
    "id.livumedia.candyblast",
    "id.livumedia.arrowpuzzle",
    "id.livumedia.cubematch",
    "id.livumedia.jewelmatch",
    "com.axlhostdev.tankbubbleshooter",
    "com.axlhostdev.ludoknight",
    "com.axlhostdev.silatkata",
    "com.axlhostdev.blogspot",
    "id.livumedia.livuphotoeditor",
    "id.livumedia.pdftools",
    "id.livumedia.vpnunlimited",
    "id.livumedia.youmakeaishortstools",
    "id.wallpaperhd.anime"
  ]
}
```

---

## Standar Penulisan Judul (Title Normalization)

Parser otomatis merapikan judul aplikasi:
- Judul berhuruf besar semua (*ALL CAPS*) diubah menjadi **Title Case**.
- Akronim/singkatan populer tetap dipertahankan dalam huruf kapital (`TTS`, `AI`, `PDF`, `VPN`, `HD`, `4K`, `3D`, `UI`).
- Contoh: `TTS SERU - TEKA TEKI SILANG` ➡️ `TTS Seru - Teka Teki Silang`.

---

## Setup GitHub Actions

1. Push folder `github-script` ke repository GitHub Anda.
2. Tambahkan **Repository Secrets** (Settings > Secrets and variables > Actions):
   - `MAIL_USERNAME`: Email Gmail pengirim notifikasi.
   - `MAIL_PASSWORD`: App Password Gmail pengirim.
3. Atur **Workflow permissions** ke **Read and write permissions**.
4. Workflow akan otomatis mengeksekusi parser atau dapat dijalankan manual via tab **Actions** > **Parse Play Store** > **Run workflow**.
