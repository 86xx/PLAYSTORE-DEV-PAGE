/**
 * Cek apakah sudah waktunya parse berdasarkan `frequencyDays` di
 * config/settings.json, dibandingkan dengan waktu run sukses terakhir
 * yang tersimpan di cache/last-run.json.
 *
 * Kalau trigger-nya manual (workflow_dispatch), SELALU dianggap due
 * (skip pengecekan frekuensi) - karena manual run = kamu memang mau
 * parse sekarang.
 *
 * Output: menulis `should_run=true/false` ke GITHUB_OUTPUT supaya
 * step selanjutnya di workflow bisa pakai `if:` condition.
 */

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');
const LAST_RUN_PATH = path.join(__dirname, '..', 'cache', 'last-run.json');

function main() {
  const isManual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

  if (isManual) {
    console.log('Trigger manual - langsung jalan, skip cek frekuensi.');
    writeOutput(true);
    return;
  }

  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const frequencyDays = settings.frequencyDays ?? 7;

  if (!fs.existsSync(LAST_RUN_PATH)) {
    console.log('Belum pernah ada run sukses sebelumnya - jalan sekarang.');
    writeOutput(true);
    return;
  }

  const lastRun = JSON.parse(fs.readFileSync(LAST_RUN_PATH, 'utf8'));
  const lastRunAt = new Date(lastRun.timestamp);
  const daysSince = (Date.now() - lastRunAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince >= frequencyDays) {
    console.log(
      `Sudah ${daysSince.toFixed(1)} hari sejak run terakhir (>= ${frequencyDays} hari) - jalan sekarang.`
    );
    writeOutput(true);
  } else {
    console.log(
      `Baru ${daysSince.toFixed(1)} hari sejak run terakhir (< ${frequencyDays} hari) - skip.`
    );
    writeOutput(false);
  }
}

function writeOutput(shouldRun) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (outputPath) {
    fs.appendFileSync(outputPath, `should_run=${shouldRun}\n`);
  }
}

main();
