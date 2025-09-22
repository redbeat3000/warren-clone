-- Comprehensive cleanup of any remaining SECURITY DEFINER references
-- Check for any function dependencies and clean up

-- Recreate the view with explicit column types to ensure clean definition
DROP VIEW IF EXISTS public.member_contribution_summary CASCADE;

CREATE VIEW public.member_contribution_summary AS
SELECT 
  u.id AS member_id,
  u.full_name AS full_name,
  COALESCE(sum(c.amount), 0)::numeric(14,2) AS total_contributed,
  count(c.id)::bigint AS contribution_count,
  max(c.contribution_date) AS last_contribution
FROM public.users u
LEFT JOIN public.contributions c ON c.member_id = u.id
GROUP BY u.id, u.full_name;

-- Ensure proper permissions
GRANT SELECT ON public.member_contribution_summary TO authenticated;

-- Check if there are any other objects referencing the old function
-- This query will help identify any remaining references
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Clean up any remaining function references in the system catalogs
    FOR rec IN 
        SELECT oid FROM pg_proc 
        WHERE proname = 'get_member_contribution_summary' 
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.get_member_contribution_summary CASCADE';
    END LOOP;
END $$;