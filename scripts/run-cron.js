// scripts/run-cron.js
require('ts-node').register({
  // Specify any required ts-node options here, matching your tsconfig.json if needed
  // For example, if your tsconfig uses ESM
  esm: true,
  experimentalSpecifierResolution: 'node'
});
require('./cronJobs.ts');
