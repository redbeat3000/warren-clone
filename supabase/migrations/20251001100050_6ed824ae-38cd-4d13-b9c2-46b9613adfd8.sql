-- Add contribution_type column to contributions table
ALTER TABLE public.contributions 
ADD COLUMN IF NOT EXISTS contribution_type text DEFAULT 'savings' CHECK (contribution_type IN ('savings', 'land_fund', 'security', 'tea', 'xmas'));

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_contributions_type ON public.contributions(contribution_type);

-- Add status column to messages for draft support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS scheduled_for timestamp with time zone;

-- Add comments for clarity
COMMENT ON COLUMN public.contributions.contribution_type IS 'Type of contribution: savings, land_fund, security, tea, xmas';
COMMENT ON COLUMN public.messages.scheduled_for IS 'Scheduled time for sending queued messages';