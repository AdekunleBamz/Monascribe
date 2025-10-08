import { useState, useEffect } from 'react';
import ScreenerTier1 from '../../components/ScreenerTier1';
import ScreenerTier2 from '../../components/ScreenerTier2';
import ScreenerTier3 from '../../components/ScreenerTier3';
import AlphaFeed from '../../components/AlphaFeed';

export default function OnchainScreener() {
  const [tier, setTier] = useState<string>('1');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detect tier from URL query params
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tierParam = urlParams.get('tier') || '1';
      setTier(tierParam);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16, textAlign: 'center' }}>
        Loading screener data...
      </div>
    );
  }

  // Conditionally render based on tier
  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: 16 }}>
      {tier === '1' && <ScreenerTier1 />}
      {tier === '2' && <ScreenerTier2 />}
      {tier === '3' && <ScreenerTier3 />}
      {tier === 'alpha' && <AlphaFeed />}
    </div>
  );
}
