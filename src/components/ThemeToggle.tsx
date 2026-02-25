import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mpflogs-theme";
const CLASS_DARK = "dark";

const getStoredTheme = (): "light" | "dark" | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return null;
};

const getSystemDark = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const isDark = (): boolean => {
  const stored = getStoredTheme();
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return getSystemDark();
};

const applyTheme = (dark: boolean) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (dark) {
    root.classList.add(CLASS_DARK);
  } else {
    root.classList.remove(CLASS_DARK);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", dark ? "#0c0c0c" : "#ffffff");
  }
};

const ThemeToggle = ({ className }: { className?: string }) => {
  const [dark, setDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    setDark(isDark());
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    applyTheme(dark);
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, [mounted, dark]);

  const handleClick = () => setDark((d) => !d);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  if (!mounted) {
    return (
      <span
        className={cn("inline-flex size-9 items-center justify-center rounded-md border border-border", className)}
        aria-hidden
      >
        <span className="size-4 rounded-full bg-muted" />
      </span>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={dark ? "切換至淺色模式" : "切換至深色模式"}
      className={cn(className)}
    >
      {dark ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </Button>
  );
};

export default ThemeToggle;
