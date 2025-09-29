-- Add more testing data for existing users only

-- Add more contributions with unique receipt numbers
DO $$
DECLARE
    user_rec RECORD;
    contribution_date DATE;
    receipt_counter INTEGER := 2000; -- Start from 2000 to avoid conflicts
BEGIN
    FOR user_rec IN SELECT id FROM public.users WHERE status = 'active' LOOP
        -- Generate 8-12 contributions per member across different months
        FOR i IN 1..10 LOOP
            contribution_date := '2024-01-01'::date + (i * 30 + (random() * 25)::int);
            IF random() < 0.7 THEN -- 70% chance of contribution each period
                INSERT INTO public.contributions (member_id, amount, contribution_date, payment_method, receipt_no, notes)
                VALUES (
                    user_rec.id,
                    CASE 
                        WHEN random() < 0.3 THEN 5000
                        WHEN random() < 0.7 THEN 10000
                        ELSE 15000
                    END,
                    contribution_date,
                    CASE 
                        WHEN random() < 0.4 THEN 'Cash'
                        WHEN random() < 0.8 THEN 'M-Pesa'
                        ELSE 'Bank Transfer'
                    END,
                    'REC' || receipt_counter,
                    CASE 
                        WHEN random() < 0.2 THEN 'Monthly contribution'
                        ELSE NULL
                    END
                );
                receipt_counter := receipt_counter + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;

-- Add more loans for existing users
INSERT INTO public.loans (member_id, principal, interest_rate, term_months, issue_date, due_date, status, interest_type, notes)
SELECT 
    u.id,
    CASE 
        WHEN random() < 0.3 THEN 50000
        WHEN random() < 0.6 THEN 100000
        WHEN random() < 0.8 THEN 200000
        ELSE 500000
    END,
    CASE 
        WHEN random() < 0.5 THEN 12.0
        WHEN random() < 0.8 THEN 15.0
        ELSE 18.0
    END,
    CASE 
        WHEN random() < 0.4 THEN 6
        WHEN random() < 0.7 THEN 12
        ELSE 24
    END,
    ('2024-01-01'::date + (random() * 250)::int),
    ('2024-06-01'::date + (random() * 365)::int),
    CASE 
        WHEN random() < 0.4 THEN 'active'::loan_status
        WHEN random() < 0.6 THEN 'repaid'::loan_status
        WHEN random() < 0.8 THEN 'overdue'::loan_status
        ELSE 'defaulted'::loan_status
    END,
    'declining',
    CASE 
        WHEN random() < 0.3 THEN 'Emergency loan'
        WHEN random() < 0.6 THEN 'Business expansion'
        ELSE 'Personal development'
    END
FROM public.users u
WHERE u.status = 'active'
AND random() < 0.5; -- 50% of members have additional loans

-- Add loan repayments
INSERT INTO public.loan_repayments (loan_id, member_id, amount, payment_date, payment_method)
SELECT 
    l.id,
    l.member_id,
    (l.principal * 0.08), -- 8% of principal as monthly payment
    l.issue_date + (generate_series(1, 4) || ' month')::interval,
    CASE 
        WHEN random() < 0.6 THEN 'M-Pesa'
        WHEN random() < 0.8 THEN 'Cash'
        ELSE 'Bank Transfer'
    END
FROM public.loans l
WHERE l.status = 'active'
AND random() < 0.6; -- 60% chance of repayment records

-- Add more expenses
INSERT INTO public.expenses (category, description, amount, expense_date) VALUES
('Office Supplies', 'Stationery and printing materials', 8500, '2024-01-15'),
('Meeting Costs', 'Venue and refreshments for monthly meeting', 12000, '2024-01-20'),
('Transport', 'Field visit to investment site', 15000, '2024-02-05'),
('Communication', 'SMS and call charges for member notifications', 3500, '2024-02-10'),
('Banking', 'Account maintenance and transaction fees', 2800, '2024-02-28'),
('Training', 'Financial literacy workshop for members', 25000, '2024-03-10'),
('Insurance', 'Group insurance premium payment', 45000, '2024-03-15'),
('Legal Fees', 'Constitution review and registration', 18000, '2024-04-02'),
('Marketing', 'Promotional materials and website', 22000, '2024-04-20'),
('Audit', 'Annual financial audit services', 35000, '2024-05-15'),
('Equipment', 'Laptop and printer for office', 65000, '2024-06-01'),
('Utilities', 'Internet and electricity bills', 8000, '2024-06-15'),
('Refreshments', 'Meeting snacks and drinks', 5500, '2024-07-10'),
('Fuel', 'Transport for field visits', 12000, '2024-07-25'),
('Registration', 'Business permits and licenses', 28000, '2024-08-05');

