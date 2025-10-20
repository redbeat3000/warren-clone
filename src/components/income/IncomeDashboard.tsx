import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  DocumentArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function IncomeDashboard() {
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [loanInterest, setLoanInterest] = useState(0);
  const [registrationFees, setRegistrationFees] = useState(0);
  const [finesCollected, setFinesCollected] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    fetchIncomeData();
  }, [dateFrom, dateTo, filterCategory]);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch Loan Interest
      const { data: interestData } = await supabase
        .from('loan_repayments')
        .select('interest_portion, payment_date, amount, loans!inner(users!inner(first_name, last_name, member_no))')
        .gte('payment_date', dateFrom)
        .lte('payment_date', dateTo);

      const totalInterest = (interestData || []).reduce((sum, r) => sum + (Number(r.interest_portion) || 0), 0);
      setLoanInterest(totalInterest);

      // Fetch Registration Fees
      const { data: regFeesData } = await supabase
        .from('contributions')
        .select('amount, contribution_date, users!inner(first_name, last_name, member_no)')
        .eq('contribution_type', 'registration_fee')
        .gte('contribution_date', dateFrom)
        .lte('contribution_date', dateTo);

      const totalRegFees = (regFeesData || []).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      setRegistrationFees(totalRegFees);

      // Fetch Fines
      const { data: finesData } = await supabase
        .from('fines')
        .select('paid_amount, fine_date, reason, users!inner(first_name, last_name, member_no)')
        .gte('fine_date', dateFrom)
        .lte('fine_date', dateTo);

      const totalFines = (finesData || []).reduce((sum, f) => sum + (Number(f.paid_amount) || 0), 0);
      setFinesCollected(totalFines);

      // Fetch Expenses
      const { data: expensesData } = await supabase
        .from('expenses')
        .select('amount, expense_date, description, category')
        .gte('expense_date', dateFrom)
        .lte('expense_date', dateTo);

      const totalExp = (expensesData || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setTotalExpenses(totalExp);

      // Combine all transactions for the table
      const allTransactions: any[] = [];

      // Add interest transactions
      (interestData || []).forEach((item: any) => {
        allTransactions.push({
          date: item.payment_date,
          category: 'Loan Interest',
          source: `${item.loans.users.first_name} ${item.loans.users.last_name} (${item.loans.users.member_no})`,
          amount: Number(item.interest_portion) || 0,
          type: 'income',
          description: `Loan interest payment`
        });
      });

      // Add registration fees
      (regFeesData || []).forEach((item: any) => {
        allTransactions.push({
          date: item.contribution_date,
          category: 'Registration Fees',
          source: `${item.users.first_name} ${item.users.last_name} (${item.users.member_no})`,
          amount: Number(item.amount) || 0,
          type: 'income',
          description: 'Member registration fee'
        });
      });

      // Add fines
      (finesData || []).forEach((item: any) => {
        allTransactions.push({
          date: item.fine_date,
          category: 'Fines',
          source: `${item.users.first_name} ${item.users.last_name} (${item.users.member_no})`,
          amount: Number(item.paid_amount) || 0,
          type: 'income',
          description: item.reason || 'Fine payment'
        });
      });

      // Add expenses
      (expensesData || []).forEach((item: any) => {
        allTransactions.push({
          date: item.expense_date,
          category: 'Expenses',
          source: item.category || 'General',
          amount: Number(item.amount) || 0,
          type: 'expense',
          description: item.description || 'Expense'
        });
      });

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Filter by category if needed
      if (filterCategory !== 'all') {
        setTransactions(allTransactions.filter(t => t.category.toLowerCase() === filterCategory.toLowerCase()));
      } else {
        setTransactions(allTransactions);
      }

    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const netIncome = loanInterest + registrationFees + finesCollected - totalExpenses;

  const handleExport = () => {
    // Create CSV
    const headers = ['Date', 'Category', 'Source', 'Description', 'Amount', 'Type'];
    const rows = transactions.map(t => [
      format(new Date(t.date), 'PP'),
      t.category,
      t.source,
      t.description,
      t.amount.toLocaleString(),
      t.type
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-tracking-${dateFrom}-to-${dateTo}.csv`;
    a.click();
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
          <h1 className="text-3xl font-bold text-foreground">Income Tracking</h1>
          <p className="text-muted-foreground mt-1">Monitor all income sources and expenses</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          className="btn-secondary flex items-center space-x-2"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          <span>Export CSV</span>
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Loan Interest</p>
              <p className="text-2xl font-bold text-primary mt-2">KES {loanInterest.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Registration Fees</p>
              <p className="text-2xl font-bold text-success mt-2">KES {registrationFees.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
              <ArrowTrendingUpIcon className="h-6 w-6 text-success" />
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
              <p className="text-sm font-medium text-muted-foreground">Fines Collected</p>
              <p className="text-2xl font-bold text-warning mt-2">KES {finesCollected.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-warning" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-destructive mt-2">KES {totalExpenses.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ArrowTrendingDownIcon className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-6 bg-accent/5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Net Income</p>
              <p className={`text-2xl font-bold mt-2 ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                KES {netIncome.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                (Interest + Fees + Fines) - Expenses
              </p>
            </div>
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {netIncome >= 0 ? (
                <ArrowTrendingUpIcon className="h-6 w-6 text-success" />
              ) : (
                <ArrowTrendingDownIcon className="h-6 w-6 text-destructive" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-elevated p-6"
      >
        <div className="flex items-center space-x-4 flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filters:</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">From:</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-input-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-accent-border"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">To:</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-input-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-accent-border"
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm text-muted-foreground">Category:</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-input-border rounded-lg bg-input text-sm focus:outline-none focus:ring-2 focus:ring-accent-border"
            >
              <option value="all">All Categories</option>
              <option value="loan interest">Loan Interest</option>
              <option value="registration fees">Registration Fees</option>
              <option value="fines">Fines</option>
              <option value="expenses">Expenses</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card-elevated overflow-hidden"
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Transaction History</h3>
          <p className="text-sm text-muted-foreground">Showing {transactions.length} transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Source
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    Loading transactions...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                    No transactions found for the selected period
                  </td>
                </tr>
              ) : (
                transactions.map((transaction, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.05 }}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{format(new Date(transaction.date), 'PP')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.category === 'Loan Interest' ? 'bg-primary/10 text-primary' :
                        transaction.category === 'Registration Fees' ? 'bg-success/10 text-success' :
                        transaction.category === 'Fines' ? 'bg-warning/10 text-warning' :
                        'bg-destructive/10 text-destructive'
                      }`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground">{transaction.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-muted-foreground">{transaction.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'} KES {transaction.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        transaction.type === 'income' ? 'status-active' : 'status-overdue'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
