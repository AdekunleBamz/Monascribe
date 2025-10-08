import { useState, useEffect } from 'react';

interface AlphaData {
  sentiment: string;
  totalEvents: number;
  recentNews: Array<{
    title: string;
    url: string;
    source: string;
  }>;
  subscriptionStats: {
    active: number;
    cancelled: number;
    net: number;
  };
  network: any;
  timestamp: string;
}

interface AlphaResponse {
  status: string;
  data: AlphaData;
}

export default function AlphaInsights() {
  const [data, setData] = useState<AlphaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlphaData = async () => {
      try {
        const res = await fetch('/api/compact-alpha');
        if (!res.ok) {
          throw new Error('Failed to fetch alpha data');
        }
        const jsonData: AlphaResponse = await res.json();
        setData(jsonData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAlphaData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading alpha insights...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!data) return <div className="p-6 text-center">No alpha data available</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Weekly Alpha Insights</h2>

      {/* Market Sentiment */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Market Sentiment</h3>
        <div className={`text-lg font-bold ${
          data.sentiment === 'Bullish' ? 'text-green-400' :
          data.sentiment === 'Bearish' ? 'text-red-400' :
          'text-yellow-400'
        }`}>
          {data.sentiment}
        </div>
      </div>

      {/* Events & News */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📅 Events This Week</h3>
          <div className="text-2xl font-bold text-blue-400">{data.totalEvents}</div>
          <div className="text-sm text-gray-400">Upcoming events</div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-2">👥 Subscription Activity</h3>
          <div className="text-sm space-y-1">
            <div>Active: <span className="text-green-400">{data.subscriptionStats.active}</span></div>
            <div>Cancelled: <span className="text-red-400">{data.subscriptionStats.cancelled}</span></div>
            <div>Net: <span className={data.subscriptionStats.net >= 0 ? 'text-green-400' : 'text-red-400'}>
              {data.subscriptionStats.net >= 0 ? '+' : ''}{data.subscriptionStats.net}
            </span></div>
          </div>
        </div>
      </div>

      {/* Recent News */}
      {data.recentNews.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3">📰 Latest News</h3>
          <div className="space-y-2">
            {data.recentNews.map((news, index) => (
              <div key={index} className="border-l-2 border-gray-700 pl-3">
                <div className="font-semibold text-sm">{news.title}</div>
                <div className="text-xs text-gray-400">{news.source}</div>
                {news.url && (
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Read more →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Network Stats */}
      {data.network.SubscriptionService_Subscribed && (
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold mb-3">🔗 Network Activity</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Active Subscriptions</div>
              <div className="text-lg font-semibold">{data.network.SubscriptionService_Subscribed.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Recent Cancellations</div>
              <div className="text-lg font-semibold">{data.network.SubscriptionService_SubscriptionCancelled?.length || 0}</div>
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 text-center">
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
}
