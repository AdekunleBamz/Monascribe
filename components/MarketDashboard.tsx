import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';

interface MarketData {
  bitcoin?: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
  };
  ethereum?: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
  };
  monad?: {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
  };
}

interface TrendingCoin {
  item: {
    id: string;
    name: string;
    symbol: string;
    thumb: string;
    market_cap_rank: number;
  };
}

interface Top10Coin {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  price_change_percentage_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface VIPCoinData {
  id: string;
  symbol: string;
  name: string;
  market_data: {
    current_price: { usd: number };
    market_cap: { usd: number };
    total_volume: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
  };
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
  sparkline_7d: number[];
}

interface MarketDashboardProps {
  userTier: 'basic' | 'premium' | 'vip';
  userAddress: string;
}

export default function MarketDashboard({ userTier, userAddress }: MarketDashboardProps) {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [top10Coins, setTop10Coins] = useState<Top10Coin[]>([]);
  const [vipCoinData, setVipCoinData] = useState<VIPCoinData | null>(null);
  const [searchCoin, setSearchCoin] = useState('bitcoin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/market/${userTier}?address=${userAddress}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch market data');
      }
      
      if (userTier === 'basic') {
        setMarketData(data.data);
      } else if (userTier === 'premium') {
        setMarketData(data.data.basic);
        setTrendingCoins(data.data.trending || []);
        setTop10Coins(data.data.top10 || []);
      } else if (userTier === 'vip') {
        setVipCoinData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchVIPCoin = async (coinId: string) => {
    if (userTier !== 'vip') return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/market/vip?address=${userAddress}&coinId=${coinId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coin data');
      }
      
      setVipCoinData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, [userTier, userAddress]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toFixed(0)}`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? '📈' : '📉';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading market data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-500">
        <span className="mr-2">⚠️</span>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Market Dashboard</h2>
        <Badge variant="outline" className="capitalize">
          {userTier} Tier
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trending" disabled={userTier === 'basic'}>
            Trending
          </TabsTrigger>
          <TabsTrigger value="search" disabled={userTier !== 'vip'}>
            Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Basic Tier - Top 3 Cryptos */}
          {userTier === 'basic' && marketData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketData.bitcoin && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <span className="w-6 h-6 bg-orange-500 rounded-full mr-2"></span>
                      Bitcoin
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{formatPrice(marketData.bitcoin.usd)}</div>
                      <div className={`flex items-center ${getChangeColor(marketData.bitcoin.usd_24h_change)}`}>
                        <span className="mr-1">{getChangeIcon(marketData.bitcoin.usd_24h_change)}</span>
                        <span>{marketData.bitcoin.usd_24h_change.toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Market Cap: {formatMarketCap(marketData.bitcoin.usd_market_cap)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {marketData.ethereum && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <span className="w-6 h-6 bg-blue-500 rounded-full mr-2"></span>
                      Ethereum
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{formatPrice(marketData.ethereum.usd)}</div>
                      <div className={`flex items-center ${getChangeColor(marketData.ethereum.usd_24h_change)}`}>
                        <span className="mr-1">{getChangeIcon(marketData.ethereum.usd_24h_change)}</span>
                        <span>{marketData.ethereum.usd_24h_change.toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Market Cap: {formatMarketCap(marketData.ethereum.usd_market_cap)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {marketData.monad && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <span className="w-6 h-6 bg-purple-500 rounded-full mr-2"></span>
                      Monad
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">{formatPrice(marketData.monad.usd)}</div>
                      <div className={`flex items-center ${getChangeColor(marketData.monad.usd_24h_change)}`}>
                        <span className="mr-1">{getChangeIcon(marketData.monad.usd_24h_change)}</span>
                        <span>{marketData.monad.usd_24h_change.toFixed(2)}%</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Market Cap: {formatMarketCap(marketData.monad.usd_market_cap)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Premium Tier - Top 10 + Trending */}
          {userTier === 'premium' && (
            <div className="space-y-6">
              {/* Top 10 Coins */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Top 10 Cryptocurrencies</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {top10Coins.map((coin) => (
                    <Card key={coin.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{coin.name}</span>
                          <Badge variant="outline">#{coin.market_cap}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="text-lg font-bold">{formatPrice(coin.current_price)}</div>
                          <div className={`flex items-center ${getChangeColor(coin.price_change_percentage_24h)}`}>
                            <span className="mr-1">{getChangeIcon(coin.price_change_percentage_24h)}</span>
                            <span>{coin.price_change_percentage_24h.toFixed(2)}%</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Market Cap: {formatMarketCap(coin.market_cap)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIP Tier - Full Coin Details */}
          {userTier === 'vip' && vipCoinData && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center">
                    <span className="w-8 h-8 bg-blue-500 rounded-full mr-3"></span>
                    {vipCoinData.name} ({vipCoinData.symbol.toUpperCase()})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Current Price</div>
                      <div className="text-2xl font-bold">
                        {formatPrice(vipCoinData.market_data.current_price.usd)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Market Cap</div>
                      <div className="text-lg font-semibold">
                        {formatMarketCap(vipCoinData.market_data.market_cap.usd)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">24h Volume</div>
                      <div className="text-lg font-semibold">
                        {formatMarketCap(vipCoinData.market_data.total_volume.usd)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">24h Change</div>
                      <div className={`flex items-center ${getChangeColor(vipCoinData.market_data.price_change_percentage_24h)}`}>
                        <span className="mr-1">{getChangeIcon(vipCoinData.market_data.price_change_percentage_24h)}</span>
                        <span>{vipCoinData.market_data.price_change_percentage_24h.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">7d Change</div>
                      <div className={`flex items-center ${getChangeColor(vipCoinData.market_data.price_change_percentage_7d)}`}>
                        <span className="mr-1">{getChangeIcon(vipCoinData.market_data.price_change_percentage_7d)}</span>
                        <span>{vipCoinData.market_data.price_change_percentage_7d.toFixed(2)}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">30d Change</div>
                      <div className={`flex items-center ${getChangeColor(vipCoinData.market_data.price_change_percentage_30d)}`}>
                        <span className="mr-1">{getChangeIcon(vipCoinData.market_data.price_change_percentage_30d)}</span>
                        <span>{vipCoinData.market_data.price_change_percentage_30d.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  {vipCoinData.description.en && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Description</div>
                      <div className="text-sm leading-relaxed">
                        {vipCoinData.description.en.substring(0, 500)}
                        {vipCoinData.description.en.length > 500 && '...'}
                      </div>
                    </div>
                  )}

                  {vipCoinData.links.homepage && vipCoinData.links.homepage.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">Links</div>
                      <div className="space-y-1">
                        {vipCoinData.links.homepage.slice(0, 3).map((link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm block"
                          >
                            {link}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-4">
          {userTier === 'premium' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Trending Coins</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trendingCoins.map((coin, index) => (
                  <Card key={coin.item.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center">
                        <img
                          src={coin.item.thumb}
                          alt={coin.item.name}
                          className="w-6 h-6 mr-2 rounded-full"
                        />
                        {coin.item.name}
                        <Badge variant="outline" className="ml-2">
                          #{coin.item.market_cap_rank}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className="text-sm">⭐ Trending #{index + 1}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          {userTier === 'vip' && (
            <div>
              <div className="flex space-x-2 mb-4">
                <Input
                  placeholder="Enter coin ID (e.g., bitcoin, ethereum, solana)"
                  value={searchCoin}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchCoin(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => fetchVIPCoin(searchCoin)}>
                  🔍 Search
                </Button>
              </div>
              
              {vipCoinData && (
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleString()}
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
