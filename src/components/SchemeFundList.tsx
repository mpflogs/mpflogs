import React from "react";
import type { FundEntry, FundPriceSchemeData, FundPriceSchemeEntry } from "../types/mpf";
import { useBookmarks } from "../lib/useBookmarks";
import BookmarkButton from "./BookmarkButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

/** Detail icon: arrow-right, indicates "view detail page" */
const DetailIcon = () => (
  <svg className="size-5 shrink-0 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
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
  const { isBookmarked, toggleBookmark } = useBookmarks();
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
      <p className="text-destructive" role="alert">
        無法載入資料：{error}
      </p>
    );
  }

  if (entry === "loading") {
    return (
      <p className="text-muted-foreground" aria-live="polite">
        載入中…
      </p>
    );
  }

  if (entry === "not-found") {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground" role="status">
          {params ? "未找到該計劃" : "請從受託人與計劃頁選擇計劃"}
        </p>
        <Button asChild variant="outline">
          <a
            href="/mpflogs/trustees/"
            aria-label="返回受託人與計劃"
          >
            返回受託人與計劃
          </a>
        </Button>
      </div>
    );
  }

  const funds = entry.funds ?? [];

  return (
    <div className="space-y-6">
      <div>
        <a
          href="/mpflogs/trustees/"
          className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="返回受託人與計劃"
        >
          ← 返回受託人與計劃
        </a>
        <h2 className="text-xl font-semibold text-foreground">
          {entry.scheme.zh || entry.scheme.name}
        </h2>
        {entry.scheme.zh && entry.scheme.name !== entry.scheme.zh && (
          <p className="text-muted-foreground">{entry.scheme.name}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {entry.trustee.zh || entry.trustee.name} · {funds.length} 隻基金
        </p>
      </div>

      <Card aria-labelledby="funds-heading">
        <h3 id="funds-heading" className="sr-only">
          基金列表
        </h3>
        <CardContent className="p-0">
          <ul className="divide-y divide-border" role="list">
            {funds.map((fund: FundEntry) => {
              const fundKey = fund.fund;
              const detailHref = `/mpflogs/funds/detail?fund=${encodeURIComponent(fundKey)}`;
              const fundLabel = fund.zh || fund.fund;
              return (
                <li key={fundKey} className="flex items-center gap-2 px-4 py-3 sm:px-6">
                  <a
                    href={detailHref}
                    className="min-w-0 flex-1 text-foreground hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    aria-label={`查看 ${fundLabel} 圖表與數據`}
                  >
                    {fund.zh && (
                      <span className="font-medium text-foreground">{fund.zh}</span>
                    )}
                    <span className={fund.zh ? "block text-sm text-muted-foreground" : "text-foreground"}>
                      {fund.fund}
                    </span>
                  </a>
                  <BookmarkButton
                    fund={fundKey}
                    isBookmarked={isBookmarked(fundKey)}
                    onToggle={toggleBookmark}
                    ariaLabel={isBookmarked(fundKey) ? `從收藏移除：${fundLabel}` : `加入收藏：${fundLabel}`}
                  />
                  <Button variant="ghost" size="icon" asChild>
                    <a
                      href={detailHref}
                      className="flex shrink-0 items-center justify-center rounded p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      aria-label={`查看 ${fundLabel} 圖表與數據`}
                      tabIndex={0}
                    >
                      <DetailIcon />
                    </a>
                  </Button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemeFundList;
