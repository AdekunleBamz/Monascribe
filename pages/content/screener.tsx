import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import ScreenerTier1 from '../../components/ScreenerTier1';
import ScreenerTier2 from '../../components/ScreenerTier2';
import ScreenerTier3 from '../../components/ScreenerTier3';
import AlphaFeed from '../../components/AlphaFeed';

export default function OnchainScreener() {
  const [activeTab, setActiveTab] = useState('tier1');

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
      <h1>On-chain Screener</h1>
      <p style={{ color: '#374151', marginBottom: 24 }}>
        Live signals from Monad testnet: top flows, contracts, and momentum.
      </p>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <div style={{ marginBottom: 24 }}>
          <TabsList>
            <TabsTrigger value="tier1">Tier 1 (Trending)</TabsTrigger>
            <TabsTrigger value="tier2">Tier 2 (Events)</TabsTrigger>
            <TabsTrigger value="tier3">Tier 3 (Search)</TabsTrigger>
            <TabsTrigger value="alpha">Alpha</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tier1">
          <ScreenerTier1 />
        </TabsContent>

        <TabsContent value="tier2">
          <ScreenerTier2 />
        </TabsContent>

        <TabsContent value="tier3">
          <ScreenerTier3 />
        </TabsContent>

        <TabsContent value="alpha">
          <AlphaFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
}
