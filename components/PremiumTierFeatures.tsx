import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle, Activity, BarChart3, Target } from 'lucide-react';

interface PremiumTierData {
  smartMoneyAlerts: Array<{
    walletAddress: string;
    contractAddress: string;
    contractName: string;
    transactionCount: number;
    totalVolume: number;
    lastActivity: Date;
    alertType: 'high_volume' | 'new_contract' | 'unusual_activity';
  }>;
  dexActivity: Array<{
    protocol: string;
    contractAddress: string;
    volume24h: number;
    volume7d: number;
    liquidityChange: number;
    tradeCount: number;
    uniqueTraders: number;
    topTokens: Array<{
      symbol: string;
      volume: number;
      priceChange: number;
    }>;
  }>;
  historicalComparisons: Array<{
    metric: string;
    currentWeek: number;
    previousWeek: number;
    change: number;
    changePercentage: number;
  }>;
  tokenNarratives: Array<{
    token: string;
    symbol: string;
    narrative: string;
    category: 'AI' | 'DeFi' | 'Gaming' | 'Infrastructure' | 'Meme' | 'Layer1' | 'Layer2';
    sentiment: 'bullish' | 'bearish' | 'neutral';
    keyEvents: string[];
    marketCap: number;
    priceChange24h: number;
  }>;
  analysisNotes: string[];
}

interface PremiumTierFeaturesProps {
  userAddress: string;
}

export default function PremiumTierFeatures({ userAddress }: PremiumTierFeaturesProps) {
  const [data, setData] = useState<PremiumTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/premium/features?address=${userAddress}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch premium tier data');
        }
        
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userAddress]);

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'text-green-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AI': return 'bg-purple-100 text-purple-800';
      case 'DeFi': return 'bg-blue-100 text-blue-800';
      case 'Gaming': return 'bg-green-100 text-green-800';
      case 'Infrastructure': return 'bg-gray-100 text-gray-800';
      case 'Meme': return 'bg-pink-100 text-pink-800';
      case 'Layer1': return 'bg-orange-100 text-orange-800';
      case 'Layer2': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'high_volume': return 'bg-red-100 text-red-800';
      case 'new_contract': return 'bg-blue-100 text-blue-800';
      case 'unusual_activity': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading premium tier features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Error loading premium tier features: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Premium Tier Features</h2>
        <p className="text-gray-600">Advanced analytics, smart money alerts, and deeper insights</p>
      </div>

      {/* Smart Money Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            🐋 Smart Money Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.smartMoneyAlerts.length > 0 ? (
            <div className="space-y-3">
              {data.smartMoneyAlerts.slice(0, 5).map((alert, index) => (
                <div key={index} className="border-l-4 border-red-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">
                        {alert.walletAddress.slice(0, 8)}...{alert.walletAddress.slice(-6)}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {alert.contractName} • {alert.transactionCount} transactions
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Volume: {formatVolume(alert.totalVolume)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertTypeColor(alert.alertType)}>
                        {alert.alertType.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No smart money alerts found</p>
          )}
        </CardContent>
      </Card>

      {/* DEX Activity Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
            🔄 DEX Activity Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.dexActivity.length > 0 ? (
            <div className="space-y-4">
              {data.dexActivity.slice(0, 3).map((dex, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{dex.protocol}</h4>
                    <Badge variant="outline">
                      {dex.uniqueTraders} traders
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">24h Volume</div>
                      <div className="font-semibold">{formatVolume(dex.volume24h)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">7d Volume</div>
                      <div className="font-semibold">{formatVolume(dex.volume7d)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Liquidity Change</div>
                      <div className={`flex items-center ${getChangeColor(dex.liquidityChange)}`}>
                        {getChangeIcon(dex.liquidityChange)}
                        <span className="ml-1">{dex.liquidityChange.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Trades</div>
                      <div className="font-semibold">{dex.tradeCount.toLocaleString()}</div>
                    </div>
                  </div>
                  
                  {dex.topTokens.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-600 mb-1">Top Tokens</div>
                      <div className="flex flex-wrap gap-1">
                        {dex.topTokens.slice(0, 3).map((token, tokenIndex) => (
                          <Badge key={tokenIndex} variant="outline" className="text-xs">
                            {token.symbol} {token.priceChange > 0 ? '+' : ''}{token.priceChange.toFixed(1)}%
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No DEX activity data available</p>
          )}
        </CardContent>
      </Card>

      {/* Historical Comparisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-500" />
            📊 Historical Comparisons
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.historicalComparisons.length > 0 ? (
            <div className="space-y-3">
              {data.historicalComparisons.map((comparison, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm capitalize">
                      {comparison.metric.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-xs text-gray-600">
                      This week: {comparison.currentWeek.toLocaleString()} • 
                      Last week: {comparison.previousWeek.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${getChangeColor(comparison.changePercentage)}`}>
                      {getChangeIcon(comparison.changePercentage)}
                      <span className="ml-1 font-semibold">
                        {comparison.changePercentage > 0 ? '+' : ''}{comparison.changePercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {comparison.change > 0 ? '+' : ''}{comparison.change.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No historical comparison data available</p>
          )}
        </CardContent>
      </Card>

      {/* Token Narratives */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-500" />
            🏷️ Top Token Narratives
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.tokenNarratives.length > 0 ? (
            <div className="space-y-4">
              {data.tokenNarratives.slice(0, 5).map((narrative, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">
                        {narrative.token} ({narrative.symbol.toUpperCase()})
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        Market Cap: {formatVolume(narrative.marketCap)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(narrative.category)}>
                        {narrative.category}
                      </Badge>
                      <span className={`text-sm ${getSentimentColor(narrative.sentiment)}`}>
                        {narrative.sentiment}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{narrative.narrative}</p>
                  
                  {narrative.keyEvents.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-1">Key Events</div>
                      <div className="flex flex-wrap gap-1">
                        {narrative.keyEvents.slice(0, 3).map((event, eventIndex) => (
                          <Badge key={eventIndex} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 text-right">
                    <span className={`text-sm ${getChangeColor(narrative.priceChange24h)}`}>
                      24h: {narrative.priceChange24h > 0 ? '+' : ''}{narrative.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No token narrative data available</p>
          )}
        </CardContent>
      </Card>

      {/* Exclusive Analysis Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            📌 Exclusive Analysis Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.analysisNotes.length > 0 ? (
            <div className="space-y-3">
              {data.analysisNotes.map((note, index) => (
                <div key={index} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <p className="text-sm text-gray-700">{note}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No analysis notes available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
