import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSupabaseQuery } from "@/hooks/useSupabaseQuery";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddContributionForm } from "./AddContributionForm";
import { useState } from "react";

export default function ContributionsView() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: contributions, loading, refetch } = useSupabaseQuery('contributions', '*', []);

  // Sample data when database is empty
  const sampleContributions = [
    {
      id: 'sample-1',
      member_id: 'sample-member-1',
      amount: 5000,
      contribution_date: '2024-01-15',
      payment_method: 'M-Pesa',
      receipt_no: 'REC001',
      notes: 'Monthly contribution'
    },
    {
      id: 'sample-2',
      member_id: 'sample-member-2',
      amount: 5000,
      contribution_date: '2024-01-15',
      payment_method: 'Bank Transfer',
      receipt_no: 'REC002',
      notes: null
    },
    {
      id: 'sample-3',
      member_id: 'sample-member-3',
      amount: 7500,
      contribution_date: '2024-01-14',
      payment_method: 'Cash',
      receipt_no: 'REC003',
      notes: 'Extra contribution'
    }
  ];

  const displayContributions = contributions.length > 0 ? contributions : sampleContributions;
  const totalAmount = displayContributions.reduce((sum: number, c: any) => sum + parseFloat(c.amount || 0), 0);

  const handleSuccess = () => {
    setDialogOpen(false);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Contributions Management</h2>
          <p className="text-muted-foreground">Track and manage member contributions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Contribution
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Contribution</DialogTitle>
            </DialogHeader>
            <AddContributionForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contributions</p>
                <p className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Number of Contributions</p>
                <p className="text-2xl font-bold">{displayContributions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Contribution</p>
                <p className="text-2xl font-bold">
                  KES {displayContributions.length > 0 ? Math.round(totalAmount / displayContributions.length).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contributions List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {displayContributions.map((contribution: any) => (
              <div key={contribution.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">Receipt #{contribution.receipt_no}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(contribution.contribution_date).toLocaleDateString()} - {contribution.payment_method}
                  </p>
                  {contribution.notes && (
                    <p className="text-sm text-muted-foreground">{contribution.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">KES {parseFloat(contribution.amount).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {displayContributions.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No contributions recorded yet. Add your first contribution to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}