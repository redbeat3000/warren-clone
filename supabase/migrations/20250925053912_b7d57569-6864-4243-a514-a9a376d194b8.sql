-- Update handle_new_user function to use settings from the database
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    next_member_no text;
    chairperson_exists boolean;
    auto_assign_enabled boolean;
    member_prefix text;
    max_members integer;
    current_member_count integer;
    approval_required boolean;
BEGIN
  -- Get settings from the database
  SELECT 
    (SELECT value::boolean FROM settings WHERE key = 'auto_assign_member_numbers'),
    (SELECT COALESCE(json_extract_path_text(value::json, '')::text, 'CH') FROM settings WHERE key = 'member_number_prefix'),
    (SELECT value::integer FROM settings WHERE key = 'maximum_members'),
    (SELECT value::boolean FROM settings WHERE key = 'member_approval_required')
  INTO auto_assign_enabled, member_prefix, max_members, approval_required;

  -- Set defaults if settings not found
  auto_assign_enabled := COALESCE(auto_assign_enabled, true);
  member_prefix := COALESCE(member_prefix, 'CH');
  max_members := COALESCE(max_members, 50);
  approval_required := COALESCE(approval_required, true);

  -- Check member count limit
  SELECT COUNT(*) INTO current_member_count FROM users WHERE status = 'active';
  IF current_member_count >= max_members THEN
    RAISE EXCEPTION 'Maximum number of members (%) has been reached', max_members;
  END IF;

  -- Check if trying to create a chairperson when one already exists
  IF NEW.raw_user_meta_data ->> 'role' = 'chairperson' OR NEW.email = 'nyaberihamisi@gmail.com' THEN
    SELECT EXISTS(SELECT 1 FROM users WHERE role = 'chairperson' AND status = 'active') INTO chairperson_exists;
    IF chairperson_exists THEN
      RAISE EXCEPTION 'Only one chairperson is allowed in the system';
    END IF;
  END IF;

  -- Generate member number
  IF NEW.email = 'nyaberihamisi@gmail.com' THEN
    next_member_no := 'ADM001';
  ELSIF auto_assign_enabled THEN
    -- Get the next available member number with the current prefix
    SELECT member_prefix || LPAD((COALESCE(MAX(CAST(SUBSTRING(member_no FROM (length(member_prefix) + 1)) AS INTEGER)), 0) + 1)::text, 3, '0')
    INTO next_member_no
    FROM users 
    WHERE member_no LIKE member_prefix || '%' AND member_no ~ ('^' || member_prefix || '[0-9]{3}$');
    
    -- If no members exist with this prefix, start with 001
    IF next_member_no IS NULL THEN
      next_member_no := member_prefix || '001';
    END IF;
  ELSE
    -- Don't auto-assign, will be set manually by admin
    next_member_no := NULL;
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
    CASE 
      WHEN NEW.email = 'nyaberihamisi@gmail.com' THEN 'active'::record_status
      WHEN approval_required THEN 'pending'::record_status
      ELSE 'active'::record_status
    END,
    next_member_no
  );
  
  RETURN NEW;
END;
$function$;