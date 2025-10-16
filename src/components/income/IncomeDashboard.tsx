import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, TrendingUp, FileText, Calculator, RefreshCw, Eye, EyeOff, Download, Calendar } from 'lucide-react';
import IncomeRecordingForm from './IncomeRecordingForm';

interface IncomeSummary {
  fiscal_year: number;
  category_name: string;
  total_amount: number;
  transaction_count: number;
  affects_dividends: boolean;
}

interface IncomeTransaction {
  id: string;
  amount: number;
  income_date: string;
  description: string;
  receipt_no: string;
  payment_method: string;
  status: string;
  category_name: string;
  recorded_by_name: string;
}

export default function IncomeDashboard() {
  const [incomeSummary, setIncomeSummary] = useState<IncomeSummary[]>([]);
  const [incomeTransactions, setIncomeTransactions] = useState<IncomeTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchIncomeData();
  }, [selectedYear]);

  const fetchIncomeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch income summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('yearly_income_summary')
        .select('*')
        .eq('fiscal_year', selectedYear)
        .order('total_amount', { ascending: false });

      if (summaryError) throw summaryError;

      // Fetch detailed transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('income_records')
        .select(`
          id,
          amount,
          income_date,
          description,
          receipt_no,
          payment_method,
          status,
          income_categories!inner (
            name
          ),
          users!income_records_recorded_by_fkey (
            first_name,
            last_name
          )
        `)
        .eq('fiscal_year', selectedYear)
        .order('income_date', { ascending: false });

      if (transactionError) throw transactionError;

      const formattedTransactions: IncomeTransaction[] = transactionData?.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        income_date: tx.income_date,
        description: tx.description,
        receipt_no: tx.receipt_no,
        payment_method: tx.payment_method,
        status: tx.status,
        category_name: tx.income_categories.name,
        recorded_by_name: tx.users ? `${tx.users.first_name} ${tx.users.last_name}` : 'System'
      })) || [];

      setIncomeSummary(summaryData || []);
      setIncomeTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching income data:', error);
      setError('Failed to load income data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalDividendIncome = incomeSummary
    .filter(item => item.affects_dividends)
    .reduce((sum, item) => sum + item.total_amount, 0);

  const totalNonDividendIncome = incomeSummary
    .filter(item => !item.affects_dividends)
    .reduce((sum, item) => sum + item.total_amount, 0);

  const totalIncome = totalDividendIncome + totalNonDividendIncome;

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Description', 'Amount', 'Receipt No', 'Payment Method', 'Status', 'Recorded By'];
    const csvData = incomeTransactions.map(tx => [
      tx.income_date,
      tx.category_name,
      tx.description,
      `KES ${tx.amount.toLocaleString()}`,
      tx.receipt_no,
      tx.payment_method,
      tx.status,
      tx.recorded_by_name
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `income-transactions-${selectedYear}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">{error}</div>
          <Button onClick={fetchIncomeData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Income Management</h1>
          <p className="text-muted-foreground">
            Track all income sources and monitor dividend-eligible amounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowIncomeForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Income
          </Button>
          <Button variant="outline" onClick={fetchIncomeData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Year Selector */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">Fiscal Year:</span>
        </div>
        <select 
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="border rounded-md px-3 py-2 text-sm"
        >
          {[2023, 2024, 2025].map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All income sources in {selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dividend Income</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              KES {totalDividendIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for dividend distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Dividend Income</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              KES {totalNonDividendIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Operational and reserve funds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Summary and Details */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Income Summary</TabsTrigger>
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income Breakdown by Category</CardTitle>
              <CardDescription>
                Detailed view of all income sources and their dividend eligibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <div>Loading income data...</div>
                </div>
              ) : incomeSummary.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No income records found for {selectedYear}. Click "Record Income" to add your first income transaction.
                </div>
              ) : (
                <div className="space-y-4">
                  {incomeSummary.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${item.affects_dividends ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                        <div>
                          <div className="font-medium">{item.category_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.transaction_count} transactions in {item.fiscal_year}
                          </div>
                        </div>
                        {item.affects_dividends ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Dividend Income
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Operational</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">KES {item.total_amount.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">
                          {totalIncome > 0 ? ((item.total_amount / totalIncome) * 100).toFixed(1) : 0}% of total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Income Transactions</CardTitle>
                  <CardDescription>
                    Detailed view of all income transactions for {selectedYear}
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={exportToCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <div>Loading transactions...</div>
                </div>
              ) : incomeTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found for {selectedYear}.
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Receipt No</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Recorded By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomeTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {new Date(transaction.income_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {transaction.category_name.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {transaction.description}
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            KES {transaction.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transaction.receipt_no}
                          </TableCell>
                          <TableCell className="capitalize">
                            {transaction.payment_method}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                transaction.status === 'verified' ? 'default' : 
                                transaction.status === 'pending' ? 'secondary' : 'destructive'
                              }
                            >
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {transaction.recorded_by_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Income Recording Form */}
      {showIncomeForm && (
        <IncomeRecordingForm 
          onClose={() => setShowIncomeForm(false)}
          onSuccess={() => {
            setShowIncomeForm(false);
            fetchIncomeData();
          }}
        />
      )}
    </div>
  );
}