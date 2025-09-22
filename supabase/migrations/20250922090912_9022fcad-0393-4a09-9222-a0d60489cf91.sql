-- Security Fixes Migration (Corrected)
-- Fix 1: Replace member_contribution_summary view with secure function
DROP VIEW IF EXISTS public.member_contribution_summary;

-- Create a security definer function that respects RLS policies
CREATE OR REPLACE FUNCTION public.get_member_contribution_summary(target_member_id uuid DEFAULT NULL)
RETURNS TABLE (
  member_id uuid,
  full_name character varying,
  total_contributed numeric(14,2),
  contribution_count bigint,
  last_contribution date
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    u.id AS member_id,
    u.full_name,
    (COALESCE(sum(c.amount), 0))::numeric(14,2) AS total_contributed,
    count(c.*) AS contribution_count,
    max(c.contribution_date) AS last_contribution
  FROM users u
  LEFT JOIN contributions c ON (c.member_id = u.id)
  WHERE (target_member_id IS NULL OR u.id = target_member_id)
    AND (
      -- Members can only see their own summary
      u.auth_uid = auth.uid() 
      OR 
      -- Admins can see all summaries
      is_admin()
    )
  GROUP BY u.id, u.full_name;
$$;

-- Create a view that uses the secure function for backward compatibility
CREATE VIEW public.member_contribution_summary AS
SELECT * FROM public.get_member_contribution_summary();

-- Fix 2: Prevent role escalation - update users table policies
DROP POLICY IF EXISTS "users_update_self" ON public.users;

-- New policy: Users can update their profile but NOT their role, status, or member_no
CREATE POLICY "users_update_profile_only" 
ON public.users 
FOR UPDATE 
USING (auth_uid = auth.uid()) 
WITH CHECK (
  auth_uid = auth.uid() 
  AND OLD.role = NEW.role 
  AND OLD.status = NEW.status 
  AND OLD.member_no = NEW.member_no
  AND OLD.auth_uid = NEW.auth_uid
);

-- Fix 3: Create audit function for role changes
CREATE OR REPLACE FUNCTION public.audit_user_role_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes to audit_logs table
  IF OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_logs (
      actor_id,
      action,
      meta
    ) VALUES (
      current_user_id(),
      'user_role_change',
      jsonb_build_object(
        'user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for user role change auditing
DROP TRIGGER IF EXISTS audit_user_changes ON public.users;
CREATE TRIGGER audit_user_changes
  AFTER UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_user_role_changes();