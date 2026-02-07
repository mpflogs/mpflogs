import React from "react";

interface BookmarkButtonProps {
  fund: string;
  isBookmarked: boolean;
  onToggle: (fund: string) => void;
  /** Optional label override for a11y */
  ariaLabel?: string;
  className?: string;
}

const BookmarkButton = ({
  fund,
  isBookmarked,
  onToggle,
  ariaLabel,
  className = "",
}: BookmarkButtonProps) => {
  const handleClick = () => onToggle(fund);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle(fund);
    }
  };
  const label =
    ariaLabel ?? (isBookmarked ? "從收藏移除" : "加入收藏");

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={label}
      tabIndex={0}
      className={`shrink-0 rounded p-1.5 text-sky-600 transition-colors hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-1 ${className}`}
    >
      {isBookmarked ? (
        <svg
          className="h-5 w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"
          />
        </svg>
      )}
    </button>
  );
};

export default BookmarkButton;
