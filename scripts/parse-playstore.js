/**
 * Parse halaman developer Play Store -> cache JSON untuk ditampilkan
 * di dalam app/game (Flutter atau Kotlin).
 *
 * Setting terpusat ada di config/settings.json (developerId, notifyEmails,
 * frequencyDays, maxApps). Kredensial email (MAIL_USERNAME/MAIL_PASSWORD)
 * TETAP di GitHub Secrets, tidak pernah ditaruh di settings.json.
 *
 * Perilaku penting:
 *   - Cache LAMA (cache/apps.json) hanya ditimpa kalau hasil parse baru
 *     lolos validasi skema (field & tipe data sama seperti sebelumnya).
 *   - Kalau skema berubah (Google mengubah struktur halaman), cache lama
 *     TIDAK disentuh, dan file cache/SCHEMA_WARNING.md dibuat berisi
 *     detail apa yang berubah supaya EXPECTED_SCHEMA / parser bisa
 *     diperbaiki. Workflow akan mengirim email ke notifyEmails.
 */

const fs = require('fs');
const path = require('path');
const rawGplay = require('google-play-scraper');
const gplay = rawGplay.developer ? rawGplay : (rawGplay.default || rawGplay);

const ROOT = path.join(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, 'config', 'settings.json');
const CACHE_DIR = path.join(ROOT, 'cache');
const CACHE_PATH = path.join(CACHE_DIR, 'apps.json');
const SCHEMA_PATH = path.join(CACHE_DIR, 'apps.schema.json');
const WARNING_PATH = path.join(CACHE_DIR, 'SCHEMA_WARNING.md');
const LAST_RUN_PATH = path.join(CACHE_DIR, 'last-run.json');

const EXPECTED_SCHEMA = {
  appId: 'string',
  title: 'string',
  icon: 'string',
  summary: 'string',
  url: 'string',
  type: 'string',
};

function loadSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    throw new Error('config/settings.json tidak ditemukan.');
  }
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  if (!settings.developerId || settings.developerId.startsWith('GANTI_')) {
    throw new Error(
      'developerId belum diisi di config/settings.json. Isi dengan ID numerik developer Play Store kamu.'
    );
  }
  return settings;
}

function validateSchema(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, reason: 'Hasil parse kosong atau bukan array.' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const missing = [];
    const wrongType = [];

    for (const [key, expectedType] of Object.entries(EXPECTED_SCHEMA)) {
      if (!(key in item)) {
        missing.push(key);
      } else if (typeof item[key] !== expectedType) {
        wrongType.push(
          `${key} (dapat: ${typeof item[key]}, harusnya: ${expectedType})`
        );
      }
    }

    if (missing.length || wrongType.length) {
      return {
        valid: false,
        reason: `Item [index ${i}] -> ` + [
          missing.length ? `Field hilang: ${missing.join(', ')}` : null,
          wrongType.length ? `Tipe data salah: ${wrongType.join(', ')}` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      };
    }
  }

  return { valid: true };
}

async function fetchWithRetry(fn, retries = 3, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`⚠️ Percobaan ${attempt}/${retries} gagal: ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((res) => setTimeout(res, delayMs * attempt));
    }
  }
}

function getScraperVersion() {
  try {
    return require('google-play-scraper/package.json').version;
  } catch (e) {
    return 'unknown';
  }
}

function formatTitle(title) {
  if (!title) return '';
  const acronyms = new Set(['TTS', 'AI', 'PDF', 'VPN', 'HD', '4K', '3D', 'UI', 'ID', 'URL']);
  const isAllCaps = title === title.toUpperCase() && /[A-Z]/.test(title);
  if (isAllCaps) {
    return title
      .split(' ')
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (acronyms.has(clean)) return w.replace(new RegExp(clean, 'i'), clean);
        return w.replace(/[a-zA-Z0-9]+/g, (m) =>
          acronyms.has(m.toUpperCase())
            ? m.toUpperCase()
            : m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
        );
      })
      .join(' ');
  }
  return title;
}

async function main() {
  const settings = loadSettings();

  let rawApps = [];

  if (Array.isArray(settings.appIds) && settings.appIds.length > 0) {
    console.log(
      `Fetching ${settings.appIds.length} apps dari daftar appIds di config/settings.json...`
    );
    rawApps = await fetchWithRetry(() =>
      Promise.all(
        settings.appIds.map((id) =>
          gplay.app({ appId: id, lang: 'id', country: 'id' }).catch((err) => {
            console.warn(`⚠️ Warning: Gagal fetch app ${id}: ${err.message}`);
            return null;
          })
        )
      ).then((list) => list.filter(Boolean))
    );
  } else {
    console.log('Fetching developer page untuk devId:', settings.developerId);
    rawApps = await fetchWithRetry(() =>
      gplay.developer({
        devId: settings.developerId,
        num: settings.maxApps || 200,
      })
    );
  }

  const mappedApps = rawApps.map((a) => {
    const isGame =
      (a.genreId && a.genreId.startsWith('GAME_')) ||
      (a.genre && a.genre.toLowerCase().includes('game')) ||
      (a.appId && (a.appId.includes('game') || a.appId.includes('puzzle') || a.appId.includes('match') || a.appId.includes('blast') || a.appId.includes('shooter') || a.appId.includes('ludo') || a.appId.includes('silat')));

    return {
      appId: a.appId,
      title: formatTitle(a.title),
      icon: a.icon,
      summary: a.summary || '',
      url: a.url,
      type: isGame ? 'GAME' : 'APP',
    };
  });

  const games = mappedApps.filter((a) => a.type === 'GAME');
  const apps = mappedApps.filter((a) => a.type === 'APP');
  const sortedApps = [...games, ...apps];

  const check = validateSchema(sortedApps);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (!check.valid) {
    const scraperVersion = getScraperVersion();
    const msg = `## ⚠️ Parse gagal validasi skema (${new Date().toISOString()})

**Versi Scraper:** \`google-play-scraper@${scraperVersion}\`
**Alasan:** ${check.reason}

Cache LAMA (\`cache/apps.json\`) tidak ditimpa — aplikasi tetap memakai data sebelumnya.

Langkah perbaikan:
1. Cek struktur data terbaru dari Play Store (lihat contoh mentah di bawah)
2. Sesuaikan EXPECTED_SCHEMA dan/atau mapping di \`scripts/parse-playstore.js\`
3. Jalankan ulang workflow secara manual

Contoh item mentah yang gagal divalidasi:
\`\`\`json
${JSON.stringify(rawApps[0] || {}, null, 2)}
\`\`\`
`;
    fs.writeFileSync(WARNING_PATH, msg);
    console.error(msg);
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(CACHE_PATH, JSON.stringify(sortedApps, null, 2));
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(EXPECTED_SCHEMA, null, 2));
  fs.writeFileSync(
    LAST_RUN_PATH,
    JSON.stringify({ timestamp: new Date().toISOString() }, null, 2)
  );

  if (fs.existsSync(WARNING_PATH)) fs.unlinkSync(WARNING_PATH);

  console.log(
    `✅ Berhasil parse ${sortedApps.length} items (${games.length} Games di atas, ${apps.length} Apps di bawah). Cache diupdate.`
  );
}

main().catch((err) => {
  console.error('❌ Parse error:', err.message);
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const msg = `## ⚠️ Parse gagal - Unexpected Error (${new Date().toISOString()})\n\n**Error:** ${err.message}\n`;
    fs.writeFileSync(WARNING_PATH, msg);
  } catch (_) {}
  process.exitCode = 1;
});

