import React from "react";
import type { FundPriceSchemeData, FundPriceSchemeEntry } from "../types/mpf";

const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

const TrusteeSchemeSelector = () => {
  const [data, setData] = React.useState<FundPriceSchemeEntry[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedTrustee, setSelectedTrustee] = React.useState<string>("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(DATA_URL);
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

  const handleTrusteeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTrustee(e.target.value);
  };

  if (loading) {
    return (
      <p className="text-slate-600" aria-live="polite">
        載入中…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-red-600" role="alert">
        無法載入資料：{error}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-slate-600" role="status">
        暫無資料
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="trustee-select"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          選擇受託人 (Trustee)
        </label>
        <select
          id="trustee-select"
          value={selectedTrustee}
          onChange={handleTrusteeChange}
          className="w-full max-w-md rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          aria-label="選擇受託人"
        >
          <option value="">— 請選擇 —</option>
          {trustees.map((t) => (
            <option key={t.name} value={t.name}>
              {t.zh ? `${t.zh} (${t.name})` : t.name}
            </option>
          ))}
        </select>
      </div>

      {schemesForTrustee.length > 0 && (
        <section
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
          aria-labelledby="schemes-heading"
        >
          <h2
            id="schemes-heading"
            className="mb-4 text-lg font-semibold text-slate-800"
          >
            該受託人下的計劃 (Schemes)
          </h2>
          <ul className="space-y-3" role="list">
            {schemesForTrustee.map((entry) => {
              const schemeHref = `/scheme/?trustee=${encodeURIComponent(entry.trustee.name.trim())}&scheme=${encodeURIComponent(entry.scheme.name.trim())}`;
              return (
                <li key={entry.scheme.name}>
                  <a
                    href={schemeHref}
                    className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:border-slate-200 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    aria-label={`查看 ${entry.scheme.zh || entry.scheme.name} 的基金列表`}
                  >
                    <span className="font-medium text-slate-800">
                      {entry.scheme.zh || entry.scheme.name}
                    </span>
                    {entry.scheme.zh && entry.scheme.name !== entry.scheme.zh && (
                      <span className="text-sm text-slate-600">
                        {entry.scheme.name}
                      </span>
                    )}
                    <span className="text-sm text-slate-500">
                      {entry.funds?.length ?? 0} 隻基金
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

export default TrusteeSchemeSelector;
