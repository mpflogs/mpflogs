import React, { useMemo, useState } from "react";
import { useBookmarks } from "../lib/useBookmarks";
import BookmarkButton from "./BookmarkButton";

export interface FundItem {
  fund: string;
  zh?: string;
}

interface FundListWithBookmarksProps {
  funds: FundItem[];
  basePath?: string;
}

const SearchIcon = () => (
  <svg
    className="h-5 w-5 shrink-0 text-slate-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const matchesQuery = (item: FundItem, query: string): boolean => {
  const q = query.trim();
  if (!q) return true;
  const qLower = q.toLowerCase();
  const matchZh = item.zh != null && item.zh.includes(q);
  const matchEn = item.fund.toLowerCase().includes(qLower);
  return matchZh || matchEn;
};

const FundListWithBookmarks = ({
  funds,
  basePath = "/mpflogs/funds",
}: FundListWithBookmarksProps) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [query, setQuery] = useState("");

  const filteredFunds = useMemo(
    () => funds.filter((item) => matchesQuery(item, query)),
    [funds, query]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2
          id="funds-heading"
          className="text-lg font-semibold text-slate-800"
        >
          基金一覽
        </h2>
        <label className="flex min-w-0 max-w-xs flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-700 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-500/20 sm:max-w-sm">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={handleSearchChange}
            placeholder="搜尋基金名稱"
            className="min-w-0 flex-1 border-0 bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
            aria-label="搜尋基金名稱（中文或英文）"
            autoComplete="off"
          />
        </label>
      </div>
      <ul
        className="grid list-inside gap-2 text-slate-700 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
      >
        {filteredFunds.map(({ fund, zh }) => (
          <li
            key={fund}
            className="flex items-center gap-2 rounded border border-slate-100 bg-slate-50/50 px-3 py-2"
          >
            <a
              href={`${basePath}/detail?fund=${encodeURIComponent(fund)}`}
              className="min-w-0 flex-1 text-slate-700 hover:text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 rounded"
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
              ariaLabel={isBookmarked(fund) ? `從收藏移除：${zh ?? fund}` : `加入收藏：${zh ?? fund}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FundListWithBookmarks;
