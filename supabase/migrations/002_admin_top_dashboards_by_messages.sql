-- Rank dashboards by total chat_messages rows (service-role RPC for admin overview).

CREATE OR REPLACE FUNCTION public.admin_top_dashboards_by_messages(p_limit integer DEFAULT 3)
RETURNS TABLE (
  id uuid,
  dashboard_code text,
  dashboard_name text,
  message_count bigint
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    d.id,
    d.dashboard_id AS dashboard_code,
    d.dashboard_name,
    x.cnt AS message_count
  FROM (
    SELECT m.dashboard_id, COUNT(*)::bigint AS cnt
    FROM public.chat_messages m
    GROUP BY m.dashboard_id
    ORDER BY cnt DESC
    LIMIT LEAST(GREATEST(COALESCE(p_limit, 3), 1), 50)
  ) x
  INNER JOIN public.dashboards d ON d.id = x.dashboard_id
  ORDER BY x.cnt DESC;
$$;

REVOKE ALL ON FUNCTION public.admin_top_dashboards_by_messages(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_top_dashboards_by_messages(integer) TO service_role;