-- Add fines for existing members
INSERT INTO public.fines (member_id, amount, reason, fine_date, status)
SELECT 
    u.id,
    CASE 
        WHEN random() < 0.5 THEN 1000
        WHEN random() < 0.8 THEN 2000
        ELSE 5000
    END,
    CASE 
        WHEN random() < 0.4 THEN 'Late payment of contribution'
        WHEN random() < 0.7 THEN 'Missing scheduled meeting'
        ELSE 'Violation of group rules'
    END,
    ('2024-01-01'::date + (random() * 250)::int),
    CASE 
        WHEN random() < 0.6 THEN 'paid'
        ELSE 'unpaid'
    END
FROM public.users u
WHERE u.status = 'active'
AND random() < 0.4; -- 40% of members have fines

-- Add more meetings
INSERT INTO public.meetings (title, description, meeting_date, meeting_time, venue, status, agenda, expected_attendees, actual_attendees) VALUES
('Monthly General Meeting - January', 'Regular monthly meeting to discuss financial progress', '2024-01-20', '14:00:00', 'Community Hall', 'completed', 'Financial report, loan applications, new member registrations', 12, 10),
('Monthly General Meeting - February', 'February monthly meeting with guest speaker', '2024-02-17', '14:00:00', 'Community Hall', 'completed', 'Investment opportunities, member welfare, upcoming projects', 12, 11),
('Monthly General Meeting - March', 'March meeting with annual planning', '2024-03-16', '14:00:00', 'Community Hall', 'completed', 'Annual budget review, loan policy updates, member contributions', 12, 9),
('Emergency Meeting - Investment Decision', 'Special meeting to discuss major investment opportunity', '2024-03-30', '10:00:00', 'Chairperson Office', 'completed', 'Real estate investment proposal, funding requirements', 8, 7),
('Monthly General Meeting - April', 'April monthly meeting with audit presentation', '2024-04-20', '14:00:00', 'Community Hall', 'completed', 'Audit results, loan disbursements, member updates', 12, 12),
('Monthly General Meeting - May', 'May meeting with mid-year review', '2024-05-18', '14:00:00', 'Community Hall', 'completed', 'Mid-year financial review, dividend calculations, future planning', 12, 8),
('Monthly General Meeting - June', 'June meeting with training session', '2024-06-15', '14:00:00', 'Community Hall', 'scheduled', 'Financial literacy training, loan recovery strategies', 12, 0),
('Annual General Meeting 2024', 'Annual review and planning meeting', '2024-12-15', '09:00:00', 'Main Hall', 'scheduled', 'Annual reports, elections, strategic planning for 2025', 14, 0);

-- Add dividends for eligible members
INSERT INTO public.dividends (member_id, allocation_amount, period, payout_date)
SELECT 
    u.id,
    CASE 
        WHEN random() < 0.3 THEN 25000
        WHEN random() < 0.6 THEN 35000
        ELSE 50000
    END,
    '2024-Q1',
    '2024-04-01'
FROM public.users u
WHERE u.status = 'active'
AND u.join_date <= '2024-03-31'
AND random() < 0.8; -- 80% of eligible members get dividends

-- Add some withdrawal requests
INSERT INTO public.withdrawals (member_id, amount, status, notes, requested_at, approved_at, approved_by)
SELECT 
    u.id,
    CASE 
        WHEN random() < 0.5 THEN 20000
        WHEN random() < 0.8 THEN 50000
        ELSE 100000
    END,
    CASE 
        WHEN random() < 0.6 THEN 'approved'
        WHEN random() < 0.8 THEN 'pending'
        ELSE 'rejected'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'Emergency withdrawal'
        WHEN random() < 0.6 THEN 'Personal investment'
        ELSE 'Medical expenses'
    END,
    ('2024-01-01'::date + (random() * 150)::int),
    CASE 
        WHEN random() < 0.6 THEN ('2024-01-01'::date + (random() * 150)::int + '3 days'::interval)
        ELSE NULL
    END,
    (SELECT id FROM public.users WHERE role IN ('chairperson', 'treasurer') LIMIT 1)
FROM public.users u
WHERE u.status = 'active'
AND random() < 0.25; -- 25% of members have withdrawal requests