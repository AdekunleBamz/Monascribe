import { createPublicClient, createWalletClient, http } from 'viem'
import { monadTestnet } from './config'

export interface WalletConnector {
  id: string
  name: string
  description: string
  icon: string
  iconBackground: string
  installed?: boolean
  downloadUrls?: {
    [key: string]: string
  }
}

export const SUPPORTED_WALLETS: WalletConnector[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Smart Account Support',
    icon: '🦊',
    iconBackground: '#f6851b',
    installed: typeof window !== 'undefined' && !!(window as any).ethereum?.isMetaMask,
    downloadUrls: {
      chrome: 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn',
      firefox: 'https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/',
      edge: 'https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm'
    }
  },
  {
    id: 'coinbase',
    name: 'Coinbase Wallet',
    description: 'Coming Soon',
    icon: '💎',
    iconBackground: '#0052ff',
    installed: false
  },
  {
    id: 'walletconnect',
    name: 'WalletConnect',
    description: 'Coming Soon', 
    icon: '🔗',
    iconBackground: '#3b99fc',
    installed: false
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    description: 'Coming Soon',
    icon: '🌈',
    iconBackground: '#ff5656',
    installed: false
  }
]

export class WalletConnectionError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'WalletConnectionError'
  }
}

export async function detectWallets(): Promise<WalletConnector[]> {
  if (typeof window === 'undefined') return SUPPORTED_WALLETS
  
  return SUPPORTED_WALLETS.map(wallet => ({
    ...wallet,
    installed: wallet.id === 'metamask' 
      ? !!(window as any).ethereum?.isMetaMask
      : false
  }))
}

export async function connectWallet(walletId: string) {
  if (walletId !== 'metamask') {
    throw new WalletConnectionError(`${walletId} not yet supported`, 'UNSUPPORTED_WALLET')
  }
  
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new WalletConnectionError('MetaMask not detected. Please install MetaMask.', 'METAMASK_NOT_FOUND')
  }
  
  try {
    // Request account access with user approval
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    })
    
    if (!accounts || accounts.length === 0) {
      throw new WalletConnectionError('No accounts found. Please connect your wallet.', 'NO_ACCOUNTS')
    }
    
    // Switch to or add Monad Testnet
    await ensureMonadNetwork()
    
    return {
      address: accounts[0],
      chainId: 10143,
      connector: SUPPORTED_WALLETS.find(w => w.id === walletId)
    }
  } catch (error: any) {
    if (error.code === 4001) {
      throw new WalletConnectionError('Connection rejected by user', 'USER_REJECTED')
    }
    throw error
  }
}

async function ensureMonadNetwork() {
  const ethereum = (window as any).ethereum
  
  try {
    // Try to switch to Monad Testnet
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x279F' }], // 10143 in hex
    })
  } catch (switchError: any) {
    // If the chain doesn't exist, add it
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x279F',
          chainName: 'Monad Testnet',
          nativeCurrency: {
            name: 'Monad',
            symbol: 'MON',
            decimals: 18,
          },
          rpcUrls: ['https://testnet-rpc.monad.xyz'],
          blockExplorerUrls: ['https://testnet.monadexplorer.com'],
        }],
      })
    } else {
      throw new WalletConnectionError('Failed to switch to Monad Testnet', 'NETWORK_SWITCH_FAILED')
    }
  }
}
