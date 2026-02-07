import { useState, useEffect, useCallback } from "react";
import {
  getBookmarks,
  addBookmark as addBookmarkStorage,
  removeBookmark as removeBookmarkStorage,
  BOOKMARKS_CHANGE_EVENT,
} from "./bookmarks";

export const useBookmarks = () => {
  const [bookmarks, setBookmarksState] = useState<string[]>([]);

  const syncFromStorage = useCallback(() => {
    setBookmarksState(getBookmarks());
  }, []);

  useEffect(() => {
    syncFromStorage();
    const handleChange = () => syncFromStorage();
    window.addEventListener(BOOKMARKS_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(BOOKMARKS_CHANGE_EVENT, handleChange);
  }, [syncFromStorage]);

  const addBookmark = useCallback((fund: string) => {
    addBookmarkStorage(fund);
    setBookmarksState(getBookmarks());
  }, []);

  const removeBookmark = useCallback((fund: string) => {
    removeBookmarkStorage(fund);
    setBookmarksState(getBookmarks());
  }, []);

  const toggleBookmark = useCallback((fund: string) => {
    const id = fund.trim();
    if (!id) return;
    const list = getBookmarks();
    if (list.includes(id)) removeBookmarkStorage(id);
    else addBookmarkStorage(id);
    setBookmarksState(getBookmarks());
  }, []);

  const isBookmarked = useCallback(
    (fund: string) => bookmarks.includes(fund.trim()),
    [bookmarks]
  );

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
  };
};
