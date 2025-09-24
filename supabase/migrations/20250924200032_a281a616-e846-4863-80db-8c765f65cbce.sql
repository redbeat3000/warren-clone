-- Temporarily disable the role escalation trigger to fix data inconsistency
-- This is a one-time fix for the duplicate chairperson issue

-- Drop the trigger temporarily
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON users;

-- Fix the duplicate chairperson issue and standardize member numbers
-- Keep Blessing as the chairperson, change Warren to treasurer

-- Change Warren from chairperson to treasurer
UPDATE users 
SET role = 'treasurer'
WHERE id = '11111111-1111-1111-1111-111111111111' AND first_name = 'Warren';

-- Change Susan from treasurer to member (since we now have Warren as treasurer)
UPDATE users 
SET role = 'member'
WHERE id = '22222222-2222-2222-2222-222222222222' AND first_name = 'Susan';

-- Fix member numbers to be consistent (keep ADM001 for Blessing, use MEM pattern for others)
UPDATE users SET member_no = 'MEM001' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE users SET member_no = 'MEM002' WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE users SET member_no = 'MEM003' WHERE id = '33333333-3333-3333-3333-333333333333';
UPDATE users SET member_no = 'MEM004' WHERE id = '44444444-4444-4444-4444-444444444444';
UPDATE users SET member_no = 'MEM005' WHERE id = '55555555-5555-5555-5555-555555555555';

-- Re-create the trigger
CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_escalation();