import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface LoanViewDialogProps {
  loan: any;
  open: boolean;
  onClose: () => void;
}

export default function LoanViewDialog({ loan, open, onClose }: LoanViewDialogProps) {
  if (!loan) return null;

  const totalPaid = loan.outstandingBalance ? loan.principal - loan.balance : 0;
  const interestPaid = totalPaid > 0 ? (totalPaid * loan.interestRate / 100) : 0;
  const principalPaid = totalPaid - interestPaid;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Loan Details - {loan.loanNo}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Loan Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground">Member</p>
              <p className="text-lg font-semibold text-foreground">{loan.memberName}</p>
              <p className="text-sm text-muted-foreground">{loan.memberNo}</p>
            </div>
            <div className="card-elevated p-4">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge className={loan.status === 'active' ? 'status-active' : loan.status === 'overdue' ? 'status-overdue' : 'status-inactive'}>
                {loan.status}
              </Badge>
            </div>
          </div>

          {/* Loan Details */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Loan Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Principal Amount</p>
                <p className="text-base font-medium text-foreground">KES {loan.principal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Interest Rate</p>
                <p className="text-base font-medium text-foreground">{loan.interestRate}% per month</p>
                {loan.annualEquivalentRate && (
                  <p className="text-xs text-muted-foreground">({loan.annualEquivalentRate}% annual)</p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Term</p>
                <p className="text-base font-medium text-foreground">{loan.term} months</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Issue Date</p>
                <p className="text-base font-medium text-foreground">{format(new Date(loan.issueDate), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Due Date</p>
                <p className="text-base font-medium text-foreground">{format(new Date(loan.nextPayment), 'PPP')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payment</p>
                <p className="text-base font-medium text-foreground">KES {loan.monthlyPayment.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Financial Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-foreground">Principal Amount</span>
                <span className="font-semibold text-foreground">KES {loan.principal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-foreground">Total Interest</span>
                <span className="font-semibold text-foreground">KES {((loan.monthlyPayment * loan.term) - loan.principal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-foreground">Total Loan Amount</span>
                <span className="font-semibold text-primary">KES {(loan.monthlyPayment * loan.term).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-success">Amount Paid</span>
                <span className="font-semibold text-success">KES {totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-warning">Remaining Balance</span>
                <span className="font-semibold text-warning">KES {loan.balance.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Interest Breakdown */}
          <div className="card-elevated p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Interest Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Type</span>
                <span className="font-medium text-foreground capitalize">{loan.interestType || 'declining'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Paid</span>
                <span className="font-medium text-foreground">KES {interestPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal Paid</span>
                <span className="font-medium text-foreground">KES {principalPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Repayment History would go here if available */}
          {loan.repaymentHistory && loan.repaymentHistory.length > 0 && (
            <div className="card-elevated p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Repayment History</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Principal</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Interest</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loan.repaymentHistory.map((payment: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-foreground">{format(new Date(payment.date), 'PP')}</td>
                        <td className="px-4 py-2 text-sm font-medium text-foreground">KES {payment.amount.toLocaleString()}</td>
                        <td className="px-4 py-2 text-sm text-foreground">KES {payment.principal?.toLocaleString() || '0'}</td>
                        <td className="px-4 py-2 text-sm text-foreground">KES {payment.interest?.toLocaleString() || '0'}</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">{payment.method || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
