import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, CheckCircle2, TrendingUp, Minus, Equal, AlertCircle, Receipt, CreditCard, Scale, Investment, X } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';

interface DividendCalculatorProps {
  onCalculationComplete: () => void;
  onClose: () => void;
}

interface CalculationData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalRegularSavings: number;
  incomeBreakdown: {
    registration_fees: number;
    loan_interest: number;
    fines_penalties: number;
    investment_income: number;
    other_income: number;
  };
  expenseBreakdown: { category: string; amount: number }[];
}

export default function DividendCalculator({ onCalculationComplete, onClose }: DividendCalculatorProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [calculation, setCalculation] = useState<CalculationData>({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalRegularSavings: 0,
    incomeBreakdown: {
      registration_fees: 0,
      loan_interest: 0,
      fines_penalties: 0,
      investment_income: 0,
      other_income: 0
    },
    expenseBreakdown: []
  });

  useEffect(() => {
    fetchCalculationData();
  }, [fiscalYear]);

  const fetchCalculationData = async () => {
    try {
      setLoading(true);

      // Get all dividend-eligible income that's automatically tracked
      const { data: incomeData, error: incomeError } = await supabase
        .from('yearly_income_summary')
        .select('*')
        .eq('fiscal_year', fiscalYear)
        .eq('affects_dividends', true);

      if (incomeError) throw incomeError;

      // Calculate income breakdown by category
      const incomeBreakdown = {
        registration_fees: incomeData?.find(item => item.category_name === 'registration_fees')?.total_amount || 0,
        loan_interest: incomeData?.find(item => item.category_name === 'loan_interest')?.total_amount || 0,
        fines_penalties: incomeData?.find(item => item.category_name === 'fines_penalties')?.total_amount || 0,
        investment_income: incomeData?.find(item => item.category_name === 'investment_income')?.total_amount || 0,
        other_income: incomeData?.find(item => item.category_name === 'other_income')?.total_amount || 0
      };

      const totalIncome = Object.values(incomeBreakdown).reduce((sum, amount) => sum + amount, 0);

      // Get expenses that affect dividends
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('category, amount')
        .eq('fiscal_year', fiscalYear)
        .eq('affects_dividends', true);

      if (expenseError) throw expenseError;

      const expenseBreakdown = expenseData?.map(expense => ({
        category: expense.category,
        amount: Number(expense.amount)
      })) || [];

      const totalExpenses = expenseBreakdown.reduce((sum, item) => sum + item.amount, 0);

      // Get total regular savings (for allocation calculation)
      const { data: savingsData, error: savingsError } = await supabase
        .from('contributions')
        .select('amount')
        .eq('contribution_type', 'regular')
        .eq('fiscal_year', fiscalYear);

      if (savingsError) throw savingsError;

      const totalRegularSavings = savingsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

      const netProfit = Math.max(0, totalIncome - totalExpenses);

      setCalculation({
        totalIncome,
        totalExpenses,
        netProfit,
        totalRegularSavings,
        incomeBreakdown,
        expenseBreakdown
      });
    } catch (error: any) {
      console.error('Error fetching calculation data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch calculation data from automated income tracking',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateDividends = async () => {
    if (calculation.netProfit <= 0) {
      toast({
        title: 'Cannot Calculate Dividends',
        description: 'No profit available for dividends. Income must exceed expenses.',
        variant: 'destructive'
      });
      return;
    }

    if (calculation.totalRegularSavings <= 0) {
      toast({
        title: 'No Savings Found',
        description: 'No regular savings contributions found for allocation calculation',
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
          title: 'Calculation Exists',
          description: `Dividend calculation for ${fiscalYear} already exists`,
          variant: 'destructive'
        });
        return;
      }

      // Create dividend fund calculation with automated income breakdown
      const { data: calcData, error: calcError } = await supabase
        .from('dividends_fund_calculations')
        .insert({
          fiscal_year: fiscalYear,
          registration_fees: calculation.incomeBreakdown.registration_fees,
          fines_collected: calculation.incomeBreakdown.fines_penalties,
          loan_interest: calculation.incomeBreakdown.loan_interest,
          investment_profits: calculation.incomeBreakdown.investment_income,
          relevant_expenses: calculation.totalExpenses,
          total_dividends_fund: calculation.netProfit,
          calculation_formula: 'Automated Income Tracking System: (Total Auto-Tracked Income - Relevant Expenses) × Member Savings Share',
          status: 'draft',
          calculation_date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (calcError) throw calcError;

      // Get all active members with their regular savings
      const { data: members, error: membersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, member_no')
        .eq('status', 'active');

      if (membersError) throw membersError;

      // Get each member's regular savings for the fiscal year
      const { data: memberSavings, error: savingsError } = await supabase
        .from('contributions')
        .select('member_id, amount')
        .eq('contribution_type', 'regular')
        .eq('fiscal_year', fiscalYear);

      if (savingsError) throw savingsError;

      // Calculate each member's allocation
      const allocations = members?.map(member => {
        const memberRegularSavings = memberSavings
          ?.filter(c => c.member_id === member.id)
          .reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        
        const sharePercentage = calculation.totalRegularSavings > 0 
          ? parseFloat((memberRegularSavings / calculation.totalRegularSavings).toFixed(4))
          : 0;
        
        const allocatedAmount = parseFloat((sharePercentage * calculation.netProfit).toFixed(2));

        return {
          calculation_id: calcData.id,
          member_id: member.id,
          member_contribution_for_dividends: memberRegularSavings,
          total_contributions_for_dividends: calculation.totalRegularSavings,
          share_percentage: sharePercentage,
          allocated_amount: allocatedAmount,
          payout_status: 'pending',
          calculation_notes: `Automated calculation based on ${memberRegularSavings.toLocaleString()} KES regular savings`
        };
      }).filter(alloc => alloc.allocated_amount > 0) || [];

      if (allocations.length === 0) {
        throw new Error('No valid allocations calculated. Check member regular savings data.');
      }

      const { error: allocError } = await supabase
        .from('dividend_allocations')
        .insert(allocations);

      if (allocError) throw allocError;

      // Log audit trail
      try {
        await auditLogger.logDataChange('create', 'dividends_fund_calculations', calcData.id, {
          fiscal_year: fiscalYear,
          total_income: calculation.totalIncome,
          total_expenses: calculation.totalExpenses,
          net_profit: calculation.netProfit,
          member_count: allocations.length,
          total_allocated: allocations.reduce((sum, a) => sum + a.allocated_amount, 0),
          automated_income_sources: calculation.incomeBreakdown
        });
      } catch (auditError) {
        console.error('Audit logging failed:', auditError);
      }

      toast({
        title: 'Dividends Calculated Successfully',
        description: `Automatically tracked KES ${calculation.netProfit.toLocaleString()} profit allocated to ${allocations.length} members`,
      });

      onCalculationComplete();
    } catch (error: any) {
      console.error('Error calculating dividends:', error);
      toast({
        title: 'Calculation Failed',
        description: error.message || 'Failed to calculate dividends',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getIncomeCategoryIcon = (category: string) => {
    switch (category) {
      case 'registration_fees': return <Receipt className="h-4 w-4" />;
      case 'loan_interest': return <CreditCard className="h-4 w-4" />;
      case 'fines_penalties': return <Scale className="h-4 w-4" />;
      case 'investment_income': return <Investment className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getIncomeCategoryColor = (category: string) => {
    switch (category) {
      case 'registration_fees': return 'text-blue-600 bg-blue-50';
      case 'loan_interest': return 'text-green-600 bg-green-50';
      case 'fines_penalties': return 'text-orange-600 bg-orange-50';
      case 'investment_income': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Calculator className="h-6 w-6" />
          Calculate Dividends
        </CardTitle>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
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

          {/* Automated Income Breakdown */}
          <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Automatically Tracked Income
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(calculation.incomeBreakdown).map(([category, amount]) => (
                amount > 0 && (
                  <div key={category} className={`flex items-center justify-between p-3 rounded-lg ${getIncomeCategoryColor(category)}`}>
                    <div className="flex items-center gap-2">
                      {getIncomeCategoryIcon(category)}
                      <span className="text-sm font-medium capitalize">
                        {category.replace('_', ' ')}:
                      </span>
                    </div>
                    <span className="font-bold">
                      KES {amount.toLocaleString()}
                    </span>
                  </div>
                )
              ))}
            </div>
            <div className="pt-2 border-t border-green-200 flex justify-between font-semibold">
              <span>Total Automated Income:</span>
              <span className="text-green-800">KES {calculation.totalIncome.toLocaleString()}</span>
            </div>
          </div>

          {/* Expense Breakdown */}
          {calculation.expenseBreakdown.length > 0 && (
            <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 flex items-center gap-2">
                <Minus className="h-4 w-4" />
                Relevant Expenses
              </h4>
              {calculation.expenseBreakdown.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-red-700">{item.category}:</span>
                  <span className="font-medium text-red-800">
                    KES {item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-red-200 flex justify-between font-semibold">
                <span>Total Expenses:</span>
                <span className="text-red-800">KES {calculation.totalExpenses.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Net Profit Calculation */}
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-800">Total Automated Income:</span>
              <span className="font-bold text-green-600">+ KES {calculation.totalIncome.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-semibold text-blue-800">Total Expenses:</span>
              <span className="font-bold text-red-600">- KES {calculation.totalExpenses.toLocaleString()}</span>
            </div>

            <div className="pt-2 border-t border-blue-200 flex justify-between items-center">
              <span className="font-bold text-blue-800">Net Profit Available:</span>
              <span className="font-bold text-blue-600 text-lg">
                = KES {calculation.netProfit.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between pt-2 text-sm">
              <span className="text-blue-700">Total Regular Savings:</span>
              <span className="font-medium text-blue-800">
                KES {calculation.totalRegularSavings.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground p-3 bg-amber-50 rounded-lg border border-amber-200">
            <strong className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              Automated Income Tracking System:
            </strong>
            <div className="mt-1 text-amber-700 space-y-1">
              <div>✅ Registration fees automatically recorded</div>
              <div>✅ Loan interest payments automatically tracked</div>
              <div>✅ Fine payments automatically recorded</div>
              <div>✅ Investment profits automatically tracked</div>
              <div className="text-xs mt-2">
                Formula: (Member Regular Savings ÷ Total Regular Savings) × (Automated Income - Expenses)
              </div>
            </div>
          </div>

          <Button
            onClick={handleCalculateDividends}
            disabled={loading || calculation.netProfit <= 0 || calculation.totalRegularSavings <= 0}
            className="w-full"
            size="lg"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {loading ? 'Calculating...' : `Calculate Dividends for ${fiscalYear}`}
          </Button>

          {calculation.netProfit <= 0 && calculation.totalIncome > 0 && (
            <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              No profit available for dividends. Expenses exceed income by KES {(calculation.totalExpenses - calculation.totalIncome).toLocaleString()}
            </div>
          )}

          {calculation.totalRegularSavings <= 0 && (
            <div className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              No regular savings found for {fiscalYear}. Members need to make regular contributions.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}