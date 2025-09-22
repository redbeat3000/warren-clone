-- Fix security issues with existing functions by setting proper search path

-- Update is_admin function with secure search path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
SELECT EXISTS (
  SELECT 1 FROM public.users u
  WHERE u.auth_uid = auth.uid()
    AND u.role IN ('chairperson','treasurer','secretary')
    AND u.status = 'active'
);
$function$;

-- Update current_user_id function with secure search path
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT u.id FROM public.users u WHERE u.auth_uid = auth.uid() LIMIT 1;
$function$;