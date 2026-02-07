import React from "react";
import type { FundEntry, FundPriceSchemeData, FundPriceSchemeEntry } from "../types/mpf";

const DATA_URL = "/data/fund_price_scheme.json";

/** Detail icon: arrow-right, indicates "view detail page" */
const DetailIcon = () => (
  <svg className="h-5 w-5 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const getParamsFromUrl = (): { trustee: string; scheme: string } | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const trustee = params.get("trustee")?.trim() ?? "";
  const scheme = params.get("scheme")?.trim() ?? "";
  if (!trustee || !scheme) return null;
  return { trustee, scheme };
};

const SchemeFundList = () => {
  const [params, setParams] = React.useState<{ trustee: string; scheme: string } | null>(null);
  const [entry, setEntry] = React.useState<FundPriceSchemeEntry | null | "loading" | "not-found">("loading");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const urlParams = getParamsFromUrl();
    setParams(urlParams);
    if (!urlParams) {
      setEntry("not-found");
      return;
    }
    const { trustee, scheme } = urlParams;
    const load = async () => {
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FundPriceSchemeData;
        const list = json.data ?? [];
        const found = list.find((e) => {
          const tName = (e.trustee.name ?? "").trim();
          const sName = (e.scheme.name ?? "").trim();
          return tName === trustee && sName === scheme;
        });
        setEntry(found ?? "not-found");
      } catch (e) {
        setError(e instanceof Error ? e.message : "載入失敗");
      }
    };
    load();
  }, []);

  if (error) {
    return (
      <p className="text-red-600" role="alert">
        無法載入資料：{error}
      </p>
    );
  }

  if (entry === "loading") {
    return (
      <p className="text-slate-600" aria-live="polite">
        載入中…
      </p>
    );
  }

  if (entry === "not-found") {
    return (
      <div className="space-y-4">
        <p className="text-slate-600" role="status">
          {params ? "未找到該計劃" : "請從受託人與計劃頁選擇計劃"}
        </p>
        <a
          href="/trustees/"
          className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="返回受託人與計劃"
        >
          返回受託人與計劃
        </a>
      </div>
    );
  }

  const funds = entry.funds ?? [];

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/trustees/"
          className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="返回受託人與計劃"
        >
          ← 返回受託人與計劃
        </a>
        <h2 className="text-xl font-semibold text-slate-800">
          {entry.scheme.zh || entry.scheme.name}
        </h2>
        {entry.scheme.zh && entry.scheme.name !== entry.scheme.zh && (
          <p className="text-slate-600">{entry.scheme.name}</p>
        )}
        <p className="mt-1 text-sm text-slate-500">
          {entry.trustee.zh || entry.trustee.name} · {funds.length} 隻基金
        </p>
      </div>

      <section
        className="rounded-xl border border-slate-200 bg-white shadow-sm"
        aria-labelledby="funds-heading"
      >
        <h3 id="funds-heading" className="sr-only">
          基金列表
        </h3>
        <ul className="divide-y divide-slate-100" role="list">
          {funds.map((fund: FundEntry) => {
            const fundKey = fund.fund;
            const detailHref = `/funds?detail=${encodeURIComponent(fundKey)}`;
            const fundLabel = fund.zh || fund.fund;
            return (
              <li key={fundKey} className="flex items-center gap-2 px-4 py-3 sm:px-6">
                <div className="min-w-0 flex-1">
                  {fund.zh && (
                    <span className="font-medium text-slate-800">{fund.zh}</span>
                  )}
                  <span className={fund.zh ? "block text-sm text-slate-600" : "text-slate-800"}>
                    {fund.fund}
                  </span>
                </div>
                <a
                  href={detailHref}
                  className="flex shrink-0 items-center justify-center rounded p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label={`查看 ${fundLabel} 圖表與數據`}
                  tabIndex={0}
                >
                  <DetailIcon />
                </a>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};

export default SchemeFundList;
