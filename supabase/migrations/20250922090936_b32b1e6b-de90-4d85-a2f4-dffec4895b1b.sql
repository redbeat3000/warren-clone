-- Security Fixes Migration (Final Corrected Version)
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

-- Fix 2: Create function to prevent role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow admins to change roles and status
  IF (OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status) 
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can modify user roles and status';
  END IF;
  
  -- Prevent changing auth_uid and member_no by non-admins
  IF (OLD.auth_uid IS DISTINCT FROM NEW.auth_uid OR OLD.member_no IS DISTINCT FROM NEW.member_no) 
     AND NOT is_admin() THEN
    RAISE EXCEPTION 'Only administrators can modify auth_uid and member_no';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to prevent role escalation
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.users;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

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