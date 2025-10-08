import { useState, useEffect } from 'react';

interface AlphaData {
  title: string;
  body: string;
  marketIntelligence: {
    defiMetrics: {
      totalValueLocked: number;
      volume24h: number;
      averageYield: number;
    };
    marketSentiment: {
      overall: string;
      fearGreedIndex: string;
      socialSentiment: string;
    };
    whaleIntelligence: {
      largeTransactions: number;
      activeWhales: number;
      netFlow: number;
    };
    macroIndicators: {
      dollarIndex: number;
      volatilityIndex: number;
      treasuryYields: number;
    };
  };
  insights: string[];
  topGainers: any[];
  topLosers: any[];
  upcomingEvents: any[];
  timestamp: string;
}

export default function AlphaFeed() {
  const [data, setData] = useState<AlphaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlphaData = async () => {
      try {
        const qsAddress = new URLSearchParams(window.location.search).get('address');
        let address = qsAddress;

        if (!address) {
          if (!(window as any).ethereum) {
            setError('Please connect your wallet or provide an address in the URL.');
            setLoading(false);
            return;
          }
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          address = accounts?.[0];
        }

        if (!address) {
          setError('No wallet address found.');
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/alpha?address=${address}`);
        if (!res.ok) {
          throw new Error('Failed to fetch Alpha data');
        }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlphaData();
  }, []);

  if (loading) return <div className="p-6">Loading Alpha data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6">No alpha data available</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">{data.title}</h2>

      {/* Main Analysis */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-3">📊 Market Analysis</h3>
        <div className="whitespace-pre-line text-gray-700">{data.body}</div>
      </div>

      {/* Market Intelligence Dashboard */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📈 Market Intelligence</h3>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* DeFi Metrics */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              🏦 DeFi Metrics
            </h4>
            <div className="text-sm space-y-1">
              <div>TVL: <strong>${data.marketIntelligence.defiMetrics.totalValueLocked.toLocaleString()}</strong></div>
              <div>Volume: <strong>${data.marketIntelligence.defiMetrics.volume24h.toLocaleString()}</strong></div>
              <div>Yield: <strong>{data.marketIntelligence.defiMetrics.averageYield}%</strong></div>
            </div>
          </div>

          {/* Market Sentiment */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              📊 Sentiment
            </h4>
            <div className="text-sm space-y-1">
              <div>Overall: <strong className={
                data.marketIntelligence.marketSentiment.overall === 'Bullish' ? 'text-green-500' :
                data.marketIntelligence.marketSentiment.overall === 'Bearish' ? 'text-red-500' :
                'text-yellow-500'
              }>
                {data.marketIntelligence.marketSentiment.overall}
              </strong></div>
              <div>Fear/Greed: <strong>{data.marketIntelligence.marketSentiment.fearGreedIndex}</strong></div>
              <div>Social: <strong>{data.marketIntelligence.marketSentiment.socialSentiment}</strong></div>
            </div>
          </div>

          {/* Whale Intelligence */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              🐋 Whale Activity
            </h4>
            <div className="text-sm space-y-1">
              <div>Large Txs: <strong>{data.marketIntelligence.whaleIntelligence.largeTransactions}</strong></div>
              <div>Active Whales: <strong>{data.marketIntelligence.whaleIntelligence.activeWhales}</strong></div>
              <div>Net Flow: <strong className={
                data.marketIntelligence.whaleIntelligence.netFlow > 0 ? 'text-green-500' : 'text-red-500'
              }>
                {data.marketIntelligence.whaleIntelligence.netFlow > 0 ? '+' : ''}${data.marketIntelligence.whaleIntelligence.netFlow.toLocaleString()}
              </strong></div>
            </div>
          </div>

          {/* Macro Indicators */}
          <div className="border rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center">
              🌍 Macro Indicators
            </h4>
            <div className="text-sm space-y-1">
              <div>DXY: <strong>{data.marketIntelligence.macroIndicators.dollarIndex}</strong></div>
              <div>VIX: <strong>{data.marketIntelligence.macroIndicators.volatilityIndex}</strong></div>
              <div>Yields: <strong>{data.marketIntelligence.macroIndicators.treasuryYields}%</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Gainers & Losers */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-green-600">📈 Top Gainers (24h)</h3>
          <div className="space-y-2">
            {data.topGainers.slice(0, 5).map((coin: any, index: number) => (
              <div key={coin.id} className="flex justify-between items-center">
                <span className="text-sm">#{index + 1} {coin.name}</span>
                <span className="text-sm font-semibold text-green-500">
                  +{coin.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 text-red-600">📉 Top Losers (24h)</h3>
          <div className="space-y-2">
            {data.topLosers.slice(0, 5).map((coin: any, index: number) => (
              <div key={coin.id} className="flex justify-between items-center">
                <span className="text-sm">#{index + 1} {coin.name}</span>
                <span className="text-sm font-semibold text-red-500">
                  {coin.price_change_percentage_24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">💡 Key Insights</h3>
        <div className="space-y-2">
          {data.insights.map((insight: string, index: number) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span className="text-sm text-gray-700">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      {data.upcomingEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📅 Upcoming Events</h3>
          <div className="space-y-2">
            {data.upcomingEvents.map((event: any, index: number) => (
              <div key={event.id || index} className="border rounded-lg p-3">
                <div className="font-semibold text-sm">{event.title}</div>
                <div className="text-xs text-gray-500">
                  📅 {new Date(event.date_event).toLocaleDateString()} • 🪙 {event.coins}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs text-gray-400 text-center">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
