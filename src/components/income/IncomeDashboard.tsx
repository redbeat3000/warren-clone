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

  const [summary, setSummary] = useState<any>({});
  const [yearlyTotalIncome, setYearlyTotalIncome] = useState(0);
  const [yearlyTotalExpenses, setYearlyTotalExpenses] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [finesCollected, setFinesCollected] = useState(0); // Still needed for yearly fine total

  useEffect(() => {
    fetchIncomeData();
  }, [dateFrom, dateTo, filterCategory]);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);

      // Define yearly date range
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1).toISOString().split('T')[0];
      const yearEnd = new Date(currentYear, 11, 31).toISOString().split('T')[0];

      const [
        { data: transactionData, error: transactionError },
        { data: yearlyExpensesData, error: expensesError }
      ] = await Promise.all([
        supabase.from('transaction_summary').select('*').gte('date', yearStart).lte('date', yearEnd),
        supabase.from('expenses').select('amount').gte('expense_date', yearStart).lte('expense_date', yearEnd)
      ]);

      if (transactionError) throw transactionError;
      if (expensesError) throw expensesError;

      const allYearlyTransactions = transactionData || [];

      // --- Yearly Calculations for Net Profit ---
      const yearlyInterest = allYearlyTransactions.filter(t => t.category === 'Loan Interest').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const yearlyRegFees = allYearlyTransactions.filter(t => t.category === 'Registration Fee').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const yearlyFines = allYearlyTransactions.filter(t => t.category === 'Fine Payment').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
      const totalYearlyProfitSources = yearlyInterest + yearlyRegFees + yearlyFines;
      
      setFinesCollected(yearlyFines); // This state variable is specifically for the yearly total on the Fines Collected card.
      setYearlyTotalIncome(totalYearlyProfitSources);

      const totalYearlyExp = (yearlyExpensesData || []).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      setYearlyTotalExpenses(totalYearlyExp);

      // --- Filter data for the selected date range ---
      const filteredData = allYearlyTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= new Date(dateFrom) && transactionDate <= new Date(dateTo);
      });

      // Calculate summaries for cards
      const newSummary = filteredData.reduce((acc, t) => {
        // Ensure pluralization for keys to match component state
        const category = (t.category.toLowerCase().replace(/ /g, '_')) + 's';
        acc[category] = (acc[category] || 0) + t.amount;
        return acc;
      }, {});
      setSummary(newSummary);

      // Prepare transactions for the table view
      const allTransactions = filteredData.map(t => ({
        date: t.date,
        category: t.category,
        source: t.member_name || t.source || 'N/A',
        amount: t.amount,
        type: t.type,
        description: t.description,
      }));

      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Filter by category if needed
      if (filterCategory !== 'all') {
        setTransactions(allTransactions.filter(t => t.category.toLowerCase().replace(/ /g, '_') + 's' === filterCategory.toLowerCase()));
      } else {
        setTransactions(allTransactions);
      }

    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const regularContributions = summary.regular_contributions || summary.regular_contribution || 0;
  const xmasSavings = summary.xmas_savingss || 0;
  const landFund = summary.land_funds || 0;
  const securityFund = summary.security_funds || 0;
  const teaFund = summary.tea_fund || 0;
  const loanInterest = summary.loan_interest || 0;
  const registrationFees = summary.registration_fees || 0;

  // Total Income = Only actual income sources (Interest + Fees + Fines)
  // NOT member contributions (those are member savings, not organizational income)
  // This is for the date-filtered "Total Income" card
  const totalIncome = (summary.loan_interests || 0) + (summary.registration_fees || 0) + (summary.fine_payments || 0);

  // Net Income for the whole year
  const netIncome = yearlyTotalIncome - yearlyTotalExpenses;
  
  // Total Contributions (for display purposes)
  const totalContributions = regularContributions + xmasSavings + landFund + securityFund + teaFund;
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
              <p className="text-sm font-medium text-muted-foreground">Regular Contributions</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">KES {regularContributions.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-blue-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Xmas Savings</p>
              <p className="text-2xl font-bold text-green-600 mt-2">KES {xmasSavings.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Land Fund</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">KES {landFund.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-amber-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Security Fund</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">KES {securityFund.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tea Fund</p>
              <p className="text-2xl font-bold text-teal-600 mt-2">KES {teaFund.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <CurrencyDollarIcon className="h-6 w-6 text-teal-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Income Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
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
          transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.7 }}
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
          transition={{ delay: 0.8 }}
          className="card-elevated p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-destructive mt-2">KES {yearlyTotalExpenses.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-destructive/10 rounded-lg flex items-center justify-center">
              <ArrowTrendingDownIcon className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Income Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Contributions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card-elevated p-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Member Contributions</p>
              <p className="text-3xl font-bold text-green-600 mt-2">KES {totalContributions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member savings (not organizational income)
              </p>
            </div>
            <div className="h-16 w-16 rounded-lg flex items-center justify-center bg-green-100">
              <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* Net Income */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="card-elevated p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Income (Filtered Period)</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">KES {totalIncome.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Interest + Fees + Fines
              </p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-muted-foreground">Net Profit (This Year)</p>
                <p className={`text-2xl font-bold mt-1 ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                  KES {netIncome.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Yearly Income - Yearly Expenses
                </p>
              </div>
            </div>
            <div className={`h-16 w-16 rounded-lg flex items-center justify-center ${netIncome >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {netIncome >= 0 ? (
                <ArrowTrendingUpIcon className="h-8 w-8 text-success" />
              ) : (
                <ArrowTrendingDownIcon className="h-8 w-8 text-destructive" />
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
              <option value="regular_contributions">Regular Contribution</option>
              <option value="xmas_savingss">Xmas Savings</option>
              <option value="land_funds">Land Fund</option>
              <option value="security_funds">Security Fund</option>
              <option value="tea_funds">Tea Fund</option>
              <option value="loan_interests">Loan Interest</option>
              <option value="registration_fees">Registration Fee</option>
              <option value="fine_payments">Fine Payment</option>
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
                        transaction.category === 'Regular Contribution' ? 'bg-blue-100 text-blue-700' :
                        transaction.category === 'Xmas Savings' ? 'bg-green-100 text-green-700' :
                        transaction.category === 'Land Fund' ? 'bg-amber-100 text-amber-700' :
                        transaction.category === 'Security Fund' ? 'bg-purple-100 text-purple-700' :
                        transaction.category === 'Tea Fund' ? 'bg-teal-100 text-teal-700' :
                        transaction.category === 'Loan Interest' ? 'bg-primary/10 text-primary' :
                        transaction.category === 'Registration Fee' ? 'bg-success/10 text-success' :
                        transaction.category === 'Fine Payment' ? 'bg-warning/10 text-warning' :
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
