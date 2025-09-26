// Startup logging and connection status checking

interface StartupStatus {
  server: boolean;
  mongodb: boolean;
  envio: boolean;
}

export async function checkConnectionStatus(): Promise<StartupStatus> {
  // Only run on server side
  if (typeof window !== 'undefined') {
    return { server: true, mongodb: false, envio: false };
  }

  const status: StartupStatus = {
    server: true, // Server is running if this code executes
    mongodb: false,
    envio: false
  };

  // Check MongoDB connection
  try {
    const { getDb } = await import('./db');
    const db = await getDb();
    await db.admin().ping(); // Simple ping to test connection
    status.mongodb = true;
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.log('❌ MongoDB Connection Failed:', error instanceof Error ? error.message : 'Unknown error');
    status.mongodb = false;
  }

  // Check Envio GraphQL endpoint
  try {
    const envioUrl = process.env.NEXT_PUBLIC_ENVIO_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
    const response = await fetch(envioUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: '{ __typename }', // Simple introspection query
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      status.envio = true;
      console.log('✅ Envio GraphQL Connected Successfully');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Envio GraphQL Connection Failed:', error instanceof Error ? error.message : 'Unknown error');
    status.envio = false;
  }

  return status;
}

export function displayStartupBanner() {
  console.log('\n🔐 MonaScribe - Smart Account Subscriptions on Monad');
  console.log('================================================');
  console.log('📡 Local Server: http://localhost:3000');
  console.log('🔍 Checking connections...\n');
}

export function displayConnectionSummary(status: StartupStatus) {
  console.log('\n📊 Connection Status Summary:');
  console.log('=============================');
  console.log(`🌐 Next.js Server: ${status.server ? '✅ Running on http://localhost:3000' : '❌ Not running'}`);
  console.log(`🗄️  MongoDB: ${status.mongodb ? '✅ Connected' : '❌ Disconnected'}`);
  console.log(`📊 Envio GraphQL: ${status.envio ? '✅ Connected' : '❌ Disconnected'}`);
  
  if (status.mongodb && status.envio) {
    console.log('\n🎉 All systems operational! You can start using MonaScribe.');
    console.log('📈 Alpha & Screener features are fully functional.');
  } else {
    console.log('\n⚠️  Some services are unavailable:');
    if (!status.mongodb) {
      console.log('   • MongoDB: Weekly Alpha and Screener will use fallback data');
    }
    if (!status.envio) {
      console.log('   • Envio: On-chain data will be simulated');
    }
  }
  
  console.log('\n🚀 Ready for development!');
  console.log('=============================\n');
}

export async function performStartupChecks() {
  displayStartupBanner();
  
  try {
    const status = await checkConnectionStatus();
    displayConnectionSummary(status);
    return status;
  } catch (error) {
    console.error('❌ Startup check failed:', error);
    return {
      server: true,
      mongodb: false,
      envio: false
    };
  }
}
