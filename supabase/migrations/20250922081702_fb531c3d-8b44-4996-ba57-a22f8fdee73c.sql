-- Fix the handle_new_user function to properly cast role to user_role enum
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (
    auth_uid,
    first_name,
    last_name,
    full_name,
    email,
    role,
    status,
    member_no
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
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
  RETURN NEW;
END;
$$;