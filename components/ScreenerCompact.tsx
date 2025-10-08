import { useState, useEffect } from 'react';

interface Coin {
  name: string;
  symbol: string;
  thumb: string;
  price_btc: number;
  onchain: {
    blockHeight: string;
    txCount: number;
    tps: string;
    gasUsed: string;
    validators: string;
  };
  subscriptionCount: number;
}

interface ScreenerData {
  status: string;
  data: Coin[];
  timestamp: string;
}

export default function ScreenerCompact() {
  const [data, setData] = useState<ScreenerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/compact-screener');
        if (!res.ok) {
          throw new Error('Failed to fetch screener data');
        }
        const jsonData = await res.json();
        setData(jsonData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading screener data...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!data || !data.data.length) return <div className="p-6 text-center">No data available</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">On-chain Screener</h2>
      <div className="grid gap-2">
        {data.data.map((coin: Coin, index: number) => (
          <div key={`${coin.symbol}-${index}`} className="flex items-center justify-between bg-gray-900 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <img
                src={coin.thumb}
                alt={coin.name}
                className="w-8 h-8 rounded-full"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <div>
                <div className="font-semibold text-sm">{coin.name}</div>
                <div className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</div>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">
                ${coin.price_btc ? (coin.price_btc * 122000).toFixed(2) : 'N/A'}
              </div>
              <div className="text-xs text-gray-400">
                Subs: {coin.subscriptionCount}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-xs text-gray-400 text-center mt-4">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
