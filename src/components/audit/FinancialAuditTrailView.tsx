import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface FinancialTransaction {
  id: string;
  timestamp: string;
  actionType: string;
  member: string;
  amount: number;
  paymentMethod?: string;
  previousBalance: number;
  newBalance: number;
  authorizingOfficer: string;
  referenceNumber: string;
  description?: string;
}

const transactionTypes = [
  { value: 'all', label: 'All Transactions' },
  { value: 'CONTRIBUTION_RECEIVED', label: 'Contribution Received', color: 'text-green-600' },
  { value: 'LOAN_DISBURSED', label: 'Loan Disbursed', color: 'text-red-600' },
  { value: 'LOAN_REPAYMENT_RECEIVED', label: 'Loan Repayment', color: 'text-green-600' },
  { value: 'EXPENSE_PAID', label: 'Expense Paid', color: 'text-red-600' },
  { value: 'FINE_IMPOSED', label: 'Fine Imposed', color: 'text-orange-600' },
  { value: 'FINE_PAID', label: 'Fine Paid', color: 'text-green-600' },
  { value: 'INCOME_RECEIVED', label: 'Income Received', color: 'text-green-600' },
  { value: 'DIVIDEND_PAID', label: 'Dividend Paid', color: 'text-purple-600' },
  { value: 'FUND_TRANSFER', label: 'Fund Transfer', color: 'text-blue-600' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment', color: 'text-yellow-600' },
];

export default function FinancialAuditTrailView() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  useEffect(() => {
    fetchFinancialTransactions();
  }, []);

  const fetchFinancialTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch all financial transactions from different sources
      const [
        { data: contributions },
        { data: loans },
        { data: repayments },
        { data: expenses },
        { data: fines },
        { data: dividends },
        { data: investmentProfits }
      ] = await Promise.all([
        supabase.from('contributions').select('*, users!contributions_member_id_fkey(first_name, last_name, member_no)').order('contribution_date', { ascending: false }),
        supabase.from('loans').select('*, users!loans_member_id_fkey(first_name, last_name, member_no)').order('issue_date', { ascending: false }),
        supabase.from('loan_repayments').select('*, users!loan_repayments_member_id_fkey(first_name, last_name, member_no)').order('payment_date', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('fines').select('*, users!fines_member_id_fkey(first_name, last_name, member_no)').order('fine_date', { ascending: false }),
        supabase.from('dividend_allocations').select('*, users!dividend_allocations_member_id_fkey(first_name, last_name, member_no)').order('created_at', { ascending: false }),
        supabase.from('investment_profits').select('*').order('profit_date', { ascending: false })
      ]);

      const allTransactions: FinancialTransaction[] = [];

      // Process contributions
      contributions?.forEach(c => {
        allTransactions.push({
          id: c.id,
          timestamp: c.contribution_date,
          actionType: 'CONTRIBUTION_RECEIVED',
          member: c.users ? `${c.users.first_name} ${c.users.last_name} (${c.users.member_no})` : 'Unknown',
          amount: Number(c.amount),
          paymentMethod: c.payment_method || 'Cash',
          previousBalance: 0, // TODO: Calculate from running balance
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: c.receipt_no || `CONT-${c.id.substring(0, 8)}`,
          description: c.notes
        });
      });

      // Process loans
      loans?.forEach(l => {
        allTransactions.push({
          id: l.id,
          timestamp: l.issue_date,
          actionType: 'LOAN_DISBURSED',
          member: l.users ? `${l.users.first_name} ${l.users.last_name} (${l.users.member_no})` : 'Unknown',
          amount: Number(l.principal),
          paymentMethod: 'Bank Transfer',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `LOAN-${l.id.substring(0, 8)}`,
          description: l.notes
        });
      });

      // Process loan repayments
      repayments?.forEach(r => {
        allTransactions.push({
          id: r.id,
          timestamp: r.payment_date,
          actionType: 'LOAN_REPAYMENT_RECEIVED',
          member: r.users ? `${r.users.first_name} ${r.users.last_name} (${r.users.member_no})` : 'Unknown',
          amount: Number(r.amount),
          paymentMethod: r.payment_method || 'Cash',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `REPAY-${r.id.substring(0, 8)}`,
          description: `Principal: ${r.principal_portion || 0}, Interest: ${r.interest_portion || 0}`
        });
      });

      // Process expenses
      expenses?.forEach(e => {
        allTransactions.push({
          id: e.id,
          timestamp: e.expense_date,
          actionType: 'EXPENSE_PAID',
          member: e.category,
          amount: Number(e.amount),
          paymentMethod: 'Cash',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `EXP-${e.id.substring(0, 8)}`,
          description: e.description
        });
      });

      // Process fines
      fines?.forEach(f => {
        if (f.status === 'paid' || f.paid_amount > 0) {
          allTransactions.push({
            id: f.id,
            timestamp: f.fine_date,
            actionType: 'FINE_PAID',
            member: f.users ? `${f.users.first_name} ${f.users.last_name} (${f.users.member_no})` : 'Unknown',
            amount: Number(f.paid_amount || f.amount),
            paymentMethod: 'Cash',
            previousBalance: 0,
            newBalance: 0,
            authorizingOfficer: 'System',
            referenceNumber: `FINE-${f.id.substring(0, 8)}`,
            description: f.reason
          });
        } else {
          allTransactions.push({
            id: f.id,
            timestamp: f.fine_date,
            actionType: 'FINE_IMPOSED',
            member: f.users ? `${f.users.first_name} ${f.users.last_name} (${f.users.member_no})` : 'Unknown',
            amount: Number(f.amount),
            paymentMethod: '-',
            previousBalance: 0,
            newBalance: 0,
            authorizingOfficer: 'System',
            referenceNumber: `FINE-${f.id.substring(0, 8)}`,
            description: f.reason
          });
        }
      });

      // Process investment profits as income
      investmentProfits?.forEach(i => {
        allTransactions.push({
          id: i.id,
          timestamp: i.profit_date,
          actionType: 'INCOME_RECEIVED',
          member: i.source || 'Investment Income',
          amount: Number(i.amount),
          paymentMethod: 'Bank Transfer',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `INV-${i.id.substring(0, 8)}`,
          description: i.description
        });
      });

      // Process dividend distributions
      dividends?.filter(d => d.payout_status === 'paid')?.forEach(d => {
        allTransactions.push({
          id: d.id,
          timestamp: d.payout_date || d.created_at,
          actionType: 'DIVIDEND_PAID',
          member: d.users ? `${d.users.first_name} ${d.users.last_name} (${d.users.member_no})` : 'Unknown',
          amount: Number(d.allocated_amount || 0),
          paymentMethod: 'Bank Transfer',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `DIV-${d.id.substring(0, 8)}`,
          description: d.calculation_notes
        });
      });

      // Sort all transactions by timestamp
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching financial transactions:', error);
      toast.error('Failed to load financial audit trail');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type: string) => {
    const transaction = transactionTypes.find(t => t.value === type);
    return transaction?.color || 'text-foreground';
  };

  const getTransactionIcon = (type: string) => {
    const inflowTypes = ['CONTRIBUTION_RECEIVED', 'LOAN_REPAYMENT_RECEIVED', 'FINE_PAID', 'INCOME_RECEIVED'];
    return inflowTypes.includes(type) ? (
      <ArrowUpIcon className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownIcon className="h-4 w-4 text-red-600" />
    );
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || t.actionType === selectedType;
    
    const matchesDateFrom = dateFrom === '' || new Date(t.timestamp) >= new Date(dateFrom);
    const matchesDateTo = dateTo === '' || new Date(t.timestamp) <= new Date(dateTo);
    
    const matchesMinAmount = minAmount === '' || t.amount >= parseFloat(minAmount);
    const matchesMaxAmount = maxAmount === '' || t.amount <= parseFloat(maxAmount);
    
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo && matchesMinAmount && matchesMaxAmount;
  });

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action Type', 'Member/Entity', 'Amount', 'Payment Method', 'Previous Balance', 'New Balance', 'Authorizing Officer', 'Reference Number', 'Description'];
    const csvData = filteredTransactions.map(t => [
      format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      t.actionType,
      t.member,
      t.amount.toFixed(2),
      t.paymentMethod || '-',
      t.previousBalance.toFixed(2),
      t.newBalance.toFixed(2),
      t.authorizingOfficer,
      t.referenceNumber,
      t.description || ''
    ]);

    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Audit trail exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-2"
      >
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <DocumentChartBarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Financial Audit Trail</h1>
            <p className="text-muted-foreground">Complete record of all financial transactions and monetary movements</p>
          </div>
        </div>
      </motion.div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Member, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Transaction Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Min Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Amount (KES)</label>
              <Input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            {/* Max Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Max Amount (KES)</label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>

            {/* Export Button */}
            <div className="space-y-2 flex items-end">
              <Button onClick={exportToCSV} className="w-full" variant="outline">
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2 flex items-end">
              <Button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('all');
                  setDateFrom('');
                  setDateTo('');
                  setMinAmount('');
                  setMaxAmount('');
                }}
                variant="ghost"
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Transactions</div>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Inflows</div>
            <div className="text-2xl font-bold text-green-600">
              KES {filteredTransactions
                .filter(t => ['CONTRIBUTION_RECEIVED', 'LOAN_REPAYMENT_RECEIVED', 'FINE_PAID', 'INCOME_RECEIVED'].includes(t.actionType))
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Total Outflows</div>
            <div className="text-2xl font-bold text-red-600">
              KES {filteredTransactions
                .filter(t => ['LOAN_DISBURSED', 'EXPENSE_PAID', 'DIVIDEND_PAID'].includes(t.actionType))
                .reduce((sum, t) => sum + t.amount, 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Action Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Member/Entity</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Payment Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Loading transactions...
                    </td>
                  </tr>
                ) : filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No transactions found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          {getTransactionIcon(transaction.actionType)}
                          <span className={getTransactionColor(transaction.actionType)}>
                            {transactionTypes.find(t => t.value === transaction.actionType)?.label || transaction.actionType}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="max-w-[200px] truncate" title={transaction.member}>
                          {transaction.member}
                        </div>
                        {transaction.description && (
                          <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={transaction.description}>
                            {transaction.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">
                        KES {transaction.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {transaction.referenceNumber}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {transaction.authorizingOfficer}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <DocumentChartBarIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Immutable Audit Trail
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                All financial transactions are automatically recorded and cannot be edited or deleted. 
                This ensures complete transparency and accountability for all monetary movements within the Chama.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
