import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DocumentTextIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  PrinterIcon,
  FunnelIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinancialTransaction {
  id: string;
  timestamp: string;
  actionType: string;
  member: string;
  amount: number;
  paymentMethod: string;
  previousBalance: number;
  newBalance: number;
  authorizingOfficer: string;
  referenceNumber: string;
  description: string;
  type: 'income' | 'expense' | 'loan' | 'contribution' | 'fine';
}

export default function ReportsView() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [fundType, setFundType] = useState('all');
  const [moneyFlow, setMoneyFlow] = useState<'in' | 'out' | 'all'>('all');
  const [reportType, setReportType] = useState<'individual' | 'collective'>('collective');
  const [selectedMember, setSelectedMember] = useState<string>('all');

  const transactionTypes = [
    { value: 'all', label: 'All Transactions' },
    { value: 'contributions', label: 'Contributions' },
    { value: 'loans', label: 'Loans' },
    { value: 'loan_repayments', label: 'Loan Repayments' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'fines', label: 'Fines' },
    { value: 'income', label: 'Income' }
  ];

  const contributionTypes = [
    { value: 'regular', label: 'Regular Contributions' },
    { value: 'fines', label: 'Fine Payments' },
    { value: 'loan_repayments', label: 'Loan Repayments' }
  ];

  const fundTypes = [
    { value: 'all', label: 'All Funds' },
    { value: 'regular', label: 'Regular Savings' },
    { value: 'xmas_savings', label: 'Christmas Savings' },
    { value: 'land_fund', label: 'Land Fund' },
    { value: 'security_fund', label: 'Security Fund' },
    { value: 'registration_fee', label: 'Registration Fees' }
  ];

  const moneyFlowOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'in', label: 'Money In (Income)' },
    { value: 'out', label: 'Money Out (Expenses)' }
  ];

  const quickPresets = [
    { label: 'Today', days: 0 },
    { label: 'This Week', days: 7 },
    { label: 'This Month', days: 30 },
    { label: 'Last 3 Months', days: 90 },
    { label: 'This Year', days: 365 }
  ];

  useEffect(() => {
    fetchFinancialTransactions();
    fetchMembers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, selectedType, dateFrom, dateTo, minAmount, maxAmount, selectedCategories, sortBy, sortOrder, fundType, moneyFlow, selectedMember]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, member_no, full_name')
        .eq('status', 'active')
        .order('member_no');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

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
        { data: incomeRecords }
      ] = await Promise.all([
        supabase.from('contributions').select('*, users!contributions_member_id_fkey(first_name, last_name, member_no)').order('contribution_date', { ascending: false }),
        supabase.from('loans').select('*, users!loans_member_id_fkey(first_name, last_name, member_no)').order('issue_date', { ascending: false }),
        supabase.from('loan_repayments').select('*, users!loan_repayments_member_id_fkey(first_name, last_name, member_no)').order('payment_date', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
        supabase.from('fines').select('*, users!fines_member_id_fkey(first_name, last_name, member_no)').order('fine_date', { ascending: false }),
        supabase.from('income_records').select('*, income_categories!inner(name)').order('income_date', { ascending: false })
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
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: c.receipt_no || `CONT-${c.id.substring(0, 8)}`,
          description: c.notes,
          type: 'contribution'
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
          description: l.notes,
          type: 'loan'
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
          description: `Principal: ${r.principal_portion || 0}, Interest: ${r.interest_portion || 0}`,
          type: 'contribution'
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
          description: e.description,
          type: 'expense'
        });
      });

      // Process fines
      fines?.forEach(f => {
        allTransactions.push({
          id: f.id,
          timestamp: f.fine_date,
          actionType: 'FINE_IMPOSED',
          member: f.users ? `${f.users.first_name} ${f.users.last_name} (${f.users.member_no})` : 'Unknown',
          amount: Number(f.amount),
          paymentMethod: 'System',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: `FINE-${f.id.substring(0, 8)}`,
          description: f.reason,
          type: 'fine'
        });
      });

      // Process income records
      incomeRecords?.forEach(ir => {
        allTransactions.push({
          id: ir.id,
          timestamp: ir.income_date,
          actionType: 'INCOME_RECEIVED',
          member: ir.income_categories?.name || 'Income',
          amount: Number(ir.amount),
          paymentMethod: ir.payment_method || 'N/A',
          previousBalance: 0,
          newBalance: 0,
          authorizingOfficer: 'System',
          referenceNumber: ir.receipt_no || `INC-${ir.id.substring(0, 8)}`,
          description: ir.description || ir.income_categories?.name,
          type: 'income'
        });
      });

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching financial transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.member.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    // Fund type filter
    if (fundType !== 'all') {
      filtered = filtered.filter(t => {
        // Check contribution_type from the original data
        return t.description?.toLowerCase().includes(fundType.toLowerCase());
      });
    }

    // Money flow filter
    if (moneyFlow !== 'all') {
      if (moneyFlow === 'in') {
        filtered = filtered.filter(t => ['contribution', 'income', 'fine'].includes(t.type));
      } else if (moneyFlow === 'out') {
        filtered = filtered.filter(t => ['expense', 'loan'].includes(t.type));
      }
    }

    // Member filter
    if (selectedMember !== 'all') {
      filtered = filtered.filter(t => t.member.toLowerCase().includes(selectedMember.toLowerCase()));
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.timestamp) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.timestamp) <= new Date(dateTo));
    }

    // Amount range filter
    if (minAmount) {
      filtered = filtered.filter(t => t.amount >= Number(minAmount));
    }
    if (maxAmount) {
      filtered = filtered.filter(t => t.amount <= Number(maxAmount));
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'member':
          aValue = a.member;
          bValue = b.member;
          break;
        default:
          aValue = new Date(a.timestamp);
          bValue = new Date(b.timestamp);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedCategories([]);
    setSortBy('date');
    setSortOrder('desc');
    setFundType('all');
    setMoneyFlow('all');
    setReportType('collective');
    setSelectedMember('all');
  };

  const applyQuickPreset = (days: number) => {
    const today = new Date();
    const fromDate = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));
    setDateFrom(fromDate.toISOString().split('T')[0]);
    setDateTo(today.toISOString().split('T')[0]);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Member', 'Amount', 'Payment Method', 'Reference', 'Description'];
    const rows = filteredTransactions.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.actionType,
      t.member,
      t.amount.toLocaleString(),
      t.paymentMethod,
      t.referenceNumber,
      t.description || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToPDF = async () => {
    const { generateFinancialSummaryPDF } = await import('@/utils/pdfGenerator');
    generateFinancialSummaryPDF(filteredTransactions, 'Financial Report', 'financial-report');
  };

  const exportAdvancedPDF = async () => {
    const { generateAdvancedFinancialReport } = await import('@/utils/advancedReportPDF');
    
    // Transform transactions to match the expected format
    const transformedTransactions = filteredTransactions.map(t => ({
      ...t,
      memberId: t.id,
      fundType: fundType !== 'all' ? fundType : undefined,
      contributionType: fundType !== 'all' ? fundType : undefined
    }));
    
    const filters = {
      dateFrom,
      dateTo,
      transactionType: selectedType,
      fundType,
      minAmount: minAmount ? Number(minAmount) : undefined,
      maxAmount: maxAmount ? Number(maxAmount) : undefined,
      memberIds: selectedMember !== 'all' ? [selectedMember] : [],
      reportType,
      moneyFlow
    };
    
    generateAdvancedFinancialReport(transformedTransactions, filters, 'Chama Management System');
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const monthlyData: { [key: string]: { month: string; contributions: number; loans: number; expenses: number; fines: number } } = {};
    
    filteredTransactions.forEach(t => {
      const month = new Date(t.timestamp).toLocaleDateString('en', { month: 'short', year: '2-digit' });
      if (!monthlyData[month]) {
        monthlyData[month] = { month, contributions: 0, loans: 0, expenses: 0, fines: 0 };
      }
      
      switch (t.type) {
        case 'contribution':
          monthlyData[month].contributions += t.amount;
          break;
        case 'loan':
          monthlyData[month].loans += t.amount;
          break;
        case 'expense':
          monthlyData[month].expenses += t.amount;
          break;
        case 'fine':
          monthlyData[month].fines += t.amount;
          break;
      }
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive financial reporting with advanced filtering</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={exportToPDF}
            className="flex items-center space-x-2"
          >
            <DocumentTextIcon className="h-4 w-4" />
            <span>Basic PDF</span>
          </Button>
          <Button
            onClick={exportAdvancedPDF}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <DocumentArrowDownIcon className="h-4 w-4" />
            <span>Advanced PDF</span>
          </Button>
        </div>
      </motion.div>

      {/* Advanced Filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="card-elevated p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Member, reference, description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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

            {/* Member Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Member</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="All Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Members</SelectItem>
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.full_name || `${member.first_name} ${member.last_name}`}>
                      {member.member_no} - {member.full_name || `${member.first_name} ${member.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Amount Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Amount (KES)</label>
              <Input
                type="number"
                placeholder="0"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Max Amount (KES)</label>
              <Input
                type="number"
                placeholder="No limit"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>

            {/* Fund Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Fund Type</label>
              <Select value={fundType} onValueChange={setFundType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fundTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Money Flow Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Money Flow</label>
              <Select value={moneyFlow} onValueChange={(value: 'in' | 'out' | 'all') => setMoneyFlow(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moneyFlowOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Order</label>
              <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Report Type Selection */}
            <div className="space-y-2 col-span-2">
              <label className="text-sm font-medium">Report Type (for PDF)</label>
              <div className="flex gap-4 items-center h-10">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox 
                    checked={reportType === 'collective'}
                    onCheckedChange={() => setReportType('collective')}
                  />
                  <span className="text-sm">Collective (All Members)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <Checkbox 
                    checked={reportType === 'individual'}
                    onCheckedChange={() => setReportType('individual')}
                  />
                  <span className="text-sm">Individual Member</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map(preset => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

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
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold text-foreground mt-2">{filteredTransactions.length}</p>
            </div>
            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-primary" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                KES {filteredTransactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="h-6 w-6 text-green-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-2">
                KES {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <ArrowDownTrayIcon className="h-6 w-6 text-red-600" />
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
              <p className="text-sm font-medium text-muted-foreground">Net Position</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                KES {(filteredTransactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0) - 
                     filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="table" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="table">Tabulated Data</TabsTrigger>
          <TabsTrigger value="charts">Interactive Charts</TabsTrigger>
          <TabsTrigger value="summary">Summary Report</TabsTrigger>
        </TabsList>

        {/* Tabulated Data View */}
        <TabsContent value="table" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Member</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-sm text-foreground">
                          {new Date(transaction.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <Badge variant={
                            transaction.type === 'contribution' ? 'default' :
                            transaction.type === 'expense' ? 'destructive' :
                            transaction.type === 'loan' ? 'secondary' : 'outline'
                          }>
                            {transaction.actionType.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground">{transaction.member}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          KES {transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.paymentMethod}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{transaction.referenceNumber}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{transaction.description || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interactive Charts */}
        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Transaction Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="contributions" stroke="#22C55E" strokeWidth={2} />
                      <Line type="monotone" dataKey="loans" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="contributions" fill="#22C55E" />
                      <Bar dataKey="loans" fill="#3B82F6" />
                      <Bar dataKey="expenses" fill="#EF4444" />
                      <Bar dataKey="fines" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Summary Report */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Contributions:</span>
                  <span className="font-medium text-green-600">
                    KES {filteredTransactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Loans:</span>
                  <span className="font-medium text-blue-600">
                    KES {filteredTransactions.filter(t => t.type === 'loan').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Expenses:</span>
                  <span className="font-medium text-red-600">
                    KES {filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Fines:</span>
                  <span className="font-medium text-yellow-600">
                    KES {filteredTransactions.filter(t => t.type === 'fine').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Net Position:</span>
                  <span className={
                    (filteredTransactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0) - 
                     filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }>
                    KES {(filteredTransactions.filter(t => t.type === 'contribution').reduce((sum, t) => sum + t.amount, 0) - 
                         filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={exportToCSV} className="w-full" variant="outline">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
                <Button onClick={exportToPDF} className="w-full" variant="outline">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Basic PDF Report
                </Button>
                <Button 
                  onClick={exportAdvancedPDF} 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Advanced PDF Report
                </Button>
                <Button onClick={() => window.print()} className="w-full" variant="outline">
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print Report
                </Button>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    <strong>Advanced PDF</strong> includes fund breakdowns, money in/out analysis, and member-specific reports based on your filters.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}