import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';

interface DividendCalculatorProps {
  onCalculationComplete: () => void;
}

export default function DividendCalculator({ onCalculationComplete }: DividendCalculatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [calculation, setCalculation] = useState({
    registrationFees: 0,
    finesCollected: 0,
    loanInterest: 0,
    investmentProfits: 0,
    relevantExpenses: 0,
    totalDividendsFund: 0
  });

  useEffect(() => {
    fetchCalculationData();
  }, [fiscalYear]);

  const fetchCalculationData = async () => {
    try {
      setLoading(true);
      const startDate = `${fiscalYear}-01-01`;
      const endDate = `${fiscalYear}-12-31`;

      const [
        { data: contributions },
        { data: fines },
        { data: repayments },
        { data: investmentProfits },
        { data: expenses }
      ] = await Promise.all([
        supabase.from('contributions')
          .select('amount')
          .eq('is_dividend_eligible', true)
          .gte('contribution_date', startDate)
          .lte('contribution_date', endDate),
        supabase.from('fines')
          .select('paid_amount')
          .gte('fine_date', startDate)
          .lte('fine_date', endDate),
        supabase.from('loan_repayments')
          .select('interest_portion')
          .gte('payment_date', startDate)
          .lte('payment_date', endDate),
        supabase.from('investment_profits')
          .select('amount')
          .gte('profit_date', startDate)
          .lte('profit_date', endDate),
        supabase.from('expenses')
          .select('amount')
          .eq('affects_dividends', true)
          .gte('expense_date', startDate)
          .lte('expense_date', endDate)
      ]);

      const registrationFees = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
      const finesCollected = fines?.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0) || 0;
      const loanInterest = repayments?.reduce((sum, r) => sum + Number(r.interest_portion || 0), 0) || 0;
      const investmentProfitsTotal = investmentProfits?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const relevantExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      const totalDividendsFund = registrationFees + finesCollected + loanInterest + investmentProfitsTotal - relevantExpenses;

      setCalculation({
        registrationFees,
        finesCollected,
        loanInterest,
        investmentProfits: investmentProfitsTotal,
        relevantExpenses,
        totalDividendsFund
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch calculation data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDividends = async () => {
    if (calculation.totalDividendsFund <= 0) {
      toast({
        title: 'Error',
        description: 'Dividends fund must be positive to calculate allocations',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      // Check if calculation already exists
      const { data: existing } = await supabase
        .from('dividends_fund_calculations')
        .select('id')
        .eq('fiscal_year', fiscalYear)
        .single();

      if (existing) {
        toast({
          title: 'Error',
          description: `Dividend calculation for ${fiscalYear} already exists`,
          variant: 'destructive'
        });
        return;
      }

      // Create dividend fund calculation
      const { data: calcData, error: calcError } = await supabase
        .from('dividends_fund_calculations')
        .insert({
          fiscal_year: fiscalYear,
          registration_fees: calculation.registrationFees,
          fines_collected: calculation.finesCollected,
          loan_interest: calculation.loanInterest,
          investment_profits: calculation.investmentProfits,
          relevant_expenses: calculation.relevantExpenses,
          calculation_formula: `Registration Fees (${calculation.registrationFees}) + Fines Collected (${calculation.finesCollected}) + Loan Interest (${calculation.loanInterest}) + Investment Profits (${calculation.investmentProfits}) - Relevant Expenses (${calculation.relevantExpenses})`,
          status: 'draft'
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // Get all active members with their dividend-eligible contributions
      const { data: members } = await supabase
        .from('users')
        .select('id')
        .eq('status', 'active');

      const { data: contributions } = await supabase
        .from('contributions')
        .select('member_id, amount')
        .eq('is_dividend_eligible', true)
        .gte('contribution_date', `${fiscalYear}-01-01`)
        .lte('contribution_date', `${fiscalYear}-12-31`);

      const totalContributionsForDividends = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      // Calculate each member's allocation
      const allocations = members?.map(member => {
        const memberContribution = contributions?.filter(c => c.member_id === member.id)
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        
        const sharePercentage = totalContributionsForDividends > 0 
          ? parseFloat((memberContribution / totalContributionsForDividends).toFixed(4))
          : 0;
        
        const allocatedAmount = parseFloat((sharePercentage * calculation.totalDividendsFund).toFixed(2));

        return {
          calculation_id: calcData.id,
          member_id: member.id,
          member_contribution_for_dividends: memberContribution,
          total_contributions_for_dividends: totalContributionsForDividends,
          share_percentage: sharePercentage,
          allocated_amount: allocatedAmount,
          calculation_notes: `${(sharePercentage * 100).toFixed(2)}% share of total dividends fund`
        };
      }) || [];

      const { error: allocError } = await supabase
        .from('dividend_allocations')
        .insert(allocations);

      if (allocError) throw allocError;

      await auditLogger.logDataChange('create', 'dividends_fund_calculations', calcData.id, {
        fiscal_year: fiscalYear,
        total_fund: calculation.totalDividendsFund,
        member_count: members?.length || 0
      });

      toast({
        title: 'Success',
        description: `Dividends calculated successfully for ${fiscalYear}`,
      });

      onCalculationComplete();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to calculate dividends',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calculate Dividends
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Fiscal Year</Label>
            <Input
              type="number"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(Number(e.target.value))}
              min={2020}
              max={new Date().getFullYear()}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Registration Fees:</span>
              <span className="font-medium">KES {calculation.registrationFees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fines Collected:</span>
              <span className="font-medium">KES {calculation.finesCollected.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Loan Interest:</span>
              <span className="font-medium">KES {calculation.loanInterest.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Investment Profits:</span>
              <span className="font-medium">KES {calculation.investmentProfits.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Relevant Expenses:</span>
              <span className="font-medium text-red-600">- KES {calculation.relevantExpenses.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t flex justify-between">
              <span className="font-semibold">Total Dividends Fund:</span>
              <span className="font-bold text-primary">KES {calculation.totalDividendsFund.toLocaleString()}</span>
            </div>
          </div>

          <Button
            onClick={handleCalculateDividends}
            disabled={loading || calculation.totalDividendsFund <= 0}
            className="w-full"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Calculate & Allocate Dividends
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}