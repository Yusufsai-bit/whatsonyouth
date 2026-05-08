// Lightweight GA4 event helper. Safe to call before gtag loads.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(['event', name, params]);
    }
  } catch {
    // no-op
  }
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return;
  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  } catch {
    // no-op
  }
}
