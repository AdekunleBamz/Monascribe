import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/Tabs";

export default function Screener() {
  const [tier, setTier] = useState("tier1");
  const [data, setData] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/screener?tier=${tier}&q=${query}`);
        const jsonData = await res.json();
        setData(jsonData);
      } catch (error) {
        console.error("Failed to fetch screener data", error);
        setData([]);
      }
      setLoading(false);
    };

    // Only fetch for tier 3 if there is a query
    if (tier === "tier3" && query.length > 2) {
      fetchData();
    } else if (tier !== "tier3") {
      fetchData();
    } else {
      setData([]);
    }
  }, [tier, query]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">On-chain Screener</h1>

      <Tabs value={tier} onValueChange={setTier}>
        <TabsList>
          <TabsTrigger value="tier1">Tier 1 (Trending)</TabsTrigger>
          <TabsTrigger value="tier2">Tier 2 (Events)</TabsTrigger>
          <TabsTrigger value="tier3">Tier 3 (Search)</TabsTrigger>
        </TabsList>

        {/* TIER 1 - Trending */}
        <TabsContent value="tier1">
          {loading ? <p>Loading...</p> : (
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              {data.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <img src={c.logo} alt={c.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-semibold">{c.name} ({c.symbol})</p>
                      <p className="text-sm text-gray-500">{c.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* TIER 2 - Events (CoinMarketCal / Coinpanic) */}
        <TabsContent value="tier2">
          {loading ? <p>Loading...</p> : (
            <ul className="mt-4 space-y-3">
              {data.map((e: any) => (
                <li key={e.id} className="p-3 border rounded-lg shadow-sm">
                  <strong>{e.title}</strong> — {e.description}
                  <div className="text-xs text-gray-500">{new Date(e.date_event).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* TIER 3 - Searchable */}
        <TabsContent value="tier3">
          <Input
            placeholder="Search for any coin (e.g., Bitcoin)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mb-4"
          />
          {loading ? <p>Loading...</p> : (
            <div className="grid md:grid-cols-3 gap-4">
              {data.map((c: any) => (
                <Card key={c.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <img src={c.logo} alt={c.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <p className="font-semibold">{c.name} ({c.symbol})</p>
                      <p className="text-sm text-gray-500">${c.price}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
