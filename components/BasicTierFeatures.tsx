import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Lightbulb, Newspaper, Activity, TrendingUp, ExternalLink } from 'lucide-react';

interface BasicTierData {
  tip: string;
  events: Array<{
    title: string;
    date: string;
    coin: string;
    category: string;
    url?: string;
    description?: string;
  }>;
  news: Array<{
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    description?: string;
  }>;
  monadSnapshot: {
    week: number;
    subsCount: number;
    txCount: number;
    topContracts: Array<{
      address: string;
      name: string;
      txCount: number;
    }>;
    timestamp: Date;
  } | null;
}

interface BasicTierFeaturesProps {
  userAddress: string;
}

export default function BasicTierFeatures({ userAddress }: BasicTierFeaturesProps) {
  const [data, setData] = useState<BasicTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/basic/features?address=${userAddress}`);
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch basic tier data');
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '📈';
      case 'negative': return '📉';
      default: return '📊';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'launch': return 'bg-green-100 text-green-800';
      case 'airdrop': return 'bg-blue-100 text-blue-800';
      case 'hardfork': return 'bg-purple-100 text-purple-800';
      case 'conference': return 'bg-yellow-100 text-yellow-800';
      case 'listing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Loading basic tier features...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>Error loading basic tier features: {error}</p>
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
        <h2 className="text-2xl font-bold mb-2">Basic Tier Features</h2>
        <p className="text-gray-600">Weekly digest, crypto tips, and Monad ecosystem updates</p>
      </div>

      {/* Crypto Tip of the Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
            💡 Crypto Tip of the Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">{data.tip}</p>
        </CardContent>
      </Card>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-blue-500" />
            📅 Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.events.length > 0 ? (
            <div className="space-y-3">
              {data.events.slice(0, 5).map((event, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {event.coin} • {new Date(event.date).toLocaleDateString()}
                      </p>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(event.category)}>
                        {event.category}
                      </Badge>
                      {event.url && (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No upcoming events found</p>
          )}
        </CardContent>
      </Card>

      {/* News Digest */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Newspaper className="w-5 h-5 mr-2 text-green-500" />
            📰 Top Market Stories
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.news.length > 0 ? (
            <div className="space-y-3">
              {data.news.map((article, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm leading-tight">
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-blue-600 transition-colors"
                        >
                          {article.title}
                        </a>
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {article.source} • {new Date(article.publishedAt).toLocaleDateString()}
                      </p>
                      {article.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {article.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-3">
                      <span className={`text-lg ${getSentimentColor(article.sentiment)}`}>
                        {getSentimentIcon(article.sentiment)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No news articles found</p>
          )}
        </CardContent>
      </Card>

      {/* Monad Ecosystem Update */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2 text-purple-500" />
            🌐 Monad Ecosystem Update
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.monadSnapshot ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.monadSnapshot.subsCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Active Subscribers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {data.monadSnapshot.txCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Transactions</div>
                </div>
              </div>
              
              {data.monadSnapshot.topContracts.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Top Contracts</h4>
                  <div className="space-y-2">
                    {data.monadSnapshot.topContracts.slice(0, 3).map((contract, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-mono text-xs">
                          {contract.address.slice(0, 8)}...{contract.address.slice(-6)}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{contract.txCount} tx</span>
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-500 text-center">
                Last updated: {new Date(data.monadSnapshot.timestamp).toLocaleString()}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No ecosystem data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
