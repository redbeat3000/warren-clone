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
import { useAuth } from '@/hooks/useAuth';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const contributionSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  regularAmount: z.string().optional(),
  landFundAmount: z.string().optional(),
  securityFundAmount: z.string().optional(),
  teaFundAmount: z.string().optional(),
  xmasSavingsAmount: z.string().optional(),
  registrationFeeAmount: z.string().optional(),
  fineAmount: z.string().optional(),
  loanRepaymentAmount: z.string().optional(),
  loanId: z.string().optional(),
  fineId: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
  contributionDate: z.string().min(1, 'Date is required'),
}).refine((data) => {
  const totalAmount = (Number(data.regularAmount) || 0) + 
                      (Number(data.landFundAmount) || 0) + 
                      (Number(data.securityFundAmount) || 0) + 
                      (Number(data.teaFundAmount) || 0) + 
                      (Number(data.xmasSavingsAmount) || 0) + 
                      (Number(data.registrationFeeAmount) || 0) + 
                      (Number(data.fineAmount) || 0) + 
                      (Number(data.loanRepaymentAmount) || 0);
  return totalAmount > 0;
}, {
  message: 'At least one contribution type must have an amount',
  path: ['regularAmount'], // Show error on the first amount field
}).refine((data) => {
  // If a fine amount is entered, a fine must be selected
  if ((Number(data.fineAmount) || 0) > 0) {
    return !!data.fineId;
  }
  return true;
}, {
  message: 'You must select a fine to pay if you enter a fine amount.',
  path: ['fineId'],
}).refine((data) => {
  // If a loan repayment amount is entered, a loan must be selected
  if ((Number(data.loanRepaymentAmount) || 0) > 0) {
    return !!data.loanId;
  }
  return true;
}, {
  message: 'You must select a loan to repay if you enter a repayment amount.',
  path: ['loanId'],
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  member_number: string; // Added member_number
  full_name: string;
}

interface Loan {
  id: string;
  principal: number;
  balance?: number;
  member_id: string;
  interest_paid: number;
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
  const { authUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      regularAmount: '',
      landFundAmount: '',
      securityFundAmount: '',
      teaFundAmount: '',
      xmasSavingsAmount: '',
      registrationFeeAmount: '',
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

  const watchedAmounts = form.watch([
    'regularAmount',
    'landFundAmount',
    'securityFundAmount',
    'teaFundAmount',
    'xmasSavingsAmount',
    'registrationFeeAmount',
    'fineAmount',
    'loanRepaymentAmount',
  ]);

  useEffect(() => {
    const total = watchedAmounts.reduce((sum, current) => {
      return sum + (Number(current) || 0);
    }, 0);
    setTotalAmount(total);
  }, [watchedAmounts]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchMembers();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []); // Empty dependency array - only run once on mount

  const selectedMemberId = form.watch('memberId');

  useEffect(() => {
    if (selectedMemberId) {
      fetchLoans(selectedMemberId);
      fetchFines(selectedMemberId);
    } else {
      setLoans([]);
      setFines([]);
    }
  }, [selectedMemberId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users') // Assuming 'users' table contains member information
        .select('id, first_name, last_name, full_name, member_number') // Select member_number
        .eq('status', 'active')
        .order('full_name');

      if (error) {
        throw new Error(`Failed to fetch members: ${error.message}`);
      }
      setMembers(data || []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch members';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const fetchLoans = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, principal, interest_paid, member_id, users (full_name), loan_repayments(amount)')
        .eq('status', 'active')
        .eq('member_id', memberId)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      const loansWithBalance = (data || []).map(loan => {
        const totalRepaid = loan.loan_repayments.reduce((sum, p) => sum + p.amount, 0);
        const totalOwed = loan.principal_amount + (loan.total_interest || 0);
        return { ...loan, balance: totalOwed - totalRepaid };
      });
      setLoans(loansWithBalance);
    } catch (error: unknown) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchFines = async (memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('fines')
        .select('id, amount, paid_amount, member_id, reason')
        .neq('status', 'paid')
        .eq('member_id', memberId)
        .order('fine_date', { ascending: false });

      if (error) throw error;
      setFines(data || []);
    } catch (error: unknown) {
      console.error('Error fetching fines:', error);
    }
  };

  const onSubmit = async (data: ContributionFormData) => {
    try {
      const contributionsPayload: { [key: string]: number } = {};
      if (data.regularAmount && +data.regularAmount > 0) contributionsPayload['regular'] = +data.regularAmount;
      if (data.landFundAmount && +data.landFundAmount > 0) contributionsPayload['land_fund'] = +data.landFundAmount;
      if (data.securityFundAmount && +data.securityFundAmount > 0) contributionsPayload['security_fund'] = +data.securityFundAmount;
      if (data.teaFundAmount && +data.teaFundAmount > 0) contributionsPayload['tea_fund'] = +data.teaFundAmount;
      if (data.xmasSavingsAmount && +data.xmasSavingsAmount > 0) contributionsPayload['xmas_savings'] = +data.xmasSavingsAmount;
      if (data.registrationFeeAmount && +data.registrationFeeAmount > 0) contributionsPayload['registration_fee'] = +data.registrationFeeAmount;

      const finePaymentsPayload: { [key: string]: number } = {};
      if (data.fineId && data.fineAmount && +data.fineAmount > 0) {
        finePaymentsPayload[data.fineId] = +data.fineAmount;
      }

      const loanRepaymentsPayload: { [key: string]: number } = {};
      if (data.loanId && data.loanRepaymentAmount && +data.loanRepaymentAmount > 0) {
        loanRepaymentsPayload[data.loanId] = +data.loanRepaymentAmount;
      }

      const { data: rpcData, error } = await supabase.rpc('process_member_transaction', {
        p_member_id: data.memberId,
        p_contributions: contributionsPayload,
        p_fine_payments: finePaymentsPayload,
        p_loan_repayments: loanRepaymentsPayload,
        p_transaction_date: data.contributionDate,
        p_payment_method: data.paymentMethod,
        p_receipt_no: data.receiptNo,
        p_notes: data.notes,
            p_created_by: authUser?.id
      });

      if (error) {
        console.error('RPC Error:', error);
        throw error;
      }

      // Manually trigger a refetch for loans view to ensure status is updated
      // This is a failsafe to ensure UI consistency after a complex transaction.
      onSuccess();
      
      // Optional: Log the master transaction
      const selectedMember = members.find(m => m.id === data.memberId);
      await auditLogger.logDataChange('create', 'contribution_transactions', rpcData, {
        member_name: selectedMember?.full_name || 'Unknown',
        total_amount: Object.values(contributionsPayload).reduce((s, a) => s + a, 0) +
                      Object.values(finePaymentsPayload).reduce((s, a) => s + a, 0) +
                      Object.values(loanRepaymentsPayload).reduce((s, a) => s + a, 0),
        receipt_no: data.receiptNo,
        transaction_date: data.contributionDate,
      });

      toast({
        title: 'Success',
        description: 'Transaction recorded successfully.',
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

  const handleDownloadDraftPDF = async () => {
    try {
      // Dynamically import the PDF generation utility
      const { generateContributionFormPDF } = await import('@/utils/contributionFormPDF');
      const formData = form.getValues();
      const selectedMember = members.find(m => m.id === formData.memberId);
      generateContributionFormPDF(formData, selectedMember, loans, fines, totalAmount);
      toast({ title: 'Downloading PDF', description: 'Your contribution form draft is being generated.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF draft.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading form data...</p>
        </div>
      </div>
    );
  }

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
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Contribution Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Regular Contributions */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Regular</h4>
                </div>
                <FormField
                  control={form.control}
                  name="regularAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Land Fund */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Land Fund</h4>
                </div>
                <FormField
                  control={form.control}
                  name="landFundAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Security Fund */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Security Fund</h4>
                </div>
                <FormField
                  control={form.control}
                  name="securityFundAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tea Fund */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Tea Fund</h4>
                </div>
                <FormField
                  control={form.control}
                  name="teaFundAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Xmas Savings */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Xmas Savings</h4>
                </div>
                <FormField
                  control={form.control}
                  name="xmasSavingsAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Registration Fee */}
              <div className="space-y-2 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">Registration Fee</h4>
                </div>
                <FormField
                  control={form.control}
                  name="registrationFeeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="Amount (KES)" type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Other Payment Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Other Payments</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

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
                            {fine.reason} - KES {(fine.amount - fine.paid_amount).toLocaleString()} due
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
                            Loan #{loan.id.slice(-4)} - KES {(loan.balance ?? 0).toLocaleString()} due
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

          {/* Total Amount Display */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex justify-between items-center text-lg font-bold text-foreground">
              <span>Total Amount:</span>
              <span>KES {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleDownloadDraftPDF} disabled={!form.formState.isDirty && totalAmount === 0}>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download Draft PDF
            </Button>
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