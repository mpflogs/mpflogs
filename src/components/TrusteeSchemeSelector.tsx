import React from "react";
import type { FundPriceSchemeData, FundPriceSchemeEntry } from "../types/mpf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

const TrusteeSchemeSelector = () => {
  const [data, setData] = React.useState<FundPriceSchemeEntry[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTrustee, setSelectedTrustee] = React.useState<string>("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(DATA_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FundPriceSchemeData;
        setData(json.data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const trustees = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from(
      new Map(
        data.map((entry) => [
          entry.trustee.name.trim(),
          { name: entry.trustee.name.trim(), zh: entry.trustee.zh },
        ])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const schemesForTrustee = React.useMemo(() => {
    if (!data || !selectedTrustee) return [];
    return data.filter((entry) => entry.trustee.name.trim() === selectedTrustee);
  }, [data, selectedTrustee]);

  const handleTrusteeChange = (value: string) => {
    setSelectedTrustee(value);
  };

  if (loading) {
    return (
      <p className="text-muted-foreground" aria-live="polite">
        載入中…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-destructive" role="alert">
        無法載入資料：{error}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-muted-foreground" role="status">
        暫無資料
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="trustee-select"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          選擇受託人 (Trustee)
        </label>
        <Select value={selectedTrustee || undefined} onValueChange={handleTrusteeChange}>
          <SelectTrigger id="trustee-select" className="w-full max-w-md" aria-label="選擇受託人">
            <SelectValue placeholder="— 請選擇 —" />
          </SelectTrigger>
          <SelectContent>
            {trustees.map((t) => (
              <SelectItem key={t.name} value={t.name}>
                {t.zh ? `${t.zh} (${t.name})` : t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {schemesForTrustee.length > 0 && (
        <Card aria-labelledby="schemes-heading">
          <CardHeader>
            <CardTitle id="schemes-heading">
              該受託人下的計劃 (Schemes)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3" role="list">
              {schemesForTrustee.map((entry) => {
                const schemeHref = `/mpflogs/scheme/?trustee=${encodeURIComponent(entry.trustee.name.trim())}&scheme=${encodeURIComponent(entry.scheme.name.trim())}`;
                return (
                  <li key={entry.scheme.name}>
                    <a
                      href={schemeHref}
                      className="flex flex-col gap-1 rounded-md border border-border bg-muted/50 p-3 transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      aria-label={`查看 ${entry.scheme.zh || entry.scheme.name} 的基金列表`}
                    >
                      <span className="font-medium text-foreground">
                        {entry.scheme.zh || entry.scheme.name}
                      </span>
                      {entry.scheme.zh && entry.scheme.name !== entry.scheme.zh && (
                        <span className="text-sm text-muted-foreground">
                          {entry.scheme.name}
                        </span>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {entry.funds?.length ?? 0} 隻基金
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrusteeSchemeSelector;
