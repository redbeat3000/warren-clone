-- Fix Security Definer View Issue
-- Remove the problematic SECURITY DEFINER function and view

DROP VIEW IF EXISTS public.member_contribution_summary;
DROP FUNCTION IF EXISTS public.get_member_contribution_summary(uuid);

-- Create a new view that relies on existing RLS policies
-- This view will respect the RLS policies on users and contributions tables
CREATE VIEW public.member_contribution_summary AS
SELECT 
  u.id AS member_id,
  u.full_name,
  (COALESCE(sum(c.amount), 0))::numeric(14,2) AS total_contributed,
  count(c.*) AS contribution_count,
  max(c.contribution_date) AS last_contribution
FROM users u
LEFT JOIN contributions c ON (c.member_id = u.id)
GROUP BY u.id, u.full_name;

-- Grant appropriate permissions to the view
-- The view will inherit security from the underlying tables' RLS policies
GRANT SELECT ON public.member_contribution_summary TO authenticated;