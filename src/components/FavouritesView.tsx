import React from "react";
import type { FundPriceSchemeData } from "../types/mpf";
import { useBookmarks } from "../lib/useBookmarks";
import BookmarkButton from "./BookmarkButton";

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
      <div
        className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        role="region"
        aria-labelledby="favourites-empty-heading"
      >
        <h2 id="favourites-empty-heading" className="mb-2 text-xl font-semibold text-slate-800">
          我的收藏
        </h2>
        <p className="text-slate-600">
          尚未收藏任何基金。請到
          <a
            href={`${BASE_PATH}/`}
            className="ml-1 text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 rounded"
            aria-label="前往全部基金頁面"
          >
            全部基金
          </a>
          點選星號加入收藏。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="region" aria-labelledby="favourites-heading">
      <section
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        aria-labelledby="favourites-heading"
      >
        <h2 id="favourites-heading" className="sr-only">
          已收藏的基金列表
        </h2>
        <ul className="grid list-none gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
          {bookmarks.map((fund) => {
            const zh = fundToZh.get(fund);
            const detailHref = `${BASE_PATH}/detail?fund=${encodeURIComponent(fund)}`;
            const label = zh ?? fund;
            return (
              <li
                key={fund}
                className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:bg-slate-100/50"
              >
                <a
                  href={detailHref}
                  className="min-w-0 flex-1 text-slate-700 hover:text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 rounded"
                  aria-label={`查看 ${label} 詳情`}
                >
                  {zh ? (
                    <span>
                      <span className="font-medium text-slate-800">{zh}</span>
                      <span className="block text-sm text-slate-600">{fund}</span>
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
      </section>
    </div>
  );
};

export default FavouritesView;
