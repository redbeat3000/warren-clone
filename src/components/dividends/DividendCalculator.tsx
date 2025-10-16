import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle2, TrendingUp } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';

interface DividendCalculatorProps {
  onCalculationComplete: () => void;
}

export default function DividendCalculator({ onCalculationComplete }: DividendCalculatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [calculation, setCalculation] = useState({
    totalDividendIncome: 0,
    totalRegularSavings: 0,
    totalDividendsFund: 0
  });

  useEffect(() => {
    fetchCalculationData();
  }, [fiscalYear]);

  const fetchCalculationData = async () => {
    try {
      setLoading(true);

      // Get total dividend-eligible income from income_records
      const { data: incomeData } = await supabase
        .from('yearly_income_summary')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('affects_dividends', true);

      const totalDividendIncome = incomeData?.reduce((sum, item) => sum + item.total_amount, 0) || 0;

      // Get total regular savings (NOT dividend-eligible contributions)
      const { data: savingsData } = await supabase
        .from('contributions')
        .select('amount')
        .eq('contribution_type', 'regular')
        .eq('fiscal_year', fiscalYear);

      const totalRegularSavings = savingsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      setCalculation({
        totalDividendIncome,
        totalRegularSavings,
        totalDividendsFund: totalDividendIncome // Total dividend pool is the income
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

      // Create dividend fund calculation using income data
      const { data: calcData, error: calcError } = await supabase
        .from('dividends_fund_calculations')
        .insert({
          fiscal_year: fiscalYear,
          registration_fees: 0, // Now handled by income system
          fines_collected: 0,   // Now handled by income system
          loan_interest: 0,     // Now handled by income system
          investment_profits: 0, // Now handled by income system
          relevant_expenses: 0,  // Now handled by income system
          total_dividends_fund: calculation.totalDividendsFund,
          calculation_formula: `Total Dividend Income from Income Tracking System`,
          status: 'draft'
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // Get all active members with their REGULAR SAVINGS (not dividend-eligible)
      const { data: members } = await supabase
        .from('users')
        .select('id, first_name, last_name, member_no')
        .eq('status', 'active');

      // Get each member's regular savings
      const { data: memberSavings } = await supabase
        .from('contributions')
        .select('member_id, amount')
        .eq('contribution_type', 'regular')
        .eq('fiscal_year', fiscalYear);

      // Calculate each member's allocation using YOUR FORMULA
      const allocations = members?.map(member => {
        const memberRegularSavings = memberSavings
          ?.filter(c => c.member_id === member.id)
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        
        // YOUR FORMULA: (Member Regular Savings ÷ Total Regular Savings) × Total Dividend Income
        const sharePercentage = calculation.totalRegularSavings > 0 
          ? parseFloat((memberRegularSavings / calculation.totalRegularSavings).toFixed(4))
          : 0;
        
        const allocatedAmount = parseFloat((sharePercentage * calculation.totalDividendsFund).toFixed(2));

        return {
          calculation_id: calcData.id,
          member_id: member.id,
          member_contribution_for_dividends: memberRegularSavings,
          total_contributions_for_dividends: calculation.totalRegularSavings,
          share_percentage: sharePercentage,
          allocated_amount: allocatedAmount,
          calculation_notes: `(${memberRegularSavings.toLocaleString()} / ${calculation.totalRegularSavings.toLocaleString()}) × ${calculation.totalDividendsFund.toLocaleString()} = ${allocatedAmount.toLocaleString()}`
        };
      }) || [];

      const { error: allocError } = await supabase
        .from('dividend_allocations')
        .insert(allocations);

      if (allocError) throw allocError;

      await auditLogger.logDataChange('create', 'dividends_fund_calculations', calcData.id, {
        fiscal_year: fiscalYear,
        total_fund: calculation.totalDividendsFund,
        member_count: members?.length || 0,
        formula_used: '(Member Regular Savings ÷ Total Regular Savings) × Total Dividend Income'
      });

      toast({
        title: 'Success',
        description: `Dividends calculated successfully for ${fiscalYear} using income tracking system`,
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

          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Dividend Income:</span>
              <span className="font-medium">KES {calculation.totalDividendIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Regular Savings:</span>
              <span className="font-medium">KES {calculation.totalRegularSavings.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t flex justify-between">
              <span className="font-semibold">Total Dividends Fund:</span>
              <span className="font-bold text-primary">KES {calculation.totalDividendsFund.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground p-3 bg-blue-50 rounded-lg">
            <strong>Formula Used:</strong> (Member Regular Savings ÷ Total Regular Savings) × Total Dividend Income
          </div>

          <Button
            onClick={handleCalculateDividends}
            disabled={loading || calculation.totalDividendsFund <= 0 || calculation.totalRegularSavings <= 0}
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