import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Crown, AlertCircle, Activity, Star, Plus, Trash2, Bell, Brain } from 'lucide-react';

interface VIPTierData {
  whaleTracking: Array<{
    address: string;
    rank: number;
    totalVolume: number;
    transactionCount: number;
    lastActivity: Date;
    topMovements: Array<{
      token: string;
      amount: number;
      value: number;
      timestamp: Date;
      type: 'in' | 'out';
    }>;
    portfolioValue: number;
    riskScore: number;
  }>;
  watchlist: Array<{
    id: string;
    userId: string;
    type: 'token' | 'wallet' | 'contract';
    identifier: string;
    name: string;
    addedAt: Date;
    alerts: {
      priceChange: number;
      volumeSpike: number;
      whaleActivity: boolean;
    };
  }>;
  recentAlerts: Array<{
    id: string;
    userId: string;
    type: 'whale_tx' | 'big_swap' | 'sentiment_flip' | 'price_alert' | 'volume_spike';
    title: string;
    message: string;
    timestamp: Date;
    data: any;
    read: boolean;
  }>;
  aiSummary: {
    id: string;
    week: number;
    summary: string;
    keyMetrics: {
      whaleActivity: number;
      dexVolume: number;
      sentimentScore: number;
      topNarratives: string[];
    };
    generatedAt: Date;
  } | null;
}

interface VIPTierFeaturesProps {
  userAddress: string;
}

