import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CATEGORY_COLORS: Record<string, string> = {
  Events: '#2D1B69',
  Jobs: '#1A2A4A',
  Grants: '#1A3A2A',
  Programs: '#0A2A3A',
  Wellbeing: '#2A1A3A',
};

interface Props {
  listingId: string;
  imageUrl: string | null;
  title: string;
  category: string;
  link: string;
  className?: string;
}

export default function ListingCardImage({ listingId, imageUrl, title, category, link, className = 'w-full h-40' }: Props) {
  const [src, setSrc] = useState<string | null>(imageUrl || null);
  const [resolving, setResolving] = useState(!imageUrl);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(Boolean(imageUrl));
  const containerRef = useRef<HTMLDivElement | null>(null);

  const resolve = useCallback(async () => {
    setResolving(true);
    try {
      const { data } = await supabase.functions.invoke('resolve-listing-image', {
        body: { listing_id: listingId },
      });
      if (data?.image_url) {
        setSrc(data.image_url);
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setResolving(false);
    }
  }, [listingId]);

  useEffect(() => {
    if (imageUrl || visible) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '240px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [imageUrl, visible]);

  useEffect(() => {
    if (!imageUrl && visible) {
      resolve();
    }
  }, [imageUrl, visible, resolve]);

  const handleError = () => {
    if (!resolving && !failed) {
      setSrc(null);
      resolve();
    } else {
      setFailed(true);
    }
  };

  const isUnsplash = src?.includes('unsplash.com');
  const fallbackColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.Events;

  // Shimmer loading
  if (resolving && !src) {
    return <div ref={containerRef} className={`${className} skeleton-shimmer`} />;
  }

  // Category color fallback
  if (failed && !src) {
    return <div ref={containerRef} className={className} style={{ backgroundColor: fallbackColor }} />;
  }

  return (
    <div ref={containerRef} className={`${className} relative`} style={{ backgroundColor: fallbackColor }}>
      {src && (
        <img
          src={src}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={handleError}
        />
      )}
      {isUnsplash && (
        <span className="absolute bottom-7 left-2.5 font-body text-[10px] text-white/60" style={{ fontWeight: 400 }}>
          Photo: Unsplash
        </span>
      )}
    </div>
  );
}
