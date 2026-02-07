/** localStorage key for bookmarked fund names (English fund id). */
const STORAGE_KEY = "mpflogs-bookmarks";

const parse = (raw: string | null): string[] => {
  if (raw == null || raw === "") return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
};

/** Get list of bookmarked fund names. Returns [] when not in browser. */
export const getBookmarks = (): string[] => {
  if (typeof window === "undefined") return [];
  return parse(window.localStorage.getItem(STORAGE_KEY));
};

export const BOOKMARKS_CHANGE_EVENT = "mpflogs-bookmarks-change";

/** Replace entire bookmarks list. No-op when not in browser. Dispatches custom event so islands can sync. */
export const setBookmarks = (ids: string[]): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(BOOKMARKS_CHANGE_EVENT));
};

/** Add one fund by name. No-op when not in browser. */
export const addBookmark = (fund: string): void => {
  const id = fund.trim();
  if (!id) return;
  const list = getBookmarks();
  if (list.includes(id)) return;
  setBookmarks([...list, id]);
};

/** Remove one fund by name. No-op when not in browser. */
export const removeBookmark = (fund: string): void => {
  const id = fund.trim();
  if (!id) return;
  setBookmarks(getBookmarks().filter((x) => x !== id));
};

/** True if fund is bookmarked. */
export const isBookmarked = (fund: string): boolean =>
  getBookmarks().includes(fund.trim());
