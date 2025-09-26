#!/usr/bin/env node

// Development startup script that shows connection status
const { spawn } = require('child_process');

console.log('\n🔐 MonaScribe - Smart Account Subscriptions on Monad');
console.log('================================================');
console.log('🚀 Starting development servers...\n');

// Check if MongoDB is running
async function checkMongoDB() {
  try {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      serverSelectionTimeoutMS: 3000, // 3 second timeout
      autoEncryption: undefined, // Disable client-side encryption
    });
    await client.connect();
    await client.db().admin().ping(); // Simple ping test
    await client.close();
    console.log('✅ MongoDB: Connected');
    return true;
  } catch (error) {
    console.log('❌ MongoDB: Not connected (' + error.message + ')');
    return false;
  }
}

// Check if Envio is running
async function checkEnvio() {
  try {
    const http = require('http');
    const url = require('url');
    
    const envioUrl = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
    const parsedUrl = url.parse(envioUrl);
    
    const postData = JSON.stringify({
      query: '{ __typename }',
    });

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8080,
      path: parsedUrl.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 3000
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log('✅ Envio GraphQL: Connected');
          resolve(true);
        } else {
          console.log('❌ Envio GraphQL: Not connected (HTTP ' + res.statusCode + ')');
          resolve(false);
        }
      });

      req.on('error', (error) => {
        console.log('❌ Envio GraphQL: Not connected (' + error.message + ')');
        resolve(false);
      });

      req.on('timeout', () => {
        console.log('❌ Envio GraphQL: Not connected (timeout)');
        req.destroy();
        resolve(false);
      });

      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.log('❌ Envio GraphQL: Not connected (' + error.message + ')');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking service connections...\n');
  
  // Check connections sequentially to avoid race conditions
  const mongoOk = await checkMongoDB();
  await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  const envioOk = await checkEnvio();

  console.log('\n📊 Service Status:');
  console.log('==================');
  console.log(`🗄️  Database: ${mongoOk ? 'Ready' : 'Offline (using fallback data)'}`);
  console.log(`📊 Indexer: ${envioOk ? 'Ready' : 'Offline (using mock data)'}`);
  console.log('🌐 Web Server: Starting Next.js...\n');

  if (mongoOk && envioOk) {
    console.log('🎉 All systems operational!\n');
  } else {
    console.log('⚠️  Some services offline - app will use fallback data.\n');
    
    if (!mongoOk) {
      console.log('💡 To enable database features:');
      console.log('   • Install MongoDB locally: https://docs.mongodb.com/manual/installation/');
      console.log('   • Or set MONGODB_URI to a cloud instance (Atlas, etc.)');
    }
    
    if (!envioOk) {
      console.log('💡 To enable real-time indexing:');
      console.log('   • Start Envio indexer: cd monascribe-indexer && pnpm dev');
    }
    console.log('');
  }

  console.log('📡 Local: http://localhost:3000');
  console.log('🔧 Mode: Development');
  console.log('=============================\n');

  // Start Next.js development server
  const nextProcess = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('close', (code) => {
    console.log(`\n🛑 Development server exited with code ${code}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    nextProcess.kill('SIGINT');
  });
}

main().catch(console.error);
