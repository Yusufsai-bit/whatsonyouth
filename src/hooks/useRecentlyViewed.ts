import { useState, useCallback } from 'react';

const STORAGE_KEY = 'woy_recently_viewed';
const MAX_ITEMS = 5;

function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState<string[]>(readRecent);

  const addRecentlyViewed = useCallback((id: string) => {
    setRecentIds(prev => {
      const updated = [id, ...prev.filter(x => x !== id)].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setRecentIds([]);
  }, []);

  return { recentIds, addRecentlyViewed, clearRecent };
}
