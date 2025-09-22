-- Update the handle_new_user function to use nyaberihamisi@gmail.com as admin
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
    -- Make nyaberihamisi@gmail.com automatically a chairperson (admin)
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'chairperson'
      ELSE 'member'
    END,
    'active',
    -- Generate member number
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'ADM001'
      ELSE 'MEM' || LPAD((SELECT COUNT(*) + 1 FROM users WHERE role = 'member')::text, 3, '0')
    END
  );
  RETURN NEW;
END;
$$;