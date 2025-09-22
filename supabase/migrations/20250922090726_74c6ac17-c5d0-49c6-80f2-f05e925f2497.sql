-- Security Fixes Migration
-- Fix 1: Add RLS protection for member_contribution_summary
ALTER TABLE public.member_contribution_summary ENABLE ROW LEVEL SECURITY;

-- Policy: Members can only see their own contribution summary
CREATE POLICY "members_view_own_summary" 
ON public.member_contribution_summary 
FOR SELECT 
USING (
  member_id IN (
    SELECT id FROM public.users 
    WHERE auth_uid = auth.uid()
  ) OR is_admin()
);

-- Policy: Only admins can modify summary data (if needed for maintenance)
CREATE POLICY "admin_full_access_summary" 
ON public.member_contribution_summary 
FOR ALL 
USING (is_admin()) 
WITH CHECK (is_admin());

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

-- Fix 4: Restrict admin role assignment - only existing admins can assign admin roles
CREATE POLICY "admin_role_assignment_only" 
ON public.users 
FOR UPDATE 
USING (
  auth_uid = auth.uid() 
  AND (
    -- Allow self-updates that don't change role
    (OLD.role = NEW.role) 
    OR 
    -- Only admins can change roles to admin positions
    (is_admin() AND NEW.role IN ('chairperson', 'treasurer', 'secretary'))
  )
) 
WITH CHECK (
  auth_uid = auth.uid() 
  AND (
    -- Allow self-updates that don't change role
    (OLD.role = NEW.role) 
    OR 
    -- Only admins can assign admin roles
    (is_admin() AND NEW.role IN ('chairperson', 'treasurer', 'secretary'))
  )
);