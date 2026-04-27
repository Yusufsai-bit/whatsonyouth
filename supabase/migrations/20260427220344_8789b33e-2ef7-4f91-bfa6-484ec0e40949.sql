REVOKE EXECUTE ON FUNCTION public.increment_listing_views(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_listing_views(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.list_users() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_users() TO authenticated;