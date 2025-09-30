#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const http = require('http');
const url = require('url');

const POLLING_INTERVAL = 2000; // 2 seconds
const MAX_WAIT_TIME = 30000; // 30 seconds

console.log('\n🔐 MonaScribe - Smart Account Subscriptions on Monad');
console.log('================================================');
console.log('🚀 Starting development environment...\n');

// Helper to wait for a service with polling
async function waitForService(name, checkFunction) {
  const startTime = Date.now();
  process.stdout.write(`⏳ Waiting for ${name}...`);

  while (Date.now() - startTime < MAX_WAIT_TIME) {
    if (await checkFunction()) {
      process.stdout.write(' ✅ Ready\n');
      return true;
    }
    process.stdout.write('.');
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }

  process.stdout.write(' ❌ Failed\n');
  console.error(`Error: ${name} did not become available within ${MAX_WAIT_TIME / 1000} seconds.`);
  return false;
}

// Check function for MongoDB
async function checkMongoDB() {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 1500,
    });
    await client.connect();
    await client.db().admin().ping();
    await client.close();
    return true;
  } catch {
    return false;
  }
}

// Check function for Envio GraphQL
async function checkEnvio() {
  const envioUrl = process.env.ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
  const parsedUrl = url.parse(envioUrl);
  const postData = JSON.stringify({ query: '{ __typename }' });

  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 80,
    path: parsedUrl.path,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
    timeout: 1500,
  };

  return new Promise((resolve) => {
    const req = http.request(options, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(postData);
    req.end();
  });
}

// Check function for Cron Job
async function checkCronJob() {
  const pidFile = path.join(__dirname, 'cron.pid');
  return fs.existsSync(pidFile);
}

async function main() {
  console.log('🔍 Checking service connections...\n');

  const mongoOk = await waitForService('MongoDB', checkMongoDB);
  const envioOk = await waitForService('Envio GraphQL', checkEnvio);
  const cronOk = await checkCronJob();

  console.log('\n📊 Service Status:');
  console.log('==================');
  console.log(`🗄️  Database: ${mongoOk ? 'Online' : 'Offline'}`);
  console.log(`📊 Indexer:  ${envioOk ? 'Online' : 'Offline'}`);
  console.log(`⏰ Cron Job: ${cronOk ? 'Running' : 'Stopped'}`);
  console.log('==================\n');

  if (!mongoOk || !envioOk) {
    console.error('❌ One or more required services are offline. Aborting startup.');
    if (!mongoOk) console.log('   -> Tip: Start MongoDB with `docker start monascribe-db`');
    if (!envioOk) console.log('   -> Tip: Start the indexer with `npm run dev:indexer`');
    process.exit(1);
  }

  console.log('🎉 All systems operational! Starting Next.js web server...\n');
  console.log('📡 Local: http://localhost:3000');
  console.log('🔧 Mode:  Development');
  console.log('=============================\n');

  const nextProcess = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true,
  });

  nextProcess.on('close', (code) => {
    console.log(`\n🛑 Development server exited with code ${code}`);
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextProcess.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(console.error);
