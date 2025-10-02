import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const repaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  paymentDate: z.string().min(1, 'Date is required')
});

type RepaymentFormData = z.infer<typeof repaymentSchema>;

interface FineRepaymentDialogProps {
  fine: {
    id: string;
    memberName: string;
    reason: string;
    amount: number;
  } | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FineRepaymentDialog({ fine, open, onClose, onSuccess }: FineRepaymentDialogProps) {
  const { toast } = useToast();

  const form = useForm<RepaymentFormData>({
    resolver: zodResolver(repaymentSchema),
    defaultValues: {
      amount: fine?.amount || 0,
      paymentMethod: 'mpesa',
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });

  React.useEffect(() => {
    if (fine) {
      form.reset({
        amount: fine.amount,
        paymentMethod: 'mpesa',
        paymentDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [fine, form]);

  const onSubmit = async (data: RepaymentFormData) => {
    if (!fine) return;

    try {
      // Update fine status to paid
      const { error } = await supabase
        .from('fines')
        .update({ status: 'paid' })
        .eq('id', fine.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Fine repayment recorded successfully'
      });

      form.reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error recording fine repayment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record fine repayment',
        variant: 'destructive'
      });
    }
  };

  if (!fine) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Fine Repayment</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="bg-muted/30 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Member:</span>
              <span className="text-sm font-medium">{fine.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Reason:</span>
              <span className="text-sm font-medium">{fine.reason}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Fine Amount:</span>
              <span className="text-sm font-bold text-primary">KES {fine.amount.toLocaleString()}</span>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Amount (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
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
                        <SelectItem value="mpesa">M-PESA</SelectItem>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Record Payment
                </Button>
              </div>
            </form>
          </Form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
