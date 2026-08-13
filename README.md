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

## 📱 Client Integration Directives

> [!IMPORTANT]
> **Mandatory Rules for Client WebView Implementations (Flutter & Kotlin):**
> 1. **Multi-Layer Offline Caching**: Always implement a 4-layer caching flow (Local Bundled Asset -> Local Disk File Cache -> Background Async Fetch -> Error Fallback) so the screen loads instantly with 0ms delay and handles offline mode cleanly without showing `net::ERR_INTERNET_DISCONNECTED`.
> 2. **Top Navigation Bar & Close Button**: Always provide a prominent **Close / Back Button** (`Icons.close` in Flutter or `finish()` in Kotlin) in a top header/toolbar so users can easily close the "More Apps" screen without relying solely on system back gestures.

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
