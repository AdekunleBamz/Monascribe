// Enhanced mock data generator for realistic smart money and market activity
// Creates compelling demo data for Alpha and Screener features

interface MockSmartMoneyWallet {
  address: string;
  totalVolume: string;
  transactionCount: number;
  score: number;
  tags: string[];
  isWhale: boolean;
  recentActivity: {
    timestamp: number;
    type: 'transfer' | 'swap' | 'contract';
    amount: string;
    token: string;
  }[];
  profile: {
    firstSeen: number;
    avgTxSize: string;
    favoriteTokens: string[];
    tradingPattern: 'accumulator' | 'arbitrager' | 'whale' | 'degen';
  };
}

interface MockDEXTrade {
  id: string;
  trader: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  amountUSD: number;
  dexProtocol: string;
  timestamp: number;
  isSmartMoney: boolean;
  impact: 'low' | 'medium' | 'high';
}

interface MockMarketIntelligence {
  defiProtocols: Array<{
    name: string;
    tvl: number;
    change24h: number;
    category: string;
    risk: 'low' | 'medium' | 'high';
  }>;
  trendingTokens: Array<{
    symbol: string;
    address: string;
    priceUSD: number;
    change24h: number;
    volume24h: number;
    marketCap: number;
  }>;
  socialSentiment: {
    overall: 'bearish' | 'neutral' | 'bullish';
    score: number;
    mentions24h: number;
    trends: string[];
  };
  whaleAlerts: Array<{
    wallet: string;
    amount: string;
    token: string;
    type: 'accumulation' | 'distribution' | 'transfer';
    timestamp: number;
    significance: 'low' | 'medium' | 'high';
  }>;
}

class MockDataGenerator {
  private whaleAddresses: string[] = [
    '0x742d35Cc6B4C63e5D0d5E7c7b5A7b8De8f48Ae8F',
    '0x8ba1f109551bD432803012645Hac136c22C77c9e',
    '0x1b01DA37EaD46Fd36e78fe97C60b43A8d4e6c734',
    '0xa910f92ACdAf488fa6eF02174fb86208Ad7722ba',
    '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503',
    '0xd37BbE5744D730a1d98d8DC97c42F0Ca46aD7146',
    '0xF977814e90dA44bFA03b6295A0616a897441aceC',
    '0x8eb8a3b98659Cce290402893d0123abb75E3ab28',
    '0xdFd5293D8e347dFe59E90eFd55b2956a1343963d',
    '0x46705dfff24256421A05D056c29E81Bdc09723B8'
  ];

