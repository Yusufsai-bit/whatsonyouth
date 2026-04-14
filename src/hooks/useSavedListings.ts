import { useState, useEffect, useCallback } from 'react';

interface SavedListing {
  id: string;
  title: string;
  category: string;
  organisation: string;
  location: string;
}

const STORAGE_KEY = 'woy_saved_listings';

function readSaved(): SavedListing[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export default function useSavedListings() {
  const [saved, setSaved] = useState<SavedListing[]>(readSaved);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }, [saved]);

  const savedIds = saved.map(s => s.id);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  const toggleSave = useCallback((listing: SavedListing) => {
    setSaved(prev => {
      const exists = prev.find(s => s.id === listing.id);
      if (exists) return prev.filter(s => s.id !== listing.id);
      return [...prev, listing];
    });
  }, []);

  return { saved, savedIds, isSaved, toggleSave };
}
