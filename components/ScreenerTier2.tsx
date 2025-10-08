import { useState, useEffect } from 'react';

interface Event {
  id: string;
  source: string;
  title: string;
  description: string;
  date_event: string;
  coins: string;
  sentiment?: string;
  url?: string;
}

interface Tier2Data {
  events: Event[];
  marketData: any[];
  onchain: any;
}

export default function ScreenerTier2() {
  const [data, setData] = useState<Tier2Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTier2Data = async () => {
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

        const res = await fetch(`/api/tier2?address=${address}`);
        if (!res.ok) {
          throw new Error('Failed to fetch Tier 2 data');
        }
        const jsonData = await res.json();
        setData(jsonData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTier2Data();
  }, []);

  if (loading) return <div className="p-6">Loading Tier 2 data...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6">No data available</div>;

  // Separate events by source
  const cmcEvents = data.events.filter((event: Event) => event.source === 'CoinMarketCal');
  const cpNews = data.events.filter((event: Event) => event.source === 'CryptoPanic');

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Tier 2 - Events & News</h2>

      {/* CoinMarketCal Events */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📅 Upcoming Events</h3>
        {cmcEvents.length > 0 ? (
          <div className="space-y-3">
            {cmcEvents.slice(0, 10).map((event: Event) => (
              <div key={event.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{event.title}</h4>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {event.source}
                  </span>
                </div>
                {event.description && (
                  <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                )}
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>🪙 {event.coins}</span>
                  <span>📅 {new Date(event.date_event).toLocaleDateString()}</span>
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      View →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No upcoming events found. Check back later!
          </div>
        )}
      </div>

      {/* CryptoPanic News */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">📰 Latest News</h3>
        {cpNews.length > 0 ? (
          <div className="space-y-3">
            {cpNews.slice(0, 10).map((news: Event) => (
              <div key={news.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{news.title}</h4>
                  <span className={`text-xs px-2 py-1 rounded ${
                    news.sentiment === 'bullish' ? 'bg-green-100 text-green-800' :
                    news.sentiment === 'bearish' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {news.sentiment || 'neutral'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>🪙 {news.coins}</span>
                  <span>📅 {new Date(news.date_event).toLocaleDateString()}</span>
                  <a
                    href={news.description}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Read →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No recent news found. Check back later!
          </div>
        )}
      </div>

      {/* Market Context */}
      {data.marketData && data.marketData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">📊 Market Context</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {data.marketData.slice(0, 6).map((coin: any) => (
              <div key={coin.id} className="border rounded-lg p-3 text-center">
                <div className="font-semibold text-sm">{coin.name}</div>
                <div className="text-lg">${coin.current_price.toLocaleString()}</div>
                <div className={`text-sm ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subscription Info */}
      {data.onchain && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
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
