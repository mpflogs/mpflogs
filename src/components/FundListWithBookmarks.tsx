import React from "react";
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

const FundListWithBookmarks = ({
  funds,
  basePath = "/mpflogs/funds",
}: FundListWithBookmarksProps) => {
  const { isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <ul
      className="grid list-inside gap-2 text-slate-700 sm:grid-cols-2 lg:grid-cols-3"
      role="list"
    >
      {funds.map(({ fund, zh }) => (
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
  );
};

export default FundListWithBookmarks;
