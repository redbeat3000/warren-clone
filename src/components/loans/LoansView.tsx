import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddLoanForm from './AddLoanForm';
import LoanViewDialog from './LoanViewDialog';
import { supabase } from '@/integrations/supabase/client';
import { generateLoansReportPDF } from '@/utils/pdfGenerator';

// Sample loans data
const sampleLoans = [
  {
    id: '1',
    loanNo: 'LN001',
    memberName: 'Alice Wanjiku',
    memberNo: 'CH001',
    principal: 50000,
    interestRate: 1.5, // Changed to monthly rate (1.5% per month)
    term: 12,
    issueDate: '2024-01-01',
    outstandingBalance: 35000,
    monthlyPayment: 4583,
    nextPayment: '2024-02-01',
    status: 'active',
  },
  {
    id: '2',
    loanNo: 'LN002',
    memberName: 'Peter Mwangi',
    memberNo: 'CH004',
    principal: 30000,
    interestRate: 2, // Changed to monthly rate (2% per month)
    term: 6,
    issueDate: '2023-12-15',
    outstandingBalance: 5000,
    monthlyPayment: 5183,
    nextPayment: '2024-01-15',
    status: 'active'
  },
  {
    id: '3',
    loanNo: 'LN003',
    memberName: 'Mary Njoki',
    memberNo: 'CH003',
    principal: 25000,
    interestRate: 1.5, // Changed to monthly rate (1.5% per month)
    term: 8,
    issueDate: '2023-11-01',
    outstandingBalance: 8000,
    monthlyPayment: 3406,
    nextPayment: '2024-01-01',
    status: 'active',
  }
];

export default function LoansView() {
  const [filter, setFilter] = useState('all');
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoans();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('loans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans'
        },
        () => {
          fetchLoans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshKey]); // The fetchLoans call was here, which is not ideal.

  const fetchLoans = async () => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .select('*, users!inner(full_name, member_number), loan_repayments(amount)')
        .order('issue_date', { ascending: false });

      if (error) throw error;

      const formattedLoans = (data || []).map((loan: any) => {
        // Calculate total repayments
        const totalRepayments = (loan.loan_repayments || []).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0);

        const principal = parseFloat(loan.principal_amount);
        const totalInterest = parseFloat(loan.total_interest || 0);
        const totalAmount = principal + totalInterest;
        const outstandingBalance = totalAmount - totalRepayments;

        let status = loan.status;
        if (status !== 'repaid' && outstandingBalance <= 0.01) {
          status = 'repaid';
        }

        return {
          id: loan.id,
          loanNo: loan.loan_number,
          memberName: loan.users.full_name,
          memberNo: loan.users.member_number || 'N/A',
          principal: principal,
          interestRate: parseFloat(loan.interest_rate),
          term: loan.term_months,
          issueDate: loan.issue_date,
          interestType: loan.interest_type,
          status: status,
          outstandingBalance: outstandingBalance,
          balance: outstandingBalance,
          total_interest_calculated: totalInterest,
        };
      });

      setLoans(formattedLoans);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeLoans = loans.length > 0 ? loans : sampleLoans;
  const totalLoaned = activeLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalOutstanding = activeLoans.reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0);
  const activeLoanCount = activeLoans.filter(loan => loan.status === 'active').length;
  const repaidLoanCount = activeLoans.filter(loan => loan.status === 'repaid').length;

  const filteredLoans = activeLoans.filter(loan => 
    filter === 'all' || loan.status === filter
  );

  const handleExportLoans = async () => {
    generateLoansReportPDF(filteredLoans);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Loans</h1>
          <p className="text-muted-foreground mt-1">Manage loans, track repayments, and monitor schedules</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-secondary flex items-center space-x-2"
            onClick={handleExportLoans}
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            <span>Export PDF</span>
          </motion.button>
          <Dialog open={isAddLoanOpen} onOpenChange={setIsAddLoanOpen}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center space-x-2"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Issue Loan</span>
              </motion.button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <AddLoanForm 
                onSuccess={() => setRefreshKey(prev => prev + 1)} 
                onClose={() => setIsAddLoanOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Loaned</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalLoaned.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <BanknotesIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
              <p className="text-2xl font-bold text-foreground mt-2">KES {totalOutstanding.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-warning" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Loans</p>
              <p className="text-2xl font-bold text-foreground mt-2">{activeLoanCount}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Repaid Loans</p>
              <p className="text-2xl font-bold text-foreground mt-2">{repaidLoanCount}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-success" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center space-x-4"
      >
        <span className="text-sm font-medium text-foreground">Filter by status:</span>
        {['all', 'active', 'repaid'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === status
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </motion.div>

      {/* Loans Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-elevated overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Loan No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLoans.map((loan, index) => (
                <motion.tr
                  key={loan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="hover:bg-muted/20 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">{loan.loanNo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">{loan.memberName}</div>
                      <div className="text-sm text-muted-foreground">{loan.memberNo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">KES {loan.principal.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      {loan.interestRate}% monthly • {loan.term}m
                      {loan.annualEquivalentRate && (
                        <span className="text-xs"> ({loan.annualEquivalentRate}% annual)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">KES {loan.outstandingBalance.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      loan.status === 'repaid' 
                        ? 'status-active'
                        : loan.status === 'active'
                        ? 'status-pending'
                        : 'status-inactive'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        onClick={() => {
                          setSelectedLoan(loan);
                          setIsViewOpen(true);
                        }}
                        title="View Loan Details"
                      >
                        <EyeIcon className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <LoanViewDialog
        loan={selectedLoan}
        open={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedLoan(null);
        }}
      />
    </div>
  );
}