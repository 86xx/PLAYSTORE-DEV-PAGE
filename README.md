# Playstore More Apps - Parser (GitHub)

Script untuk parse halaman developer Play Store — manual kapan saja,
ATAU otomatis sesuai frekuensi yang kamu atur — dengan validasi skema
sebelum cache lama ditimpa, plus notifikasi email ke beberapa alamat
kalau skema berubah.

## Struktur setting

Semua setting non-rahasia ada terpusat di **`config/settings.json`**:

```json
{
  "developerId": "GANTI_DENGAN_DEV_ID_PLAY_STORE",
  "notifyEmails": ["email1@example.com", "email2@example.com", "email3@example.com"],
  "frequencyDays": 7,
  "maxApps": 200
}
```

- `developerId` — ID numerik developer kamu (lihat di URL halaman
  developer Play Store, contoh:
  `https://play.google.com/store/apps/dev?id=1234567890123456789`)
- `notifyEmails` — daftar email yang menerima notifikasi kalau skema
  berubah. Tambah/kurangi sesuai kebutuhan, tidak terbatas 3.
- `frequencyDays` — jarak minimal (hari) antar auto-parse. Ubah kapan
  saja tanpa perlu edit file workflow.
- `maxApps` — batas maksimal app yang diambil dari halaman developer.

**PENTING:** file ini AMAN untuk di-commit ke repo (tidak ada password
di dalamnya). Password email tetap tersimpan terpisah di GitHub Secrets
(lihat di bawah) supaya tidak pernah ke-expose lewat git history.

## Setup

1. Push folder ini ke repo GitHub kamu.
2. Edit `config/settings.json`, isi `developerId` dan `notifyEmails`.
3. Buka Settings > Secrets and variables > Actions > New repository
   secret, tambahkan (HANYA kredensial, bukan setting biasa):
   - `MAIL_USERNAME` — email pengirim (misal Gmail kamu)
   - `MAIL_PASSWORD` — App Password Gmail (bukan password akun biasa —
     buat di https://myaccount.google.com/apppasswords, butuh 2FA aktif)
4. Buka tab **Actions**, pilih workflow **"Parse Play Store"**, klik
   **"Run workflow"** kapan pun mau parse manual (selalu jalan, tidak
   peduli `frequencyDays`).

## Cara kerja jadwal otomatis

Workflow **dicek tiap hari** jam 03:00 UTC, tapi parser hanya benar-benar
jalan kalau sudah lewat `frequencyDays` hari sejak run sukses terakhir
(dicatat di `cache/last-run.json`). Ini akal karena GitHub Actions cron
tidak bisa baca file config secara dinamis untuk menentukan jadwalnya
sendiri — jadi triknya: cron jalan sering (harian), tapi script yang
memutuskan "beneran parse atau skip" berdasarkan `frequencyDays`.

Kalau kamu ubah `frequencyDays` dari 7 ke 14 misalnya, cukup edit angka
itu di `config/settings.json` dan commit — tidak perlu sentuh file
`.yml` sama sekali.

## Cara kerja validasi & notifikasi

- `scripts/parse-playstore.js` fetch halaman developer, ambil daftar app
  (appId, title, icon, summary, url), validasi field & tipe datanya
  terhadap `EXPECTED_SCHEMA` di dalam script.
- **Valid** -> `cache/apps.json` ditimpa penuh (full overwrite, bukan
  merge) dengan data terbaru, di-commit otomatis. Kalau tidak ada
  perubahan data, tidak ada commit baru.
- **Tidak valid** (struktur halaman berubah) -> `cache/apps.json` TIDAK
  disentuh, `cache/SCHEMA_WARNING.md` dibuat berisi detail field yang
  bermasalah, dan **email dikirim ke semua alamat di `notifyEmails`**
  (dibaca otomatis dari `config/settings.json`) berisi link log run dan
  langkah perbaikan. Setelah parser diperbaiki, jalankan ulang manual.

## Konsumsi cache dari app

App Flutter/Kotlin cukup fetch file `cache/apps.json` lewat raw URL:

```
https://raw.githubusercontent.com/<user>/<repo>/main/cache/apps.json
```

Lihat folder `flutter-script/` dan `kotlin-script/` untuk contoh
konsumsinya.
