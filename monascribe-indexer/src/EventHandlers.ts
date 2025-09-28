/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import {
  SubscriptionService,
  // ERC20Tokens, // Commented out - not available on Monad testnet yet
  // UniswapV2Pair, // Commented out - not available on Monad testnet yet  
  // UniswapV3Pool, // Commented out - not available on Monad testnet yet
  SubscriptionService_PlanCreated,
  SubscriptionService_Subscribed,
  SubscriptionService_SubscriptionCancelled,
  TokenTransfer,
  LargeTransaction,
  DEXTrade,
  SmartMoneyWallet,
  SmartMoneyScore,
} from "generated";

import { initializeMongoSync, getMongoSyncService } from "./MongoSync";

// Import external data effects - temporarily disabled for testing
// import {
//   getTokenPrices,
//   getDeFiMetrics,
//   getMarketSentiment,
//   getWhaleIntelligence,
//   getMacroIndicators
// } from "./ExternalEffects";

// Constants for smart money detection
const LARGE_TRANSFER_THRESHOLD = BigInt("1000000000000000000000"); // 1000 tokens (18 decimals)
const LARGE_ETH_THRESHOLD = BigInt("10000000000000000000"); // 10 ETH
const WHALE_VOLUME_THRESHOLD = BigInt("100000000000000000000000"); // 100k tokens
const HIGH_GAS_THRESHOLD = BigInt("1000000000000000000"); // 1 ETH in gas

// Initialize MongoDB sync service
const mongoUri = process.env.MONGODB_URI || "mongodb+srv://adebamzzw1_db_user:GSZXxpbNIdVjZSQc@cluster0.fbquz94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const dbName = process.env.MONGODB_DB || "monascribe_analytics";
const mongoSync = initializeMongoSync(mongoUri, dbName);

// Original subscription handlers
SubscriptionService.PlanCreated.handler(async ({ event, context }) => {
  const entity: SubscriptionService_PlanCreated = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    planId: event.params.planId,
    title: event.params.title,
    price: event.params.price,
    duration: event.params.duration,
  };

  context.SubscriptionService_PlanCreated.set(entity);
});

SubscriptionService.Subscribed.handler(async ({ event, context }) => {
  const entity: SubscriptionService_Subscribed = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriber: event.params.subscriber.toLowerCase(),
    planId: event.params.planId,
    expiresAt: event.params.expiresAt,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.SubscriptionService_Subscribed.set(entity);
  
  // Update smart money tracking for subscriber
  await updateSmartMoneyWallet(event.params.subscriber.toLowerCase(), event, context);
  
  // Sync to MongoDB periodically
  if (!context.isPreload && event.block.number % 10 === 0) {
    try {
      const syncService = getMongoSyncService();
      if (syncService) {
        await syncService.syncSubscriptionEvents(context);
        await syncService.syncSmartMoneyData(context);
      }
    } catch (error) {
      console.log('MongoDB sync failed:', error);
    }
  }
  
  // Market intelligence gathering - temporarily disabled for testing
  // Will be re-enabled once Effect API schema is properly configured
  if (!context.isPreload && event.block.number % 100 === 0) {
    try {
      // Store enhanced tracking metadata
      const walletId = event.params.subscriber.toLowerCase();
      const wallet = await context.SmartMoneyWallet.get(walletId);
      if (wallet) {
        const enrichedWallet: SmartMoneyWallet = {
          ...wallet,
          tags: [...wallet.tags, "enhanced_analytics"]
        };
        context.SmartMoneyWallet.set(enrichedWallet);
      }
    } catch (error) {
      console.log('Enhanced analytics failed:', error);
    }
  }
});

SubscriptionService.SubscriptionCancelled.handler(async ({ event, context }) => {
  const entity: SubscriptionService_SubscriptionCancelled = {
    id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    subscriber: event.params.subscriber.toLowerCase(),
    planId: event.params.planId,
    cancelledAt: event.params.cancelledAt,
    blockNumber: BigInt(event.block.number),
    transactionHash: event.transaction.hash,
    timestamp: BigInt(event.block.timestamp),
  };

  context.SubscriptionService_SubscriptionCancelled.set(entity);
});

