import { useState, useEffect } from 'react';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface Tier1Data {
  trending: any[];
  marketData: Coin[];
  onchain: any;
}

export default function ScreenerTier1() {
  const [data, setData] = useState<Tier1Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTier1Data = async () => {
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

        const res = await fetch(`/api/tier1?address=${address}`);
        if (!res.ok) {
          throw new Error('Failed to fetch Tier 1 data');
        }
        const jsonData = await res.json();
        setData(jsonData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTier1Data();
  }, []);

  if (loading) return <div className="p-6">Loading Tier 1 data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6">No data available</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tier 1 - Trending Coins</h2>

      {/* Trending Coins */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🔥 Trending Now</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.trending.map((coin: any) => (
            <div key={coin.item.id} className="border rounded-lg p-4 flex items-center gap-3">
              <img
                src={coin.item.small}
                alt={coin.item.name}
                className="w-10 h-10 rounded-full"
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
              />
              <div className="flex-1">
                <div className="font-semibold">{coin.item.name}</div>
                <div className="text-sm text-gray-500">{coin.item.symbol.toUpperCase()}</div>
                {coin.item.data?.price && (
                  <div className="text-sm">${coin.item.data.price}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market Data */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📊 Market Overview</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.marketData.slice(0, 12).map((coin: Coin) => (
            <div key={coin.id} className="border rounded-lg p-4 flex items-center gap-3">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-8 h-8 rounded-full"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
              />
              <div className="flex-1">
                <div className="font-semibold text-sm">{coin.name}</div>
                <div className="text-xs text-gray-500">{coin.symbol.toUpperCase()}</div>
                <div className="text-sm">${coin.current_price.toLocaleString()}</div>
                <div className={`text-xs ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Info */}
      {data.onchain && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2">Subscription Details</h4>
          <div className="text-sm text-gray-600">
            <div>Plan ID: {data.onchain.planId}</div>
            <div>Expires: {data.onchain.expiresAt ? new Date(data.onchain.expiresAt).toLocaleDateString() : 'Never'}</div>
            <div>Subscribed: {new Date(data.onchain.timestamp).toLocaleDateString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
