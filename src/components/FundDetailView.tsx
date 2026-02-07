import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { FundEntry, FundPriceSchemeData, UnitPriceEntry } from "../types/mpf";
import { useBookmarks } from "../lib/useBookmarks";
import BookmarkButton from "./BookmarkButton";

const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

const chartDataFromUnitPrice = (list: UnitPriceEntry[]): { month: string; price: number }[] =>
  list
    .filter((e): e is UnitPriceEntry & { price: number } => e.price != null && typeof e.price === "number")
    .map(({ month, price }) => ({ month, price }));

const isUnitPriceList = (up: FundEntry["unitPrice"]): up is UnitPriceEntry[] =>
  Array.isArray(up) && up.length > 0 && typeof (up as UnitPriceEntry[])[0] === "object";

const getFundFromUrl = (): string | null => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return params.get("fund")?.trim() ?? null;
};

const fundsListPath = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "")}/funds/`;

const FundDetailView = () => {
  const [detail, setDetail] = React.useState<string | null>(null);
  const [fund, setFund] = React.useState<FundEntry | null | "loading" | "not-found">(null);
  const [isOnDetailPage, setIsOnDetailPage] = React.useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname.replace(/\/$/, "");
    setIsOnDetailPage(path.endsWith("/funds/detail"));
  }, []);

  React.useEffect(() => {
    const syncFromUrl = () => {
      const name = getFundFromUrl();
      setDetail(name);
      if (!name) {
        setFund(null);
        return;
      }
      const load = async () => {
        try {
          const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || "/";
          const dataUrl =
            typeof window !== "undefined"
              ? new URL(`${base}/data/fund_price_scheme.json`, window.location.origin).href
              : DATA_URL;
          const res = await fetch(dataUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as FundPriceSchemeData;
          const list = json.data ?? [];
          const decoded = (name || "").trim();
          let found: FundEntry | null = null;
          for (const entry of list) {
            const f = entry.funds?.find((item) => (item.fund ?? "").trim() === decoded) ?? null;
            if (f) {
              found = f;
              break;
            }
          }
          setFund(found ?? "not-found");
        } catch {
          setFund("not-found");
        }
      };
      setFund("loading");
      void load();
    };
    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  React.useEffect(() => {
    if (fund && fund !== "loading" && fund !== "not-found") {
      const title = fund.zh || fund.fund;
      const prev = document.title;
      document.title = `${title} — MPF Logs`;
      return () => {
        document.title = prev;
      };
    }
  }, [fund]);

  if (detail == null || detail === "") {
    if (isOnDetailPage) {
      return (
        <div className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-slate-600">請從網址指定基金，或前往全部基金選擇。</p>
          <a
            href={fundsListPath}
            className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="前往全部基金"
          >
            前往全部基金
          </a>
        </div>
      );
    }
    return null;
  }

  if (fund === "loading") {
    return (
      <div className="mb-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="status" aria-label="載入基金詳情">
        <p className="text-slate-600">載入中…</p>
      </div>
    );
  }

  if (fund === "not-found") {
    return (
      <div className="mb-10 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-slate-600" role="status">未找到該基金</p>
        <a
          href={fundsListPath}
          className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="返回全部基金"
        >
          返回全部基金
        </a>
      </div>
    );
  }

  if (!fund) return null;

  const hasList = isUnitPriceList(fund.unitPrice);
  const list = hasList ? (fund.unitPrice as UnitPriceEntry[]) : [];
  const chartData = hasList ? chartDataFromUnitPrice(list) : [];
  const hasSinglePrice = !hasList && typeof fund.unitPrice === "number";

  return (
    <div className="mb-10 space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm" role="region" aria-labelledby="fund-detail-heading">
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <a
            href={fundsListPath}
            className="text-sm text-slate-600 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="返回全部基金"
          >
            ← 返回全部基金
          </a>
          <BookmarkButton
            fund={fund.fund}
            isBookmarked={isBookmarked(fund.fund)}
            onToggle={toggleBookmark}
            ariaLabel={isBookmarked(fund.fund) ? "從收藏移除" : "加入收藏"}
          />
        </div>
        <h2 id="fund-detail-heading" className="text-xl font-semibold text-slate-800">
          {fund.zh || fund.fund}
        </h2>
        {fund.zh && fund.fund !== fund.zh && (
          <p className="text-slate-600">{fund.fund}</p>
        )}
      </div>

      {chartData.length > 0 && (
        <section aria-labelledby="fund-chart-heading">
          <h3 id="fund-chart-heading" className="mb-2 text-sm font-medium text-slate-700">
            單位價格走勢
          </h3>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), "單位價格"]}
                  labelFormatter={(label) => `月份：${label}`}
                  contentStyle={{ fontSize: 12 }}
                />
                <Line type="monotone" dataKey="price" name="單位價格" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section aria-labelledby="fund-data-heading">
        <h3 id="fund-data-heading" className="mb-2 text-sm font-medium text-slate-700">
          單位價格數據
        </h3>
        {hasList && list.length > 0 ? (
          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 text-sm">
            <table className="w-full border-collapse" role="table" aria-labelledby="fund-data-heading">
              <thead className="sticky top-0 z-10 bg-slate-100/95">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-600">
                    月份
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                    單位價格
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-600">
                    變動百分比
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                {[...list].reverse().map(({ month, price }, i, reversed) => {
                  const prevPrice = reversed[i + 1]?.price ?? null;
                  const changePercent =
                    prevPrice != null &&
                    typeof prevPrice === "number" &&
                    price != null &&
                    typeof price === "number" &&
                    prevPrice !== 0
                      ? ((price - prevPrice) / prevPrice) * 100
                      : null;
                  return (
                    <tr key={month} className="border-t border-slate-200/80 first:border-t-0">
                      <td className="px-3 py-1.5">{month}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">
                        {price != null
                          ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                          : "—"}
                      </td>
                      <td
                        className={`px-3 py-1.5 text-right tabular-nums ${
                          changePercent === null
                            ? "text-slate-500"
                            : changePercent > 0
                              ? "text-emerald-600"
                              : changePercent < 0
                                ? "text-rose-600"
                                : "text-slate-600"
                        }`}
                      >
                        {changePercent === null
                          ? "—"
                          : `${changePercent >= 0 ? "+" : ""}${changePercent.toFixed(2)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : hasSinglePrice ? (
          <p className="text-slate-700">
            單位價格：{(fund.unitPrice as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
          </p>
        ) : (
          <p className="text-slate-500">暫無單位價格數據</p>
        )}
      </section>
    </div>
  );
};

export default FundDetailView;
