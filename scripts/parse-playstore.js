/**
 * Parse Play Store developer page -> JSON cache & update HTML files to display inside
 * client apps/games (Flutter or Kotlin) and web view.
 *
 * Centralized settings are in config/settings.json (developerId, notifyEmails,
 * frequencyDays, maxApps). Email credentials (MAIL_USERNAME/MAIL_PASSWORD)
 * REMAIN in GitHub Secrets and are never stored in settings.json.
 *
 * Key behavior:
 *   - OLD Cache (cache/apps.json) is only overwritten if the new parse result
 *     passes schema validation (fields & data types match expectation).
 *   - Automatically updates fallback embedded DATA_ID & DATA_EN inside list-apps.html
 *     and demo_preview.html so HTML files ALWAYS contain latest app count automatically!
 */

const fs = require('fs');
const path = require('path');
const rawGplay = require('google-play-scraper');
const gplay = rawGplay.developer ? rawGplay : (rawGplay.default || rawGplay);

const ROOT = path.join(__dirname, '..');
const SETTINGS_PATH = path.join(ROOT, 'config', 'settings.json');
const CACHE_DIR = path.join(ROOT, 'cache');
const CACHE_PATH_EN = path.join(CACHE_DIR, 'apps.json');
const CACHE_PATH_ID = path.join(CACHE_DIR, 'apps-id.json');
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
    throw new Error('config/settings.json not found.');
  }
  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  if (!settings.developerId || settings.developerId.startsWith('CHANGE_')) {
    throw new Error(
      'developerId not set in config/settings.json. Fill with your numeric Play Store developer ID.'
    );
  }
  return settings;
}

