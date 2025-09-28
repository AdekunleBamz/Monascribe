/**
 * Monad Network Data Service
 * 
 * Provides real-time network statistics and blockchain data
 * for the MonaScribe platform dashboards.
 */

export interface MonadNetworkData {
  latestBlock: {
    number: number
    timestamp: number
    transactions: number
    gasUsed: string
    gasLimit: string
  }
  latestTransactions: Array<{
    hash: string
    from: string
    to: string
    value: string
    gasPrice: string
    timestamp: number
    type: 'transfer' | 'contract' | 'swap'
  }>
  activeAddresses: {
    last24h: number
    last7d: number
    growth: number
  }
  networkStats: {
    tps: number
    avgBlockTime: number
    gasPrice: {
      slow: string
      standard: string
      fast: string
    }
    validators: number
    networkUtilization: number
  }
  smartAccounts: {
    total: number
    active24h: number
    subscriptions: number
  }
}

export class MonadNetworkService {
  private static instance: MonadNetworkService
  private cache: MonadNetworkData | null = null
  private lastFetch: number = 0
  private readonly CACHE_DURATION = 30 * 1000 // 30 seconds

  static getInstance(): MonadNetworkService {
    if (!this.instance) {
      this.instance = new MonadNetworkService()
    }
    return this.instance
  }

  /**
   * Get real-time network data from Monad RPC
   * Uses real blockchain data only
   */
  async getNetworkData(): Promise<MonadNetworkData> {
    const now = Date.now()
    
    // Return cached data if still valid
    if (this.cache && now - this.lastFetch < this.CACHE_DURATION) {
      return this.cache
    }

    try {
      // Try to fetch from the visualizer API
      const data = await this.fetchFromVisualizer()
      this.cache = data
      this.lastFetch = now
      return data
    } catch (error) {
      console.error('Failed to fetch from visualizer:', error)
      throw new Error('Unable to fetch network data from Monad RPC')
    }
  }

  /**
   * Fetch data from Monad RPC directly
   */
  private async fetchFromVisualizer(): Promise<MonadNetworkData> {
    const RPC_URL = 'https://testnet-rpc.monad.xyz'
    
    try {
      // Fetch latest block
      const blockResponse = await fetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: ['latest', true],
          id: 1
        })
      })

      if (!blockResponse.ok) {
        throw new Error(`RPC request failed: ${blockResponse.status}`)
      }

      const blockData = await blockResponse.json()
      const block = blockData.result

      if (!block) {
        throw new Error('No block data received from RPC')
      }

      return this.mapRPCData(block)
    } catch (error) {
      console.error('Failed to fetch from Monad RPC:', error)
      throw new Error('Unable to fetch network data from Monad RPC')
    }
  }

  /**
   * Map RPC block data to our data structure
   */
  private mapRPCData(block: any): MonadNetworkData {
    const blockNumber = parseInt(block.number, 16)
    const timestamp = parseInt(block.timestamp, 16)
    const gasUsed = parseInt(block.gasUsed, 16)
    const gasLimit = parseInt(block.gasLimit, 16)
    const transactionCount = block.transactions.length

    return {
      latestBlock: {
        number: blockNumber,
        timestamp: timestamp,
        transactions: transactionCount,
        gasUsed: this.formatGas(gasUsed),
        gasLimit: gasLimit.toString()
      },
      latestTransactions: block.transactions.slice(0, 10).map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: this.formatEther(parseInt(tx.value, 16)),
        gasUsed: parseInt(tx.gas, 16),
        type: 'transfer', // Default type
        timestamp: timestamp // Use block timestamp
      })),
      activeAddresses: {
        last24h: 0, // Would need additional RPC calls to calculate
        last7d: 0,  // Would need additional RPC calls to calculate
        growth: 0   // Would need additional RPC calls to calculate
      },
      networkStats: {
        tps: 0, // Would need multiple blocks to calculate
        avgBlockTime: 0, // Would need multiple blocks to calculate
        gasPrice: {
          slow: this.formatGwei(0),
          standard: this.formatGwei(0),
          fast: this.formatGwei(0)
        },
        validators: 0, // Would need additional RPC calls
        networkUtilization: (gasUsed / gasLimit) * 100
      },
      smartAccounts: {
        total: 0, // Would need additional RPC calls
        active24h: 0, // Would need additional RPC calls
        subscriptions: 0 // Would need additional RPC calls
      }
    }
  }

  // Removed mock data generation methods - using only real on-chain data

  // Removed mock data helper methods - using only real on-chain data

  private formatGas(value: number): string {
    return Math.floor(value).toLocaleString()
  }

  private formatGwei(value: number): string {
    return value.toFixed(2)
  }

  private formatEther(value: number): string {
    return value.toFixed(6)
  }

  /**
   * Get formatted data for dashboard display
   */
  getFormattedData(data: MonadNetworkData) {
    return {
      network: {
        latestBlock: `#${data.latestBlock.number.toLocaleString()}`,
        blockTime: `${data.networkStats.avgBlockTime.toFixed(1)}s`,
        tps: `${data.networkStats.tps.toFixed(1)} TPS`,
        gasPrice: `${data.networkStats.gasPrice.standard} Gwei`,
        utilization: `${(data.networkStats.networkUtilization * 100).toFixed(1)}%`
      },
      activity: {
        activeToday: data.activeAddresses.last24h.toLocaleString(),
        activeWeek: data.activeAddresses.last7d.toLocaleString(),
        growth: `${data.activeAddresses.growth > 0 ? '+' : ''}${data.activeAddresses.growth.toFixed(1)}%`,
        smartAccounts: data.smartAccounts.total.toLocaleString(),
        subscriptions: data.smartAccounts.subscriptions.toLocaleString()
      },
      transactions: data.latestTransactions.slice(0, 5).map(tx => ({
        hash: `${tx.hash.slice(0, 10)}...${tx.hash.slice(-8)}`,
        type: tx.type,
        value: `${parseFloat(tx.value) > 100 ? '🐋' : ''} ${parseFloat(tx.value).toFixed(3)} MON`,
        age: this.timeAgo(tx.timestamp)
      }))
    }
  }

  private timeAgo(timestamp: number): string {
    const seconds = Math.floor(Date.now() / 1000) - timestamp
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }
}

// Export singleton instance
export const monadNetwork = MonadNetworkService.getInstance()
