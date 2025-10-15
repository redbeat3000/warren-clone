import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Plus } from 'lucide-react';
import { auditLogger } from '@/utils/auditLogger';

interface InvestmentProfit {
  id: string;
  amount: number;
  profit_date: string;
  source: string;
  description: string;
  created_at: string;
}

export default function InvestmentProfitsView() {
  const { toast } = useToast();
  const [profits, setProfits] = useState<InvestmentProfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    profitDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProfits();
  }, []);

  const fetchProfits = async () => {
    try {
      const { data, error } = await supabase
        .from('investment_profits')
        .select('*')
        .order('profit_date', { ascending: false });

      if (error) throw error;
      setProfits(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch investment profits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.source) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('investment_profits')
        .insert({
          amount: Number(formData.amount),
          profit_date: formData.profitDate,
          source: formData.source,
          description: formData.description || null
        })
        .select()
        .single();

      if (error) throw error;

      await auditLogger.logDataChange('create', 'investment_profits', data.id, {
        amount: Number(formData.amount),
        source: formData.source
      });

      toast({
        title: 'Success',
        description: 'Investment profit recorded successfully'
      });

      setShowAddDialog(false);
      setFormData({
        amount: '',
        source: '',
        description: '',
        profitDate: new Date().toISOString().split('T')[0]
      });
      fetchProfits();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record investment profit',
        variant: 'destructive'
      });
    }
  };

  const totalProfits = profits.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investment Profits</h2>
          <p className="text-muted-foreground">Track profits that contribute to dividends fund</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Profit
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Total Investment Profits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary">KES {totalProfits.toLocaleString()}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {profits.map((profit) => (
          <motion.div
            key={profit.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{profit.source}</h3>
                {profit.description && (
                  <p className="text-sm text-muted-foreground mt-1">{profit.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(profit.profit_date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">
                  KES {Number(profit.amount).toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Investment Profit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (KES)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter profit amount"
              />
            </div>
            <div>
              <Label>Source</Label>
              <Input
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="e.g., Stock dividends, Real estate rental"
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.profitDate}
                onChange={(e) => setFormData({ ...formData, profitDate: e.target.value })}
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional details about this profit"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                Record Profit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}