// ERC20 Token Transfer Handler - COMMENTED OUT (no ERC20 contracts configured yet)
// ERC20Tokens.Transfer.handler(async ({ event, context }) => {
//   // Skip null addresses and zero transfers
//   if (event.params.from === "0x0000000000000000000000000000000000000000" || 
//       event.params.to === "0x0000000000000000000000000000000000000000" ||
//       event.params.value === BigInt(0)) {
//     return;
//   }

//   const isLargeTransfer = event.params.value >= LARGE_TRANSFER_THRESHOLD;
  
//   // Get token price data for USD value calculation - temporarily disabled
//   let valueUSD: bigint | undefined = undefined;
//   // Temporary mock price calculation
//   try {
//     if (!context.isPreload) {
//       const mockPrice = Math.random() * 1000 + 10; // Random price $10-$1010
//       const tokenAmount = Number(event.params.value) / Math.pow(10, 18); // Assuming 18 decimals
//       valueUSD = BigInt(Math.round(tokenAmount * mockPrice * 100)); // Store as cents
//     }
//   } catch (error) {
//     console.log('Price calculation failed:', error);
//   }
  
//   const entity: TokenTransfer = {
//     id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
//     token: event.srcAddress.toLowerCase(),
//     from: event.params.from.toLowerCase(),
//     to: event.params.to.toLowerCase(),
//     value: event.params.value,
//     blockNumber: BigInt(event.block.number),
//     transactionHash: event.transaction.hash,
//     timestamp: BigInt(event.block.timestamp),
//     isLargeTransfer,
//     valueUSD: valueUSD,
//   };

//   context.TokenTransfer.set(entity);

//   // Track large transfers for smart money detection
//   if (isLargeTransfer) {
//     await updateSmartMoneyWallet(event.params.from.toLowerCase(), event, context);
//     await updateSmartMoneyWallet(event.params.to.toLowerCase(), event, context);
//   }
// });

// UniswapV2 Swap Handler - COMMENTED OUT (no DEX contracts configured yet)
// UniswapV2Pair.Swap.handler(async ({ event, context }) => {
//   const trader = (event.transaction.from || event.params.sender).toLowerCase();
//   const totalAmountIn = event.params.amount0In + event.params.amount1In;
//   const totalAmountOut = event.params.amount0Out + event.params.amount1Out;
  
//   const entity: DEXTrade = {
//     id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
//     trader,
//     tokenIn: "unknown", // Would need pair info to determine exact tokens
//     tokenOut: "unknown",
//     amountIn: totalAmountIn,
//     amountOut: totalAmountOut,
//     dexProtocol: "UniswapV2",
//     blockNumber: BigInt(event.block.number),
//     transactionHash: event.transaction.hash,
//     timestamp: BigInt(event.block.timestamp),
//     isSmartMoney: undefined,
//   };

//   context.DEXTrade.set(entity);
  
//   // Large trades indicate potential smart money
//   if (totalAmountIn >= LARGE_TRANSFER_THRESHOLD || totalAmountOut >= LARGE_TRANSFER_THRESHOLD) {
//     await updateSmartMoneyWallet(trader, event, context);
//   }
// });

// UniswapV3 Swap Handler - COMMENTED OUT (no DEX contracts configured yet)
// UniswapV3Pool.Swap.handler(async ({ event, context }) => {
//   const trader = (event.transaction.from || event.params.sender).toLowerCase();
//   const amount0Abs = event.params.amount0 < 0 ? -event.params.amount0 : event.params.amount0;
//   const amount1Abs = event.params.amount1 < 0 ? -event.params.amount1 : event.params.amount1;
  
//   const entity: DEXTrade = {
//     id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
//     trader,
//     tokenIn: "unknown",
//     tokenOut: "unknown", 
//     amountIn: amount0Abs,
//     amountOut: amount1Abs,
//     dexProtocol: "UniswapV3",
//     blockNumber: BigInt(event.block.number),
//     transactionHash: event.transaction.hash,
//     timestamp: BigInt(event.block.timestamp),
//     isSmartMoney: undefined,
//   };

//   context.DEXTrade.set(entity);
  
