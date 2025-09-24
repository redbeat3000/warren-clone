import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';

const loanSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  principal: z.string().min(1, 'Principal amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Principal must be a positive number',
  }),
  interestRate: z.string().min(1, 'Interest rate is required').refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Interest rate must be a non-negative number',
  }),
  termMonths: z.string().min(1, 'Term is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Term must be a positive number',
  }),
  interestType: z.enum(['declining', 'flat']),
  issueDate: z.string().min(1, 'Issue date is required'),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof loanSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AddLoanFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddLoanForm({ onSuccess, onClose }: AddLoanFormProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      memberId: '',
      principal: '',
      interestRate: '10',
      termMonths: '12',
      interestType: 'declining',
      issueDate: new Date().toISOString().split('T')[0],
      notes: '',
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
    }
  };

  const calculateDueDate = (issueDate: string, termMonths: number) => {
    const date = new Date(issueDate);
    date.setMonth(date.getMonth() + termMonths);
    return date.toISOString().split('T')[0];
  };

  const onSubmit = async (data: LoanFormData) => {
    try {
      const principal = Number(data.principal);
      const termMonths = Number(data.termMonths);
      const dueDate = calculateDueDate(data.issueDate, termMonths);

      const { error } = await supabase
        .from('loans')
        .insert({
          member_id: data.memberId,
          principal,
          interest_rate: Number(data.interestRate),
          term_months: termMonths,
          interest_type: data.interestType,
          issue_date: data.issueDate,
          due_date: dueDate,
          notes: data.notes || null,
          status: 'active' as any,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Loan issued successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue loan',
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
        <h2 className="text-2xl font-bold text-foreground">Issue Loan</h2>
        <p className="text-muted-foreground">Issue a new loan to a member</p>
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
              name="principal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal Amount (KES)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter principal amount" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (%)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter interest rate" type="number" step="0.1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="termMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term (Months)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter term in months" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="declining">Declining Balance</SelectItem>
                      <SelectItem value="flat">Flat Rate</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
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
              {form.formState.isSubmitting ? 'Issuing...' : 'Issue Loan'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}