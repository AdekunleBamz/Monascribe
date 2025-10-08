import { useState, useEffect } from 'react';

interface Subscription {
  _id?: string;
  subscriber: string;
  planId: number;
  expiresAt?: string;
  timestamp: string;
  type: string;
}

interface SubscriptionResponse {
  status: string;
  data: Subscription[];
  count: number;
  timestamp: string;
}

export default function SubscriptionInfo() {
  const [data, setData] = useState<Subscription[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        const res = await fetch('/api/compact-subscription');
        if (!res.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        const jsonData: SubscriptionResponse = await res.json();
        setData(jsonData.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, []);

  if (loading) return <div className="p-6 text-center">Loading subscription data...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  if (!data || !data.length) return <div className="p-6 text-center">No subscription data available</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Subscription Management</h2>

      <div className="space-y-3">
        {data.map((sub: Subscription, index: number) => (
          <div key={sub._id || index} className="bg-gray-900 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-sm">
                  Plan {sub.planId}
                  <span className={`ml-2 text-xs px-2 py-1 rounded ${
                    sub.type === 'subscribed' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
                  }`}>
                    {sub.type}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {sub.subscriber.slice(0, 6)}...{sub.subscriber.slice(-4)}
                </div>
              </div>
              <div className="text-right text-xs text-gray-400">
                {new Date(sub.timestamp).toLocaleDateString()}
              </div>
            </div>

            <div className="text-xs text-gray-400">
              {sub.expiresAt ? (
                <span>Expires: {new Date(sub.expiresAt).toLocaleDateString()}</span>
              ) : (
                <span>No expiration</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 text-center mt-4">
        Total subscriptions: {data.length}
      </div>
    </div>
  );
}
