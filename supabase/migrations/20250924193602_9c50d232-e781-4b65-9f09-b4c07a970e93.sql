-- Fix the handle_new_user function to not manually insert full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.users (
    auth_uid,
    first_name,
    last_name,
    email,
    role,
    status,
    member_no
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.email,
    -- Properly cast role to user_role enum
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'chairperson'::user_role
      ELSE 'member'::user_role
    END,
    'active'::record_status,
    -- Generate member number
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'ADM001'
      ELSE 'MEM' || LPAD((SELECT COUNT(*) + 1 FROM users WHERE role = 'member')::text, 3, '0')
    END
  );
  
  -- Update the full_name after insertion
  UPDATE public.users 
  SET full_name = COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')
  WHERE auth_uid = NEW.id;
  
  RETURN NEW;
END;
$function$;