// src/components/income/IncomeRecordingForm.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const incomeSchema = z.object({
  category_id: z.string().min(1, 'Category is required'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  income_date: z.string().min(1, 'Date is required'),
  description: z.string().min(1, 'Description is required'),
  receipt_no: z.string().optional(),
  payment_method: z.string().optional(),
  source_reference: z.string().optional(),
  notes: z.string().optional(),
});

type IncomeFormData = z.infer<typeof incomeSchema>;

interface IncomeRecordingFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function IncomeRecordingForm({ onClose, onSuccess }: IncomeRecordingFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      income_date: new Date().toISOString().split('T')[0],
    }
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('income_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setCategories(data || []);
  };

  const onSubmit = async (data: IncomeFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('income_records')
        .insert({
          category_id: data.category_id,
          amount: Number(data.amount),
          income_date: data.income_date,
          description: data.description,
          receipt_no: data.receipt_no || null,
          payment_method: data.payment_method || null,
          source_reference: data.source_reference || null,
          notes: data.notes || null,
          fiscal_year: new Date(data.income_date).getFullYear(),
          recorded_by: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
      onSuccess();
    } catch (error) {
      console.error('Error recording income:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Record New Income</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">Income Category</Label>
              <Select onValueChange={(value) => {}}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category_id && (
                <p className="text-red-500 text-sm">{errors.category_id.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                type="number"
                step="0.01"
                {...register('amount')}
                placeholder="Enter amount"
              />
              {errors.amount && (
                <p className="text-red-500 text-sm">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="income_date">Income Date</Label>
              <Input
                type="date"
                {...register('income_date')}
              />
              {errors.income_date && (
                <p className="text-red-500 text-sm">{errors.income_date.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="receipt_no">Receipt Number (Optional)</Label>
              <Input
                {...register('receipt_no')}
                placeholder="Receipt number"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              {...register('description')}
              placeholder="Describe the income source"
            />
            {errors.description && (
              <p className="text-red-500 text-sm">{errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="source_reference">Source Reference (Optional)</Label>
            <Input
              {...register('source_reference')}
              placeholder="e.g., Loan ID, Fine ID, etc."
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              {...register('notes')}
              placeholder="Additional notes about this income"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Recording...' : 'Record Income'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}