export default function VIPTierFeatures({ userAddress }: VIPTierFeaturesProps) {
  const [data, setData] = useState<VIPTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchWallet, setSearchWallet] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [newWatchlistItem, setNewWatchlistItem] = useState({
    type: 'token' as 'token' | 'wallet' | 'contract',
    identifier: '',
    name: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/vip/features?address=${userAddress}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch VIP tier data');
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

  const handleWalletSearch = async () => {
    if (!searchWallet.trim()) return;
    
    try {
      const response = await fetch(`/api/vip/features?address=${userAddress}&action=search-wallet&walletAddress=${searchWallet}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to search wallet');
      }
      
      setSearchResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    }
  };

  const handleAddToWatchlist = async () => {
    if (!newWatchlistItem.identifier.trim() || !newWatchlistItem.name.trim()) return;
    
    try {
      const response = await fetch('/api/vip/watchlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          ...newWatchlistItem
        })
      });
      
      if (response.ok) {
        setNewWatchlistItem({ type: 'token', identifier: '', name: '' });
        // Refresh data
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to watchlist');
    }
  };

  const handleRemoveFromWatchlist = async (itemId: string) => {
    try {
      const response = await fetch('/api/vip/watchlist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: userAddress,
          itemId
        })
      });
      
      if (response.ok) {
        // Refresh data
        window.location.reload();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from watchlist');
    }
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `$${(volume / 1e3).toFixed(2)}K`;
    return `$${volume.toFixed(0)}`;
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 80) return 'text-red-500';
    if (risk >= 60) return 'text-orange-500';
    if (risk >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'whale_tx': return 'bg-red-100 text-red-800';
      case 'big_swap': return 'bg-blue-100 text-blue-800';
      case 'sentiment_flip': return 'bg-yellow-100 text-yellow-800';
      case 'price_alert': return 'bg-green-100 text-green-800';
      case 'volume_spike': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading VIP tier features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Error loading VIP tier features: {error}</p>
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
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center">
          <Crown className="w-6 h-6 mr-2 text-yellow-500" />
          VIP Tier Features
        </h2>
        <p className="text-gray-600">Full control, personalization, and exclusive access</p>
      </div>

      <Tabs defaultValue="whale-tracking" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whale-tracking">Whale Tracking</TabsTrigger>
          <TabsTrigger value="wallet-search">Wallet Search</TabsTrigger>
          <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="whale-tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                🐋 Whale Tracking Dashboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.whaleTracking.length > 0 ? (
                <div className="space-y-4">
                  {data.whaleTracking.map((whale) => (
                    <div key={whale.address} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">#{whale.rank}</Badge>
                            <h4 className="font-semibold text-sm font-mono">
                              {whale.address.slice(0, 8)}...{whale.address.slice(-6)}
                            </h4>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Last activity: {new Date(whale.lastActivity).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatVolume(whale.totalVolume)}</div>
                          <div className="text-xs text-gray-600">
                            Risk: <span className={getRiskColor(whale.riskScore)}>{whale.riskScore}/100</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Transactions</div>
                          <div className="font-semibold">{whale.transactionCount.toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Portfolio Value</div>
                          <div className="font-semibold">{formatVolume(whale.portfolioValue)}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Top Movements</div>
                          <div className="font-semibold">{whale.topMovements.length}</div>
                        </div>
                      </div>
                      
                      {whale.topMovements.length > 0 && (
                        <div className="mt-3">
                          <div className="text-xs text-gray-600 mb-2">Recent Movements</div>
                          <div className="space-y-1">
                            {whale.topMovements.slice(0, 3).map((movement, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="font-mono">
                                  {movement.type === 'in' ? '⬇️' : '⬆️'} {movement.token}
                                </span>
                                <span className="text-gray-600">
                                  {formatVolume(movement.value)} • {new Date(movement.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No whale tracking data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet-search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2 text-green-500" />
                🔍 Wallet Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter wallet address (0x...)"
                  value={searchWallet}
                  onChange={(e) => setSearchWallet(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleWalletSearch}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
              
              {searchResult && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-3">
                    {searchResult.address.slice(0, 8)}...{searchResult.address.slice(-6)}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-gray-600">Transactions</div>
                      <div className="font-semibold">{searchResult.transactionCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Total Volume</div>
                      <div className="font-semibold">{formatVolume(searchResult.totalVolume)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">First Seen</div>
                      <div className="font-semibold">{new Date(searchResult.firstSeen).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Last Activity</div>
                      <div className="font-semibold">{new Date(searchResult.lastActivity).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {searchResult.topContracts.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Top Contracts</div>
                      <div className="space-y-1">
                        {searchResult.topContracts.map((contract: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="font-mono">{contract.name}</span>
                            <span className="text-gray-600">
                              {contract.txCount} tx • {formatVolume(contract.volume)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watchlist" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="w-5 h-5 mr-2 text-yellow-500" />
                📌 Custom Watchlist
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add new item */}
              <div className="border rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-sm mb-3">Add to Watchlist</h4>
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <select
                      value={newWatchlistItem.type}
                      onChange={(e) => setNewWatchlistItem({...newWatchlistItem, type: e.target.value as any})}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="token">Token</option>
                      <option value="wallet">Wallet</option>
                      <option value="contract">Contract</option>
                    </select>
                    <Input
                      placeholder="Identifier (e.g., bitcoin, 0x...)"
                      value={newWatchlistItem.identifier}
                      onChange={(e) => setNewWatchlistItem({...newWatchlistItem, identifier: e.target.value})}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Display name"
                      value={newWatchlistItem.name}
                      onChange={(e) => setNewWatchlistItem({...newWatchlistItem, name: e.target.value})}
                      className="flex-1"
                    />
                    <Button onClick={handleAddToWatchlist}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Watchlist items */}
              {data.watchlist.length > 0 ? (
                <div className="space-y-2">
                  {data.watchlist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{item.type}</Badge>
                          <h4 className="font-semibold text-sm">{item.name}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {item.identifier} • Added {new Date(item.addedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFromWatchlist(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No items in watchlist</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2 text-red-500" />
                ⚡ Real-time Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentAlerts.length > 0 ? (
                <div className="space-y-3">
                  {data.recentAlerts.map((alert) => (
                    <div key={alert.id} className={`border-l-4 pl-4 py-2 ${alert.read ? 'border-gray-300' : 'border-red-500'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <Badge className={getAlertTypeColor(alert.type)}>
                              {alert.type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No recent alerts</p>
              )}
            </CardContent>
          </Card>
          
          {/* AI Summary */}
          {data.aiSummary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-500" />
                  🤖 AI-Powered Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {data.aiSummary.summary}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Whale Activity</div>
                      <div className="font-semibold">+{data.aiSummary.keyMetrics.whaleActivity.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">DEX Volume</div>
                      <div className="font-semibold">{formatVolume(data.aiSummary.keyMetrics.dexVolume)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Sentiment Score</div>
                      <div className="font-semibold">{data.aiSummary.keyMetrics.sentimentScore.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Top Narratives</div>
                      <div className="font-semibold">{data.aiSummary.keyMetrics.topNarratives.join(', ')}</div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    Generated: {new Date(data.aiSummary.generatedAt).toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
