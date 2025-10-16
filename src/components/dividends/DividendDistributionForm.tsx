import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Calculator, Users, DollarSign, AlertCircle, X } from 'lucide-react';

interface DividendDistributionProps {
  calculationId: string;
  fiscalYear: number;
  totalDividendFund: number;
  onDistributionComplete: () => void;
  onClose: () => void;
}

interface MemberAllocation {
  member_id: string;
  member_name: string;
  member_no: string;
  savings_balance: number;
  share_percentage: number;
  allocated_amount: number;
  payout_status: string;
}

export default function DividendDistributionForm({
  calculationId,
  fiscalYear,
  totalDividendFund,
  onDistributionComplete,
  onClose
}: DividendDistributionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [allocations, setAllocations] = useState<MemberAllocation[]>([]);
  const [distributionDate, setDistributionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchAllocations();
  }, [calculationId]);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('dividend_allocations')
        .select(`
          member_id,
          allocated_amount,
          share_percentage,
          payout_status,
          users!inner (
            first_name,
            last_name,
            member_no
          )
        `)
        .eq('calculation_id', calculationId)
        .order('allocated_amount', { ascending: false });

      if (error) throw error;

      // Get current savings balances for each member
      const allocationsWithSavings = await Promise.all(
        (data || []).map(async (allocation: any) => {
          const { data: savingsData } = await supabase
            .from('contributions')
            .select('amount')
            .eq('member_id', allocation.member_id)
            .eq('contribution_type', 'regular')
            .eq('fiscal_year', fiscalYear);

          const savings_balance = savingsData?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;

          return {
            member_id: allocation.member_id,
            member_name: `${allocation.users.first_name} ${allocation.users.last_name}`,
            member_no: allocation.users.member_no,
            savings_balance,
            share_percentage: allocation.share_percentage,
            allocated_amount: allocation.allocated_amount,
            payout_status: allocation.payout_status
          };
        })
      );

      setAllocations(allocationsWithSavings);
    } catch (error: any) {
      console.error('Error fetching allocations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dividend allocations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDistributeDividends = async () => {
    if (!distributionDate) {
      toast({
        title: 'Error',
        description: 'Please select a distribution date',
        variant: 'destructive'
      });
      return;
    }

    try {
      setDistributing(true);

      // Update dividend calculation status to distributed
      const { error: calcError } = await supabase
        .from('dividends_fund_calculations')
        .update({ 
          status: 'distributed',
          updated_at: new Date().toISOString()
        })
        .eq('id', calculationId);

      if (calcError) throw calcError;

      // Update all allocations to paid status
      const { error: allocError } = await supabase
        .from('dividend_allocations')
        .update({ 
          payout_status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('calculation_id', calculationId);

      if (allocError) throw allocError;

      // Record dividend payments as expenses (since money is going out to members)
      const user = await supabase.auth.getUser();
      const paymentRecords = allocations.map(allocation => ({
        category: 'dividend_payout',
        description: `Dividend payment to ${allocation.member_name} (${allocation.member_no})`,
        amount: allocation.allocated_amount,
        expense_date: distributionDate,
        fiscal_year: fiscalYear,
        affects_dividends: false, // This doesn't affect future dividends
        created_by: user.data.user?.id
      }));

      const { error: expenseError } = await supabase
        .from('expenses')
        .insert(paymentRecords);

      if (expenseError) throw expenseError;

      toast({
        title: 'Success',
        description: `Dividends distributed successfully to ${allocations.length} members`,
      });

      onDistributionComplete();
    } catch (error: any) {
      console.error('Error distributing dividends:', error);
      toast({
        title: 'Distribution Failed',
        description: error.message || 'Failed to distribute dividends',
        variant: 'destructive'
      });
    } finally {
      setDistributing(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0);
  const remainingAmount = totalDividendFund - totalAllocated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-2xl">
          <DollarSign className="h-6 w-6" />
          Distribute Dividends - FY {fiscalYear}
        </CardTitle>
        <Button variant="ghost" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* Distribution Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                KES {totalDividendFund.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Total Dividend Fund</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                KES {totalAllocated.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">Total Allocated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                KES {remainingAmount.toLocaleString()}
              </div>
              <div className="text-sm text-orange-700">Remaining</div>
            </div>
          </div>

          {/* Distribution Date */}
          <div className="space-y-2">
            <Label htmlFor="distributionDate">Distribution Date</Label>
            <Input
              id="distributionDate"
              type="date"
              value={distributionDate}
              onChange={(e) => setDistributionDate(e.target.value)}
            />
          </div>

          {/* Allocation Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Allocations
              </h3>
              <Badge variant="outline">
                {allocations.length} Members
              </Badge>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <Calculator className="w-8 h-8 animate-spin mx-auto mb-2" />
                <div>Loading allocations...</div>
              </div>
            ) : (
              <div className="border rounded-lg max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Savings Balance</TableHead>
                      <TableHead>Share %</TableHead>
                      <TableHead>Allocated Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allocations.map((allocation, index) => (
                      <TableRow key={allocation.member_id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{allocation.member_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {allocation.member_no}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          KES {allocation.savings_balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(allocation.share_percentage * 100).toFixed(2)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-green-600">
                          KES {allocation.allocated_amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              allocation.payout_status === 'paid' ? 'default' : 
                              allocation.payout_status === 'pending' ? 'secondary' : 'destructive'
                            }
                          >
                            {allocation.payout_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Distribution Formula Explanation */}
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4" />
              Distribution Formula
            </h4>
            <div className="text-sm text-amber-700 space-y-1">
              <div><strong>Member's Share %</strong> = (Member's Regular Savings ÷ Total Regular Savings)</div>
              <div><strong>Member's Dividend</strong> = Member's Share % × Total Dividend Fund</div>
              <div className="text-xs mt-2">
                Only regular savings contributions are considered for dividend calculations.
              </div>
            </div>
          </div>

          {/* Distribution Action */}
          <Button
            onClick={handleDistributeDividends}
            disabled={distributing || allocations.length === 0 || allocations.every(a => a.payout_status === 'paid')}
            className="w-full"
            size="lg"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {distributing ? 'Distributing...' : 'Distribute Dividends to All Members'}
          </Button>

          {allocations.every(a => a.payout_status === 'paid') && (
            <div className="text-center text-green-600 p-4 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 mx-auto mb-2" />
              Dividends have already been distributed for FY {fiscalYear}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}