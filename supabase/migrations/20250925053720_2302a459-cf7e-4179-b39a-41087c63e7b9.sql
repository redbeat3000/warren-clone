-- Add member management settings to the settings table
INSERT INTO public.settings (key, value, description) VALUES 
('member_approval_required', 'true', 'Whether new member applications require chairman approval'),
('auto_assign_member_numbers', 'true', 'Whether to automatically assign sequential member numbers'),
('member_number_prefix', '"CH"', 'Prefix used for member numbers'),
('maximum_members', '50', 'Maximum number of members allowed in the chama')
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = now();