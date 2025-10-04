import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function WeeklyAlphaIssue() {
  const [alpha, setAlpha] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { issue } = router.query;

  useEffect(() => {
    const fetchAlpha = async () => {
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

        const res = await fetch(`/api/alpha?address=${address}`);
        if (!res.ok) {
          throw new Error('Failed to fetch alpha data. You may not have access.');
        }
        const jsonData = await res.json();
        setAlpha(jsonData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (issue) {
      fetchAlpha();
    }
  }, [issue, router.query.address]);

  return (
    <div style={{ maxWidth: 820, margin: '40px auto', padding: 16 }}>
      <h1>Weekly Alpha #{issue}</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
      {!loading && !error && alpha && (
        <div>
          <h2>{alpha.title}</h2>
          <p>{alpha.body}</p>
        </div>
      )}
    </div>
  );
}
