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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>基金詳情</CardTitle>
            <p className="text-muted-foreground">請從網址指定基金，或前往全部基金選擇。</p>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <a href={fundsListPath} aria-label="前往全部基金">
                前往全部基金
              </a>
            </Button>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  if (fund === "loading") {
    return (
      <Card className="mb-10" role="status" aria-label="載入基金詳情">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">載入中…</p>
        </CardContent>
      </Card>
    );
  }

  if (fund === "not-found") {
    return (
      <Card className="mb-10 space-y-4">
        <CardHeader>
          <CardTitle>基金詳情</CardTitle>
          <p className="text-muted-foreground" role="status">未找到該基金</p>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <a href={fundsListPath} aria-label="返回全部基金">
              返回全部基金
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!fund) return null;

  const hasList = isUnitPriceList(fund.unitPrice);
  const list = hasList ? (fund.unitPrice as UnitPriceEntry[]) : [];
  const chartData = hasList ? chartDataFromUnitPrice(list) : [];
  const hasSinglePrice = !hasList && typeof fund.unitPrice === "number";

  return (
    <Card className="mb-10 space-y-6" role="region" aria-labelledby="fund-detail-heading">
      <CardHeader>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <a
            href={fundsListPath}
            className="text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
        <CardTitle id="fund-detail-heading">
          {fund.zh || fund.fund}
        </CardTitle>
        {fund.zh && fund.fund !== fund.zh && (
          <p className="text-muted-foreground">{fund.fund}</p>
        )}
      </CardHeader>

      {chartData.length > 0 && (
        <CardContent className="pt-0">
          <section aria-labelledby="fund-chart-heading">
            <h3 id="fund-chart-heading" className="mb-2 text-sm font-medium text-foreground">
              單位價格走勢
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" tickFormatter={(v) => v.toLocaleString(undefined, { maximumFractionDigits: 2 })} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }), "單位價格"]}
                    labelFormatter={(label) => `月份：${label}`}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="price" name="單位價格" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        </CardContent>
      )}

      <CardContent className="pt-0">
        <section aria-labelledby="fund-data-heading">
          <h3 id="fund-data-heading" className="mb-2 text-sm font-medium text-foreground">
            單位價格數據
          </h3>
          {hasList && list.length > 0 ? (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-muted/50 text-sm">
              <table className="w-full border-collapse" role="table" aria-labelledby="fund-data-heading">
                <thead className="sticky top-0 z-10 bg-muted/95">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                      月份
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      單位價格
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">
                      變動百分比
                    </th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
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
                      <tr key={month} className="border-t border-border first:border-t-0">
                        <td className="px-3 py-1.5">{month}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">
                          {price != null
                            ? price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })
                            : "—"}
                        </td>
                        <td
                          className={`px-3 py-1.5 text-right tabular-nums ${
                            changePercent === null
                              ? "text-muted-foreground"
                              : changePercent > 0
                                ? "text-foreground"
                                : changePercent < 0
                                  ? "text-muted-foreground"
                                  : "text-muted-foreground"
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
            <p className="text-foreground">
              單位價格：{(fund.unitPrice as number).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </p>
          ) : (
            <p className="text-muted-foreground">暫無單位價格數據</p>
          )}
        </section>
      </CardContent>
    </Card>
  );
};

export default FundDetailView;
