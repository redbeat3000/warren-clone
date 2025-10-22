import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PrinterIcon, CalendarDaysIcon, BanknotesIcon, ChartPieIcon } from '@heroicons/react/24/outline';
import { format, addMonths, differenceInMonths } from 'date-fns';

interface Loan {
  id: string;
  principal_amount: number;
  issue_date: string;
  status: 'active' | 'fully_paid' | 'overdue';
  users: {
    full_name: string;
    member_number: string;
  };
}

interface LoanRepayment {
  payment_date: string;
  amount: number;
  principal_portion: number;
  interest_portion: number;
  payment_method: string;
}

interface RepaymentScheduleRow {
  date: string;
  openingBalance: number;
  loanIssued: number;
  interest: number;
  repayment: number;
  loanBalance: number;
}

export default function LoanRepaymentsView() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [schedule, setSchedule] = useState<RepaymentScheduleRow[]>([]);

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('id, principal_amount, issue_date, status, users!inner(full_name, member_number)')
        .in('status', ['active', 'fully_paid', 'overdue'])
        .order('issue_date', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewLoan = async (loan: Loan) => {
    setSelectedLoan(loan);
    const { data: repaymentsData, error } = await supabase
      .from('loan_repayments')
      .select('payment_date, amount, principal_portion, interest_portion, payment_method')
      .eq('loan_id', loan.id)
      .order('payment_date', { ascending: true });

    if (error) {
      console.error('Error fetching repayments:', error);
      return;
    }
    setRepayments(repaymentsData || []);
    calculateRepaymentSchedule(loan, repaymentsData || []);
  };

  const calculateRepaymentSchedule = (loan: Loan, repayments: LoanRepayment[]) => {
    const interestRate = 0.015; // 1.5%
    let currentBalance = loan.principal_amount;
    const startDate = new Date(loan.issue_date);
    const endDate = new Date();
    const monthsElapsed = differenceInMonths(endDate, startDate);

    const scheduleRows: RepaymentScheduleRow[] = [];

    // Initial loan issue row
    scheduleRows.push({
      date: format(startDate, 'yyyy-MM-dd'),
      openingBalance: 0,
      loanIssued: loan.principal_amount,
      interest: 0,
      repayment: 0,
      loanBalance: loan.principal_amount,
    });

    const repaymentsByMonth: { [key: string]: number } = repayments.reduce((acc, p) => {
      const monthKey = format(new Date(p.payment_date), 'yyyy-MM');
      acc[monthKey] = (acc[monthKey] || 0) + p.amount;
      return acc;
    }, {} as { [key: string]: number });

    for (let i = 1; i <= monthsElapsed + 1; i++) {
      const monthDate = addMonths(startDate, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      
      const openingBalance = currentBalance;
      const monthlyInterest = openingBalance * interestRate;
      const repaymentAmount = repaymentsByMonth[monthKey] || 0;
      
      currentBalance += monthlyInterest - repaymentAmount;

      scheduleRows.push({
        date: format(monthDate, 'yyyy-MM-dd'),
        openingBalance,
        loanIssued: 0,
        interest: monthlyInterest,
        repayment: repaymentAmount,
        loanBalance: currentBalance,
      });
    }
    setSchedule(scheduleRows);
  };

  const handlePrintStatement = async () => {
    if (!selectedLoan) return;

    const { jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Loan Statement', 105, 20, { align: 'center' });

    // Loan Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Member: ${selectedLoan.users.full_name} (${selectedLoan.users.member_number})`, 14, 35);
    doc.text(`Loan ID: ${selectedLoan.id}`, 14, 42);
    doc.text(`Principal: KES ${selectedLoan.principal_amount.toLocaleString()}`, 14, 49);
    doc.text(`Issue Date: ${format(new Date(selectedLoan.issue_date), 'PP')}`, 14, 56);

    // Amortization Schedule
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Amortization Schedule (1.5% Reducing Balance)', 14, 70);
    (doc as any).autoTable({
      startY: 75,
      head: [['Date', 'Opening Balance', 'Interest', 'Repayment', 'Closing Balance']],
      body: schedule.map(row => [
        format(new Date(row.date), 'dd-MMM-yy'),
        row.openingBalance.toLocaleString(undefined, {minimumFractionDigits: 2}),
        row.interest.toLocaleString(undefined, {minimumFractionDigits: 2}),
        row.repayment.toLocaleString(undefined, {minimumFractionDigits: 2}),
        row.loanBalance.toLocaleString(undefined, {minimumFractionDigits: 2}),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [45, 55, 72] },
    });

    // Repayment History
    if (repayments.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Actual Repayment History', 14, 20);
      (doc as any).autoTable({
        startY: 25,
        head: [['Date', 'Method', 'Principal', 'Interest', 'Total Paid']],
        body: repayments.map(p => [
          format(new Date(p.payment_date), 'PP'),
          p.payment_method,
          p.principal_portion.toLocaleString(),
          p.interest_portion.toLocaleString(),
          p.amount.toLocaleString(),
        ]),
        theme: 'grid',
        headStyles: { fillColor: [22, 163, 74] },
      });
    }

    doc.save(`Loan_Statement_${selectedLoan.users.member_no}.pdf`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'fully_paid': return 'status-paid';
      case 'overdue': return 'status-overdue';
      default: return 'status-pending';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Loan Repayments</h1>
        <p className="text-muted-foreground mt-1">View loan repayment schedules and history.</p>
      </motion.div>

      {loading ? (
        <p>Loading loans...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map(loan => (
            <motion.div
              key={loan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="card-elevated p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleViewLoan(loan)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-lg text-foreground">{loan.users.full_name}</p>
                  <p className="text-sm text-muted-foreground">{loan.users.member_number}</p>
                </div>
                <Badge className={getStatusBadge(loan.status)}>{loan.status}</Badge>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center space-x-2">
                  <BanknotesIcon className="h-5 w-5 text-primary" />
                  <p>Principal: <span className="font-semibold">KES {loan.principal_amount.toLocaleString()}</span></p>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary" />
                  <p>Issued: <span className="font-semibold">{format(new Date(loan.issue_date), 'PP')}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {selectedLoan && (
        <Dialog open={!!selectedLoan} onOpenChange={(open) => !open && setSelectedLoan(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loan Details: {selectedLoan.users.full_name}</DialogTitle>
              <DialogDescription>
                Amortization schedule and repayment history for Loan ID: {selectedLoan.id.slice(0, 8)}...
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="flex justify-end mb-4">
                <Button onClick={handlePrintStatement}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Statement
                </Button>
              </div>
              <h3 className="font-semibold mb-2">Amortization Schedule (1.5% Reducing Balance)</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-right">Opening Balance</th>
                      <th className="p-2 text-right">Interest</th>
                      <th className="p-2 text-right">Repayment</th>
                      <th className="p-2 text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{format(new Date(row.date), 'dd-MMM-yy')}</td>
                        <td className="p-2 text-right">{row.openingBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-2 text-right text-red-600">{row.interest.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-2 text-right text-green-600">{row.repayment.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                        <td className="p-2 text-right font-semibold">{row.loanBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {repayments.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Actual Repayment History</h3>
                  <ul className="space-y-2">
                    {repayments.map((p, i) => (
                      <li key={i} className="p-3 bg-muted/50 rounded-md flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{format(new Date(p.payment_date), 'PP')}</p>
                          <p className="text-xs text-muted-foreground">Method: {p.payment_method}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">KES {p.amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">
                            (P: {p.principal_portion.toLocaleString()} | I: {p.interest_portion.toLocaleString()})
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}