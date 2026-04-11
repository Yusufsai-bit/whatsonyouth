const CATEGORY_FALLBACKS: Record<string, string> = {
  Events: '/images/fallback-events.jpg',
  Jobs: '/images/fallback-jobs.jpg',
  Grants: '/images/fallback-grants.jpg',
  Programs: '/images/fallback-programs.jpg',
  Wellbeing: '/images/fallback-wellbeing.jpg',
};

export function getListingImage(imageUrl: string | null | undefined, category: string): string {
  if (imageUrl) return imageUrl;
  return CATEGORY_FALLBACKS[category] || CATEGORY_FALLBACKS.Events;
}