  private tokens = {
    'MON': { address: '0x0000000000000000000000000000000000000000', decimals: 18, price: 0.85 },
    'USDC': { address: '0xa0b86a33e6351ccf59e5af6d5a4c1b7c8bc69e9a', decimals: 6, price: 1.00 },
    'ETH': { address: '0x4200000000000000000000000000000000000006', decimals: 18, price: 2450.00 },
    'WBTC': { address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', decimals: 8, price: 43200.00 },
    'LINK': { address: '0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6', decimals: 18, price: 14.75 },
    'UNI': { address: '0x6fd9d7AD17242c41f7131d257212c54A0e816691', decimals: 18, price: 7.23 }
  };

  generateSmartMoneyWallets(count: number = 20): MockSmartMoneyWallet[] {
    return Array.from({ length: count }, (_, i) => {
      const address = this.whaleAddresses[i % this.whaleAddresses.length] || this.generateRandomAddress();
      const isWhale = Math.random() > 0.3; // 70% whales
      const pattern = this.getRandomPattern();
      
      const baseVolume = isWhale 
        ? (500000 + Math.random() * 2000000) // $500K - $2.5M
        : (50000 + Math.random() * 200000);  // $50K - $250K

      const txCount = isWhale 
        ? (200 + Math.floor(Math.random() * 800))
        : (50 + Math.floor(Math.random() * 200));

      const score = this.calculateWalletScore(baseVolume, txCount, pattern);

      return {
        address,
        totalVolume: (baseVolume * (0.8 + Math.random() * 0.4)).toFixed(0), // Add variance
        transactionCount: txCount,
        score,
        tags: this.generateWalletTags(isWhale, pattern, score),
        isWhale,
        recentActivity: this.generateRecentActivity(address, isWhale),
        profile: {
          firstSeen: Date.now() - (30 + Math.random() * 300) * 24 * 60 * 60 * 1000, // 30-330 days ago
          avgTxSize: (baseVolume / txCount).toFixed(0),
          favoriteTokens: this.getFavoriteTokens(pattern),
          tradingPattern: pattern
        }
      };
    });
  }

  generateDEXTrades(count: number = 50): MockDEXTrade[] {
    const protocols = ['UniswapV2', 'UniswapV3', 'SushiSwap', 'Curve', '1inch'];
    const smartWallets = this.whaleAddresses.slice(0, 8);

    return Array.from({ length: count }, (_, i) => {
      const isSmartMoney = Math.random() > 0.4; // 60% smart money trades
      const trader = isSmartMoney 
        ? smartWallets[Math.floor(Math.random() * smartWallets.length)]
        : this.generateRandomAddress();

      const tokenInKey = this.getRandomToken();
      const tokenOutKey = this.getRandomToken(tokenInKey);
      const tokenIn = this.tokens[tokenInKey as keyof typeof this.tokens];
      const tokenOut = this.tokens[tokenOutKey as keyof typeof this.tokens];

      const baseAmount = isSmartMoney 
        ? (10000 + Math.random() * 100000) // $10K - $110K
        : (100 + Math.random() * 5000);    // $100 - $5K

      const amountInUSD = baseAmount;
      const amountOutUSD = amountInUSD * (0.997 - Math.random() * 0.01); // Account for slippage/fees

      const amountIn = ((amountInUSD / tokenIn.price) * Math.pow(10, tokenIn.decimals)).toFixed(0);
      const amountOut = ((amountOutUSD / tokenOut.price) * Math.pow(10, tokenOut.decimals)).toFixed(0);

      return {
        id: `trade_${Date.now()}_${i}`,
        trader,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn,
        amountOut,
        amountUSD: amountInUSD,
        dexProtocol: protocols[Math.floor(Math.random() * protocols.length)],
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000, // Last 7 days
        isSmartMoney,
        impact: this.getTradeImpact(amountInUSD)
      };
    });
  }

  generateMarketIntelligence(): MockMarketIntelligence {
    return {
      defiProtocols: [
        { name: 'MonadSwap', tvl: 45200000, change24h: 12.3, category: 'DEX', risk: 'low' },
        { name: 'MonadLend', tvl: 28750000, change24h: -3.2, category: 'Lending', risk: 'medium' },
        { name: 'MonadYield', tvl: 15890000, change24h: 8.7, category: 'Yield', risk: 'medium' },
        { name: 'MonadBridge', tvl: 8230000, change24h: 15.1, category: 'Bridge', risk: 'high' },
        { name: 'MonadStake', tvl: 6450000, change24h: 4.5, category: 'Staking', risk: 'low' }
      ],
      trendingTokens: [
        { symbol: 'MON', address: this.tokens.MON.address, priceUSD: 0.85, change24h: 15.2, volume24h: 2100000, marketCap: 850000000 },
        { symbol: 'mUSDC', address: this.tokens.USDC.address, priceUSD: 1.001, change24h: 0.1, volume24h: 5600000, marketCap: 1500000000 },
        { symbol: 'mETH', address: this.tokens.ETH.address, priceUSD: 2455.20, change24h: -2.1, volume24h: 3400000, marketCap: 295000000000 },
        { symbol: 'mBTC', address: this.tokens.WBTC.address, priceUSD: 43180.00, change24h: 3.7, volume24h: 1800000, marketCap: 850000000000 }
      ],
      socialSentiment: {
        overall: 'bullish',
        score: 72.5,
        mentions24h: 15840,
        trends: ['#MonadRising', '#DeFiSummer', '#SmartMoney', '#YieldFarming', '#L1Competition']
      },
      whaleAlerts: this.generateWhaleAlerts()
    };
  }

  generateEnhancedAlphaContent(issue: number): any {
    const marketIntel = this.generateMarketIntelligence();
    const smartWallets = this.generateSmartMoneyWallets(15);
    const dexTrades = this.generateDEXTrades(30);

    return {
      id: issue,
      title: `Weekly Alpha #${issue}`,
      subtitle: `Deep-dive market notes, catalysts, and actionable insights for this week on Monad.`,
      publishedAt: new Date().toISOString(),
      
      // Executive Summary
      executiveSummary: {
        weeklyTheme: "Monad DeFi Ecosystem Expansion",
        keyTakeaways: [
          "Smart money accumulation in MON tokens (+15.2% price action)",
          "DeFi TVL growth to $104.52M across 5 major protocols",
          "$8.2M in whale movements indicating institutional interest",
          "Cross-chain bridge activity suggesting ecosystem growth"
        ],
        riskFactors: [
          "Increased volatility in mBTC pairs",
          "Potential liquidity fragmentation across DEXs",
          "Regulatory uncertainty affecting bridge operations"
        ]
      },

      // Market Structure Analysis
      marketStructure: {
        overview: "Monad testnet showing strong fundamentals with increasing institutional adoption",
        liquidityAnalysis: {
          totalTVL: marketIntel.defiProtocols.reduce((sum, p) => sum + p.tvl, 0),
          dominantProtocols: marketIntel.defiProtocols.slice(0, 3),
          concentrationRisk: "Medium - Top 3 protocols control 68% of TVL"
        },
        tradingVolume: {
          spot24h: 12900000,
          derivatives24h: 0,
          crossChain24h: 2100000
        }
      },

      // Smart Money Insights
      smartMoneyInsights: {
        topWallets: smartWallets.filter(w => w.isWhale).slice(0, 10),
        behaviorPatterns: {
          accumulation: smartWallets.filter(w => w.profile.tradingPattern === 'accumulator').length,
          arbitrage: smartWallets.filter(w => w.profile.tradingPattern === 'arbitrager').length,
          whales: smartWallets.filter(w => w.profile.tradingPattern === 'whale').length
        },
        weeklyFlow: {
          netInflow: 15200000,
          largestTrade: Math.max(...dexTrades.map(t => t.amountUSD)),
          activeTraders: new Set(dexTrades.map(t => t.trader)).size
        }
      },

      // Technical Analysis
      technicalAnalysis: {
        monadPrice: {
          current: 0.85,
          support: [0.78, 0.72, 0.65],
          resistance: [0.92, 1.05, 1.20],
          trend: "Bullish breakout from consolidation",
          rsi: 67.3,
          volume: "Above average with smart money accumulation"
        },
        keyLevels: {
          critical: "Break above $0.92 could trigger momentum to $1.05",
          invalidation: "Daily close below $0.78 would signal weakness"
        }
      },

      // Catalysts & Events
      catalysts: {
        thisWeek: [
          "MonadSwap V2 launch announcement",
          "Major CEX listing discussions",
          "Institutional fund allocation rumors"
        ],
        nextWeek: [
          "Mainnet launch timeline update",
          "Partnership announcements expected",
          "DeFi protocol integrations"
        ],
        longTerm: [
          "EVM compatibility improvements",
          "Cross-chain infrastructure expansion",
          "Institutional custody solutions"
        ]
      },

      // Actionable Insights
      actionableInsights: [
        {
          type: "accumulation",
          confidence: "High",
          timeframe: "1-2 weeks",
          action: "MON accumulation on dips to $0.78-0.80 range",
          reasoning: "Smart money flow and technical breakout pattern"
        },
        {
          type: "defi",
          confidence: "Medium",
          timeframe: "2-4 weeks", 
          action: "Monitor MonadLend yield opportunities",
          reasoning: "TVL growing but rates still attractive"
        },
        {
          type: "risk",
          confidence: "High",
          timeframe: "Immediate",
          action: "Reduce exposure above $0.95 resistance",
          reasoning: "Overbought conditions developing"
        }
      ],

      // Social & Sentiment
      sentiment: {
        overall: marketIntel.socialSentiment.overall,
        score: marketIntel.socialSentiment.score,
        keyNarratives: [
          "Monad as Ethereum killer narrative gaining traction",
          "DeFi summer 2.0 comparisons emerging",
          "Institutional adoption stories circulating"
        ],
        influencerTakes: [
          "Major crypto Twitter accounts discussing Monad tech",
          "DeFi researchers highlighting innovative features",
          "Trading communities sharing accumulation strategies"
        ]
      },

      // Data Sources
      dataSources: {
        onChain: "Envio indexer analyzing 50+ smart money wallets",
        market: "Real-time pricing and volume from DEX aggregators",
        social: "Sentiment analysis from 15K+ mentions",
        institutional: "Whale wallet tracking and flow analysis"
      },

      // Generated timestamp
      generatedAt: new Date().toISOString(),
      analyticsVersion: "2.1.0"
    };
  }

  private generateRandomAddress(): string {
    return '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private getRandomPattern(): 'accumulator' | 'arbitrager' | 'whale' | 'degen' {
    const patterns = ['accumulator', 'arbitrager', 'whale', 'degen'] as const;
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  private calculateWalletScore(volume: number, txCount: number, pattern: string): number {
    let score = 0;
    
    // Volume score (0-300)
    score += Math.min(300, (volume / 1000000) * 100);
    
    // Frequency score (0-200)
    score += Math.min(200, txCount * 0.5);
    
    // Pattern bonus
    const patternBonus = {
      'whale': 100,
      'accumulator': 80,
      'arbitrager': 60,
      'degen': 20
    };
    score += patternBonus[pattern] || 0;
    
    return Math.round(score);
  }

  private generateWalletTags(isWhale: boolean, pattern: string, score: number): string[] {
    const tags = [];
    
    if (isWhale) tags.push('whale');
    if (score > 400) tags.push('high-scorer');
    if (pattern === 'arbitrager') tags.push('arbitrage-bot');
    if (pattern === 'accumulator') tags.push('long-term-holder');
    if (Math.random() > 0.7) tags.push('early-adopter');
    if (Math.random() > 0.8) tags.push('institutional');
    
    return tags;
  }

  private generateRecentActivity(address: string, isWhale: boolean) {
    const activityCount = isWhale ? 5 + Math.floor(Math.random() * 10) : 2 + Math.floor(Math.random() * 5);
    
    return Array.from({ length: activityCount }, () => ({
      timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
      type: ['transfer', 'swap', 'contract'][Math.floor(Math.random() * 3)] as 'transfer' | 'swap' | 'contract',
      amount: (1000 + Math.random() * 50000).toFixed(0),
      token: Object.keys(this.tokens)[Math.floor(Math.random() * Object.keys(this.tokens).length)]
    }));
  }

  private getFavoriteTokens(pattern: string): string[] {
    const allTokens = Object.keys(this.tokens);
    
    switch (pattern) {
      case 'whale':
        return ['ETH', 'WBTC', 'MON'];
      case 'arbitrager':
        return ['USDC', 'ETH', 'MON'];
      case 'accumulator':
        return ['MON', 'ETH', 'LINK'];
      case 'degen':
        return ['MON', 'UNI', 'LINK'];
      default:
        return allTokens.slice(0, 3);
    }
  }

  private getRandomToken(exclude?: string): string {
    const tokens = Object.keys(this.tokens).filter(t => t !== exclude);
    return tokens[Math.floor(Math.random() * tokens.length)];
  }

  private getTradeImpact(amountUSD: number): 'low' | 'medium' | 'high' {
    if (amountUSD > 50000) return 'high';
    if (amountUSD > 10000) return 'medium';
    return 'low';
  }

  private generateWhaleAlerts() {
    return Array.from({ length: 8 }, () => ({
      wallet: this.whaleAddresses[Math.floor(Math.random() * this.whaleAddresses.length)],
      amount: (100000 + Math.random() * 900000).toFixed(0),
      token: Object.keys(this.tokens)[Math.floor(Math.random() * Object.keys(this.tokens).length)],
      type: ['accumulation', 'distribution', 'transfer'][Math.floor(Math.random() * 3)] as 'accumulation' | 'distribution' | 'transfer',
      timestamp: Date.now() - Math.random() * 24 * 60 * 60 * 1000,
      significance: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high'
    }));
  }
}

export const mockDataGenerator = new MockDataGenerator();
export type { MockSmartMoneyWallet, MockDEXTrade, MockMarketIntelligence };

