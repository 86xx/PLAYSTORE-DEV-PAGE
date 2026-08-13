/**
 * Check if it is time to parse based on `frequencyDays` in
 * config/settings.json, compared against the last successful run timestamp
 * stored in cache/last-run.json.
 *
 * If triggered manually (workflow_dispatch), ALWAYS consider due
 * (skip frequency check) - because manual run = user explicitly requested now.
 *
 * Output: writes `should_run=true/false` to GITHUB_OUTPUT for
 * subsequent workflow steps to use in `if:` conditions.
 */

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'config', 'settings.json');
const LAST_RUN_PATH = path.join(__dirname, '..', 'cache', 'last-run.json');

function main() {
  const isManual = process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';

  if (isManual) {
    console.log('Manual trigger - running immediately, skipping frequency check.');
    writeOutput(true);
    return;
  }

  const settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
  const frequencyDays = settings.frequencyDays ?? 7;

  if (!fs.existsSync(LAST_RUN_PATH)) {
    console.log('No previous successful run recorded - running now.');
    writeOutput(true);
    return;
  }

  const lastRun = JSON.parse(fs.readFileSync(LAST_RUN_PATH, 'utf8'));
  const lastRunAt = new Date(lastRun.timestamp);
  const daysSince = (Date.now() - lastRunAt.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince >= frequencyDays) {
    console.log(
      `${daysSince.toFixed(1)} days since last run (>= ${frequencyDays} days) - running now.`
    );
    writeOutput(true);
  } else {
    console.log(
      `Only ${daysSince.toFixed(1)} days since last run (< ${frequencyDays} days) - skipping.`
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
