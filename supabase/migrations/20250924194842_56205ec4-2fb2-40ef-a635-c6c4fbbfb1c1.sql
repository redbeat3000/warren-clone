-- Fix member number generation to be unique and prevent multiple chairpersons
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    next_member_no text;
    chairperson_exists boolean;
BEGIN
  -- Check if trying to create a chairperson when one already exists
  IF NEW.raw_user_meta_data ->> 'role' = 'chairperson' OR NEW.email = 'nyaberihamisi@gmail.com' THEN
    SELECT EXISTS(SELECT 1 FROM users WHERE role = 'chairperson' AND status = 'active') INTO chairperson_exists;
    IF chairperson_exists THEN
      RAISE EXCEPTION 'Only one chairperson is allowed in the system';
    END IF;
  END IF;

  -- Generate unique member number
  IF NEW.email = 'nyaberihamisi@gmail.com' THEN
    next_member_no := 'ADM001';
  ELSE
    -- Get the next available member number
    SELECT 'MEM' || LPAD((COALESCE(MAX(CAST(SUBSTRING(member_no FROM 4) AS INTEGER)), 0) + 1)::text, 3, '0')
    INTO next_member_no
    FROM users 
    WHERE member_no LIKE 'MEM%' AND member_no ~ '^MEM[0-9]{3}$';
    
    -- If no members exist, start with MEM001
    IF next_member_no IS NULL THEN
      next_member_no := 'MEM001';
    END IF;
  END IF;

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
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'chairperson'::user_role
      ELSE 'member'::user_role
    END,
    'active'::record_status,
    next_member_no
  );
  
  RETURN NEW;
END;
$function$;