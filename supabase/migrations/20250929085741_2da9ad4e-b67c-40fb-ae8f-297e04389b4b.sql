-- Add more testing data for a realistic dashboard (fixed version)

-- Add more members (users)
INSERT INTO public.users (first_name, last_name, email, phone, national_id, member_no, role, status, join_date) VALUES
('Sarah', 'Mwangi', 'sarah.mwangi@email.com', '254701234567', '32123456', 'CH006', 'member', 'active', '2024-01-15'),
('John', 'Kiprotich', 'john.kiprotich@email.com', '254702345678', '32234567', 'CH007', 'member', 'active', '2024-02-01'),
('Grace', 'Wanjiku', 'grace.wanjiku@email.com', '254703456789', '32345678', 'CH008', 'member', 'active', '2024-02-20'),
('Peter', 'Otieno', 'peter.otieno@email.com', '254704567890', '32456789', 'CH009', 'member', 'active', '2024-03-05'),
('Mary', 'Njeri', 'mary.njeri@email.com', '254705678901', '32567890', 'CH010', 'member', 'active', '2024-03-18'),
('David', 'Kemboi', 'david.kemboi@email.com', '254706789012', '32678901', 'CH011', 'secretary', 'active', '2024-04-02'),
('Alice', 'Achieng', 'alice.achieng@email.com', '254707890123', '32789012', 'CH012', 'member', 'active', '2024-04-15'),
('Samuel', 'Mutua', 'samuel.mutua@email.com', '254708901234', '32890123', 'CH013', 'treasurer', 'active', '2024-05-01');

-- Add more contributions with unique receipt numbers
DO $$
DECLARE
    user_rec RECORD;
    contribution_date DATE;
    receipt_counter INTEGER := 1000;
BEGIN
    FOR user_rec IN SELECT id FROM public.users WHERE status = 'active' LOOP
        -- Generate 8-12 contributions per member
        FOR i IN 1..12 LOOP
            contribution_date := '2024-01-01'::date + (i * 30 + (random() * 25)::int);
            IF random() < 0.8 THEN
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

-- Add some loans
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
    ('2024-01-01'::date + (random() * 300)::int),
    ('2024-06-01'::date + (random() * 365)::int),
    CASE 
        WHEN random() < 0.5 THEN 'active'::loan_status
        WHEN random() < 0.7 THEN 'repaid'::loan_status
        WHEN random() < 0.9 THEN 'overdue'::loan_status
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
AND random() < 0.4; -- 40% of members have loans

-- Add expenses
INSERT INTO public.expenses (category, description, amount, expense_date)
VALUES
('Office Supplies', 'Stationery and printing materials', 8500, '2024-01-15'),
('Meeting Costs', 'Venue and refreshments for monthly meeting', 12000, '2024-01-20'),
('Transport', 'Field visit to investment site', 15000, '2024-02-05'),
('Communication', 'SMS and call charges for member notifications', 3500, '2024-02-10'),
('Banking', 'Account maintenance and transaction fees', 2800, '2024-02-28'),
('Training', 'Financial literacy workshop for members', 25000, '2024-03-10'),
('Insurance', 'Group insurance premium payment', 45000, '2024-03-15'),
('Legal Fees', 'Constitution review and registration', 18000, '2024-04-02'),
('Marketing', 'Promotional materials and website', 22000, '2024-04-20'),
('Audit', 'Annual financial audit services', 35000, '2024-05-15');

-- Add some fines
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
    ('2024-01-01'::date + (random() * 300)::int),
    CASE 
        WHEN random() < 0.6 THEN 'paid'
        ELSE 'unpaid'
    END
FROM public.users u
WHERE u.status = 'active'
AND random() < 0.3; -- 30% of members have fines

-- Add meetings
INSERT INTO public.meetings (title, description, meeting_date, meeting_time, venue, status, agenda, expected_attendees, actual_attendees)
VALUES
('Monthly General Meeting - January', 'Regular monthly meeting to discuss financial progress', '2024-01-20', '14:00:00', 'Community Hall', 'completed', 'Financial report, loan applications, new member registrations', 12, 10),
('Monthly General Meeting - February', 'February monthly meeting with guest speaker', '2024-02-17', '14:00:00', 'Community Hall', 'completed', 'Investment opportunities, member welfare, upcoming projects', 12, 11),
('Monthly General Meeting - March', 'March meeting with annual planning', '2024-03-16', '14:00:00', 'Community Hall', 'completed', 'Annual budget review, loan policy updates, member contributions', 12, 9),
('Emergency Meeting - Investment Decision', 'Special meeting to discuss major investment opportunity', '2024-03-30', '10:00:00', 'Chairperson Office', 'completed', 'Real estate investment proposal, funding requirements', 8, 7),
('Monthly General Meeting - April', 'April monthly meeting with audit presentation', '2024-04-20', '14:00:00', 'Community Hall', 'completed', 'Audit results, loan disbursements, member updates', 12, 12),
('Monthly General Meeting - May', 'May meeting with mid-year review', '2024-05-18', '14:00:00', 'Community Hall', 'completed', 'Mid-year financial review, dividend calculations, future planning', 12, 8),
('Monthly General Meeting - June', 'June meeting with training session', '2024-06-15', '14:00:00', 'Community Hall', 'scheduled', 'Financial literacy training, loan recovery strategies', 12, 0);

-- Add dividends for some members
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