# Playstore More Apps - Parser, Dual-Cache & WebView Engine (GitHub)

Project parser halaman developer Google Play Store otomatis berbasis GitHub Actions yang menghasilkan **Dual-Cache (Global/English & Indonesia)**, memilah kategori **Games di atas & Apps di bawah**, memformat judul dengan standar Title Case (preservasi akronim), serta menyediakan tampilan antarmuka **WebView Single-Page Application (SPA)** super ringan.

---

## Live Web View URL (GitHub Pages)

Tampilan antarmuka resmi yang di-load oleh client Flutter & Kotlin:

🌐 **[https://86xx.github.io/PLAYSTORE-DEV-PAGE/demo_preview.html](https://86xx.github.io/PLAYSTORE-DEV-PAGE/demo_preview.html)**

---

## Arsitektur WebView & Multi-Layer Caching

### Keunggulan Arsitektur WebView:
1. **Beban Client Sangat Ringan (Near-Zero Overhead)**: Client Flutter maupun Kotlin hanya memuat 1 widget WebView. Tidak ada beban parsing JSON, rendering list kompleks, atau penggunaan memori berlebih.
2. **Zero Client Update**: Jika ada perubahan tampilan UI, warna, atau layout di masa mendatang, cukup ubah file HTML di GitHub. Seluruh aplikasi pengguna akan langsung mendapatkan tampilan terbaru tanpa perlu update APK.
3. **Multi-Layer Caching (Instant Load & Offline Ready)**:
   - **Layer 1 (Chromium HTTP Disk Cache)**: WebView menyimpan aset gambar dan HTML di disk lokal HP.
   - **Layer 2 (LocalStorage Caching)**: Data JSON disimpan di `localStorage` WebView untuk render instan 0 detik.
   - **Layer 3 (Offline Fallback)**: Tetap dapat dibuka walaupun HP sedang offline tanpa koneksi internet.

---

## Setup GitHub Actions & Pages

1. Repository berstatus **Public**: `https://github.com/86xx/PLAYSTORE-DEV-PAGE`.
2. GitHub Pages diaktifkan pada **Settings > Pages > Branch `main` > Folder `/ (root)`**.
3. Tambahkan **Repository Secrets** (Settings > Secrets and variables > Actions):
   - `MAIL_USERNAME`: Email Gmail pengirim notifikasi.
   - `MAIL_PASSWORD`: App Password Gmail pengirim.
4. Workflow akan otomatis mengeksekusi parser dan meng-commit file cache & HTML baru secara teratur.
