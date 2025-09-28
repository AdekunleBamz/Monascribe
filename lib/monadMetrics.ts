// Real-time Monad Testnet metrics integration
// Fetches live data from Monad RPC and network statistics

interface MonadNetworkMetrics {
  latestBlock: {
    number: number;
    hash: string;
    timestamp: number;
    gasUsed: string;
    gasLimit: string;
    transactionCount: number;
  };
  gasPrice: {
    current: string; // in gwei
    fast: string;
    standard: string;
    safe: string;
  };
  networkStats: {
    tps: number;
    utilization: number; // percentage
    avgBlockTime: number; // seconds
    activeValidators: number;
    totalSupply: string;
  };
  recentActivity: {
    blocks: Array<{
      number: number;
      txCount: number;
      gasUsed: string;
      timestamp: number;
    }>;
    avgTps24h: number;
    peakTps24h: number;
  };
}

const MONAD_RPC_URL = 'https://testnet-rpc.monad.xyz';

class MonadMetricsService {
  private cache: MonadNetworkMetrics | null = null;
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds

  async getNetworkMetrics(): Promise<MonadNetworkMetrics> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.lastFetch) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      // Fetch real data from Monad RPC
      const [latestBlock, gasPrice, blockHistory] = await Promise.all([
        this.fetchLatestBlock(),
        this.fetchGasPrice(),
        this.fetchBlockHistory(20) // Last 20 blocks for TPS calculation
      ]);

      // Calculate network statistics
      const networkStats = this.calculateNetworkStats(blockHistory);
      const recentActivity = this.analyzeRecentActivity(blockHistory);

      this.cache = {
        latestBlock,
        gasPrice,
        networkStats,
        recentActivity
      };
      
      this.lastFetch = now;
      return this.cache;

    } catch (error) {
      console.error('Failed to fetch Monad metrics:', error);
      
      // Return minimal data structure when RPC fails
      return this.getMinimalMetrics();
    }
  }

  private async fetchLatestBlock() {
    const response = await fetch(MONAD_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: ['latest', true],
        id: 1
      })
    });

    const data = await response.json();
    const block = data.result;

    return {
      number: parseInt(block.number, 16),
      hash: block.hash,
      timestamp: parseInt(block.timestamp, 16),
      gasUsed: parseInt(block.gasUsed, 16).toString(),
      gasLimit: parseInt(block.gasLimit, 16).toString(),
      transactionCount: block.transactions.length
    };
  }

  private async fetchGasPrice() {
    const response = await fetch(MONAD_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_gasPrice',
        params: [],
        id: 2
      })
    });

    const data = await response.json();
    const gasPriceWei = parseInt(data.result, 16);
    const gasPriceGwei = gasPriceWei / 1e9;

    return {
      current: gasPriceGwei.toFixed(2),
      fast: (gasPriceGwei * 1.2).toFixed(2),
      standard: gasPriceGwei.toFixed(2),
      safe: (gasPriceGwei * 0.8).toFixed(2)
    };
  }

  private async fetchBlockHistory(count: number) {
    const latest = await this.fetchLatestBlock();
    const blocks = [];

    // Fetch last N blocks for analysis
    for (let i = 0; i < count; i++) {
      try {
        const blockNum = latest.number - i;
        const response = await fetch(MONAD_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBlockByNumber',
            params: [`0x${blockNum.toString(16)}`, false],
            id: blockNum
          })
        });

        const data = await response.json();
        const block = data.result;

        blocks.push({
          number: parseInt(block.number, 16),
          txCount: block.transactions.length,
          gasUsed: parseInt(block.gasUsed, 16).toString(),
          timestamp: parseInt(block.timestamp, 16)
        });
      } catch (error) {
        console.warn(`Failed to fetch block ${latest.number - i}:`, error);
      }
    }

    return blocks;
  }

  private calculateNetworkStats(blocks: any[]) {
    if (blocks.length < 2) {
      return {
        tps: 0,
        utilization: 0,
        avgBlockTime: 0,
        activeValidators: 0,
        totalSupply: "0"
      };
    }

    // Calculate TPS based on recent blocks
    const totalTxs = blocks.reduce((sum, block) => sum + block.txCount, 0);
    const timeSpan = blocks[0].timestamp - blocks[blocks.length - 1].timestamp;
    const tps = timeSpan > 0 ? totalTxs / timeSpan : 0;

    // Calculate average block time
    const blockTimes = [];
    for (let i = 0; i < blocks.length - 1; i++) {
      blockTimes.push(blocks[i].timestamp - blocks[i + 1].timestamp);
    }
    const avgBlockTime = blockTimes.length > 0 
      ? blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length 
      : 1;

    // Calculate network utilization (simplified)
    const avgGasUsed = blocks.reduce((sum, block) => sum + parseInt(block.gasUsed), 0) / blocks.length;
    const utilization = Math.min((avgGasUsed / 30000000) * 100, 100); // Assuming 30M gas limit

    return {
      tps: Math.round(tps * 100) / 100,
      utilization: Math.round(utilization * 10) / 10,
      avgBlockTime: Math.round(avgBlockTime * 10) / 10,
      activeValidators: 0, // Will be populated from real data when available
      totalSupply: "0" // Will be populated from real data when available
    };
  }

  private analyzeRecentActivity(blocks: any[]) {
    const last24hBlocks = blocks.filter(block => 
      block.timestamp > (Date.now() / 1000) - 24 * 60 * 60
    );

    const totalTxs24h = last24hBlocks.reduce((sum, block) => sum + block.txCount, 0);
    const avgTps24h = last24hBlocks.length > 0 ? totalTxs24h / (24 * 60 * 60) : 0;
    const peakTps24h = Math.max(...blocks.map(b => b.txCount)) / 1; // Peak TPS in single block

    return {
      blocks: blocks.slice(0, 10), // Recent 10 blocks
      avgTps24h: Math.round(avgTps24h * 100) / 100,
      peakTps24h: Math.round(peakTps24h * 100) / 100
    };
  }

  private getMinimalMetrics(): MonadNetworkMetrics {
    const now = Math.floor(Date.now() / 1000);

    return {
      latestBlock: {
        number: 0,
        hash: "0x0000000000000000000000000000000000000000000000000000000000000000",
        timestamp: now,
        gasUsed: "0",
        gasLimit: "30000000",
        transactionCount: 0
      },
      gasPrice: {
        current: "0",
        fast: "0",
        standard: "0",
        safe: "0"
      },
      networkStats: {
        tps: 0,
        utilization: 0,
        avgBlockTime: 0,
        activeValidators: 0,
        totalSupply: "0"
      },
      recentActivity: {
        blocks: [],
        avgTps24h: 0,
        peakTps24h: 0
      }
    };
  }

  // Get formatted metrics for display
  getFormattedMetrics(metrics: MonadNetworkMetrics) {
    return {
      network: {
        chainId: "10143",
        name: "Monad Testnet",
        status: "🟢 Active",
        latestBlock: `#${metrics.latestBlock.number.toLocaleString()}`,
        blockTime: `${metrics.networkStats.avgBlockTime}s`,
        tps: `${metrics.networkStats.tps} TPS`,
        utilization: `${metrics.networkStats.utilization}%`
      },
      gas: {
        current: `${metrics.gasPrice.current} gwei`,
        fast: `${metrics.gasPrice.fast} gwei`,
        standard: `${metrics.gasPrice.standard} gwei`,
        safe: `${metrics.gasPrice.safe} gwei`
      },
      activity: {
        recentTxs: metrics.latestBlock.transactionCount,
        avg24h: `${metrics.recentActivity.avgTps24h} TPS`,
        peak24h: `${metrics.recentActivity.peakTps24h} TPS`,
        validators: metrics.networkStats.activeValidators
      }
    };
  }
}

export const monadMetrics = new MonadMetricsService();
export type { MonadNetworkMetrics };

