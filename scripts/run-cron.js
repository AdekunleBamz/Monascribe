// scripts/run-cron.js
require('dotenv').config({ path: ['.env.local', '.env'], override: true });
const cron = require('node-cron');
const { spawn } = require('child_process');

function runScript(scriptPath) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] Starting ${scriptPath}`);
  const child = spawn(process.execPath, [scriptPath], { stdio: 'inherit' });
  child.on('close', (code) => {
    const doneTs = new Date().toISOString();
    console.log(`[${doneTs}] Finished ${scriptPath} (exit ${code})`);
  });
}

// Fetch trending data every 5 minutes for Tier 1
cron.schedule('*/5 * * * *', () => runScript(require('path').join(__dirname, 'fetch-gecko-trending.js')));

// Fetch market data every 15 minutes (can be used for Tier 2/3)
cron.schedule('*/15 * * * *', () => runScript(require('path').join(__dirname, 'fetch-market-coingecko.js')));

// Fetch CoinMarketCal events every 6 hours for Tier 2
cron.schedule('0 */6 * * *', () => runScript(require('path').join(__dirname, 'fetch-events-cmc.js')));

// Fetch CryptoPanic news every 2 hours for Tier 2
cron.schedule('0 */2 * * *', () => runScript(require('path').join(__dirname, 'fetch-news-cryptopanic.js')));

console.log('Cron scheduler started with updated jobs.');
