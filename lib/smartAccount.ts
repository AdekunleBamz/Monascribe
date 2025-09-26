import { 
  Implementation, 
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment 
} from '@metamask/delegation-toolkit'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { createWalletClient, http, encodeFunctionData, type Address } from 'viem'
import { publicClient, bundlerClient, monadTestnet } from './config'
import { SUBSCRIPTION_CONTRACT_ABI } from './subscriptionContract'
import { getMetaMaskProvider, detectWalletConflicts, reportWalletError } from './walletConfig'

export async function createSmartAccount() {
  try {
    // Detect wallet conflicts first
    const walletConflicts = detectWalletConflicts()
    
    if (walletConflicts.hasConflicts) {
      console.warn('🚨 Wallet Extension Conflicts Detected:', walletConflicts)
      console.warn('Detected wallets:', walletConflicts.detectedWallets)
      console.warn('Recommendations:', walletConflicts.recommendations)
    }

    // Get the specific MetaMask provider
    const metaMaskProvider = getMetaMaskProvider()
    
    if (!metaMaskProvider) {
      const error = new Error('MetaMask not detected. Please install MetaMask to continue.')
      reportWalletError(error, 'SmartAccount Creation')
      throw error
    }

    // Use the specific MetaMask provider instead of window.ethereum
    const ethereum = metaMaskProvider
    
    // Request account access
    console.log('Requesting MetaMask connection...')
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    
    if (!accounts || accounts.length === 0) {
      const error = new Error('No accounts found. Please connect your MetaMask wallet.')
      reportWalletError(error, 'Account Access')
      throw error
    }

    const userAddress = accounts[0] as Address
    console.log('Connected to MetaMask:', userAddress)

    // Switch to Monad Testnet if not already connected
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x279F' }], // 10143 in hex
      })
    } catch (switchError: any) {
      // If the chain doesn't exist, add it
      if (switchError.code === 4902) {
        console.log('Adding Monad Testnet to MetaMask...')
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
        console.error('Failed to switch to Monad Testnet:', switchError)
        throw new Error('Please switch to Monad Testnet in MetaMask')
      }
    }

    // Create wallet client
    const walletClient = createWalletClient({
      chain: monadTestnet,
      transport: http(),
      account: userAddress,
    })

    // Try to create MetaMask Smart Account
    try {
      console.log('Attempting to create MetaMask Smart Account...')
      
      if (walletConflicts.hasConflicts) {
        console.warn('⚠️ Smart Account creation may fail due to wallet conflicts')
      }
      
      const smartAccount = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Hybrid,
        deployParams: [userAddress, [], [], []],
        deploySalt: "0x",
        signer: { walletClient },
      })
      
      console.log('✅ MetaMask Smart Account created successfully')
      
      // Note: Smart Account created but will fall back to standard transactions
      // if Monad doesn't support ERC-4337 bundler operations
      return { 
        smartAccount: {
          ...smartAccount,
          type: 'smart-account',
          ethereum,
          walletClient,
          eoaAddress: userAddress as `0x${string}`,
          fallbackToStandard: true, // Will use standard tx if bundler fails
        }, 
        account: { address: userAddress },
        isReal: true,
        type: 'smart-account',
        walletConflicts: walletConflicts.hasConflicts ? walletConflicts : undefined
      }
    } catch (smartAccountError) {
      console.log('⚠️ MetaMask Smart Account not available, using standard MetaMask account')
      
      if (walletConflicts.hasConflicts) {
        console.warn('Smart Account creation failed likely due to wallet conflicts:', walletConflicts.detectedWallets)
        reportWalletError(smartAccountError, 'Smart Account Creation with Conflicts')
      } else {
        reportWalletError(smartAccountError, 'Smart Account Creation')
      }
      
      // Use standard MetaMask account
      return {
        smartAccount: {
          address: userAddress,
          type: 'standard-account',
          implementation: 'EOA',
          walletClient,
          ethereum,
          eoaAddress: userAddress as `0x${string}`,
          getAddress: () => userAddress,
        },
        account: { address: userAddress },
        isReal: true,
        type: 'standard-account',
        walletConflicts: walletConflicts.hasConflicts ? walletConflicts : undefined
      }
    }
  } catch (error) {
    console.error('Error connecting to MetaMask:', error)
    throw error
  }
}


