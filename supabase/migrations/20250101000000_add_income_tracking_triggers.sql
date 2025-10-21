-- Add Income Tracking Triggers for Kamandoto SHG Management System
-- These triggers automatically record income when loan repayments, fine payments, and registration fees are made

-- Create income categories if they don't exist
INSERT INTO income_categories (name, description, is_active) VALUES
('loan_interest', 'Interest income from loan repayments', true),
('fine_payments', 'Income from fine payments', true),
('registration_fees', 'Income from member registration fees', true)
ON CONFLICT (name) DO NOTHING;

-- Function to record loan interest income
CREATE OR REPLACE FUNCTION record_loan_interest_income()
RETURNS TRIGGER AS $$
DECLARE
    category_id UUID;
BEGIN
    -- Get the loan interest category ID
    SELECT id INTO category_id FROM income_categories WHERE name = 'loan_interest';
    
    -- If category doesn't exist, create it
    IF category_id IS NULL THEN
        INSERT INTO income_categories (name, description, is_active)
        VALUES ('loan_interest', 'Interest income from loan repayments', true)
        RETURNING id INTO category_id;
    END IF;
    
    -- Record the interest portion as income
    IF NEW.interest_portion > 0 THEN
        INSERT INTO income_records (
            category_id,
            amount,
            income_date,
            description,
            source_reference,
            recorded_by
        ) VALUES (
            category_id,
            NEW.interest_portion,
            NEW.payment_date,
            'Loan interest payment from member',
            'loan_repayment_' || NEW.id,
            current_user_id()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to record fine payment income
CREATE OR REPLACE FUNCTION record_fine_payment_income()
RETURNS TRIGGER AS $$
DECLARE
    category_id UUID;
    payment_amount NUMERIC(15,2);
BEGIN
    -- Get the fine payments category ID
    SELECT id INTO category_id FROM income_categories WHERE name = 'fine_payments';
    
    -- If category doesn't exist, create it
    IF category_id IS NULL THEN
        INSERT INTO income_categories (name, description, is_active)
        VALUES ('fine_payments', 'Income from fine payments', true)
        RETURNING id INTO category_id;
    END IF;
    
    -- Calculate the payment amount (difference between old and new paid_amount)
    payment_amount := NEW.paid_amount - COALESCE(OLD.paid_amount, 0);
    
    -- Record the payment as income
    IF payment_amount > 0 THEN
        INSERT INTO income_records (
            category_id,
            amount,
            income_date,
            description,
            source_reference,
            recorded_by
        ) VALUES (
            category_id,
            payment_amount,
            CURRENT_DATE,
            'Fine payment from member: ' || NEW.reason,
            'fine_' || NEW.id,
            current_user_id()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to record registration fee income
CREATE OR REPLACE FUNCTION record_registration_fee_income()
RETURNS TRIGGER AS $$
DECLARE
    category_id UUID;
BEGIN
    -- Get the registration fees category ID
    SELECT id INTO category_id FROM income_categories WHERE name = 'registration_fees';
    
    -- If category doesn't exist, create it
    IF category_id IS NULL THEN
        INSERT INTO income_categories (name, description, is_active)
        VALUES ('registration_fees', 'Income from member registration fees', true)
        RETURNING id INTO category_id;
    END IF;
    
    -- Record registration fee as income
    IF NEW.contribution_type = 'registration_fee' THEN
        INSERT INTO income_records (
            category_id,
            amount,
            income_date,
            description,
            source_reference,
            recorded_by
        ) VALUES (
            category_id,
            NEW.amount,
            NEW.contribution_date,
            'Registration fee from new member',
            'contribution_' || NEW.id,
            current_user_id()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_loan_interest_income ON loan_repayments;
CREATE TRIGGER trigger_loan_interest_income
    AFTER INSERT OR UPDATE ON loan_repayments
    FOR EACH ROW
    EXECUTE FUNCTION record_loan_interest_income();

DROP TRIGGER IF EXISTS trigger_fine_payment_income ON fines;
CREATE TRIGGER trigger_fine_payment_income
    AFTER UPDATE ON fines
    FOR EACH ROW
    WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount)
    EXECUTE FUNCTION record_fine_payment_income();

DROP TRIGGER IF EXISTS trigger_registration_fee_income ON contributions;
CREATE TRIGGER trigger_registration_fee_income
    AFTER INSERT ON contributions
    FOR EACH ROW
    EXECUTE FUNCTION record_registration_fee_income();

-- Create function to update loan balance when repayments are made
CREATE OR REPLACE FUNCTION update_loan_balance()
RETURNS TRIGGER AS $$
DECLARE
    current_balance NUMERIC(15,2);
    total_interest_paid NUMERIC(15,2);
BEGIN
    -- Calculate current outstanding balance
    SELECT 
        COALESCE(SUM(principal_portion), 0),
        COALESCE(SUM(interest_portion), 0)
    INTO current_balance, total_interest_paid
    FROM loan_repayments 
    WHERE loan_id = NEW.loan_id;
    
    -- Update the loan record
    UPDATE loans 
    SET 
        outstanding_balance = principal - current_balance,
        interest_paid = total_interest_paid,
        status = CASE 
            WHEN (principal - current_balance) <= 0 THEN 'repaid'::loan_status
            WHEN (principal - current_balance) > 0 AND due_date < CURRENT_DATE THEN 'overdue'::loan_status
            ELSE status
        END
    WHERE id = NEW.loan_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update loan balance
DROP TRIGGER IF EXISTS trigger_update_loan_balance ON loan_repayments;
CREATE TRIGGER trigger_update_loan_balance
    AFTER INSERT OR UPDATE ON loan_repayments
    FOR EACH ROW
    EXECUTE FUNCTION update_loan_balance();

-- Create function to calculate loan interest on reducing balance
CREATE OR REPLACE FUNCTION calculate_loan_interest(
    p_principal NUMERIC(15,2),
    p_interest_rate NUMERIC(5,2),
    p_balance NUMERIC(15,2)
) RETURNS NUMERIC(15,2) AS $$
BEGIN
    -- Interest rate is per month (1.5% = 0.015)
    -- Calculate interest on reducing balance
    RETURN p_balance * (p_interest_rate / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to get member's outstanding loans for contributions form
CREATE OR REPLACE FUNCTION get_member_outstanding_loans(p_member_id UUID)
RETURNS TABLE (
    loan_id UUID,
    principal NUMERIC(15,2),
    outstanding_balance NUMERIC(15,2),
    interest_rate NUMERIC(5,2),
    issue_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.principal,
        l.outstanding_balance,
        l.interest_rate,
        l.issue_date
    FROM loans l
    WHERE l.member_id = p_member_id
    AND l.status IN ('active', 'overdue')
    AND l.outstanding_balance > 0
    ORDER BY l.issue_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to get member's unpaid fines for contributions form
CREATE OR REPLACE FUNCTION get_member_unpaid_fines(p_member_id UUID)
RETURNS TABLE (
    fine_id UUID,
    amount NUMERIC(15,2),
    paid_amount NUMERIC(15,2),
    outstanding_amount NUMERIC(15,2),
    reason TEXT,
    fine_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.amount,
        f.paid_amount,
        (f.amount - f.paid_amount) as outstanding_amount,
        f.reason,
        f.fine_date
    FROM fines f
    WHERE f.member_id = p_member_id
    AND f.status IN ('unpaid', 'partially_paid')
    AND (f.amount - f.paid_amount) > 0
    ORDER BY f.fine_date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions
GRANT EXECUTE ON FUNCTION record_loan_interest_income() TO authenticated;
GRANT EXECUTE ON FUNCTION record_fine_payment_income() TO authenticated;
GRANT EXECUTE ON FUNCTION record_registration_fee_income() TO authenticated;
GRANT EXECUTE ON FUNCTION update_loan_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_loan_interest(NUMERIC, NUMERIC, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_outstanding_loans(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_unpaid_fines(UUID) TO authenticated;
