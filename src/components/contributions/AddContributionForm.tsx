import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { auditLogger } from '@/utils/auditLogger';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const contributionSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  regularAmount: z.string().optional(),
  fineAmount: z.string().optional(),
  loanRepaymentAmount: z.string().optional(),
  loanId: z.string().optional(),
  fineId: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
  contributionDate: z.string().min(1, 'Date is required'),
}).refine((data) => {
  const totalAmount = (Number(data.regularAmount) || 0) + (Number(data.fineAmount) || 0) + (Number(data.loanRepaymentAmount) || 0);
  return totalAmount > 0;
}, {
  message: 'At least one contribution type must have an amount',
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface Loan {
  id: string;
  principal: number;
  balance?: number;
  member_id: string;
}

interface Fine {
  id: string;
  amount: number;
  paid_amount: number;
  member_id: string;
  reason: string;
}

interface AddContributionFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddContributionForm({ onSuccess, onClose }: AddContributionFormProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      regularAmount: '',
      fineAmount: '',
      loanRepaymentAmount: '',
      loanId: '',
      fineId: '',
      paymentMethod: 'M-Pesa',
      receiptNo: '',
      notes: '',
      contributionDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchMembers();
      await fetchLoans();
      await fetchFines();
    };
    loadData();
  }, [fetchMembers]);

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, full_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch members';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, principal, member_id')
        .eq('status', 'active')
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setLoans((data || []).map(loan => ({
        id: loan.id,
        principal: loan.principal,
        member_id: loan.member_id,
        balance: loan.principal // Use principal as balance for now
      })));
    } catch (error: unknown) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchFines = async () => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select('id, amount, paid_amount, member_id, reason')
        .neq('status', 'paid')
        .order('fine_date', { ascending: false });

      if (error) throw error;
      setFines(data || []);
    } catch (error: unknown) {
      console.error('Error fetching fines:', error);
    }
  };

  const onSubmit = async (data: ContributionFormData) => {
    try {
      const selectedMember = members.find(m => m.id === data.memberId);
      const memberName = selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Unknown';

      // Handle Regular Contributions
      if (data.regularAmount && Number(data.regularAmount) > 0) {
      const contributionData = {
        member_id: data.memberId,
          amount: Number(data.regularAmount),
          contribution_type: 'regular' as const,
          is_dividend_eligible: false,
        payment_method: data.paymentMethod || null,
        receipt_no: data.receiptNo || null,
        notes: data.notes || null,
        contribution_date: data.contributionDate,
      };

      const { data: result, error } = await supabase
        .from('contributions')
        .insert(contributionData)
        .select()
        .single();

      if (error) throw error;

      await auditLogger.logDataChange('create', 'contributions', result.id, {
          member_name: memberName,
          amount: Number(data.regularAmount),
          type: 'regular_contribution',
          payment_method: data.paymentMethod,
          contribution_date: data.contributionDate,
          receipt_no: data.receiptNo
        });
      }

      // Handle Fine Payments
      if (data.fineAmount && Number(data.fineAmount) > 0 && data.fineId) {
        const fine = fines.find(f => f.id === data.fineId);
        if (fine) {
          const newPaidAmount = fine.paid_amount + Number(data.fineAmount);
          const newStatus = newPaidAmount >= fine.amount ? 'paid' : 'partially_paid';

          const { error: fineError } = await supabase
            .from('fines')
            .update({
              paid_amount: newPaidAmount,
              status: newStatus
            })
            .eq('id', data.fineId);

          if (fineError) throw fineError;

          await auditLogger.logDataChange('update', 'fines', data.fineId, {
            member_name: memberName,
            amount: Number(data.fineAmount),
            type: 'fine_payment',
            payment_method: data.paymentMethod,
            contribution_date: data.contributionDate,
            receipt_no: data.receiptNo
          });
        }
      }

      // Handle Loan Repayments
      if (data.loanRepaymentAmount && Number(data.loanRepaymentAmount) > 0 && data.loanId) {
        const loan = loans.find(l => l.id === data.loanId);
        if (loan) {
          // Calculate interest portion (1.5% per month on reducing balance)
          const interestRate = 0.015; // 1.5% per month
          const interestPortion = loan.balance * interestRate;
          const principalPortion = Number(data.loanRepaymentAmount) - interestPortion;

          const { error: repaymentError } = await supabase
            .from('loan_repayments')
            .insert({
              loan_id: data.loanId,
              member_id: data.memberId,
              amount: Number(data.loanRepaymentAmount),
              principal_portion: Math.max(0, principalPortion),
              interest_portion: Math.min(interestPortion, Number(data.loanRepaymentAmount)),
              payment_date: data.contributionDate,
              payment_method: data.paymentMethod || null
            });

          if (repaymentError) throw repaymentError;

          await auditLogger.logDataChange('create', 'loan_repayments', data.loanId, {
            member_name: memberName,
            amount: Number(data.loanRepaymentAmount),
            type: 'loan_repayment',
        payment_method: data.paymentMethod,
        contribution_date: data.contributionDate,
        receipt_no: data.receiptNo
      });
        }
      }

      toast({
        title: 'Success',
        description: 'Contributions recorded successfully',
      });

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to record contributions';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Record Contributions</h2>
        <p className="text-muted-foreground">Record multiple contribution types for a member</p>
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Instructions:</strong> Select a member and fill in the amounts for the contribution types you want to record. 
            You can record multiple types in one transaction. Leave fields empty if not applicable.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Member Selection */}
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name || `${member.first_name} ${member.last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Contribution Types Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Regular Contributions */}
            <div className="space-y-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Regular Contributions</h3>
              </div>
              <FormField
                control={form.control}
                name="regularAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regular Savings Amount (KES)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter amount" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fine Payments */}
            <div className="space-y-4 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Fine Payments</h3>
              </div>
              <FormField
                control={form.control}
                name="fineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Fine</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fine to pay" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fines.map((fine) => (
                          <SelectItem key={fine.id} value={fine.id}>
                            {fine.reason} - KES {fine.amount.toLocaleString()} (Paid: {fine.paid_amount.toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <FormField
              control={form.control}
                name="fineAmount"
              render={({ field }) => (
                <FormItem>
                    <FormLabel>Fine Payment Amount (KES)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter amount" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
            )}
          />
            </div>

            {/* Loan Repayments */}
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">Loan Repayments</h3>
              </div>
          <FormField
            control={form.control}
                name="loanId"
            render={({ field }) => (
              <FormItem>
                    <FormLabel>Select Loan</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                          <SelectValue placeholder="Select loan to repay" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                        {loans.map((loan) => (
                          <SelectItem key={loan.id} value={loan.id}>
                            Loan #{loan.id.slice(-3)} - KES {loan.principal.toLocaleString()}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
              <FormField
                control={form.control}
                name="loanRepaymentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repayment Amount (KES)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter amount" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Common Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <FormField
            control={form.control}
            name="contributionDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Method</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
          <FormField
            control={form.control}
            name="receiptNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter receipt number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                    <Textarea placeholder="Enter any additional notes" className="min-h-[80px]" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Recording...' : 'Record Contribution'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}