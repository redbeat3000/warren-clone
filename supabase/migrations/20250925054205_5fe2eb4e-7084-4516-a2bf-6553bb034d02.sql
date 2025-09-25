-- Add 'pending' status to the record_status enum
ALTER TYPE record_status ADD VALUE IF NOT EXISTS 'pending';