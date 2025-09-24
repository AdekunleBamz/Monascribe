import { createPublicClient, createWalletClient, http, defineChain } from 'viem'
import { createBundlerClient } from 'viem/account-abstraction'

// Monad Testnet configuration (REAL)
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Monad',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' },
  },
})

// Use Monad Testnet for everything
export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(),
})

// Bundler client for account abstraction on Monad
// Note: You'll need to configure an actual bundler for Monad testnet
export const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http('https://testnet-rpc.monad.xyz'), // Using Monad RPC as fallback
})
