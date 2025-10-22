-- Verify and recreate income tracking triggers
-- This ensures that paid fines and loan interest automatically create income_records

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_loan_interest_income ON public.loan_repayments;
DROP TRIGGER IF EXISTS trigger_fine_payment_income ON public.fines;
DROP TRIGGER IF EXISTS trigger_registration_fee_income ON public.contributions;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.record_loan_interest_income();
DROP FUNCTION IF EXISTS public.record_fine_payment_income();
DROP FUNCTION IF EXISTS public.record_registration_fee_income();

-- Function to automatically record loan interest as income
CREATE OR REPLACE FUNCTION public.record_loan_interest_income()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record if there's an interest portion
  IF NEW.interest_portion > 0 THEN
    -- Check if income record already exists for this repayment
    IF NOT EXISTS (
      SELECT 1 FROM public.income_records 
      WHERE source_reference = 'loan_repayment:' || NEW.id
    ) THEN
      INSERT INTO public.income_records (
        category_id,
        amount,
        income_date,
        description,
        source_reference,
        fiscal_year,
        status,
        payment_method
      )
      SELECT 
        (SELECT id FROM public.income_categories WHERE name = 'loan_interest'),
        NEW.interest_portion,
        NEW.payment_date,
        'Loan interest payment - Member: ' || COALESCE(
          (SELECT full_name FROM public.users WHERE id = NEW.member_id),
          'Unknown'
        ),
        'loan_repayment:' || NEW.id,
        EXTRACT(YEAR FROM NEW.payment_date)::INTEGER,
        'verified',
        NEW.payment_method;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically record fine payments as income
CREATE OR REPLACE FUNCTION public.record_fine_payment_income()
RETURNS TRIGGER AS $$
DECLARE
  payment_amount NUMERIC;
BEGIN
  -- Calculate the payment amount (difference between old and new paid_amount)
  payment_amount := NEW.paid_amount - COALESCE(OLD.paid_amount, 0);
  
  -- Only record if there's an actual payment
  IF payment_amount > 0 THEN
    INSERT INTO public.income_records (
      category_id,
      amount,
      income_date,
      description,
      source_reference,
      fiscal_year,
      status
    )
    SELECT 
      (SELECT id FROM public.income_categories WHERE name = 'fines_penalties'),
      payment_amount,
      CURRENT_DATE,
      'Fine payment - ' || NEW.reason || ' - Member: ' || COALESCE(
        (SELECT full_name FROM public.users WHERE id = NEW.member_id),
        'Unknown'
      ),
      'fine:' || NEW.id || ':' || NEW.paid_amount::TEXT,
      EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
      'verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically record registration fees as income
CREATE OR REPLACE FUNCTION public.record_registration_fee_income()
RETURNS TRIGGER AS $$
BEGIN
  -- Only record registration fees that are dividend eligible
  IF NEW.contribution_type = 'registration_fee' AND NEW.is_dividend_eligible = true THEN
    -- Check if income record already exists for this contribution
    IF NOT EXISTS (
      SELECT 1 FROM public.income_records 
      WHERE source_reference = 'contribution:' || NEW.id
    ) THEN
      INSERT INTO public.income_records (
        category_id,
        amount,
        income_date,
        description,
        source_reference,
        fiscal_year,
        status,
        payment_method,
        receipt_no
      )
      SELECT 
        (SELECT id FROM public.income_categories WHERE name = 'registration_fees'),
        NEW.amount,
        NEW.contribution_date,
        'Registration fee - Member: ' || COALESCE(
          (SELECT full_name FROM public.users WHERE id = NEW.member_id),
          'Unknown'
        ),
        'contribution:' || NEW.id,
        EXTRACT(YEAR FROM NEW.contribution_date)::INTEGER,
        'verified',
        NEW.payment_method,
        NEW.receipt_no;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
CREATE TRIGGER trigger_loan_interest_income
  AFTER INSERT OR UPDATE ON public.loan_repayments
  FOR EACH ROW
  EXECUTE FUNCTION public.record_loan_interest_income();

CREATE TRIGGER trigger_fine_payment_income
  AFTER INSERT OR UPDATE ON public.fines
  FOR EACH ROW
  EXECUTE FUNCTION public.record_fine_payment_income();

CREATE TRIGGER trigger_registration_fee_income
  AFTER INSERT ON public.contributions
  FOR EACH ROW
  EXECUTE FUNCTION public.record_registration_fee_income();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.record_loan_interest_income() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_fine_payment_income() TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_registration_fee_income() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.record_loan_interest_income() IS 'Automatically creates income_records entries when loan interest is paid';
COMMENT ON FUNCTION public.record_fine_payment_income() IS 'Automatically creates income_records entries when fines are paid';
COMMENT ON FUNCTION public.record_registration_fee_income() IS 'Automatically creates income_records entries for registration fees';
