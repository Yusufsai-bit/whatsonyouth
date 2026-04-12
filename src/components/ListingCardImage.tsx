import { useState, useEffect, useCallback } from 'react';
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

  const resolve = useCallback(async () => {
    setResolving(true);
    try {
      const { data } = await supabase.functions.invoke('resolve-listing-image', {
        body: { listing_id: listingId, listing_url: link, listing_title: title, category },
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
  }, [listingId, link, title, category]);

  useEffect(() => {
    if (!imageUrl) {
      resolve();
    }
  }, [imageUrl, resolve]);

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
    return <div className={`${className} skeleton-shimmer`} />;
  }

  // Category color fallback
  if (failed && !src) {
    return <div className={className} style={{ backgroundColor: fallbackColor }} />;
  }

  return (
    <div className={`${className} relative`} style={{ backgroundColor: fallbackColor }}>
      {src && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
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
