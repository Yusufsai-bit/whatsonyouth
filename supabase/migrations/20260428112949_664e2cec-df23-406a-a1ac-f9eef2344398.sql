REVOKE EXECUTE ON FUNCTION public.deactivate_expired_listings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_listing_views(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_users() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;