//   // Large V3 trades indicate sophisticated trading
//   if (amount0Abs >= LARGE_TRANSFER_THRESHOLD || amount1Abs >= LARGE_TRANSFER_THRESHOLD) {
//     await updateSmartMoneyWallet(trader, event, context);
//   }
// });

// Helper function to update smart money wallet tracking
async function updateSmartMoneyWallet(address: string, event: any, context: any) {
  // Skip during preload to avoid duplicate processing
  if (context.isPreload) {
    return;
  }

  const walletId = address.toLowerCase();
  let wallet = await context.SmartMoneyWallet.get(walletId);
  
  const txValue = event.transaction.value || BigInt(0);
  const gasUsed = BigInt(event.transaction.gasUsed || 0);
  const gasPrice = BigInt(event.transaction.gasPrice || 0);
  const gasCost = gasUsed * gasPrice;
  
  if (!wallet) {
    // Create new smart money wallet entry
    wallet = {
      id: walletId,
      address: walletId,
      totalVolume: txValue,
      transactionCount: BigInt(1),
      firstSeen: BigInt(event.block.timestamp),
      lastActive: BigInt(event.block.timestamp),
      scoreComponents_id: `${walletId}_score`,
      isWhale: false,
      tags: [],
    };
  } else {
    // Update existing wallet
    wallet = {
      ...wallet,
      totalVolume: wallet.totalVolume + txValue,
      transactionCount: wallet.transactionCount + BigInt(1),
      lastActive: BigInt(event.block.timestamp),
    };
  }

  // Determine if wallet is a whale based on activity
  const isWhale = wallet.totalVolume >= WHALE_VOLUME_THRESHOLD || 
                  gasCost >= HIGH_GAS_THRESHOLD ||
                  wallet.transactionCount >= BigInt(100);
  
  // Update tags based on behavior
  const tags: string[] = [];
  if (isWhale) tags.push("whale");
  if (gasCost >= HIGH_GAS_THRESHOLD) tags.push("high-gas-user");
  if (wallet.transactionCount >= BigInt(50)) tags.push("active-trader");
  if (event.srcAddress === "0x74193a1a4fF15eC8A9c3e11fd040E2c62BDCE7Fb") tags.push("subscriber");

  const updatedWallet: SmartMoneyWallet = {
    ...wallet,
    isWhale,
    tags,
  };

  context.SmartMoneyWallet.set(updatedWallet);
  
  // Update smart money score
  await updateSmartMoneyScore(walletId, updatedWallet, context);
}

// Helper function to calculate and update smart money scores
async function updateSmartMoneyScore(walletId: string, wallet: SmartMoneyWallet, context: any) {
  const scoreId = `${walletId}_score`;
  
  // Calculate various score components (0-100 scale, then convert to BigInt)
  const volumeScore = Math.min(100, Number(wallet.totalVolume) / Number(WHALE_VOLUME_THRESHOLD) * 100);
  const frequencyScore = Math.min(100, Number(wallet.transactionCount) * 2); // 2 points per tx, max 100
  
  const daysSinceFirst = (Number(wallet.lastActive) - Number(wallet.firstSeen)) / (24 * 60 * 60);
  const diversityScore = wallet.tags.length * 20; // 20 points per tag type
  
  // Timing score based on recency of activity
  const hoursAgo = (Date.now() / 1000 - Number(wallet.lastActive)) / 3600;
  const timingScore = Math.max(0, 100 - hoursAgo); // Decay over time
  
  const totalScore = Math.min(500, volumeScore + frequencyScore + diversityScore + timingScore);
  
  const scoreEntity: SmartMoneyScore = {
    id: scoreId,
    wallet_id: walletId,
    totalScore: BigInt(Math.round(totalScore)),
    volumeScore: BigInt(Math.round(volumeScore)),
    frequencyScore: BigInt(Math.round(frequencyScore)), 
    diversityScore: BigInt(Math.round(diversityScore)),
    timingScore: BigInt(Math.round(timingScore)),
    lastUpdated: BigInt(Math.floor(Date.now() / 1000)),
  };

  context.SmartMoneyScore.set(scoreEntity);
}