export async function subscribeWithSmartAccount(
  smartAccount: any,
  contractAddress: Address,
  planId: number,
  price: string
) {
  try {
    console.log('Processing subscription transaction...')
    
    // Convert price to wei
    const { parseEther } = await import('viem')
    const priceInWei = parseEther(price)
    
    // Get user address for transaction
    const userAddress = (smartAccount.eoaAddress || smartAccount.address || smartAccount.getAddress()) as `0x${string}`
    
    // Prepare transaction parameters
    const transactionParameters = {
      from: userAddress,
      to: contractAddress,
      value: `0x${priceInWei.toString(16)}`,
      // ABI-encode: subscribe(address subscriber, uint256 planId)
      data: encodeFunctionData({
        abi: SUBSCRIPTION_CONTRACT_ABI as any,
        functionName: 'subscribe',
        args: [BigInt(planId)],
      }),
    }
    
    if (smartAccount.type === 'standard-account') {
      // Standard MetaMask transaction
      console.log('Sending standard MetaMask transaction...', transactionParameters)
      
      const hash = await smartAccount.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })
      
      console.log('Standard transaction sent:', hash)
      return hash
    }
    
    // For Smart Accounts: Try user operation first, fall back to standard if bundler fails
    if (smartAccount.type === 'smart-account') {
      try {
        console.log('Attempting user operation via MetaMask Smart Account...')
        
        const userOperationHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [
            {
              to: contractAddress,
              value: priceInWei,
              data: encodeFunctionData({
                abi: SUBSCRIPTION_CONTRACT_ABI as any,
                functionName: 'subscribe',
                args: [BigInt(planId)],
              }),
            }
          ],
          maxFeePerGas: BigInt('20000000000'), // 20 gwei (higher for Monad)
          maxPriorityFeePerGas: BigInt('2000000000'), // 2 gwei
        })

        console.log('User operation sent:', userOperationHash)
        return userOperationHash
      } catch (bundlerError: any) {
        // If bundler methods not supported (like on Monad), fall back to standard transaction
        if (bundlerError.message?.includes('eth_estimateUserOperationGas') || 
            bundlerError.message?.includes('Method not found')) {
          
          console.log('Bundler not supported on this network, falling back to standard transaction...')
          console.log('Fallback transaction params:', transactionParameters)
          
          const hash = await smartAccount.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
          })
          
          console.log('Fallback standard transaction sent:', hash)
          return hash
        }
        
        // Re-throw other bundler errors
        throw bundlerError
      }
    }
    
    throw new Error('Unknown account type')
  } catch (error) {
    console.error('Error processing subscription:', error)
    throw error
  }
}

export async function cancelSubscription(
  smartAccount: any,
  contractAddress: Address
) {
  try {
    console.log('Processing cancel subscription...')

    const userAddress = (smartAccount.eoaAddress || smartAccount.address || smartAccount.getAddress()) as `0x${string}`

    const transactionParameters = {
      from: userAddress,
      to: contractAddress,
      data: encodeFunctionData({
        abi: SUBSCRIPTION_CONTRACT_ABI as any,
        functionName: 'cancelSubscription',
        args: [],
      }),
    }

    if (smartAccount.type === 'standard-account') {
      console.log('Sending standard MetaMask transaction...', transactionParameters)
      const hash = await smartAccount.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      })
      console.log('Standard transaction sent:', hash)
      return hash
    }

    if (smartAccount.type === 'smart-account') {
      try {
        console.log('Attempting user operation via MetaMask Smart Account...')
        const userOperationHash = await bundlerClient.sendUserOperation({
          account: smartAccount,
          calls: [
            {
              to: contractAddress,
              data: encodeFunctionData({
                abi: SUBSCRIPTION_CONTRACT_ABI as any,
                functionName: 'cancelSubscription',
                args: [],
              }),
            }
          ],
          maxFeePerGas: BigInt('20000000000'),
          maxPriorityFeePerGas: BigInt('2000000000'),
        })
        console.log('User operation sent:', userOperationHash)
        return userOperationHash
      } catch (bundlerError: any) {
        if (bundlerError.message?.includes('eth_estimateUserOperationGas') || bundlerError.message?.includes('Method not found')) {
          console.log('Bundler not supported on this network, falling back to standard transaction...')
          console.log('Fallback transaction params:', transactionParameters)
          const hash = await smartAccount.ethereum.request({
            method: 'eth_sendTransaction',
            params: [transactionParameters],
          })
          console.log('Fallback standard transaction sent:', hash)
          return hash
        }
        throw bundlerError
      }
    }

    throw new Error('Unknown account type')
  } catch (error) {
    console.error('Error cancelling subscription:', error)
    throw error
  }
}
