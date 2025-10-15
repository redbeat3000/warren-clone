-- Phase 1, 2, 3: Fund Management, Dividends, and Financial Precision

-- Create contribution types enum
CREATE TYPE contribution_type AS ENUM (
  'regular',
  'xmas_savings',
  'land_fund',
  'security_fund',
  'registration_fee'
);

-- Create expense category enum for dividend tracking
CREATE TYPE expense_impact AS ENUM (
  'operational',      -- Regular operational expenses (affects dividends)
  'fund_specific',    -- Specific fund expenses (doesn't affect dividends)
  'investment'        -- Investment related
);

-- Update contributions table to use the new type
ALTER TABLE contributions 
  DROP COLUMN IF EXISTS contribution_type,
  ADD COLUMN contribution_type contribution_type NOT NULL DEFAULT 'regular',
  ADD COLUMN is_dividend_eligible BOOLEAN DEFAULT false;

-- Create investment profits table
CREATE TABLE IF NOT EXISTS investment_profits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount NUMERIC(15,2) NOT NULL CHECK (amount >= 0),
  profit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE investment_profits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "investment_profits_admin" ON investment_profits
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Create member fund balances table for tracking opening/closing balances
CREATE TABLE IF NOT EXISTS member_fund_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fund_type contribution_type NOT NULL,
  fiscal_year INTEGER NOT NULL,
  opening_balance NUMERIC(15,2) DEFAULT 0 CHECK (opening_balance >= 0),
  closing_balance NUMERIC(15,2) DEFAULT 0 CHECK (closing_balance >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, fund_type, fiscal_year)
);

ALTER TABLE member_fund_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_fund_balances_admin" ON member_fund_balances
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "member_fund_balances_select_self" ON member_fund_balances
  FOR SELECT USING (
    member_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()) OR is_admin()
  );

-- Update expenses table with dividend impact tracking
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS expense_impact expense_impact DEFAULT 'operational',
  ADD COLUMN IF NOT EXISTS affects_dividends BOOLEAN DEFAULT true;

-- Create dividends fund calculation table
CREATE TABLE IF NOT EXISTS dividends_fund_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fiscal_year INTEGER NOT NULL,
  calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  registration_fees NUMERIC(15,2) DEFAULT 0,
  fines_collected NUMERIC(15,2) DEFAULT 0,
  loan_interest NUMERIC(15,2) DEFAULT 0,
  investment_profits NUMERIC(15,2) DEFAULT 0,
  relevant_expenses NUMERIC(15,2) DEFAULT 0,
  total_dividends_fund NUMERIC(15,2) GENERATED ALWAYS AS (
    registration_fees + fines_collected + loan_interest + investment_profits - relevant_expenses
  ) STORED,
  calculation_formula TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'distributed')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(fiscal_year)
);

ALTER TABLE dividends_fund_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dividends_fund_calculations_admin" ON dividends_fund_calculations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "dividends_fund_calculations_select_all" ON dividends_fund_calculations
  FOR SELECT USING (true);

-- Create dividend allocations table (replacing old dividends table structure)
CREATE TABLE IF NOT EXISTS dividend_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_id UUID NOT NULL REFERENCES dividends_fund_calculations(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_contribution_for_dividends NUMERIC(15,2) DEFAULT 0,
  total_contributions_for_dividends NUMERIC(15,2) DEFAULT 0,
  share_percentage NUMERIC(5,4),
  allocated_amount NUMERIC(15,2),
  payout_date DATE,
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid', 'cancelled')),
  calculation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(calculation_id, member_id)
);

ALTER TABLE dividend_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dividend_allocations_admin" ON dividend_allocations
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "dividend_allocations_select_self" ON dividend_allocations
  FOR SELECT USING (
    member_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()) OR is_admin()
  );

-- Add loan precision constraints and interest tracking
ALTER TABLE loans
  ALTER COLUMN principal TYPE NUMERIC(15,2),
  ALTER COLUMN interest_rate TYPE NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS total_interest_calculated NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interest_paid NUMERIC(15,2) DEFAULT 0;

-- Update loan repayments for precision
ALTER TABLE loan_repayments
  ALTER COLUMN amount TYPE NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS principal_portion NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS interest_portion NUMERIC(15,2);

-- Update fines with better status tracking
ALTER TABLE fines
  ALTER COLUMN amount TYPE NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS paid_amount NUMERIC(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  DROP CONSTRAINT IF EXISTS fines_status_check,
  ADD CONSTRAINT fines_status_check CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'waived'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_investment_profits_updated_at ON investment_profits;
CREATE TRIGGER update_investment_profits_updated_at 
  BEFORE UPDATE ON investment_profits 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_member_fund_balances_updated_at ON member_fund_balances;
CREATE TRIGGER update_member_fund_balances_updated_at 
  BEFORE UPDATE ON member_fund_balances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dividends_fund_calculations_updated_at ON dividends_fund_calculations;
CREATE TRIGGER update_dividends_fund_calculations_updated_at 
  BEFORE UPDATE ON dividends_fund_calculations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dividend_allocations_updated_at ON dividend_allocations;
CREATE TRIGGER update_dividend_allocations_updated_at 
  BEFORE UPDATE ON dividend_allocations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create audit logging function for dividend operations
CREATE OR REPLACE FUNCTION audit_dividend_operations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (actor_id, action, meta)
    VALUES (
      current_user_id(),
      'dividend_calculation_created',
      jsonb_build_object(
        'calculation_id', NEW.id,
        'fiscal_year', NEW.fiscal_year,
        'total_fund', NEW.total_dividends_fund
      )
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO audit_logs (actor_id, action, meta)
    VALUES (
      current_user_id(),
      'dividend_status_changed',
      jsonb_build_object(
        'calculation_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS audit_dividend_calculations ON dividends_fund_calculations;
CREATE TRIGGER audit_dividend_calculations
  AFTER INSERT OR UPDATE ON dividends_fund_calculations
  FOR EACH ROW EXECUTE FUNCTION audit_dividend_operations();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contributions_type ON contributions(contribution_type);
CREATE INDEX IF NOT EXISTS idx_contributions_dividend_eligible ON contributions(is_dividend_eligible);
CREATE INDEX IF NOT EXISTS idx_member_fund_balances_member_year ON member_fund_balances(member_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_dividend_allocations_member ON dividend_allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_dividend_allocations_calculation ON dividend_allocations(calculation_id);
CREATE INDEX IF NOT EXISTS idx_investment_profits_date ON investment_profits(profit_date);
CREATE INDEX IF NOT EXISTS idx_fines_status ON fines(status);