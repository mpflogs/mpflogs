import React from "react";
import type { FundPriceSchemeData } from "../types/mpf";
import { useBookmarks } from "../lib/useBookmarks";
import BookmarkButton from "./BookmarkButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const BASE_PATH = "/mpflogs/funds";
const DATA_URL = `${(import.meta.env.BASE_URL || "/").replace(/\/?$/, "/")}data/fund_price_scheme.json`;

const buildFundToZh = (data: FundPriceSchemeData): Map<string, string> => {
  const map = new Map<string, string>();
  const list = data?.data ?? [];
  for (const entry of list) {
    for (const f of entry.funds ?? []) {
      const key = (f.fund ?? "").trim();
      if (key && f.zh) map.set(key, f.zh.trim());
    }
  }
  return map;
};

const FavouritesView = () => {
  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  const [fundToZh, setFundToZh] = React.useState<Map<string, string>>(new Map());

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(DATA_URL);
        if (!res.ok) return;
        const json = (await res.json()) as FundPriceSchemeData;
        setFundToZh(buildFundToZh(json));
      } catch {
        setFundToZh(new Map());
      }
    };
    void load();
  }, []);

  if (bookmarks.length === 0) {
    return (
      <Card
        role="region"
        aria-labelledby="favourites-empty-heading"
      >
        <CardHeader>
          <CardTitle id="favourites-empty-heading">
            我的收藏
          </CardTitle>
          <CardDescription>
            尚未收藏任何基金。請到
            <a
              href={`${BASE_PATH}/`}
              className="ml-1 text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded"
              aria-label="前往全部基金頁面"
            >
              全部基金
            </a>
            點選星號加入收藏。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-labelledby="favourites-heading">
      <Card aria-labelledby="favourites-heading">
        <CardHeader>
          <h2 id="favourites-heading" className="sr-only">
            已收藏的基金列表
          </h2>
        </CardHeader>
        <CardContent>
          <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {bookmarks.map((fund) => {
              const zh = fundToZh.get(fund);
              const detailHref = `${BASE_PATH}/detail?fund=${encodeURIComponent(fund)}`;
              const label = zh ?? fund;
              return (
                <li
                  key={fund}
                  className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 transition-colors hover:bg-accent"
                >
                  <a
                    href={detailHref}
                    className="min-w-0 flex-1 text-foreground hover:text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                    aria-label={`查看 ${label} 詳情`}
                  >
                    {zh ? (
                      <span>
                        <span className="font-medium text-foreground">{zh}</span>
                        <span className="block text-sm text-muted-foreground">{fund}</span>
                      </span>
                    ) : (
                      <span>{fund}</span>
                    )}
                  </a>
                  <BookmarkButton
                    fund={fund}
                    isBookmarked={isBookmarked(fund)}
                    onToggle={toggleBookmark}
                    ariaLabel={`從收藏移除：${label}`}
                  />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FavouritesView;
