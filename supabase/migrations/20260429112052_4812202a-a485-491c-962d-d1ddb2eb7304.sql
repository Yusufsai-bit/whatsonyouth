UPDATE public.listings
SET is_active = false,
    expired_at = now()
WHERE is_active = true
  AND (
    link ILIKE '%lsv.com.au/public-training/work-highlights-projects/become-a-swim-teacher%'
    OR link ILIKE '%lsv.com.au/public-training/become-a-swim-teacher%'
    OR link ILIKE '%lsv.com.au/lsv-everyday-lifesavers/become-a-swim-teacher%'
  );