import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PlusIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import AddLoanForm from './AddLoanForm';

// Sample loans data
const sampleLoans = [
  {
    id: '1',
    loanNo: 'LN001',
    memberName: 'Alice Wanjiku',
    memberNo: 'CH001',
    principal: 50000,
    interestRate: 10,
    term: 12,
    issueDate: '2024-01-01',
    balance: 35000,
    monthlyPayment: 4583,
    nextPayment: '2024-02-01',
    status: 'active'
  },
  {
    id: '2',
    loanNo: 'LN002',
    memberName: 'Peter Mwangi',
    memberNo: 'CH004',
    principal: 30000,
    interestRate: 12,
    term: 6,
    issueDate: '2023-12-15',
    balance: 5000,
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
    interestRate: 10,
    term: 8,
    issueDate: '2023-11-01',
    balance: 8000,
    monthlyPayment: 3406,
    nextPayment: '2024-01-01',
    status: 'overdue'
  }
];

export default function LoansView() {
  const [filter, setFilter] = useState('all');
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalLoaned = sampleLoans.reduce((sum, loan) => sum + loan.principal, 0);
  const totalOutstanding = sampleLoans.reduce((sum, loan) => sum + loan.balance, 0);
  const activeLoans = sampleLoans.filter(loan => loan.status === 'active').length;
  const overdueLoans = sampleLoans.filter(loan => loan.status === 'overdue').length;

  const filteredLoans = sampleLoans.filter(loan => 
    filter === 'all' || loan.status === filter
  );

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
              <p className="text-2xl font-bold text-foreground mt-2">{activeLoans}</p>
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
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold text-destructive mt-2">{overdueLoans}</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
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
        {['all', 'active', 'overdue', 'completed'].map((status) => (
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
                  Monthly Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Next Payment
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
                    <div className="text-sm text-muted-foreground">{loan.interestRate}% • {loan.term}m</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">KES {loan.balance.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">KES {loan.monthlyPayment.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{new Date(loan.nextPayment).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      loan.status === 'active' 
                        ? 'status-active' 
                        : loan.status === 'overdue'
                        ? 'status-overdue'
                        : 'status-inactive'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 hover:bg-secondary rounded transition-colors">
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
    </div>
  );
}