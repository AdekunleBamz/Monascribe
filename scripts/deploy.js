// Simple deployment script for Monad Testnet
// Run with: node scripts/deploy.js

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const solc = require('solc')
const { createWalletClient, createPublicClient, http, defineChain } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

// Monad Testnet configuration
const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: { decimals: 18, name: 'Monad', symbol: 'MON' },
  rpcUrls: { default: { http: ['https://testnet-rpc.monad.xyz'] } },
  blockExplorers: { default: { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com' } },
})

function compileContract() {
  const filePath = path.resolve(__dirname, '..', 'contracts', 'SubscriptionService.sol')
  const source = fs.readFileSync(filePath, 'utf8')

  const input = {
    language: 'Solidity',
    sources: {
      'SubscriptionService.sol': { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
    },
  }

  const output = JSON.parse(solc.compile(JSON.stringify(input)))
  if (output.errors) {
    const errs = output.errors.filter((e) => e.severity === 'error')
    if (errs.length) {
      console.error(errs)
      throw new Error('Solc compilation failed')
    }
  }

  const contract = output.contracts['SubscriptionService.sol']['SubscriptionService']
  return { abi: contract.abi, bytecode: '0x' + contract.evm.bytecode.object }
}

async function deploy() {
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    console.error('Please set PRIVATE_KEY in a .env file (not committed).')
    process.exit(1)
  }

  const { abi, bytecode } = compileContract()
  const account = privateKeyToAccount(privateKey)

  const walletClient = createWalletClient({ account, chain: monadTestnet, transport: http() })
  const publicClient = createPublicClient({ chain: monadTestnet, transport: http() })

  console.log('Deploying from:', account.address)

  try {
    const hash = await walletClient.deployContract({ abi, bytecode, args: [] })
    console.log('Deployment tx:', hash)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })
    console.log('Contract deployed at:', receipt.contractAddress)
    console.log('\nPaste this into lib/subscriptionContract.ts:')
    console.log(`export const SUBSCRIPTION_CONTRACT_ADDRESS = "${receipt.contractAddress}" as const`)
  } catch (e) {
    console.error('Deployment failed:', e)
    process.exit(1)
  }
}

deploy().catch(console.error)
