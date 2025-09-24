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

const fineSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must be less than 500 characters'),
  fineDate: z.string().min(1, 'Date is required'),
});

type FineFormData = z.infer<typeof fineSchema>;

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

interface AddFineFormProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function AddFineForm({ onSuccess, onClose }: AddFineFormProps) {
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);

  const form = useForm<FineFormData>({
    resolver: zodResolver(fineSchema),
    defaultValues: {
      memberId: '',
      amount: '',
      reason: '',
      fineDate: new Date().toISOString().split('T')[0],
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

  const onSubmit = async (data: FineFormData) => {
    try {
      const { error } = await supabase
        .from('fines')
        .insert({
          member_id: data.memberId,
          amount: Number(data.amount),
          reason: data.reason,
          fine_date: data.fineDate,
          status: 'unpaid',
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Fine issued successfully',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to issue fine',
        variant: 'destructive',
      });
    }
  };

  const commonReasons = [
    'Late contribution payment',
    'Missed meeting attendance',
    'Late loan repayment',
    'Breach of group rules',
    'Disruptive behavior',
    'Other'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground">Issue Fine</h2>
        <p className="text-muted-foreground">Issue a penalty fine to a member</p>
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
                  <FormLabel>Fine Amount (KES)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter fine amount" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fineDate"
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
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Fine</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter the reason for this fine..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-2">Common reasons:</p>
                  <div className="flex flex-wrap gap-1">
                    {commonReasons.map((reason) => (
                      <button
                        key={reason}
                        type="button"
                        onClick={() => form.setValue('reason', reason)}
                        className="px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-muted transition-colors"
                      >
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Issuing...' : 'Issue Fine'}
            </Button>
          </div>
        </form>
      </Form>
    </motion.div>
  );
}