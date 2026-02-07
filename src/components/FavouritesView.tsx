import React from "react";
import type { FundEntry, FundPriceSchemeData } from "../types/mpf";
import { useBookmarks } from "../lib/useBookmarks";
import FundDetailBlock from "./FundDetailBlock";

const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

const findFundInData = (data: FundPriceSchemeEntry[], fundName: string): FundEntry | null => {
  const decoded = fundName.trim();
  for (const entry of data) {
    const f = entry.funds?.find((item) => (item.fund ?? "").trim() === decoded) ?? null;
    if (f) return f;
  }
  return null;
};

type FundPriceSchemeEntry = FundPriceSchemeData["data"][number];

const FavouritesView = () => {
  const { bookmarks } = useBookmarks();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [schemeData, setSchemeData] = React.useState<FundPriceSchemeEntry[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as FundPriceSchemeData;
        setSchemeData(json.data ?? []);
      } catch {
        setSchemeData([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const handleToggleSelect = (fund: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fund)) next.delete(fund);
      else next.add(fund);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (bookmarks.length === 0) return;
    setSelectedIds(new Set(bookmarks));
  };

  const handleClearSelection = () => setSelectedIds(new Set());

  const displayFunds: FundEntry[] =
    schemeData == null
      ? []
      : Array.from(selectedIds)
          .map((id) => findFundInData(schemeData, id))
          .filter((f): f is FundEntry => f != null);

  if (bookmarks.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="region" aria-labelledby="favourites-empty-heading">
        <h2 id="favourites-empty-heading" className="mb-2 text-xl font-semibold text-slate-800">
          我的收藏
        </h2>
        <p className="text-slate-600">
          尚未收藏任何基金。請到
          <a href="/mpflogs/funds/" className="ml-1 text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500">
            全部基金
          </a>
          點選星號加入收藏。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" role="region" aria-labelledby="favourites-heading">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="favourites-heading">
        <h2 id="favourites-heading" className="mb-4 text-xl font-semibold text-slate-800">
          我的收藏
        </h2>
        <p className="mb-4 text-slate-600">
          勾選要顯示的基金（可多選），選擇後會立即顯示。
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="全選"
          >
            全選
          </button>
          <button
            type="button"
            onClick={handleClearSelection}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="清除選擇"
          >
            清除選擇
          </button>
        </div>
        {loading ? (
          <p className="text-slate-600" role="status">載入中…</p>
        ) : (
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {bookmarks.map((fund) => (
              <li key={fund} className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50/50 px-3 py-2">
                <input
                  type="checkbox"
                  id={`fav-${fund}`}
                  checked={selectedIds.has(fund)}
                  onChange={() => handleToggleSelect(fund)}
                  aria-label={`選擇 ${fund}`}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor={`fav-${fund}`} className="min-w-0 flex-1 cursor-pointer text-slate-700">
                  {fund}
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {displayFunds.length > 0 && (
        <section className="space-y-8" aria-label="已選基金詳情">
          {displayFunds.map((fund, index) => (
            <FundDetailBlock
              key={fund.fund}
              fund={fund}
              headingId={`favourite-fund-${index}`}
            />
          ))}
        </section>
      )}
    </div>
  );
};

export default FavouritesView;
