import React, { useState, useEffect } from 'react';
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
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  contributionType: z.enum(['regular', 'xmas_savings', 'land_fund', 'security_fund', 'registration_fee']),
  isDividendEligible: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  receiptNo: z.string().optional(),
  notes: z.string().optional(),
  contributionDate: z.string().min(1, 'Date is required'),
});

type ContributionFormData = z.infer<typeof contributionSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AddContributionFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddContributionForm({ onSuccess, onClose }: AddContributionFormProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      memberId: '',
      amount: '',
      contributionType: 'regular',
      isDividendEligible: false,
      paymentMethod: 'M-Pesa',
      receiptNo: '',
      notes: '',
      contributionDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, full_name')
        .eq('status', 'active')
        .order('first_name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContributionFormData) => {
    try {
      const contributionData = {
        member_id: data.memberId,
        amount: Number(data.amount),
        contribution_type: data.contributionType,
        is_dividend_eligible: data.isDividendEligible || data.contributionType === 'registration_fee',
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

      // Log the contribution creation
      const selectedMember = members.find(m => m.id === data.memberId);
      await auditLogger.logDataChange('create', 'contributions', result.id, {
        member_name: selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : 'Unknown',
        amount: Number(data.amount),
        payment_method: data.paymentMethod,
        contribution_date: data.contributionDate,
        receipt_no: data.receiptNo
      });

      toast({
        title: 'Success',
        description: 'Contribution recorded successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record contribution',
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
        <h2 className="text-2xl font-bold text-foreground">Record Contribution</h2>
        <p className="text-muted-foreground">Record a new member contribution</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (KES)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter amount" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contributionType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fund Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="regular">Regular Savings</SelectItem>
                    <SelectItem value="xmas_savings">Xmas Savings</SelectItem>
                    <SelectItem value="land_fund">Land Fund</SelectItem>
                    <SelectItem value="security_fund">Security Fund</SelectItem>
                    <SelectItem value="registration_fee">Registration Fee (Dividend Eligible)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
          </div>

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
                  <Textarea placeholder="Enter any additional notes" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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