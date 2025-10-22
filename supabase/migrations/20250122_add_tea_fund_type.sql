-- Add tea_fund to contribution_type enum

-- Add the new value to the enum
ALTER TYPE contribution_type ADD VALUE IF NOT EXISTS 'tea_fund';

-- Update comment to reflect all contribution types
COMMENT ON TYPE contribution_type IS 'Types of contributions: regular, xmas_savings, land_fund, security_fund, tea_fund, registration_fee';
