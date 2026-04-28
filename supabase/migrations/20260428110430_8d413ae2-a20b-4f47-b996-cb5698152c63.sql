-- Fix Phase 1 security linter findings from scanner health views/functions

ALTER VIEW public.admin_scan_source_health SET (security_invoker = true);
ALTER VIEW public.admin_listing_quality SET (security_invoker = true);

REVOKE EXECUTE ON FUNCTION public.deactivate_expired_listings() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_listings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.deactivate_expired_listings() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_expired_listings() TO service_role;