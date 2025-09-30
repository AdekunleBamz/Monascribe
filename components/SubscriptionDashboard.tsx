import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Star, Zap, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import MarketDashboard from './MarketDashboard';
import BasicTierFeatures from './BasicTierFeatures';
import PremiumTierFeatures from './PremiumTierFeatures';
import VIPTierFeatures from './VIPTierFeatures';

interface SubscriptionDashboardProps {
  userAddress: string;
  userTier: 'basic' | 'premium' | 'vip';
}

export default function SubscriptionDashboard({ userAddress, userTier }: SubscriptionDashboardProps) {
  const [activeTab, setActiveTab] = useState('market');

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'basic': return <Zap className="w-5 h-5" />;
      case 'premium': return <Star className="w-5 h-5" />;
      case 'vip': return <Crown className="w-5 h-5" />;
      default: return <Activity className="w-5 h-5" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'text-blue-500';
      case 'premium': return 'text-purple-500';
      case 'vip': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'vip': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className={getTierColor(userTier)}>
            {getTierIcon(userTier)}
          </span>
          <h1 className="text-3xl font-bold">Subscription Dashboard</h1>
        </div>
        <div className="flex items-center justify-center space-x-2">
          <Badge className={getTierBadgeColor(userTier)}>
            {userTier.toUpperCase()} TIER
          </Badge>
          <span className="text-gray-600">•</span>
          <span className="text-sm text-gray-600">
            {userAddress.slice(0, 8)}...{userAddress.slice(-6)}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="market">Market Data</TabsTrigger>
          <TabsTrigger value="basic" disabled={userTier === 'none'}>
            Basic Features
          </TabsTrigger>
          <TabsTrigger value="premium" disabled={userTier === 'basic' || userTier === 'none'}>
            Premium Features
          </TabsTrigger>
          <TabsTrigger value="vip" disabled={userTier !== 'vip'}>
            VIP Features
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          <MarketDashboard userTier={userTier} userAddress={userAddress} />
        </TabsContent>

        <TabsContent value="basic" className="space-y-4">
          {userTier === 'basic' || userTier === 'premium' || userTier === 'vip' ? (
            <BasicTierFeatures userAddress={userAddress} />
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Basic Tier Required</h3>
                <p className="text-gray-600">
                  Upgrade to Basic tier to access weekly digest, crypto tips, and Monad ecosystem updates.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="premium" className="space-y-4">
          {userTier === 'premium' || userTier === 'vip' ? (
            <PremiumTierFeatures userAddress={userAddress} />
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Premium Tier Required</h3>
                <p className="text-gray-600">
                  Upgrade to Premium tier to access smart money alerts, DEX activity tracking, and advanced analytics.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vip" className="space-y-4">
          {userTier === 'vip' ? (
            <VIPTierFeatures userAddress={userAddress} />
          ) : (
            <Card>
              <CardContent className="text-center p-8">
                <Crown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">VIP Tier Required</h3>
                <p className="text-gray-600">
                  Upgrade to VIP tier to access wallet search, whale tracking, custom watchlists, and real-time alerts.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Tier Benefits Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Tier */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold">Basic Tier</h3>
                <Badge className="bg-blue-100 text-blue-800">BTC, ETH, MON</Badge>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Top 3 cryptocurrencies</li>
                <li>• Weekly crypto tips</li>
                <li>• Upcoming events</li>
                <li>• Market news digest</li>
                <li>• Monad ecosystem updates</li>
              </ul>
            </div>

            {/* Premium Tier */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Star className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold">Premium Tier</h3>
                <Badge className="bg-purple-100 text-purple-800">Top 10 + Trending</Badge>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Basic</li>
                <li>• Top 10 cryptocurrencies</li>
                <li>• Trending coins</li>
                <li>• Smart money alerts</li>
                <li>• DEX activity tracking</li>
                <li>• Historical comparisons</li>
                <li>• Token narratives</li>
                <li>• Exclusive analysis notes</li>
              </ul>
            </div>

            {/* VIP Tier */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold">VIP Tier</h3>
                <Badge className="bg-yellow-100 text-yellow-800">Full Access</Badge>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Everything in Premium</li>
                <li>• Search any cryptocurrency</li>
                <li>• Detailed coin information</li>
                <li>• Wallet search & analysis</li>
                <li>• Whale tracking dashboard</li>
                <li>• Custom watchlists</li>
                <li>• Real-time alerts</li>
                <li>• AI-powered summaries</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
