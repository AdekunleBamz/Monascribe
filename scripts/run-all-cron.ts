import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';

function runScript(scriptName: string) {
  return new Promise<void>((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`[${new Date().toISOString()}] Starting ${scriptName}`);

    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env
    });

    child.on('close', (code) => {
      const doneTs = new Date().toISOString();
      console.log(`[${doneTs}] Finished ${scriptName} (exit ${code})`);

      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      console.error(`Error running ${scriptName}:`, error);
      reject(error);
    });
  });
}

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running hourly cron jobs...');

  try {
    await runScript('fetch-coin-data.js');
    await runScript('fetch-events-new.js');
    console.log('✅ All cron jobs completed successfully');
  } catch (error) {
    console.error('❌ Cron job failed:', error);
  }
});

console.log('⏰ Cron scheduler started - running every hour');
console.log('📊 Will fetch: coin data + events');