function validateSchema(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, reason: 'Parse result is empty or not an array.' };
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
          `${key} (got: ${typeof item[key]}, expected: ${expectedType})`
        );
      }
    }

    if (missing.length || wrongType.length) {
      return {
        valid: false,
        reason: `Item [index ${i}] -> ` + [
          missing.length ? `Missing fields: ${missing.join(', ')}` : null,
          wrongType.length ? `Incorrect types: ${wrongType.join(', ')}` : null,
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
      console.warn(`⚠️ Attempt ${attempt}/${retries} failed: ${err.message}`);
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

async function fetchForLocale(settings, lang, country) {
  let rawApps = [];

  if (Array.isArray(settings.appIds) && settings.appIds.length > 0) {
    console.log(
      `Fetching ${settings.appIds.length} apps [${lang}_${country}] from appIds list...`
    );
    rawApps = await fetchWithRetry(() =>
      Promise.all(
        settings.appIds.map((id) =>
          gplay.app({ appId: id, lang, country }).catch((err) => {
            console.warn(`⚠️ Warning: Failed to fetch app ${id} [${lang}]: ${err.message}`);
            return null;
          })
        )
      ).then((list) => list.filter(Boolean))
    );
  } else {
    console.log(`Fetching developer page [${lang}_${country}] for devId:`, settings.developerId);
    rawApps = await fetchWithRetry(() =>
      gplay.developer({
        devId: settings.developerId,
        lang,
        country,
        num: settings.maxApps || 200,
      })
    );
  }

  const mappedApps = rawApps.map((a) => {
    const isGame =
      (a.genreId && a.genreId.startsWith('GAME_')) ||
      (a.genre && a.genre.toLowerCase().includes('game')) ||
      (a.appId && (a.appId.includes('game') || a.appId.includes('puzzle') || a.appId.includes('match') || a.appId.includes('blast') || a.appId.includes('shooter') || a.appId.includes('ludo') || a.appId.includes('silat') || a.appId.includes('screw') || a.appId.includes('ball')));

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
  return [...games, ...apps];
}

function updateHtmlFiles(appsEN, appsID) {
  const htmlFiles = [
    path.join(ROOT, 'list-apps.html'),
    path.join(ROOT, 'demo_preview.html'),
    path.join(ROOT, '..', 'list-apps.html'),
    path.join(ROOT, '..', 'demo_preview.html'),
    path.join(ROOT, '..', 'flutter-script', 'assets', 'list-apps.html'),
    path.join(ROOT, '..', 'kotlin-script', 'app', 'src', 'main', 'assets', 'list-apps.html')
  ];

  const gamesCount = appsID.filter((a) => a.type === 'GAME').length;
  const appsCount = appsID.filter((a) => a.type === 'APP').length;
  const totalCount = appsID.length;

  for (const filePath of htmlFiles) {
    if (!fs.existsSync(filePath)) continue;

    let content = fs.readFileSync(filePath, 'utf8');

    // Replace DATA_ID
    const idRegex = /const\s+DATA_ID\s*=\s*\[[\s\S]*?\];/;
    content = content.replace(idRegex, `const DATA_ID = ${JSON.stringify(appsID, null, 2)};`);

    // Replace DATA_EN
    const enRegex = /const\s+DATA_EN\s*=\s*\[[\s\S]*?\];/;
    content = content.replace(enRegex, `const DATA_EN = ${JSON.stringify(appsEN, null, 2)};`);

    // Replace Tab buttons in HTML
    content = content.replace(
      /<button class="tab-btn active" id="tab-all"[^>]*>.*?<\/button>/s,
      `<button class="tab-btn active" id="tab-all" onclick="filterCategory('ALL')">Semua (${totalCount})</button>`
    );
    content = content.replace(
      /<button class="tab-btn"[^>]*id="tab-games"[^>]*>.*?<\/button>/s,
      `<button class="tab-btn" id="tab-games" onclick="filterCategory('GAME')">🎮 Games (${gamesCount})</button>`
    );
    content = content.replace(
      /<button class="tab-btn"[^>]*id="tab-apps"[^>]*>.*?<\/button>/s,
      `<button class="tab-btn" id="tab-apps" onclick="filterCategory('APP')">📱 Apps (${appsCount})</button>`
    );

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Automatically updated ${totalCount} apps (${gamesCount} Games, ${appsCount} Apps) into ${path.basename(filePath)}`);
  }
}

async function main() {
  const settings = loadSettings();

  const [appsEN, appsID] = await Promise.all([
    fetchForLocale(settings, 'en', 'us'),
    fetchForLocale(settings, 'id', 'id'),
  ]);

  const checkEN = validateSchema(appsEN);
  const checkID = validateSchema(appsID);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  if (!checkEN.valid || !checkID.valid) {
    const scraperVersion = getScraperVersion();
    const reason = !checkEN.valid ? `EN: ${checkEN.reason}` : `ID: ${checkID.reason}`;
    const msg = `## ⚠️ Parse schema validation failed (${new Date().toISOString()})

**Scraper Version:** \`google-play-scraper@${scraperVersion}\`
**Reason:** ${reason}

OLD cache was not overwritten — apps continue using previous cached data.

Recovery steps:
1. Inspect updated Play Store data structure
2. Adjust EXPECTED_SCHEMA and/or mapping in \`scripts/parse-playstore.js\`
3. Re-run workflow manually
`;
    fs.writeFileSync(WARNING_PATH, msg);
    console.error(msg);
    process.exitCode = 1;
    return;
  }

  // 1. Save JSON cache files
  fs.writeFileSync(CACHE_PATH_EN, JSON.stringify(appsEN, null, 2));
  fs.writeFileSync(CACHE_PATH_ID, JSON.stringify(appsID, null, 2));
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(EXPECTED_SCHEMA, null, 2));
  fs.writeFileSync(
    LAST_RUN_PATH,
    JSON.stringify({ timestamp: new Date().toISOString() }, null, 2)
  );

  // 2. Automatically update list-apps.html and demo_preview.html with newly fetched app list
  updateHtmlFiles(appsEN, appsID);

  if (fs.existsSync(WARNING_PATH)) fs.unlinkSync(WARNING_PATH);

  console.log(
    `✅ Successfully parsed Dual-Cache & updated HTML: ${appsEN.length} Global (EN) -> cache/apps.json, ${appsID.length} Indonesia (ID) -> cache/apps-id.json. Cache & HTML updated.`
  );
}

main().catch((err) => {
  console.error('❌ Parse error:', err.message);
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const msg = `## ⚠️ Parse failed - Unexpected Error (${new Date().toISOString()})\n\n**Error:** ${err.message}\n`;
    fs.writeFileSync(WARNING_PATH, msg);
  } catch (_) {}
  process.exitCode = 1;
});
