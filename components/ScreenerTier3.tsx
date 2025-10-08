import { useState, useEffect } from 'react';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

interface Tier3Data {
  data: Coin[];
  query: string;
  onchain: any;
}

export default function ScreenerTier3() {
  const [data, setData] = useState<Tier3Data | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const searchCoins = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

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

      const res = await fetch(`/api/tier3?address=${address}&q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error('Failed to search coins');
      }
      const jsonData = await res.json();
      setData(jsonData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.length > 2) {
      const timeoutId = setTimeout(() => {
        searchCoins();
      }, 500); // Debounce search

      return () => clearTimeout(timeoutId);
    } else {
      setHasSearched(false);
    }
  }, [query]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tier 3 - Coin Search</h2>

      {/* Search Input */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search for any coin (e.g., Bitcoin, Ethereum)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && searchCoins()}
          />
          <button
            onClick={searchCoins}
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Search Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Searching for coins...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-500">
          Error: {error}
        </div>
      )}

      {!loading && !error && hasSearched && data && (
        <>
          {data.data.length > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-gray-600">
                  Found {data.data.length} result{data.data.length !== 1 ? 's' : ''} for "{data.query}"
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.data.map((coin: Coin) => (
                  <div key={coin.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-12 h-12 rounded-full"
                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                      />
                      <div>
                        <div className="font-semibold">{coin.name}</div>
                        <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                        <div className="text-sm">Rank #{coin.market_cap_rank}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="font-semibold">${coin.current_price.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">24h Change:</span>
                        <span className={`text-sm font-semibold ${
                          coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Market Cap:</span>
                        <span className="text-sm">${coin.market_cap.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Volume:</span>
                        <span className="text-sm">${coin.total_volume.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No coins found for "{data.query}". Try a different search term.
            </div>
          )}
        </>
      )}

      {!hasSearched && (
        <div className="text-center py-8 text-gray-500">
          Enter a search term above to find any coin in the market.
        </div>
      )}

      {/* Subscription Info */}
      {data?.onchain && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
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
