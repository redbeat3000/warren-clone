import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EditContributionDialogProps {
  contribution: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditContributionDialog = ({ contribution, open, onOpenChange, onSuccess }: EditContributionDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: contribution?.amount || 0,
    contribution_type: contribution?.contribution_type || 'regular',
    contribution_date: contribution?.contribution_date ? format(new Date(contribution.contribution_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    payment_method: contribution?.payment_method || '',
    receipt_no: contribution?.receipt_no || '',
    notes: contribution?.notes || '',
    is_dividend_eligible: contribution?.is_dividend_eligible || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('contributions')
        .update({
          amount: formData.amount,
          contribution_type: formData.contribution_type,
          contribution_date: formData.contribution_date,
          payment_method: formData.payment_method,
          receipt_no: formData.receipt_no,
          notes: formData.notes,
          is_dividend_eligible: formData.is_dividend_eligible,
        })
        .eq('id', contribution.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contribution updated successfully",
      });
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!contribution) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Contribution</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contribution_type">Contribution Type</Label>
            <Select value={formData.contribution_type} onValueChange={(value) => setFormData({ ...formData, contribution_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular Savings</SelectItem>
                <SelectItem value="xmas_savings">Christmas Savings</SelectItem>
                <SelectItem value="land_fund">Land Fund</SelectItem>
                <SelectItem value="security_fund">Security Fund</SelectItem>
                <SelectItem value="registration_fee">Registration Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="contribution_date">Date</Label>
            <Input
              id="contribution_date"
              type="date"
              value={formData.contribution_date}
              onChange={(e) => setFormData({ ...formData, contribution_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Payment Method</Label>
            <Input
              id="payment_method"
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
              placeholder="e.g., M-Pesa, Cash"
            />
          </div>

          <div>
            <Label htmlFor="receipt_no">Receipt Number</Label>
            <Input
              id="receipt_no"
              value={formData.receipt_no}
              onChange={(e) => setFormData({ ...formData, receipt_no: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_dividend_eligible"
              checked={formData.is_dividend_eligible}
              onCheckedChange={(checked) => setFormData({ ...formData, is_dividend_eligible: checked as boolean })}
            />
            <Label htmlFor="is_dividend_eligible">Eligible for Dividends</Label>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
