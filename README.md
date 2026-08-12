# Playstore More Apps - Parser, Dual-Cache & WebView Engine

Automated Google Play Store Developer Page parser powered by GitHub Actions. Generates **Dual-Cache (Global/English & Indonesia)**, automatically categorizes **Games at the top & Apps at the bottom**, formats titles with Title Case (acronym preservation), and serves an ultra-lightweight **WebView Single-Page Application (SPA)** interface.

---

## 🌐 Live Web View URL (GitHub Pages)

Official production web view loaded by Flutter & Kotlin clients:

👉 **[https://livumedia.github.io/PLAYSTORE-DEV-PAGE/list-apps.html](https://livumedia.github.io/PLAYSTORE-DEV-PAGE/list-apps.html)**

---

## 🔐 GitHub Secrets Configuration

To protect your credentials and email privacy, configure repository secrets under **Settings > Secrets and variables > Actions**:

1. Click **New repository secret**
2. Add the following secrets:
   - `MAIL_USERNAME`: Sender email address (e.g., `sender@example.com`).
   - `MAIL_PASSWORD`: App Password generated for your Gmail account (requires 2FA enabled).
   - `NOTIFY_EMAILS` *(optional)*: Target email address(es) for schema failure alerts (separated by commas for multiple emails, e.g., `alert1@example.com,alert2@example.com`).
3. Click **Add secret**.

---

## 🚀 Key Features

1. **Near-Zero Client Overhead**: Flutter and Kotlin clients load a single WebView widget. No complex JSON parsing, no heavy list rendering, and zero memory overhead.
2. **Zero Client Update**: Change the UI, theme, or layout anytime by updating the HTML file on GitHub. All client apps update instantly without releasing new APKs.
3. **Multi-Layer Caching (Instant & Offline Ready)**:
   - **Layer 1 (Chromium HTTP Disk Cache)**: Caches icons and HTML on the user's device disk.
   - **Layer 2 (LocalStorage Caching)**: Stores JSON data in `localStorage` for instant 0-second loading.
   - **Layer 3 (Offline Fallback)**: Full offline support with embedded data fallback.
4. **Automatic Categorization**:
   - 🎮 **Games (11)**: Placed in the **TOP** section.
   - 📱 **Apps (5)**: Placed in the **BOTTOM** section.
5. **Dynamic Language Switcher**: Auto-detects device locale (`navigator.language`) with interactive `🇮🇩 ID` and `🌐 EN` toggle buttons.
6. **Title Normalization**: Standardizes ALL-CAPS titles into Title Case while preserving acronyms (`TTS`, `AI`, `PDF`, `VPN`, `HD`, `4K`, `3D`, `UI`).

---

## 🛠️ Dual-Cache Architecture

The parser generates two static JSON files under the `cache/` directory:

1. **`cache/apps.json`** ➡️ English / Global (`lang: 'en'`, `country: 'us'`)
2. **`cache/apps-id.json`** ➡️ Indonesian (`lang: 'id'`, `country: 'id'`)

---

## 📱 Client Integration

### 1. Flutter (`flutter-script/lib/more_apps_page.dart`)
```dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

const String kRemoteListAppsUrl =
    'https://raw.githubusercontent.com/livumedia/PLAYSTORE-DEV-PAGE/main/list-apps.html';

class MoreAppsPage extends StatefulWidget {
  const MoreAppsPage({super.key});

  @override
  State<MoreAppsPage> createState() => _MoreAppsPageState();
}

class _MoreAppsPageState extends State<MoreAppsPage> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0F172A))
      ..loadRequest(Uri.parse(kMoreAppsHtmlUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(child: WebViewWidget(controller: _controller)),
    );
  }
}
```

### 2. Kotlin / Android (`kotlin-script/.../MoreAppsActivity.kt`)
```kotlin
package id.livumedia.moreapps

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

private const val REMOTE_LIST_APPS_URL =
    "https://raw.githubusercontent.com/livumedia/PLAYSTORE-DEV-PAGE/main/list-apps.html"

class MoreAppsActivity : AppCompatActivity() {

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                    val url = request?.url?.toString() ?: return false
                    if (url.contains("play.google.com") || url.startsWith("market://")) {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    }
                    return false
                }
            }
            loadUrl(MORE_APPS_HTML_URL)
        }
        setContentView(webView)
    }
}
```

---

## 🛠️ Credits & Dependencies

This project utilizes the following open-source Node.js library for fetching Play Store metadata:

- **[google-play-scraper](https://www.npmjs.com/package/google-play-scraper)** (`^10.1.3`) - Node.js scraper library for Google Play Store used to parse app icons, titles, summaries, and developer listings.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

<br>

---
---

<br>

# Bahasa Indonesia

Project parser halaman developer Google Play Store otomatis berbasis GitHub Actions yang menghasilkan **Dual-Cache (Global/English & Indonesia)**, memilah kategori **Games di atas & Apps di bawah**, memformat judul dengan standar Title Case (preservasi akronim), serta menyediakan tampilan antarmuka **WebView Single-Page Application (SPA)** super ringan.

---

## 🌐 Live Web View URL (GitHub Pages)

Tampilan antarmuka resmi yang di-load oleh client Flutter & Kotlin:

👉 **[https://livumedia.github.io/PLAYSTORE-DEV-PAGE/list-apps.html](https://livumedia.github.io/PLAYSTORE-DEV-PAGE/list-apps.html)**

---

## 🔐 Pengaturan GitHub Secrets

Untuk menjaga kerahasiaan email dan kredensial Anda, tambahkan rahasia di **Settings > Secrets and variables > Actions**:

1. Klik **New repository secret**
2. Tambahkan secret berikut:
   - `MAIL_USERNAME`: Alamat email pengirim (contoh: `pengirim@example.com`).
   - `MAIL_PASSWORD`: App Password akun Gmail pengirim (memerlukan 2FA aktif di akun Google).
   - `NOTIFY_EMAILS` *(opsional)*: Alamat email tujuan untuk notifikasi jika skema data berubah (pisahkan dengan koma jika lebih dari 1, contoh: `email1@domain.com,email2@domain.com`).
3. Klik **Add secret**.

---

## 🚀 Fitur Utama

1. **Beban Client Sangat Ringan (Near-Zero Overhead)**: Client Flutter maupun Kotlin hanya memuat 1 widget WebView. Tidak ada beban parsing JSON, rendering list kompleks, atau penggunaan memori berlebih.
2. **Zero Client Update**: Jika ada perubahan tampilan UI, warna, atau layout di masa mendatang, cukup ubah file HTML di GitHub. Seluruh aplikasi pengguna akan langsung mendapatkan tampilan terbaru tanpa perlu update APK.
3. **Multi-Layer Caching (Instant Load & Offline Ready)**:
   - **Layer 1 (Chromium HTTP Disk Cache)**: WebView menyimpan aset gambar dan HTML di disk lokal HP.
   - **Layer 2 (LocalStorage Caching)**: Data JSON disimpan di `localStorage` WebView untuk render instan 0 detik.
   - **Layer 3 (Offline Fallback)**: Tetap dapat dibuka walaupun HP sedang offline tanpa koneksi internet.
4. **Pengurutan Kategori Otomatis**:
   - 🎮 **Games (11)**: Selalu berada di kelompok **ATAS**.
   - 📱 **Apps (5)**: Selalu berada di kelompok **BAWAH**.
5. **Tombol Toggle Bahasa (🇮🇩 ID / 🌐 EN)**: Otomatis membaca bahasa HP pengguna (`navigator.language`) serta menyediakan tombol toggle manual.
6. **Normalisasi Judul**: Merapikan judul ALL-CAPS menjadi Title Case dengan preservasi akronim (`TTS`, `AI`, `PDF`, `VPN`, `HD`, `4K`, `3D`, `UI`).

---

## 🛠️ Arsitektur Dual-Cache

Parser menghasilkan 2 file JSON statis di folder `cache/`:

1. **`cache/apps.json`** ➡️ Bahasa English / Global (`lang: 'en'`, `country: 'us'`)
2. **`cache/apps-id.json`** ➡️ Bahasa Indonesia (`lang: 'id'`, `country: 'id'`)

---

## ⚙️ Struktur Setting (`config/settings.json`)

Semua setting non-rahasia ada terpusat di `config/settings.json`:

```json
{
  "developerId": "7833833743949360412",
  "notifyEmails": [],
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

## 🛠️ Kredit & Dependensi

Project ini memanfaatkan library open-source Node.js berikut untuk me-retrieve metadata dari Play Store:

- **[google-play-scraper](https://www.npmjs.com/package/google-play-scraper)** (`^10.1.3`) - Library Node.js scraper Google Play Store yang digunakan untuk mengambil ikon, judul, ringkasan deskripsi, dan daftar aplikasi developer.

---

## 📄 Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat [`LICENSE`](LICENSE) untuk informasi lebih lanjut.
